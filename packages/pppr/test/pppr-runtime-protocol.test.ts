import { describe, expect, test } from "vitest";
import type { PpprSnapshot } from "../src/runtime-protocol.js";
import {
	createPpprCommandExecRequest,
	createPpprContentPatchRequest,
	createPpprContentReadRequest,
	createPpprContentWriteRequest,
	createPpprEffectRequest,
	createPpprEffectResult,
	createPpprInputEvent,
	createPpprLogAppendRequest,
	createPpprLogResolveRequest,
	createPpprModelInferRequest,
	createPpprOutputEvent,
	createPpprRuntimeState,
	createPpprSessionPersistRequest,
	createPpprSnapshot,
	restorePpprRuntimeState,
} from "../src/runtime-protocol.js";

describe("pppr runtime protocol", () => {
	test("creates typed input and output events with shared envelope fields", () => {
		const input = createPpprInputEvent(
			"message.user",
			"session-1",
			{ text: "hello runtime" },
			{ id: "input-1", timestamp: 100 },
		);
		const output = createPpprOutputEvent(
			"run.started",
			"session-1",
			{ run_id: "run-1", state: "running", triggering_input_id: "input-1" },
			{ id: "output-1", timestamp: 101 },
		);

		expect(input).toEqual({
			id: "input-1",
			session_id: "session-1",
			kind: "message.user",
			timestamp: 100,
			payload: { text: "hello runtime" },
		});
		expect(output).toEqual({
			id: "output-1",
			session_id: "session-1",
			kind: "run.started",
			timestamp: 101,
			payload: { run_id: "run-1", state: "running", triggering_input_id: "input-1" },
		});
	});

	test("correlates effect results back to requests", () => {
		const request = createPpprEffectRequest(
			"command.exec",
			"session-1",
			{ command: ["rg", "--files"], cwd: "/tmp/project" },
			{ id: "req-1", requestedAt: 200 },
		);
		const result = createPpprEffectResult(
			request,
			"success",
			{ exitCode: 0, stdout: "a.ts\nb.ts", stderr: "", durationMs: 12 },
			{ id: "res-1", completedAt: 212 },
		);

		expect(request.id).toBe("req-1");
		expect(result.request_id).toBe("req-1");
		expect(result.kind).toBe("command.exec");
		expect(result.outcome).toBe("success");
		expect(result.payload.stdout).toContain("a.ts");
	});

	test("creates typed helpers for each phase 1 effect kind", () => {
		const read = createPpprContentReadRequest("session-1", { target: "README.md" }, { id: "read-1" });
		const write = createPpprContentWriteRequest(
			"session-1",
			{ target: "notes.md", content: "hello", mode: "overwrite" },
			{ id: "write-1" },
		);
		const patch = createPpprContentPatchRequest(
			"session-1",
			{ target: "notes.md", patch: "@@ -1 +1 @@\n-hi\n+hello" },
			{ id: "patch-1" },
		);
		const exec = createPpprCommandExecRequest(
			"session-1",
			{ command: ["rg", "--files"], cwd: "/tmp/project" },
			{ id: "exec-1" },
		);
		const infer = createPpprModelInferRequest(
			"session-1",
			{
				messages: [
					{ role: "system", content: "system" },
					{ role: "user", content: "hello" },
				],
				toolChoice: "auto",
			},
			{ id: "infer-1", correlation: { turn: 1 } },
		);
		const persist = createPpprSessionPersistRequest(
			"session-1",
			{ snapshot: createPpprSnapshot(createPpprRuntimeState("session-1")), intent: "checkpoint" },
			{ id: "persist-1" },
		);
		const append = createPpprLogAppendRequest(
			"session-1",
			{ entries: [{ type: "status.changed", data: { to: "running" } }] },
			{ id: "append-1" },
		);
		const resolve = createPpprLogResolveRequest(
			"session-1",
			{ reference: { stream: "logs/session-1", checkpoint: "ckpt-1" }, intent: "resume" },
			{ id: "resolve-1" },
		);

		expect(read.kind).toBe("content.read");
		expect(write.kind).toBe("content.write");
		expect(patch.kind).toBe("content.patch");
		expect(exec.kind).toBe("command.exec");
		expect(infer.kind).toBe("model.infer");
		expect(infer.correlation).toEqual({ turn: 1 });
		expect(persist.kind).toBe("session.persist");
		expect(append.kind).toBe("log.append");
		expect(resolve.kind).toBe("log.resolve");
	});

	test("creates minimal runtime state and restores snapshots with log references", () => {
		const state = createPpprRuntimeState("session-1", {
			createdAt: 300,
			systemPrompt: "system",
			instructions: ["rule 1"],
			logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
		});
		state.lifecycle = { runId: "run-1", state: "awaiting_effect", lastReason: "effect_requested" };
		state.effects.pending.push(
			createPpprEffectRequest(
				"content.read",
				"session-1",
				{ target: "README.md" },
				{ id: "req-read", requestedAt: 301 },
			),
		);

		const snapshot = createPpprSnapshot(state);
		const restored = restorePpprRuntimeState(snapshot);

		expect(restored.session.sessionId).toBe("session-1");
		expect(restored.context.instructions).toEqual(["rule 1"]);
		expect(restored.lifecycle.state).toBe("awaiting_effect");
		expect(restored.effects.pending).toHaveLength(1);
		expect(restored.observability.logReferences[0]).toEqual({
			stream: "logs/session-1",
			checkpoint: "ckpt-1",
		});
		expect(restored).not.toBe(state);
		expect(restored.effects.pending[0]).not.toBe(state.effects.pending[0]);
	});

	test("sanitizes snapshot observability to approved fields only", () => {
		const state = createPpprRuntimeState("session-1");
		state.observability = {
			logReferences: [
				{
					stream: "logs/session-1",
					checkpoint: "ckpt-1",
					digest: "sha256:1",
					...({ bucket: "private-bucket", url: "s3://private-bucket/logs/session-1" } as Record<string, unknown>),
				} as PpprSnapshot["observability"]["logReferences"][number],
			],
			checkpoint: "ckpt-1",
			metadata: {
				bucket: "private-bucket",
				embeddedEntries: [{ type: "status.changed" }],
			},
		};

		const snapshot = createPpprSnapshot(state);

		expect(snapshot.observability).toEqual({
			logReferences: [
				{
					stream: "logs/session-1",
					checkpoint: "ckpt-1",
					digest: "sha256:1",
				},
			],
			checkpoint: "ckpt-1",
		});
		expect("metadata" in snapshot.observability).toBe(false);
		expect("bucket" in snapshot.observability.logReferences[0]!).toBe(false);
		expect("url" in snapshot.observability.logReferences[0]!).toBe(false);
	});

	test("sanitizes persisted snapshots and restored snapshots while preserving lifecycle and correlation", () => {
		const dirtySnapshot = {
			session: {
				sessionId: "session-1",
				createdAt: 500,
				continuationMode: "resume",
				backend: "object-store",
			},
			context: {
				systemPrompt: "system",
				instructions: ["rule 1"],
				thinkingLevel: undefined,
				metadata: { traceId: "trace-1" },
			},
			conversation: [],
			effects: {
				pending: [
					{
						id: "req-1",
						session_id: "session-1",
						kind: "model.infer",
						requested_at: 501,
						payload: {
							messages: [{ role: "user", content: "hello" }],
						},
						correlation: { turn: 1, hostRequestId: "host-1" },
					},
				],
				fulfilled: [],
			},
			lifecycle: {
				runId: "run-1",
				state: "awaiting_effect",
				lastReason: "effect_requested",
				storageVersion: "provider-specific",
			},
			observability: {
				logReferences: [
					{
						stream: "logs/session-1",
						start: "0",
						checkpoint: "ckpt-1",
						bucket: "private-bucket",
					},
				],
				checkpoint: "ckpt-1",
				metadata: { provider: "s3" },
			},
		} as unknown as PpprSnapshot;

		const restored = restorePpprRuntimeState(dirtySnapshot);
		const persist = createPpprSessionPersistRequest("session-1", {
			snapshot: dirtySnapshot,
			intent: "checkpoint",
		});

		expect(restored.lifecycle).toEqual({
			runId: "run-1",
			state: "awaiting_effect",
			lastReason: "effect_requested",
		});
		expect(restored.effects.pending[0]?.correlation).toEqual({ turn: 1, hostRequestId: "host-1" });
		expect(restored.observability).toEqual({
			logReferences: [{ stream: "logs/session-1", start: "0", checkpoint: "ckpt-1" }],
			checkpoint: "ckpt-1",
		});
		expect("bucket" in restored.observability.logReferences[0]!).toBe(false);
		expect(persist.payload.snapshot.observability).toEqual({
			logReferences: [{ stream: "logs/session-1", start: "0", checkpoint: "ckpt-1" }],
			checkpoint: "ckpt-1",
		});
	});
});
