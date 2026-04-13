import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	createLocalPpprCliEffectHost,
	createPpprLogAppendEffectRequest,
	createPpprLogResolveEffectRequest,
	createPpprSessionPersistEffectRequest,
	fulfillPpprEffectRequest,
} from "../src/pppr/cli-effect-fulfillment.js";
import {
	createPpprCliHostState,
	createPpprForkSessionAction,
	dispatchPpprCliHostAction,
} from "../src/pppr/cli-host.js";
import { renderPpprOutputEvents } from "../src/pppr/cli-render.js";
import { requestPpprEffect } from "../src/pppr/runtime.js";
import {
	createPpprEffectRequest,
	createPpprRuntimeState,
	createPpprSnapshot,
	type PpprLogAppendResultPayload,
	type PpprLogResolveResultPayload,
	type PpprSessionPersistResultPayload,
} from "../src/pppr/runtime-protocol.js";
import { buildPpprCliVisibleContract, resolvePpprVisibleToolContract } from "../src/pppr/visible-contract.js";

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirs.splice(0).map(async (dir) => {
			await rm(dir, { recursive: true, force: true });
		}),
	);
});

async function createTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pppr-cli-host-"));
	tempDirs.push(dir);
	return dir;
}

async function expectFileToExist(path: string): Promise<void> {
	await expect(access(path)).resolves.toBeUndefined();
}

async function expectFileToBeMissing(path: string): Promise<void> {
	await expect(access(path)).rejects.toBeDefined();
}

describe("pppr cli host integration", () => {
	test("drives start, effect wait, effect fulfillment, and completion through the runtime seam", async () => {
		const cwd = await createTempDir();
		await writeFile(join(cwd, "notes.txt"), "alpha\nbeta\n", "utf-8");

		const visibleContract = buildPpprCliVisibleContract(
			{
				getAgentsFiles() {
					return {
						agentsFiles: [{ path: `${cwd}/AGENTS.md`, content: "local instructions" }],
					};
				},
				getSystemPrompt() {
					return "system";
				},
				getAppendSystemPrompt() {
					return ["append"];
				},
			},
			resolvePpprVisibleToolContract(),
		);

		const started = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "start_session",
			sessionId: "session-1",
			payload: {
				cwd,
				systemPrompt: visibleContract.systemPrompt,
				instructions: [...visibleContract.instructionTexts, ...visibleContract.appendSystemPrompt],
				continuationMode: "new",
			},
			options: { id: "start-1", timestamp: 100 },
		});

		expect(renderPpprOutputEvents(started.outputs)).toEqual([
			expect.stringContaining("[run.started]"),
			"[status.changed] idle -> running (session_started)",
		]);

		const request = createPpprEffectRequest(
			"content.read",
			"session-1",
			{ target: "notes.txt" },
			{ id: "req-read-1", requestedAt: 101 },
		);
		const waiting = requestPpprEffect(started.hostState.runtimeState!, request);
		const waitingHostState = createPpprCliHostState({
			runtimeState: waiting.state,
			inputHistory: started.hostState.inputHistory,
			outputHistory: [...started.hostState.outputHistory, ...waiting.outputs],
		});

		expect(renderPpprOutputEvents(waiting.outputs)).toEqual([
			"[effect.requested] content.read notes.txt",
			"[status.changed] running -> awaiting_effect (effect_requested)",
		]);

		const host = createLocalPpprCliEffectHost({ cwd });
		const fulfilled = await fulfillPpprEffectRequest(host, waiting.state.effects.pending[0]!);
		const resumed = dispatchPpprCliHostAction(waitingHostState, {
			type: "deliver_effect_result",
			sessionId: "session-1",
			result: fulfilled,
			options: { id: "evt-effect-1", timestamp: 102 },
		});

		expect(fulfilled.outcome).toBe("success");
		expect(fulfilled.payload).toMatchObject({
			content: "alpha\nbeta\n",
		});
		expect(renderPpprOutputEvents(resumed.outputs)).toEqual([
			"[status.changed] awaiting_effect -> running (effect_resolved)",
		]);
		expect(resumed.runtimeView.pendingEffects).toEqual([]);

		const completed = dispatchPpprCliHostAction(resumed.hostState, {
			type: "cancel_run",
			sessionId: "session-1",
			payload: { reason: "operator finished" },
			options: { id: "cancel-1", timestamp: 103 },
		});

		expect(renderPpprOutputEvents(completed.outputs)).toEqual([
			"[status.changed] running -> stopped (cancelled)",
			expect.stringMatching(/^\[run\.completed\] .+ \(operator finished\)$/),
		]);
		expect(completed.runtimeView.lifecycle).toMatchObject({
			state: "stopped",
			lastReason: "cancelled",
		});
	});

	test("resumes and forks from snapshots plus approved log references", async () => {
		const host = createLocalPpprCliEffectHost();
		const runtime = createPpprRuntimeState("session-1", {
			logReferences: [{ stream: "log:session-1", checkpoint: "0" }],
		});
		runtime.lifecycle = { runId: "run-1", state: "awaiting_effect", lastReason: "effect_requested" };

		const appendResult = await fulfillPpprEffectRequest(
			host,
			createPpprLogAppendEffectRequest("session-1", {
				reference: { stream: "log:session-1" },
				entries: [{ type: "status.changed", data: { to: "awaiting_effect" } }],
			}),
		);
		const persisted = await fulfillPpprEffectRequest(
			host,
			createPpprSessionPersistEffectRequest("session-1", {
				snapshot: createPpprSnapshot(runtime),
				intent: "checkpoint",
			}),
		);
		const appendPayload = appendResult.payload as PpprLogAppendResultPayload;
		const persistedPayload = persisted.payload as PpprSessionPersistResultPayload;

		expect(appendResult.outcome).toBe("success");
		expect(persisted.outcome).toBe("success");

		const resumed = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "resume_session",
			sessionId: "session-1",
			snapshot: createPpprSnapshot(runtime),
			logReferences: [appendPayload.reference!, persistedPayload.reference!],
			metadata: { resumedBy: "integration-test" },
			options: { id: "resume-1", timestamp: 200 },
		});

		expect(resumed.runtimeView.lifecycle).toMatchObject({
			state: "awaiting_effect",
			lastReason: "effect_requested",
		});
		expect(resumed.hostState.runtimeState?.observability.logReferences).toEqual([
			expect.objectContaining({ stream: "log:session-1", checkpoint: "0" }),
			expect.objectContaining({ stream: "log:session-1", checkpoint: "1" }),
			expect.objectContaining({ stream: "session:session-1" }),
		]);

		const resolvedLogs = await fulfillPpprEffectRequest(
			host,
			createPpprLogResolveEffectRequest("session-1", {
				reference: appendPayload.reference!,
				intent: "resume",
			}),
		);
		const resolvedLogsPayload = resolvedLogs.payload as PpprLogResolveResultPayload;
		expect(resolvedLogs.outcome).toBe("success");
		expect(resolvedLogsPayload.entries).toEqual([{ type: "status.changed", data: { to: "awaiting_effect" } }]);

		const forkAction = createPpprForkSessionAction(resumed.hostState, {
			sessionId: "session-2",
			id: "fork-1",
			timestamp: 201,
			logReferences: [{ stream: "log:session-2", checkpoint: "0" }],
			metadata: { forkedFrom: "session-1" },
		});
		const forked = dispatchPpprCliHostAction(createPpprCliHostState(), forkAction);

		expect(forkAction.snapshot.session.continuationMode).toBe("fork");
		expect(forked.hostState.runtimeState?.session).toMatchObject({
			sessionId: "session-2",
			continuationMode: "fork",
		});
		expect(forked.runtimeView.lifecycle).toMatchObject({
			state: "idle",
		});
	});

	test("executes host capabilities only through explicit runtime protocol requests", async () => {
		const cwd = await createTempDir();
		const markerPath = join(cwd, "marker.txt");
		const host = createLocalPpprCliEffectHost({ cwd });

		const started = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "start_session",
			sessionId: "session-1",
			payload: { cwd, systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 300 },
		});
		const prompted = dispatchPpprCliHostAction(started.hostState, {
			type: "submit_prompt",
			sessionId: "session-1",
			payload: { text: "bash touch marker.txt" },
			options: { id: "msg-1", timestamp: 301 },
		});

		expect(prompted.outputs).toEqual([]);
		expect(prompted.hostState.runtimeState?.conversation.at(-1)).toMatchObject({
			role: "user",
			text: "bash touch marker.txt",
		});
		await expectFileToBeMissing(markerPath);

		const request = createPpprEffectRequest(
			"command.exec",
			"session-1",
			{
				command: [process.execPath, "-e", "require('node:fs').writeFileSync('marker.txt', 'ok')"],
				cwd,
				envPolicy: "inherit",
			},
			{ id: "req-cmd-1", requestedAt: 302 },
		);
		const waiting = requestPpprEffect(prompted.hostState.runtimeState!, request);
		expect(renderPpprOutputEvents(waiting.outputs)).toEqual([
			expect.stringContaining("[effect.requested] command.exec"),
			"[status.changed] running -> awaiting_effect (effect_requested)",
		]);

		const fulfilled = await fulfillPpprEffectRequest(host, waiting.state.effects.pending[0]!);
		const waitingHostState = createPpprCliHostState({
			runtimeState: waiting.state,
			inputHistory: prompted.hostState.inputHistory,
			outputHistory: [...prompted.hostState.outputHistory, ...waiting.outputs],
		});
		const resolved = dispatchPpprCliHostAction(waitingHostState, {
			type: "deliver_effect_result",
			sessionId: "session-1",
			result: fulfilled,
			options: { id: "evt-cmd-1", timestamp: 303 },
		});

		expect(fulfilled.outcome).toBe("success");
		await expectFileToExist(markerPath);
		expect(resolved.outputs).toEqual([
			expect.objectContaining({
				kind: "status.changed",
				payload: expect.objectContaining({
					from: "awaiting_effect",
					to: "running",
					reason: "effect_resolved",
				}),
			}),
		]);
	});
});
