import { describe, expect, test } from "vitest";
import {
	createPpprCliHostState,
	createPpprForkSessionAction,
	dispatchPpprCliHostAction,
	getPpprCliHostRuntimeView,
	mapPpprCliActionToInputEvent,
	PPPR_CLI_ACTION_TO_INPUT_KIND,
	PPPR_CLI_HOST_BOUNDARY,
	PPPR_CLI_HOST_DRIVER_MODULE,
	PPPR_CLI_HOST_RESPONSIBILITIES,
	PPPR_RUNTIME_RESPONSIBILITIES,
} from "../src/pppr/cli-host.js";
import {
	createPpprEffectRequest,
	createPpprEffectResult,
	createPpprRuntimeState,
	createPpprSnapshot,
} from "../src/pppr/runtime-protocol.js";

describe("pppr cli host boundary", () => {
	test("defines the cli host driver module and responsibility split", () => {
		expect(PPPR_CLI_HOST_BOUNDARY.driverModule).toBe(PPPR_CLI_HOST_DRIVER_MODULE);
		expect(PPPR_CLI_HOST_BOUNDARY.hostResponsibilities).toEqual(PPPR_CLI_HOST_RESPONSIBILITIES);
		expect(PPPR_CLI_HOST_BOUNDARY.runtimeResponsibilities).toEqual(PPPR_RUNTIME_RESPONSIBILITIES);
		expect(PPPR_CLI_HOST_BOUNDARY.actionMappings).toEqual(PPPR_CLI_ACTION_TO_INPUT_KIND);
	});

	test("maps start, resume, prompt, effect result, and cancel actions to protocol inputs", () => {
		const state = createPpprRuntimeState("session-1");
		state.lifecycle = { runId: "run-1", state: "awaiting_effect", lastReason: "effect_requested" };
		const snapshot = createPpprSnapshot(state);
		const request = createPpprEffectRequest(
			"content.read",
			"session-1",
			{ target: "README.md" },
			{ id: "req-1", requestedAt: 120 },
		);
		const result = createPpprEffectResult(
			request,
			"success",
			{ content: "# README" },
			{ id: "res-1", completedAt: 130 },
		);

		expect(
			mapPpprCliActionToInputEvent({
				type: "start_session",
				sessionId: "session-1",
				payload: { systemPrompt: "system", continuationMode: "new" },
				options: { id: "start-1", timestamp: 100 },
			}),
		).toMatchObject({
			id: "start-1",
			kind: "session.start",
			session_id: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
		});

		expect(
			mapPpprCliActionToInputEvent({
				type: "resume_session",
				sessionId: "session-1",
				snapshot,
				logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
				metadata: { resumedBy: "cli" },
				options: { id: "resume-1", timestamp: 101 },
			}),
		).toMatchObject({
			id: "resume-1",
			kind: "session.resume",
			session_id: "session-1",
			payload: {
				snapshot,
				logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
				metadata: { resumedBy: "cli" },
			},
		});

		expect(
			mapPpprCliActionToInputEvent({
				type: "submit_prompt",
				sessionId: "session-1",
				payload: { text: "read README.md" },
				options: { id: "msg-1", timestamp: 102 },
			}),
		).toMatchObject({
			id: "msg-1",
			kind: "message.user",
			session_id: "session-1",
			payload: { text: "read README.md" },
		});

		expect(
			mapPpprCliActionToInputEvent({
				type: "deliver_effect_result",
				sessionId: "session-1",
				result,
				options: { id: "evt-1", timestamp: 130 },
			}),
		).toMatchObject({
			id: "evt-1",
			kind: "effect.result",
			session_id: "session-1",
			payload: result,
		});

		expect(
			mapPpprCliActionToInputEvent({
				type: "cancel_run",
				sessionId: "session-1",
				payload: { reason: "user requested stop" },
				options: { id: "cancel-1", timestamp: 140 },
			}),
		).toMatchObject({
			id: "cancel-1",
			kind: "session.cancel",
			session_id: "session-1",
			payload: { reason: "user requested stop" },
		});
	});

	test("dispatches cli actions through the runtime and derives lifecycle state from runtime state", () => {
		const started = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "start_session",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});

		expect(started.outputs.map((output) => output.kind)).toEqual(["run.started", "status.changed"]);
		expect(started.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "session_started",
		});
		expect(started.hostState.inputHistory).toHaveLength(1);
		expect(started.hostState.outputHistory).toHaveLength(2);

		const waiting = dispatchPpprCliHostAction(started.hostState, {
			type: "submit_prompt",
			sessionId: "session-1",
			payload: { text: "read README.md" },
			options: { id: "msg-1", timestamp: 110 },
		});
		const request = createPpprEffectRequest(
			"content.read",
			"session-1",
			{ target: "README.md" },
			{ id: "req-1", requestedAt: 120 },
		);
		const withEffect = dispatchPpprCliHostAction(waiting.hostState, {
			type: "deliver_effect_result",
			sessionId: "session-1",
			result: createPpprEffectResult(request, "success", { content: "# README" }, { id: "res-1", completedAt: 121 }),
			options: { id: "evt-1", timestamp: 121 },
		});

		expect(getPpprCliHostRuntimeView(waiting.hostState)).toEqual({
			lifecycle: waiting.hostState.runtimeState?.lifecycle,
			pendingEffects: [],
		});
		expect(withEffect.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "effect_resolved",
		});
		expect(withEffect.runtimeView.pendingEffects).toEqual([]);
	});

	test("tracks pending effects and stop state through runtime-owned state only", () => {
		const base = createPpprRuntimeState("session-1");
		base.lifecycle = { runId: "run-1", state: "running", lastReason: "session_started" };
		base.effects.pending.push(
			createPpprEffectRequest("command.exec", "session-1", { command: ["ls"] }, { id: "req-1", requestedAt: 200 }),
		);

		const hostState = createPpprCliHostState({ runtimeState: base });
		expect(getPpprCliHostRuntimeView(hostState)).toEqual({
			lifecycle: { runId: "run-1", state: "running", lastReason: "session_started" },
			pendingEffects: [
				expect.objectContaining({
					id: "req-1",
					kind: "command.exec",
				}),
			],
		});

		const cancelled = dispatchPpprCliHostAction(hostState, {
			type: "cancel_run",
			sessionId: "session-1",
			payload: { reason: "user requested stop" },
			options: { id: "cancel-1", timestamp: 210 },
		});

		expect(cancelled.outputs.map((output) => output.kind)).toEqual(["status.changed", "run.completed"]);
		expect(cancelled.runtimeView.lifecycle).toMatchObject({
			state: "stopped",
			lastReason: "cancelled",
		});
	});

	test("creates resume and fork continuation paths through the runtime contract", () => {
		const state = createPpprRuntimeState("session-1");
		state.lifecycle = { runId: "run-1", state: "awaiting_effect", lastReason: "effect_requested" };
		state.effects.pending.push(
			createPpprEffectRequest(
				"content.read",
				"session-1",
				{ target: "README.md" },
				{ id: "req-read", requestedAt: 300, correlation: { turn: 1 } },
			),
		);

		const resumed = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "resume_session",
			sessionId: "session-1",
			snapshot: createPpprSnapshot(state),
			logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
			options: { id: "resume-1", timestamp: 301 },
		});

		expect(resumed.runtimeView.lifecycle).toMatchObject({
			state: "awaiting_effect",
			lastReason: "effect_requested",
		});
		expect(resumed.runtimeView.pendingEffects).toHaveLength(1);

		const forkAction = createPpprForkSessionAction(resumed.hostState, {
			sessionId: "session-2",
			id: "fork-1",
			timestamp: 302,
			logReferences: [{ stream: "logs/session-2", checkpoint: "ckpt-2" }],
			metadata: { forkedFrom: "session-1" },
		});
		const forked = dispatchPpprCliHostAction(createPpprCliHostState(), forkAction);

		expect(forkAction).toMatchObject({
			type: "resume_session",
			sessionId: "session-2",
			snapshot: {
				session: {
					sessionId: "session-2",
					continuationMode: "fork",
				},
				lifecycle: {
					state: "idle",
				},
			},
		});
		expect(forked.runtimeView.lifecycle).toMatchObject({
			state: "idle",
		});
		expect(forked.runtimeView.pendingEffects).toEqual([]);
	});
});
