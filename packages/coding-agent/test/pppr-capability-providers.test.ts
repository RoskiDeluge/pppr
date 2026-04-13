import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createPpprCapabilityProviders, type PpprCapabilityProviders } from "../src/pppr/capability-providers.js";
import {
	createInMemoryPpprLogProvider,
	createInMemoryPpprSessionPersistenceProvider,
	createLocalPpprCapabilityProviders,
	createLocalPpprCommandProvider,
	createLocalPpprContentProvider,
} from "../src/pppr/local-capability-providers.js";
import { createPpprRuntimeState, createPpprSnapshot } from "../src/pppr/runtime-protocol.js";

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirs.splice(0).map(async (dir) => {
			await rm(dir, { recursive: true, force: true });
		}),
	);
});

async function createTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pppr-capability-providers-"));
	tempDirs.push(dir);
	return dir;
}

describe("pppr capability providers", () => {
	test("defines a composable provider boundary separate from local implementations", async () => {
		const cwd = await createTempDir();
		await writeFile(join(cwd, "notes.txt"), "hello", "utf-8");

		const content = createLocalPpprContentProvider(cwd);
		const command = createLocalPpprCommandProvider(cwd);
		const persistence = createInMemoryPpprSessionPersistenceProvider();
		const logs = createInMemoryPpprLogProvider();

		const providers = createPpprCapabilityProviders({
			content,
			command,
			persistence,
			logs,
			model: {
				async infer(request) {
					return {
						message: {
							message_id: "assistant-1",
							role: "assistant",
							segments: [{ type: "text", text: request.messages.at(-1)?.content ?? "" }],
						},
						model: "stub-model",
						provider: "stub-provider",
					};
				},
			},
		});

		const readResult = await providers.content.read({ target: "notes.txt" });
		const execResult = await providers.command.exec({
			command: [process.execPath, "-e", "process.stdout.write('ok')"],
			cwd,
			envPolicy: "inherit",
		});

		expect(readResult).toMatchObject({ content: "hello" });
		expect(execResult).toMatchObject({ exitCode: 0, stdout: "ok" });
		expect(providers.persistence).toBe(persistence);
		expect(providers.logs).toBe(logs);
	});

	test("keeps local provider factories usable without the cli host wrapper", async () => {
		const cwd = await createTempDir();
		const file = join(cwd, "notes.txt");
		await writeFile(file, "before", "utf-8");

		const providers = createLocalPpprCapabilityProviders({ cwd });
		await providers.content.write({
			target: "notes.txt",
			content: "after",
			mode: "overwrite",
		});

		const persisted = await providers.persistence.persist(
			{
				snapshot: createPpprSnapshot(createPpprRuntimeState("session-1")),
				intent: "checkpoint",
			},
			"session-1",
		);
		const appended = await providers.logs.append(
			{
				entries: [{ type: "status.changed", data: { to: "running" } }],
			},
			"session-1",
		);

		expect(await readFile(file, "utf-8")).toBe("after");
		expect(persisted).toMatchObject({
			persisted: true,
			reference: { stream: "session:session-1" },
		});
		expect(appended).toMatchObject({
			appended: 1,
			reference: { stream: "log:session-1" },
		});
	});

	test("matches the capability shape expected by the fulfillment host", async () => {
		const cwd = await createTempDir();
		const providers: PpprCapabilityProviders = createLocalPpprCapabilityProviders({
			cwd,
			model: {
				async infer(request) {
					return {
						message: {
							message_id: "assistant-2",
							role: "assistant",
							segments: [{ type: "text", text: request.messages.at(-1)?.content ?? "" }],
						},
						model: "stub-model",
					};
				},
			},
		});

		const modelResult = await providers.model?.infer({
			messages: [{ role: "user", content: "hello" }],
			toolChoice: "auto",
		});

		expect(modelResult).toMatchObject({
			model: "stub-model",
		});
	});
});
