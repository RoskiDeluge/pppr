import { describe, expect, test } from "vitest";
import { createPpprCliEffectFulfillmentHost } from "../src/pppr/cli-effect-fulfillment.js";
import { createPpprCliHostState, dispatchPpprCliHostAction } from "../src/pppr/cli-host.js";
import {
	createPpprProofHostExecutionEnvironment,
	createPpprProofHostRemoteInvocation,
	createPpprProofHostState,
	dispatchPpprProofHostInvocation,
	executePpprProofHostInvocation,
	executePpprProofHostRemoteInvocation,
	getPpprProofHostRuntimeView,
	mapPpprProofHostInvocationToInputEvent,
	PPPR_PROOF_HOST_BOUNDARY,
	PPPR_PROOF_HOST_DRIVER_MODULE,
	PPPR_PROOF_HOST_HOST_OWNED_RESOURCE_AREAS,
	PPPR_PROOF_HOST_OPERATION_TO_INPUT_KIND,
	PPPR_PROOF_HOST_RESPONSIBILITIES,
	PPPR_PROOF_HOST_RUNTIME_RESPONSIBILITIES,
} from "../src/pppr/proof-host.js";
import { requestPpprEffect } from "../src/pppr/runtime.js";
import {
	createPpprEffectRequest,
	createPpprEffectResult,
	createPpprRuntimeState,
	createPpprSnapshot,
} from "../src/pppr/runtime-protocol.js";

describe("pppr proof host boundary", () => {
	test("defines a non-cli proof-host boundary around the runtime", () => {
		expect(PPPR_PROOF_HOST_BOUNDARY.driverModule).toBe(PPPR_PROOF_HOST_DRIVER_MODULE);
		expect(PPPR_PROOF_HOST_BOUNDARY.hostResponsibilities).toEqual(PPPR_PROOF_HOST_RESPONSIBILITIES);
		expect(PPPR_PROOF_HOST_BOUNDARY.runtimeResponsibilities).toEqual(PPPR_PROOF_HOST_RUNTIME_RESPONSIBILITIES);
		expect(PPPR_PROOF_HOST_BOUNDARY.invocationMappings).toEqual(PPPR_PROOF_HOST_OPERATION_TO_INPUT_KIND);
	});

	test("maps embedded or remote invocations onto protocol inputs", () => {
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
			mapPpprProofHostInvocationToInputEvent({
				operation: "start",
				sessionId: "session-1",
				payload: { systemPrompt: "system", continuationMode: "new" },
				options: { id: "start-1", timestamp: 100 },
				invocationMetadata: { transport: "embedded" },
			}),
		).toMatchObject({
			id: "start-1",
			kind: "session.start",
			session_id: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
		});

		expect(
			mapPpprProofHostInvocationToInputEvent({
				operation: "resume",
				sessionId: "session-1",
				snapshot,
				logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
				metadata: { resumedBy: "proof-host" },
				options: { id: "resume-1", timestamp: 101 },
				invocationMetadata: { transport: "remote" },
			}),
		).toMatchObject({
			id: "resume-1",
			kind: "session.resume",
			session_id: "session-1",
			payload: {
				snapshot,
				logReferences: [{ stream: "logs/session-1", checkpoint: "ckpt-1" }],
				metadata: { resumedBy: "proof-host" },
			},
		});

		expect(
			mapPpprProofHostInvocationToInputEvent({
				operation: "prompt",
				sessionId: "session-1",
				payload: { text: "inspect README.md" },
				options: { id: "msg-1", timestamp: 102 },
				invocationMetadata: { actor: "micro-agent-1" },
			}),
		).toMatchObject({
			id: "msg-1",
			kind: "message.user",
			session_id: "session-1",
			payload: { text: "inspect README.md" },
		});

		expect(
			mapPpprProofHostInvocationToInputEvent({
				operation: "effect_result",
				sessionId: "session-1",
				result,
				options: { id: "evt-1", timestamp: 130 },
				invocationMetadata: { actor: "effect-worker-1" },
			}),
		).toMatchObject({
			id: "evt-1",
			kind: "effect.result",
			session_id: "session-1",
			payload: result,
		});

		expect(
			mapPpprProofHostInvocationToInputEvent({
				operation: "cancel",
				sessionId: "session-1",
				payload: { reason: "remote caller cancelled" },
				options: { id: "cancel-1", timestamp: 140 },
				invocationMetadata: { caller: "api" },
			}),
		).toMatchObject({
			id: "cancel-1",
			kind: "session.cancel",
			session_id: "session-1",
			payload: { reason: "remote caller cancelled" },
		});
	});

	test("returns structured invocation results without cli-only state", () => {
		const started = dispatchPpprProofHostInvocation(createPpprProofHostState(), {
			operation: "start",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
			invocationMetadata: { transport: "embedded" },
		});

		expect(started.outputs.map((output) => output.kind)).toEqual(["run.started", "status.changed"]);
		expect(started.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "session_started",
		});
		expect(started.invocationResult).toMatchObject({
			sessionId: "session-1",
			lifecycle: {
				state: "running",
				lastReason: "session_started",
			},
			pendingEffects: [],
			invocationMetadata: { transport: "embedded" },
		});
		expect(started.snapshot).toMatchObject({
			session: {
				sessionId: "session-1",
				continuationMode: "new",
			},
		});

		const waiting = dispatchPpprProofHostInvocation(started.hostState, {
			operation: "prompt",
			sessionId: "session-1",
			payload: { text: "inspect README.md" },
			options: { id: "msg-1", timestamp: 101 },
			invocationMetadata: { actor: "micro-agent-1" },
		});

		expect(getPpprProofHostRuntimeView(waiting.hostState)).toEqual({
			lifecycle: waiting.hostState.runtimeState?.lifecycle,
			pendingEffects: [],
		});
		expect(waiting.invocationResult.outputs).toEqual([]);
		expect(waiting.hostState.runtimeState?.conversation.at(-1)).toMatchObject({
			role: "user",
			text: "inspect README.md",
		});
	});

	test("executes a non-cli proof-host loop with automatic effect fulfillment", async () => {
		const base = createPpprRuntimeState("session-1");
		const waiting = requestPpprEffect(
			base,
			createPpprEffectRequest(
				"content.read",
				"session-1",
				{ target: "README.md" },
				{ id: "req-1", requestedAt: 200 },
			),
		);
		const effectHost = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					return { content: "# README" };
				},
				async write() {
					return { target: "README.md", written: true };
				},
				async patch() {
					return { target: "README.md", applied: true };
				},
			},
			command: {
				async exec() {
					return { exitCode: 0, stdout: "", stderr: "" };
				},
			},
			persistence: {
				async persist() {
					return { persisted: true };
				},
			},
			logs: {
				async append() {
					return { appended: 0 };
				},
				async resolve(request) {
					return { reference: request.reference, entries: [] };
				},
			},
		});

		const executed = await executePpprProofHostInvocation(
			createPpprProofHostState({ runtimeState: waiting.state }),
			{
				operation: "resume",
				sessionId: "session-1",
				snapshot: createPpprSnapshot(waiting.state),
				invocationMetadata: { transport: "embedded" },
			},
			{
				effectHost,
				autoFulfillPendingEffects: true,
			},
		);

		expect(executed.effectResults).toEqual([
			expect.objectContaining({
				kind: "content.read",
				outcome: "success",
				payload: expect.objectContaining({
					content: "# README",
				}),
			}),
		]);
		expect(executed.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "effect_resolved",
		});
		expect(executed.runtimeView.pendingEffects).toEqual([]);
		expect(executed.executionResult).toMatchObject({
			sessionId: "session-1",
			lifecycle: {
				state: "running",
				lastReason: "effect_resolved",
			},
			pendingEffects: [],
			invocationMetadata: { transport: "embedded" },
		});
	});

	test("returns structured completion results outside terminal interaction", async () => {
		const started = dispatchPpprProofHostInvocation(createPpprProofHostState(), {
			operation: "start",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});

		const completed = await executePpprProofHostInvocation(
			started.hostState,
			{
				operation: "cancel",
				sessionId: "session-1",
				payload: { reason: "remote completion" },
				options: { id: "cancel-1", timestamp: 101 },
				invocationMetadata: { caller: "api" },
			},
			{
				autoFulfillPendingEffects: false,
			},
		);

		expect(completed.effectResults).toEqual([]);
		expect(completed.outputs.map((output) => output.kind)).toEqual(["status.changed", "run.completed"]);
		expect(completed.executionResult).toMatchObject({
			sessionId: "session-1",
			lifecycle: {
				state: "stopped",
				lastReason: "cancelled",
			},
			invocationMetadata: { caller: "api" },
		});
		expect(completed.snapshot).toMatchObject({
			lifecycle: {
				state: "stopped",
				lastReason: "cancelled",
			},
		});
	});

	test("defines a remote actor-compatible proof-host shape with host-owned bindings", () => {
		const environment = createPpprProofHostExecutionEnvironment({
			workspace: {
				workspaceRef: "workspace://tenant-a/session-1",
				isolationBoundary: "sandbox",
				metadata: { region: "global" },
			},
			model: {
				providerRef: "models://shared-inference",
				modelRef: "gpt-proof",
				invocationMode: "async",
			},
			persistence: {
				snapshotStoreRef: "store://snapshots/session-1",
				logStoreRef: "store://logs/session-1",
			},
			observability: {
				streamRef: "stream://session-1",
				sinkRef: "sink://audit",
			},
			capabilityAccess: [
				{
					kind: "content",
					providerRef: "provider://workspace-fs",
				},
				{
					kind: "mcp",
					providerRef: "provider://mcp-gateway",
					capabilityRef: "capability://tools",
				},
			],
			metadata: { substrate: "generic-actor-host" },
		});

		const remoteInvocation = createPpprProofHostRemoteInvocation({
			address: {
				mode: "remote_actor",
				hostId: "host-cluster-a",
				agentId: "agent-42",
				sessionId: "session-1",
				namespace: "tenant-a",
				metadata: { shard: "s1" },
			},
			environment,
			invocation: {
				operation: "start",
				sessionId: "session-1",
				payload: { systemPrompt: "system", continuationMode: "new" },
			},
			metadata: { caller: "embedded-api" },
		});

		expect(PPPR_PROOF_HOST_HOST_OWNED_RESOURCE_AREAS).toEqual([
			"workspace",
			"model",
			"persistence",
			"observability",
			"capability_access",
		]);
		expect(remoteInvocation).toMatchObject({
			address: {
				mode: "remote_actor",
				hostId: "host-cluster-a",
				agentId: "agent-42",
				sessionId: "session-1",
				namespace: "tenant-a",
				metadata: { shard: "s1" },
			},
			environment: {
				workspace: {
					workspaceRef: "workspace://tenant-a/session-1",
					isolationBoundary: "sandbox",
				},
				model: {
					providerRef: "models://shared-inference",
					modelRef: "gpt-proof",
					invocationMode: "async",
				},
				persistence: {
					snapshotStoreRef: "store://snapshots/session-1",
					logStoreRef: "store://logs/session-1",
				},
				observability: {
					streamRef: "stream://session-1",
					sinkRef: "sink://audit",
				},
				capabilityAccess: [
					{ kind: "content", providerRef: "provider://workspace-fs" },
					{
						kind: "mcp",
						providerRef: "provider://mcp-gateway",
						capabilityRef: "capability://tools",
					},
				],
				metadata: { substrate: "generic-actor-host" },
			},
			metadata: { caller: "embedded-api" },
		});
	});

	test("executes a remote proof-host envelope without leaking host bindings into core snapshots", async () => {
		const remoteInvocation = createPpprProofHostRemoteInvocation({
			address: {
				mode: "remote_actor",
				hostId: "host-cluster-a",
				agentId: "agent-42",
				sessionId: "session-1",
			},
			environment: {
				workspace: {
					workspaceRef: "workspace://tenant-a/session-1",
				},
				model: {
					providerRef: "models://shared-inference",
				},
				persistence: {
					snapshotStoreRef: "store://snapshots/session-1",
				},
				observability: {
					streamRef: "stream://session-1",
				},
				capabilityAccess: [
					{
						kind: "mcp",
						providerRef: "provider://mcp-gateway",
					},
				],
			},
			invocation: {
				operation: "start",
				sessionId: "session-1",
				payload: { systemPrompt: "system", continuationMode: "new" },
				invocationMetadata: { transport: "remote" },
			},
		});

		const executed = await executePpprProofHostRemoteInvocation(createPpprProofHostState(), remoteInvocation, {
			autoFulfillPendingEffects: false,
		});

		expect(executed.remote).toMatchObject({
			address: {
				mode: "remote_actor",
				hostId: "host-cluster-a",
				agentId: "agent-42",
				sessionId: "session-1",
			},
			environment: {
				workspace: {
					workspaceRef: "workspace://tenant-a/session-1",
				},
				model: {
					providerRef: "models://shared-inference",
				},
				persistence: {
					snapshotStoreRef: "store://snapshots/session-1",
				},
				observability: {
					streamRef: "stream://session-1",
				},
				capabilityAccess: [
					{
						kind: "mcp",
						providerRef: "provider://mcp-gateway",
					},
				],
			},
		});
		expect(executed.executionResult).toMatchObject({
			sessionId: "session-1",
			lifecycle: {
				state: "running",
				lastReason: "session_started",
			},
		});
		expect(executed.snapshot).toMatchObject({
			session: {
				sessionId: "session-1",
				continuationMode: "new",
			},
		});
		expect(executed.snapshot).not.toHaveProperty("environment");
		expect(executed.snapshot).not.toHaveProperty("address");
	});

	test("runs the same runtime transitions through the non-cli proof host as the cli host", () => {
		const cliStarted = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "start_session",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});
		const proofStarted = dispatchPpprProofHostInvocation(createPpprProofHostState(), {
			operation: "start",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});

		expect(proofStarted.outputs.map((output) => output.kind)).toEqual(
			cliStarted.outputs.map((output) => output.kind),
		);
		expect(proofStarted.hostState.runtimeState).toMatchObject({
			session: cliStarted.hostState.runtimeState?.session,
			lifecycle: {
				state: cliStarted.hostState.runtimeState?.lifecycle.state,
				lastReason: cliStarted.hostState.runtimeState?.lifecycle.lastReason,
			},
		});

		const cliPrompted = dispatchPpprCliHostAction(cliStarted.hostState, {
			type: "submit_prompt",
			sessionId: "session-1",
			payload: { text: "inspect README.md" },
			options: { id: "msg-1", timestamp: 101 },
		});
		const proofPrompted = dispatchPpprProofHostInvocation(proofStarted.hostState, {
			operation: "prompt",
			sessionId: "session-1",
			payload: { text: "inspect README.md" },
			options: { id: "msg-1", timestamp: 101 },
		});

		expect(proofPrompted.outputs.map((output) => output.kind)).toEqual(
			cliPrompted.outputs.map((output) => output.kind),
		);
		expect(proofPrompted.hostState.runtimeState).toMatchObject({
			session: cliPrompted.hostState.runtimeState?.session,
			lifecycle: {
				state: cliPrompted.hostState.runtimeState?.lifecycle.state,
				lastReason: cliPrompted.hostState.runtimeState?.lifecycle.lastReason,
			},
			conversation: cliPrompted.hostState.runtimeState?.conversation,
		});
		expect(proofPrompted.runtimeView).toMatchObject({
			lifecycle: {
				state: cliPrompted.runtimeView.lifecycle?.state,
				lastReason: cliPrompted.runtimeView.lifecycle?.lastReason,
			},
			pendingEffects: cliPrompted.runtimeView.pendingEffects,
		});
	});

	test("verifies resume and embedded invocation flows through proof-host snapshots and effect resolution", async () => {
		const base = createPpprRuntimeState("session-1", {
			logReferences: [{ stream: "logs/session-1", checkpoint: "0" }],
		});
		const waiting = requestPpprEffect(
			base,
			createPpprEffectRequest(
				"content.read",
				"session-1",
				{ target: "README.md" },
				{ id: "req-1", requestedAt: 200 },
			),
		);
		const effectHost = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					return { content: "# README" };
				},
				async write() {
					return { target: "README.md", written: true };
				},
				async patch() {
					return { target: "README.md", applied: true };
				},
			},
			command: {
				async exec() {
					return { exitCode: 0, stdout: "", stderr: "" };
				},
			},
			persistence: {
				async persist() {
					return { persisted: true };
				},
			},
			logs: {
				async append() {
					return { appended: 0 };
				},
				async resolve(request) {
					return {
						reference: request.reference,
						entries: [{ type: "effect.requested", data: { kind: "content.read" } }],
					};
				},
			},
		});

		const resumed = await executePpprProofHostRemoteInvocation(
			createPpprProofHostState(),
			createPpprProofHostRemoteInvocation({
				address: {
					mode: "embedded",
					hostId: "embedded-host",
					agentId: "agent-42",
					sessionId: "session-1",
				},
				invocation: {
					operation: "resume",
					sessionId: "session-1",
					snapshot: createPpprSnapshot(waiting.state),
					logReferences: [{ stream: "logs/session-1", checkpoint: "1" }],
					invocationMetadata: { transport: "embedded" },
				},
			}),
			{
				effectHost,
				autoFulfillPendingEffects: true,
			},
		);

		expect(resumed.remote.address.mode).toBe("embedded");
		expect(resumed.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "effect_resolved",
		});
		expect(resumed.runtimeView.pendingEffects).toEqual([]);
		expect(resumed.effectResults).toEqual([
			expect.objectContaining({
				kind: "content.read",
				outcome: "success",
			}),
		]);
		expect(resumed.hostState.runtimeState?.observability.logReferences).toEqual([
			expect.objectContaining({ stream: "logs/session-1", checkpoint: "0" }),
			expect.objectContaining({ stream: "logs/session-1", checkpoint: "1" }),
		]);
	});

	test("requires no cli-only hidden state to continue runtime execution", () => {
		const started = dispatchPpprProofHostInvocation(createPpprProofHostState(), {
			operation: "start",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});
		const resumedFromSnapshot = dispatchPpprProofHostInvocation(createPpprProofHostState(), {
			operation: "resume",
			sessionId: "session-1",
			snapshot: started.snapshot!,
			logReferences: [{ stream: "logs/session-1", checkpoint: "1" }],
			options: { id: "resume-1", timestamp: 101 },
		});
		const prompted = dispatchPpprProofHostInvocation(resumedFromSnapshot.hostState, {
			operation: "prompt",
			sessionId: "session-1",
			payload: { text: "continue from snapshot only" },
			options: { id: "msg-1", timestamp: 102 },
		});

		expect(resumedFromSnapshot.hostState.inputHistory).toHaveLength(1);
		expect(resumedFromSnapshot.hostState.outputHistory).toEqual([]);
		expect(prompted.hostState.runtimeState?.conversation).toEqual([
			expect.objectContaining({
				role: "user",
				text: "continue from snapshot only",
			}),
		]);
		expect(prompted.hostState.runtimeState?.observability.logReferences).toEqual([
			expect.objectContaining({ stream: "logs/session-1", checkpoint: "1" }),
		]);
		expect(prompted.runtimeView.lifecycle).toMatchObject({
			state: "running",
		});
	});
});
