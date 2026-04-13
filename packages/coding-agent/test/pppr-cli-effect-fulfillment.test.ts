import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	createLocalPpprCliEffectHost,
	createPpprLogAppendEffectRequest,
	createPpprLogResolveEffectRequest,
	createPpprSessionPersistEffectRequest,
	fulfillPpprEffectRequest,
	mapPpprCliToolCallToEffectRequest,
	PPPR_CLI_TOOL_TO_EFFECT_KIND,
	type PpprCliEffectFulfillmentHost,
} from "../src/pppr/cli-effect-fulfillment.js";
import { createPpprEffectPolicyDecision } from "../src/pppr/effect-policy.js";
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
	const dir = await mkdtemp(join(tmpdir(), "pppr-phase2-"));
	tempDirs.push(dir);
	return dir;
}

describe("pppr cli effect fulfillment", () => {
	test("maps the visible cli tools onto the approved phase 1 effect kinds", () => {
		expect(PPPR_CLI_TOOL_TO_EFFECT_KIND).toEqual({
			read: "content.read",
			edit: "content.patch",
			write: "content.write",
			bash: "command.exec",
		});

		expect(
			mapPpprCliToolCallToEffectRequest(
				"session-1",
				{
					toolName: "read",
					input: { path: "README.md", offset: 2, limit: 3 },
				},
				{ id: "read-1" },
			),
		).toMatchObject({
			id: "read-1",
			kind: "content.read",
			payload: {
				target: "README.md",
				range: { startLine: 2, endLine: 4 },
			},
		});

		expect(
			mapPpprCliToolCallToEffectRequest(
				"session-1",
				{
					toolName: "edit",
					input: { path: "README.md", oldText: "old", newText: "new" },
				},
				{ id: "edit-1" },
			),
		).toMatchObject({
			id: "edit-1",
			kind: "content.patch",
			payload: {
				target: "README.md",
				mode: "structured",
			},
		});

		expect(
			mapPpprCliToolCallToEffectRequest(
				"session-1",
				{
					toolName: "write",
					input: { path: "README.md", content: "hello" },
				},
				{ id: "write-1" },
			),
		).toMatchObject({
			id: "write-1",
			kind: "content.write",
			payload: {
				target: "README.md",
				content: "hello",
				mode: "overwrite",
			},
		});

		expect(
			mapPpprCliToolCallToEffectRequest(
				"session-1",
				{
					toolName: "bash",
					input: { command: "pwd", timeout: 5 },
				},
				{ id: "bash-1" },
			),
		).toMatchObject({
			id: "bash-1",
			kind: "command.exec",
		});
	});

	test("fulfills local content and command effects through host-owned providers", async () => {
		const cwd = await createTempDir();
		const file = join(cwd, "notes.txt");
		await writeFile(file, "hello\nworld\n", "utf-8");
		const host = createLocalPpprCliEffectHost({ cwd });

		const readResult = await fulfillPpprEffectRequest(
			host,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "read",
				input: { path: "notes.txt" },
			}),
		);
		expect(readResult.outcome).toBe("success");
		expect(readResult.payload).toMatchObject({
			content: "hello\nworld\n",
		});

		const writeResult = await fulfillPpprEffectRequest(
			host,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "write",
				input: { path: "notes.txt", content: "updated" },
			}),
		);
		expect(writeResult.outcome).toBe("success");
		expect(await readFile(file, "utf-8")).toBe("updated");

		const patchResult = await fulfillPpprEffectRequest(
			host,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "edit",
				input: { path: "notes.txt", oldText: "updated", newText: "patched" },
			}),
		);
		expect(patchResult.outcome).toBe("success");
		expect(await readFile(file, "utf-8")).toBe("patched");

		const commandResult = await fulfillPpprEffectRequest(host, {
			id: "cmd-1",
			session_id: "session-1",
			kind: "command.exec",
			requested_at: 100,
			payload: {
				command: [process.execPath, "-e", "process.stdout.write('ok')"],
				cwd,
				envPolicy: "inherit",
			},
		});
		expect(commandResult.outcome).toBe("success");
		expect(commandResult.payload).toMatchObject({
			exitCode: 0,
			stdout: "ok",
		});
	});

	test("fulfills model, persistence, and log effects through host-owned providers", async () => {
		const runtime = createPpprRuntimeState("session-1");
		const host = createLocalPpprCliEffectHost({
			model: {
				async infer(request) {
					return {
						message: {
							message_id: "assistant-1",
							role: "assistant",
							segments: [{ type: "text", text: request.messages.at(-1)?.content ?? "" }],
						},
						model: "fake-model",
						provider: "fake-provider",
					};
				},
			},
		});

		const modelResult = await fulfillPpprEffectRequest(host, {
			id: "model-1",
			session_id: "session-1",
			kind: "model.infer",
			requested_at: 100,
			payload: {
				messages: [{ role: "user", content: "hello" }],
				toolChoice: "auto",
			},
		});
		expect(modelResult.outcome).toBe("success");
		expect(modelResult.payload).toMatchObject({
			model: "fake-model",
			provider: "fake-provider",
		});

		const persistRequest = createPpprSessionPersistEffectRequest("session-1", {
			snapshot: createPpprSnapshot(runtime),
			intent: "checkpoint",
		});
		const persistResult = await fulfillPpprEffectRequest(host, persistRequest);
		expect(persistResult.outcome).toBe("success");
		expect(persistResult.payload).toMatchObject({
			persisted: true,
			reference: { stream: "session:session-1" },
		});

		const appendResult = await fulfillPpprEffectRequest(
			host,
			createPpprLogAppendEffectRequest("session-1", {
				entries: [{ type: "status.changed", data: { to: "running" } }],
			}),
		);
		expect(appendResult.outcome).toBe("success");
		expect(appendResult.payload).toMatchObject({
			appended: 1,
			reference: { stream: "log:session-1" },
		});

		const resolveResult = await fulfillPpprEffectRequest(
			host,
			createPpprLogResolveEffectRequest("session-1", {
				reference: { stream: "log:session-1" },
				intent: "resume",
			}),
		);
		expect(resolveResult.outcome).toBe("success");
		expect(resolveResult.payload).toMatchObject({
			reference: { stream: "log:session-1" },
			entries: [{ type: "status.changed", data: { to: "running" } }],
		});
	});

	test("normalizes denied and failed outcomes into effect results", async () => {
		const cwd = await createTempDir();
		const hostWithoutModel = createLocalPpprCliEffectHost({ cwd });

		const denied = await fulfillPpprEffectRequest(hostWithoutModel, {
			id: "model-1",
			session_id: "session-1",
			kind: "model.infer",
			requested_at: 100,
			payload: {
				messages: [{ role: "user", content: "hello" }],
			},
		});
		expect(denied.outcome).toBe("denied");
		expect(denied.error).toMatchObject({
			code: "model_provider_unavailable",
		});

		const failingHost: PpprCliEffectFulfillmentHost = createLocalPpprCliEffectHost({
			cwd,
			model: {
				async infer() {
					throw new Error("provider exploded");
				},
			},
		});
		const failed = await fulfillPpprEffectRequest(failingHost, {
			id: "model-2",
			session_id: "session-1",
			kind: "model.infer",
			requested_at: 100,
			payload: {
				messages: [{ role: "user", content: "hello" }],
			},
		});
		expect(failed.outcome).toBe("failed");
		expect(failed.error).toMatchObject({
			message: "provider exploded",
		});
	});

	test("evaluates approval-required and deny policy decisions before provider execution", async () => {
		const cwd = await createTempDir();
		let commandCalls = 0;
		const approvalHost: PpprCliEffectFulfillmentHost = createLocalPpprCliEffectHost({
			cwd,
			policy: {
				evaluate(request) {
					if (request.kind === "command.exec") {
						return createPpprEffectPolicyDecision("approval_required", {
							reason: "bash requires operator approval",
							details: { effectKind: request.kind },
						});
					}
					return createPpprEffectPolicyDecision("allow");
				},
			},
		});
		approvalHost.command = {
			async exec() {
				commandCalls += 1;
				return {
					exitCode: 0,
					stdout: "should-not-run",
					stderr: "",
				};
			},
		};

		const approvalRequired = await fulfillPpprEffectRequest(approvalHost, {
			id: "cmd-approval-1",
			session_id: "session-1",
			kind: "command.exec",
			requested_at: 100,
			payload: {
				command: ["echo", "hello"],
				cwd,
				envPolicy: "inherit",
			},
		});
		expect(approvalRequired.outcome).toBe("denied");
		expect(approvalRequired.error).toMatchObject({
			code: "approval_required",
			message: "bash requires operator approval",
		});
		expect(approvalRequired.metadata).toMatchObject({
			host_policy: {
				decision: "approval_required",
			},
		});
		expect(commandCalls).toBe(0);

		const deniedHost = createLocalPpprCliEffectHost({
			cwd,
			policy: {
				evaluate(request) {
					if (request.kind === "content.write") {
						return createPpprEffectPolicyDecision("deny", {
							code: "writes_disabled",
							reason: "writes are disabled by policy",
							details: { scope: "readonly-mode" },
						});
					}
					return createPpprEffectPolicyDecision("allow");
				},
			},
		});
		const denied = await fulfillPpprEffectRequest(
			deniedHost,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "write",
				input: { path: "notes.txt", content: "hello" },
			}),
		);
		expect(denied.outcome).toBe("denied");
		expect(denied.error).toMatchObject({
			code: "writes_disabled",
			message: "writes are disabled by policy",
			details: { scope: "readonly-mode" },
		});
		expect(denied.metadata).toMatchObject({
			host_policy: {
				decision: "deny",
				code: "writes_disabled",
			},
		});
	});
});
