import { randomUUID } from "node:crypto";
import {
	createPpprOutputEvent,
	createPpprRuntimeState,
	type PpprAssistantMessagePayload,
	type PpprEffectRequest,
	type PpprEffectResult,
	type PpprInputEvent,
	type PpprInputEventKind,
	type PpprLifecycleState,
	type PpprLogReference,
	type PpprOutputEvent,
	type PpprRuntimeState,
	type PpprSnapshot,
	type PpprStatusChangeReason,
	restorePpprRuntimeState,
} from "./runtime-protocol.js";

export interface PpprRuntimeTransitionResult {
	state: PpprRuntimeState;
	outputs: PpprOutputEvent[];
}

type PpprTypedInputEvent<K extends PpprInputEventKind> = PpprInputEvent<K>;
type PpprSessionStartEvent = PpprTypedInputEvent<"session.start">;
type PpprSessionResumeEvent = PpprTypedInputEvent<"session.resume">;
type PpprUserMessageEvent = PpprTypedInputEvent<"message.user">;
type PpprEffectResultEvent = PpprTypedInputEvent<"effect.result">;
type PpprSessionCancelEvent = PpprTypedInputEvent<"session.cancel">;

function cloneState(state: PpprRuntimeState): PpprRuntimeState {
	return restorePpprRuntimeState(state as PpprSnapshot);
}

function setLifecycle(state: PpprRuntimeState, nextState: PpprLifecycleState, reason: PpprStatusChangeReason): void {
	state.lifecycle.lastReason = reason;
	state.lifecycle.state = nextState;
}

function emitStatusChanged(
	outputs: PpprOutputEvent[],
	state: PpprRuntimeState,
	from: PpprLifecycleState,
	to: PpprLifecycleState,
	reason: PpprStatusChangeReason,
	requestId?: string,
): void {
	outputs.push(
		createPpprOutputEvent("status.changed", state.session.sessionId, {
			from,
			to,
			reason,
			request_id: requestId,
		}),
	);
}

function ensureRunId(state: PpprRuntimeState): string {
	const existing = state.lifecycle.runId;
	if (existing) return existing;
	const next = randomUUID();
	state.lifecycle.runId = next;
	return next;
}

function mergeLogReferences(
	existing: PpprLogReference[],
	incoming: PpprLogReference[] | undefined,
): PpprLogReference[] {
	if (!incoming || incoming.length === 0) {
		return existing;
	}

	const merged = [...existing.map((reference) => ({ ...reference }))];
	for (const reference of incoming) {
		const duplicate = merged.find(
			(candidate) =>
				candidate.stream === reference.stream &&
				candidate.start === reference.start &&
				candidate.end === reference.end &&
				candidate.checkpoint === reference.checkpoint &&
				candidate.digest === reference.digest,
		);
		if (!duplicate) {
			merged.push({ ...reference });
		}
	}
	return merged;
}

function requireState(state: PpprRuntimeState | undefined, kind: PpprInputEvent["kind"]): PpprRuntimeState {
	if (!state) {
		throw new Error(`Cannot handle ${kind} without an active runtime state`);
	}
	return cloneState(state);
}

export function applyPpprSessionStart(input: PpprSessionStartEvent): PpprRuntimeTransitionResult {
	const outputs: PpprOutputEvent[] = [];
	const state = createPpprRuntimeState(input.session_id, {
		createdAt: input.timestamp,
		continuationMode: input.payload.continuationMode ?? "new",
		systemPrompt: input.payload.systemPrompt,
		instructions: input.payload.instructions,
		thinkingLevel: input.payload.thinkingLevel,
	});

	if (input.payload.metadata) {
		state.context.metadata = { ...input.payload.metadata };
	}

	const from = state.lifecycle.state;
	const runId = ensureRunId(state);
	setLifecycle(state, "running", "session_started");

	outputs.push(
		createPpprOutputEvent("run.started", state.session.sessionId, {
			run_id: runId,
			state: state.lifecycle.state,
			triggering_input_id: input.id,
			metadata: input.payload.metadata,
		}),
	);
	emitStatusChanged(outputs, state, from, state.lifecycle.state, "session_started");

	return { state, outputs };
}

export function applyPpprSessionResume(input: PpprSessionResumeEvent): PpprRuntimeTransitionResult {
	const state = restorePpprRuntimeState(input.payload.snapshot);
	state.observability.logReferences = mergeLogReferences(
		state.observability.logReferences,
		input.payload.logReferences,
	);
	if (input.payload.metadata) {
		state.context.metadata = {
			...(state.context.metadata ?? {}),
			...input.payload.metadata,
		};
	}
	return { state, outputs: [] };
}

export function appendPpprUserMessage(
	state: PpprRuntimeState,
	input: PpprUserMessageEvent,
): PpprRuntimeTransitionResult {
	const nextState = cloneState(state);
	const outputs: PpprOutputEvent[] = [];

	nextState.conversation.push({
		role: "user",
		messageId: input.payload.messageId ?? input.id,
		text: input.payload.text,
		attachments: input.payload.attachments ? [...input.payload.attachments] : undefined,
	});

	if (nextState.lifecycle.state !== "running") {
		const from = nextState.lifecycle.state;
		const runId = randomUUID();
		nextState.lifecycle.runId = runId;
		setLifecycle(nextState, "running", "session_started");
		outputs.push(
			createPpprOutputEvent("run.started", nextState.session.sessionId, {
				run_id: runId,
				state: nextState.lifecycle.state,
				triggering_input_id: input.id,
				metadata: input.payload.metadata,
			}),
		);
		emitStatusChanged(outputs, nextState, from, nextState.lifecycle.state, "session_started");
	}

	return { state: nextState, outputs };
}

export function appendPpprAssistantMessage(
	state: PpprRuntimeState,
	message: PpprAssistantMessagePayload,
): PpprRuntimeTransitionResult {
	const nextState = cloneState(state);
	nextState.conversation.push({
		role: "assistant",
		message: {
			...message,
			segments: [...message.segments],
		},
	});

	const outputs = [
		createPpprOutputEvent("message.assistant", nextState.session.sessionId, {
			...message,
			segments: [...message.segments],
		}),
	];
	return { state: nextState, outputs };
}

export function requestPpprEffect(state: PpprRuntimeState, request: PpprEffectRequest): PpprRuntimeTransitionResult {
	const nextState = cloneState(state);
	const outputs: PpprOutputEvent[] = [];
	const from = nextState.lifecycle.state;

	nextState.effects.pending.push({ ...request });
	setLifecycle(nextState, "awaiting_effect", "effect_requested");

	outputs.push(createPpprOutputEvent("effect.requested", nextState.session.sessionId, { ...request }));
	emitStatusChanged(outputs, nextState, from, nextState.lifecycle.state, "effect_requested", request.id);

	return { state: nextState, outputs };
}

export function ingestPpprEffectResult(state: PpprRuntimeState, result: PpprEffectResult): PpprRuntimeTransitionResult {
	const nextState = cloneState(state);
	const outputs: PpprOutputEvent[] = [];
	const from = nextState.lifecycle.state;

	nextState.effects.pending = nextState.effects.pending.filter((request) => request.id !== result.request_id);
	nextState.effects.fulfilled.push({
		requestId: result.request_id,
		kind: result.kind,
		outcome: result.outcome,
		completedAt: result.completed_at,
	});

	if (result.outcome === "success") {
		setLifecycle(nextState, "running", "effect_resolved");
		emitStatusChanged(outputs, nextState, from, nextState.lifecycle.state, "effect_resolved", result.request_id);
		return { state: nextState, outputs };
	}

	setLifecycle(nextState, "failed", "run_failed");
	emitStatusChanged(outputs, nextState, from, nextState.lifecycle.state, "run_failed", result.request_id);
	outputs.push(
		createPpprOutputEvent("run.failed", nextState.session.sessionId, {
			run_id: ensureRunId(nextState),
			state: "failed",
			error: result.error ?? {
				message:
					result.outcome === "denied"
						? "Effect request denied by host policy"
						: "Effect request failed during host execution",
			},
			request_id: result.request_id,
			metadata: result.metadata,
		}),
	);

	return { state: nextState, outputs };
}

export function cancelPpprRuntime(state: PpprRuntimeState, input: PpprSessionCancelEvent): PpprRuntimeTransitionResult {
	const nextState = cloneState(state);
	const outputs: PpprOutputEvent[] = [];
	const from = nextState.lifecycle.state;

	setLifecycle(nextState, "stopped", "cancelled");
	emitStatusChanged(outputs, nextState, from, nextState.lifecycle.state, "cancelled");
	outputs.push(
		createPpprOutputEvent("run.completed", nextState.session.sessionId, {
			run_id: ensureRunId(nextState),
			state: "stopped",
			completion_reason: input.payload.reason ?? "cancelled",
		}),
	);

	return { state: nextState, outputs };
}

export function advancePpprRuntime(
	state: PpprRuntimeState | undefined,
	input: PpprInputEvent,
): PpprRuntimeTransitionResult {
	switch (input.kind) {
		case "session.start":
			return applyPpprSessionStart(input as PpprSessionStartEvent);
		case "session.resume":
			return applyPpprSessionResume(input as PpprSessionResumeEvent);
		case "message.user":
			return appendPpprUserMessage(requireState(state, input.kind), input as PpprUserMessageEvent);
		case "effect.result":
			return ingestPpprEffectResult(requireState(state, input.kind), (input as PpprEffectResultEvent).payload);
		case "session.cancel":
			return cancelPpprRuntime(requireState(state, input.kind), input as PpprSessionCancelEvent);
	}
}
