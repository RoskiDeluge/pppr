import { describe, expect, test } from "vitest";
import { advancePpprRuntime, appendPpprAssistantMessage, requestPpprEffect } from "../src/pppr/runtime.js";
import {
	createPpprEffectRequest,
	createPpprEffectResult,
	createPpprInputEvent,
	createPpprRuntimeState,
	createPpprSnapshot,
} from "../src/pppr/runtime-protocol.js";

describe("pppr runtime progression", () => {
	test("initializes state for session.start and emits lifecycle outputs", () => {
		const input = createPpprInputEvent(
			"session.start",
			"session-1",
			{
				systemPrompt: "system",
				instructions: ["rule 1"],
				continuationMode: "new",
			},
			{ id: "start-1", timestamp: 100 },
		);

		const result = advancePpprRuntime(undefined, input);

		expect(result.state.session.sessionId).toBe("session-1");
		expect(result.state.context.instructions).toEqual(["rule 1"]);
		expect(result.state.lifecycle.state).toBe("running");
		expect(result.outputs.map((output) => output.kind)).toEqual(["run.started", "status.changed"]);
		expect(result.outputs[1]?.payload).toMatchObject({
			from: "idle",
			to: "running",
			reason: "session_started",
		});
	});

	test("restores state for session.resume without adding host outputs", () => {
		const state = createPpprRuntimeState("session-1", {
			systemPrompt: "system",
			logReferences: [{ stream: "logs/1", checkpoint: "a" }],
		});
		state.lifecycle = { runId: "run-1", state: "awaiting_effect", lastReason: "effect_requested" };

		const input = createPpprInputEvent(
			"session.resume",
			"session-1",
			{
				snapshot: createPpprSnapshot(state),
				logReferences: [{ stream: "logs/2", checkpoint: "b" }],
			},
			{ id: "resume-1", timestamp: 200 },
		);

		const result = advancePpprRuntime(undefined, input);

		expect(result.outputs).toEqual([]);
		expect(result.state.lifecycle.state).toBe("awaiting_effect");
		expect(result.state.observability.logReferences).toEqual([
			{ stream: "logs/1", checkpoint: "a" },
			{ stream: "logs/2", checkpoint: "b" },
		]);
	});

	test("ingests user messages, requests effects, and resolves successful effect results", () => {
		const started = advancePpprRuntime(
			undefined,
			createPpprInputEvent("session.start", "session-1", {}, { id: "start-1", timestamp: 100 }),
		);
		const messaged = advancePpprRuntime(
			started.state,
			createPpprInputEvent("message.user", "session-1", { text: "read README.md" }, { id: "msg-1", timestamp: 110 }),
		);
		const request = createPpprEffectRequest(
			"content.read",
			"session-1",
			{ target: "README.md" },
			{ id: "req-1", requestedAt: 120 },
		);
		const waiting = requestPpprEffect(messaged.state, request);
		const success = createPpprEffectResult(
			request,
			"success",
			{ content: "# README", digest: "sha256:1" },
			{ id: "result-1", completedAt: 130 },
		);
		const resolved = advancePpprRuntime(
			waiting.state,
			createPpprInputEvent("effect.result", "session-1", success, { id: "evt-1", timestamp: 130 }),
		);

		expect(messaged.state.conversation).toHaveLength(1);
		expect(waiting.state.lifecycle.state).toBe("awaiting_effect");
		expect(waiting.outputs.map((output) => output.kind)).toEqual(["effect.requested", "status.changed"]);
		expect(resolved.state.lifecycle.state).toBe("running");
		expect(resolved.state.effects.pending).toEqual([]);
		expect(resolved.state.effects.fulfilled).toHaveLength(1);
		expect(resolved.outputs[0]?.kind).toBe("status.changed");
		expect(resolved.outputs[0]?.payload).toMatchObject({
			from: "awaiting_effect",
			to: "running",
			reason: "effect_resolved",
			request_id: "req-1",
		});
	});

	test("emits assistant output and failed runs through protocol events", () => {
		const base = createPpprRuntimeState("session-1");
		base.lifecycle = { runId: "run-1", state: "running", lastReason: "session_started" };

		const assistant = appendPpprAssistantMessage(base, {
			message_id: "assistant-1",
			role: "assistant",
			segments: [{ type: "text", text: "I will try that." }],
		});

		expect(assistant.outputs).toHaveLength(1);
		expect(assistant.outputs[0]?.kind).toBe("message.assistant");

		const request = createPpprEffectRequest(
			"command.exec",
			"session-1",
			{ command: ["false"] },
			{ id: "req-fail", requestedAt: 140 },
		);
		const waiting = requestPpprEffect(assistant.state, request);
		const failure = createPpprEffectResult(
			request,
			"failed",
			{ exitCode: 1, stdout: "", stderr: "boom" },
			{
				id: "result-fail",
				completedAt: 145,
				error: { message: "command execution failed" },
			},
		);
		const failed = advancePpprRuntime(
			waiting.state,
			createPpprInputEvent("effect.result", "session-1", failure, { id: "evt-fail", timestamp: 145 }),
		);

		expect(failed.state.lifecycle.state).toBe("failed");
		expect(failed.outputs.map((output) => output.kind)).toEqual(["status.changed", "run.failed"]);
		expect(failed.outputs[1]?.payload).toMatchObject({
			run_id: "run-1",
			state: "failed",
			request_id: "req-fail",
		});
	});

	test("treats denied effects as failed runs with a host-policy error", () => {
		const state = createPpprRuntimeState("session-1");
		state.lifecycle = { runId: "run-1", state: "running", lastReason: "session_started" };

		const request = createPpprEffectRequest(
			"content.write",
			"session-1",
			{ target: "README.md", content: "blocked", mode: "overwrite" },
			{ id: "req-denied", requestedAt: 150 },
		);
		const waiting = requestPpprEffect(state, request);
		const denied = createPpprEffectResult(
			request,
			"denied",
			{ target: "README.md", written: false },
			{ id: "result-denied", completedAt: 151 },
		);
		const failed = advancePpprRuntime(
			waiting.state,
			createPpprInputEvent("effect.result", "session-1", denied, { id: "evt-denied", timestamp: 151 }),
		);

		expect(failed.state.lifecycle.state).toBe("failed");
		expect(failed.state.effects.pending).toEqual([]);
		expect(failed.outputs.map((output) => output.kind)).toEqual(["status.changed", "run.failed"]);
		expect(failed.outputs[1]?.payload).toMatchObject({
			run_id: "run-1",
			state: "failed",
			request_id: "req-denied",
			error: {
				message: "Effect request denied by host policy",
			},
		});
	});

	test("cancels an active runtime and emits completion output", () => {
		const state = createPpprRuntimeState("session-1");
		state.lifecycle = { runId: "run-1", state: "running", lastReason: "session_started" };

		const result = advancePpprRuntime(
			state,
			createPpprInputEvent(
				"session.cancel",
				"session-1",
				{ reason: "user requested stop" },
				{ id: "cancel-1", timestamp: 150 },
			),
		);

		expect(result.state.lifecycle.state).toBe("stopped");
		expect(result.outputs.map((output) => output.kind)).toEqual(["status.changed", "run.completed"]);
		expect(result.outputs[1]?.payload).toMatchObject({
			run_id: "run-1",
			state: "stopped",
			completion_reason: "user requested stop",
		});
	});
});
