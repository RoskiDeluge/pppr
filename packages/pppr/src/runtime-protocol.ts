import { randomUUID } from "node:crypto";
import type { PpprThinkingLevel } from "./thinking.js";

export type PpprContinuationMode = "new" | "resume" | "fork";

export type PpprLifecycleState = "idle" | "running" | "awaiting_effect" | "stopped" | "failed";

export type PpprStatusChangeReason =
	| "session_started"
	| "assistant_progress"
	| "effect_requested"
	| "effect_resolved"
	| "run_completed"
	| "run_failed"
	| "cancelled";

export interface PpprLogReference {
	stream: string;
	start?: string;
	end?: string;
	checkpoint?: string;
	digest?: string;
}

export interface PpprUsageSummary {
	inputTokens?: number;
	outputTokens?: number;
	cacheReadTokens?: number;
	cacheWriteTokens?: number;
	costUsd?: number;
}

export interface PpprArtifactReference {
	kind: string;
	label?: string;
	ref: string;
	metadata?: Record<string, unknown>;
}

export interface PpprAssistantTextSegment {
	type: "text";
	text: string;
}

export interface PpprAssistantThinkingSegment {
	type: "thinking";
	text: string;
}

export interface PpprAssistantToolIntentSegment {
	type: "tool_intent";
	toolName: string;
	summary?: string;
}

export interface PpprAssistantArtifactRefSegment {
	type: "artifact_ref";
	artifact: PpprArtifactReference;
}

export type PpprAssistantSegment =
	| PpprAssistantTextSegment
	| PpprAssistantThinkingSegment
	| PpprAssistantToolIntentSegment
	| PpprAssistantArtifactRefSegment;

export interface PpprSessionStartPayload {
	cwd?: string;
	systemPrompt?: string;
	instructions?: string[];
	continuationMode?: PpprContinuationMode;
	thinkingLevel?: PpprThinkingLevel;
	metadata?: Record<string, unknown>;
}

export interface PpprSessionResumePayload {
	snapshot: PpprSnapshot;
	logReferences?: PpprLogReference[];
	metadata?: Record<string, unknown>;
}

export interface PpprUserMessagePayload {
	messageId?: string;
	text: string;
	attachments?: PpprArtifactReference[];
	metadata?: Record<string, unknown>;
}

export interface PpprSessionCancelPayload {
	reason?: string;
}

export interface PpprInputPayloadMap {
	"session.start": PpprSessionStartPayload;
	"session.resume": PpprSessionResumePayload;
	"message.user": PpprUserMessagePayload;
	"effect.result": PpprEffectResult;
	"session.cancel": PpprSessionCancelPayload;
}

export type PpprInputEventKind = keyof PpprInputPayloadMap;

export interface PpprEventEnvelope<K extends string, TPayload> {
	id: string;
	session_id: string;
	kind: K;
	timestamp: number;
	payload: TPayload;
}

export type PpprInputEvent<K extends PpprInputEventKind = PpprInputEventKind> = PpprEventEnvelope<
	K,
	PpprInputPayloadMap[K]
>;

export interface PpprRunStartedPayload {
	run_id: string;
	state: PpprLifecycleState;
	triggering_input_id?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprAssistantMessagePayload {
	message_id: string;
	role: "assistant";
	segments: PpprAssistantSegment[];
	stop_reason?: string;
	usage?: PpprUsageSummary;
}

export interface PpprStatusChangedPayload {
	from: PpprLifecycleState;
	to: PpprLifecycleState;
	reason: PpprStatusChangeReason;
	request_id?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprRunCompletedPayload {
	run_id: string;
	state: "stopped";
	completion_reason: string;
	usage?: PpprUsageSummary;
	metadata?: Record<string, unknown>;
}

export interface PpprRunFailedPayload {
	run_id: string;
	state: "failed";
	error: {
		code?: string;
		message: string;
		details?: Record<string, unknown>;
	};
	request_id?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprOutputPayloadMap {
	"run.started": PpprRunStartedPayload;
	"message.assistant": PpprAssistantMessagePayload;
	"effect.requested": PpprEffectRequest;
	"status.changed": PpprStatusChangedPayload;
	"run.completed": PpprRunCompletedPayload;
	"run.failed": PpprRunFailedPayload;
}

export type PpprOutputEventKind = keyof PpprOutputPayloadMap;

export type PpprOutputEvent<K extends PpprOutputEventKind = PpprOutputEventKind> = PpprEventEnvelope<
	K,
	PpprOutputPayloadMap[K]
>;

export type PpprEffectKind =
	| "content.read"
	| "content.write"
	| "content.patch"
	| "command.exec"
	| "model.infer"
	| "session.persist"
	| "log.append"
	| "log.resolve";

export interface PpprContentReadRequestPayload {
	target: string;
	range?: { startLine?: number; endLine?: number };
	mode?: "text" | "binary";
}

export interface PpprContentWriteRequestPayload {
	target: string;
	content: string;
	mode?: "create" | "overwrite" | "append";
	expectExists?: boolean;
}

export interface PpprContentPatchRequestPayload {
	target: string;
	patch: string;
	mode?: "unified" | "structured";
}

export interface PpprCommandExecRequestPayload {
	command: string[];
	cwd?: string;
	timeoutMs?: number;
	envPolicy?: "inherit" | "minimal" | "custom";
}

export interface PpprModelMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
}

export interface PpprModelInferRequestPayload {
	model?: string;
	thinkingLevel?: PpprThinkingLevel;
	messages: PpprModelMessage[];
	toolChoice?: "auto" | "none";
	metadata?: Record<string, unknown>;
}

export interface PpprSessionPersistRequestPayload {
	snapshot: PpprSnapshot;
	intent?: "checkpoint" | "autosave" | "final";
	continuationMode?: PpprContinuationMode;
}

export interface PpprLogAppendEntry {
	type: string;
	data: Record<string, unknown>;
}

export interface PpprLogAppendRequestPayload {
	reference?: PpprLogReference;
	entries: PpprLogAppendEntry[];
	checkpointHint?: string;
}

export interface PpprLogResolveRequestPayload {
	reference: PpprLogReference;
	bounds?: {
		start?: string;
		end?: string;
	};
	intent?: "replay" | "inspect" | "resume";
}

export interface PpprEffectRequestPayloadMap {
	"content.read": PpprContentReadRequestPayload;
	"content.write": PpprContentWriteRequestPayload;
	"content.patch": PpprContentPatchRequestPayload;
	"command.exec": PpprCommandExecRequestPayload;
	"model.infer": PpprModelInferRequestPayload;
	"session.persist": PpprSessionPersistRequestPayload;
	"log.append": PpprLogAppendRequestPayload;
	"log.resolve": PpprLogResolveRequestPayload;
}

export type PpprEffectOutcome = "success" | "denied" | "failed";

export interface PpprContentReadResultPayload {
	content: string;
	truncated?: boolean;
	range?: { startLine?: number; endLine?: number };
	digest?: string;
}

export interface PpprContentWriteResultPayload {
	target: string;
	written: boolean;
	digest?: string;
	version?: string;
}

export interface PpprContentPatchResultPayload {
	target: string;
	applied: boolean;
	diff?: string;
}

export interface PpprCommandExecResultPayload {
	exitCode: number;
	stdout: string;
	stderr: string;
	durationMs?: number;
	terminated?: boolean;
}

export interface PpprModelInferResultPayload {
	message: PpprAssistantMessagePayload;
	stopReason?: string;
	usage?: PpprUsageSummary;
	model?: string;
	provider?: string;
}

export interface PpprSessionPersistResultPayload {
	reference?: PpprLogReference;
	checkpoint?: string;
	persisted: boolean;
}

export interface PpprLogAppendResultPayload {
	reference?: PpprLogReference;
	checkpoint?: string;
	appended: number;
}

export interface PpprLogResolveEntry {
	type: string;
	data: Record<string, unknown>;
}

export interface PpprLogResolveResultPayload {
	reference: PpprLogReference;
	entries: PpprLogResolveEntry[];
	checkpoint?: string;
}

export interface PpprEffectResultPayloadMap {
	"content.read": PpprContentReadResultPayload;
	"content.write": PpprContentWriteResultPayload;
	"content.patch": PpprContentPatchResultPayload;
	"command.exec": PpprCommandExecResultPayload;
	"model.infer": PpprModelInferResultPayload;
	"session.persist": PpprSessionPersistResultPayload;
	"log.append": PpprLogAppendResultPayload;
	"log.resolve": PpprLogResolveResultPayload;
}

export interface PpprEffectRequest<K extends PpprEffectKind = PpprEffectKind> {
	id: string;
	session_id: string;
	kind: K;
	requested_at: number;
	payload: PpprEffectRequestPayloadMap[K];
	policy?: {
		approvalRequired?: boolean;
		sandbox?: string;
	};
	correlation?: Record<string, unknown>;
}

export interface PpprEffectResult<K extends PpprEffectKind = PpprEffectKind> {
	id: string;
	session_id: string;
	request_id: string;
	kind: K;
	completed_at: number;
	outcome: PpprEffectOutcome;
	payload: PpprEffectResultPayloadMap[K];
	error?: {
		code?: string;
		message: string;
		details?: Record<string, unknown>;
	};
	metadata?: Record<string, unknown>;
}

export interface PpprSessionState {
	sessionId: string;
	createdAt: number;
	continuationMode: PpprContinuationMode;
}

export interface PpprContextState {
	systemPrompt?: string;
	instructions: string[];
	thinkingLevel?: PpprThinkingLevel;
	metadata?: Record<string, unknown>;
}

export type PpprConversationEntry =
	| { role: "user"; messageId: string; text: string; attachments?: PpprArtifactReference[] }
	| { role: "assistant"; message: PpprAssistantMessagePayload };

export interface PpprEffectsState {
	pending: PpprEffectRequest[];
	fulfilled: Array<{
		requestId: string;
		kind: PpprEffectKind;
		outcome: PpprEffectOutcome;
		completedAt: number;
	}>;
}

export interface PpprObservabilityState {
	logReferences: PpprLogReference[];
	checkpoint?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprRuntimeState {
	session: PpprSessionState;
	context: PpprContextState;
	conversation: PpprConversationEntry[];
	effects: PpprEffectsState;
	lifecycle: {
		runId?: string;
		state: PpprLifecycleState;
		lastReason?: PpprStatusChangeReason;
	};
	observability: PpprObservabilityState;
}

export interface PpprSnapshot {
	session: PpprSessionState;
	context: PpprContextState;
	conversation: PpprConversationEntry[];
	effects: PpprEffectsState;
	lifecycle: PpprRuntimeState["lifecycle"];
	observability: PpprObservabilityState;
}

export interface PpprEventOptions {
	id?: string;
	timestamp?: number;
}

export function createPpprInputEvent<K extends PpprInputEventKind>(
	kind: K,
	sessionId: string,
	payload: PpprInputPayloadMap[K],
	options: PpprEventOptions = {},
): PpprInputEvent<K> {
	return {
		id: options.id ?? randomUUID(),
		session_id: sessionId,
		kind,
		timestamp: options.timestamp ?? Date.now(),
		payload,
	};
}

export function createPpprOutputEvent<K extends PpprOutputEventKind>(
	kind: K,
	sessionId: string,
	payload: PpprOutputPayloadMap[K],
	options: PpprEventOptions = {},
): PpprOutputEvent<K> {
	return {
		id: options.id ?? randomUUID(),
		session_id: sessionId,
		kind,
		timestamp: options.timestamp ?? Date.now(),
		payload,
	};
}

export interface PpprEffectRequestOptions {
	id?: string;
	requestedAt?: number;
	policy?: PpprEffectRequest["policy"];
	correlation?: Record<string, unknown>;
}

export function createPpprEffectRequest<K extends PpprEffectKind>(
	kind: K,
	sessionId: string,
	payload: PpprEffectRequestPayloadMap[K],
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<K> {
	return {
		id: options.id ?? randomUUID(),
		session_id: sessionId,
		kind,
		requested_at: options.requestedAt ?? Date.now(),
		payload,
		policy: options.policy,
		correlation: options.correlation,
	};
}

export function createPpprContentReadRequest(
	sessionId: string,
	payload: PpprContentReadRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"content.read"> {
	return createPpprEffectRequest("content.read", sessionId, payload, options);
}

export function createPpprContentWriteRequest(
	sessionId: string,
	payload: PpprContentWriteRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"content.write"> {
	return createPpprEffectRequest("content.write", sessionId, payload, options);
}

export function createPpprContentPatchRequest(
	sessionId: string,
	payload: PpprContentPatchRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"content.patch"> {
	return createPpprEffectRequest("content.patch", sessionId, payload, options);
}

export function createPpprCommandExecRequest(
	sessionId: string,
	payload: PpprCommandExecRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"command.exec"> {
	return createPpprEffectRequest("command.exec", sessionId, payload, options);
}

export function createPpprModelInferRequest(
	sessionId: string,
	payload: PpprModelInferRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"model.infer"> {
	return createPpprEffectRequest("model.infer", sessionId, payload, options);
}

export function createPpprSessionPersistRequest(
	sessionId: string,
	payload: PpprSessionPersistRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"session.persist"> {
	return createPpprEffectRequest(
		"session.persist",
		sessionId,
		{
			...payload,
			snapshot: createPpprSnapshot(payload.snapshot),
		},
		options,
	);
}

export function createPpprLogAppendRequest(
	sessionId: string,
	payload: PpprLogAppendRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"log.append"> {
	return createPpprEffectRequest(
		"log.append",
		sessionId,
		{
			...payload,
			reference: payload.reference ? clonePpprLogReference(payload.reference) : undefined,
			entries: payload.entries.map((entry) => ({
				type: entry.type,
				data: { ...entry.data },
			})),
		},
		options,
	);
}

export function createPpprLogResolveRequest(
	sessionId: string,
	payload: PpprLogResolveRequestPayload,
	options: PpprEffectRequestOptions = {},
): PpprEffectRequest<"log.resolve"> {
	return createPpprEffectRequest(
		"log.resolve",
		sessionId,
		{
			...payload,
			reference: clonePpprLogReference(payload.reference),
			bounds: payload.bounds ? { ...payload.bounds } : undefined,
		},
		options,
	);
}

export interface PpprEffectResultOptions {
	id?: string;
	completedAt?: number;
	error?: PpprEffectResult["error"];
	metadata?: Record<string, unknown>;
}

export function createPpprEffectResult<K extends PpprEffectKind>(
	request: Pick<PpprEffectRequest<K>, "id" | "session_id" | "kind">,
	outcome: PpprEffectOutcome,
	payload: PpprEffectResultPayloadMap[K],
	options: PpprEffectResultOptions = {},
): PpprEffectResult<K> {
	return {
		id: options.id ?? randomUUID(),
		session_id: request.session_id,
		request_id: request.id,
		kind: request.kind,
		completed_at: options.completedAt ?? Date.now(),
		outcome,
		payload,
		error: options.error,
		metadata: options.metadata,
	};
}

export interface CreatePpprRuntimeStateOptions {
	createdAt?: number;
	continuationMode?: PpprContinuationMode;
	systemPrompt?: string;
	instructions?: string[];
	thinkingLevel?: PpprThinkingLevel;
	logReferences?: PpprLogReference[];
}

function clonePpprLogReference(reference: PpprLogReference): PpprLogReference {
	return {
		stream: reference.stream,
		start: reference.start,
		end: reference.end,
		checkpoint: reference.checkpoint,
		digest: reference.digest,
	};
}

function clonePpprArtifactReference(reference: PpprArtifactReference): PpprArtifactReference {
	return {
		kind: reference.kind,
		label: reference.label,
		ref: reference.ref,
		metadata: reference.metadata ? { ...reference.metadata } : undefined,
	};
}

function clonePpprAssistantSegment(segment: PpprAssistantSegment): PpprAssistantSegment {
	switch (segment.type) {
		case "text":
			return { type: "text", text: segment.text };
		case "thinking":
			return { type: "thinking", text: segment.text };
		case "tool_intent":
			return {
				type: "tool_intent",
				toolName: segment.toolName,
				summary: segment.summary,
			};
		case "artifact_ref":
			return {
				type: "artifact_ref",
				artifact: clonePpprArtifactReference(segment.artifact),
			};
	}
}

function clonePpprAssistantMessage(message: PpprAssistantMessagePayload): PpprAssistantMessagePayload {
	return {
		message_id: message.message_id,
		role: "assistant",
		segments: message.segments.map(clonePpprAssistantSegment),
		stop_reason: message.stop_reason,
		usage: message.usage ? { ...message.usage } : undefined,
	};
}

function clonePpprConversationEntry(entry: PpprConversationEntry): PpprConversationEntry {
	if (entry.role === "assistant") {
		return {
			role: "assistant",
			message: clonePpprAssistantMessage(entry.message),
		};
	}

	return {
		role: "user",
		messageId: entry.messageId,
		text: entry.text,
		attachments: entry.attachments?.map(clonePpprArtifactReference),
	};
}

function clonePpprEffectRequest<K extends PpprEffectKind>(request: PpprEffectRequest<K>): PpprEffectRequest<K> {
	return {
		id: request.id,
		session_id: request.session_id,
		kind: request.kind,
		requested_at: request.requested_at,
		payload: structuredClone(request.payload),
		policy: request.policy ? { ...request.policy } : undefined,
		correlation: request.correlation ? { ...request.correlation } : undefined,
	};
}

function clonePpprObservabilityState(observability: PpprObservabilityState): PpprObservabilityState {
	return {
		logReferences: observability.logReferences.map(clonePpprLogReference),
		checkpoint: observability.checkpoint,
	};
}

export function createPpprRuntimeState(
	sessionId: string,
	options: CreatePpprRuntimeStateOptions = {},
): PpprRuntimeState {
	return {
		session: {
			sessionId,
			createdAt: options.createdAt ?? Date.now(),
			continuationMode: options.continuationMode ?? "new",
		},
		context: {
			systemPrompt: options.systemPrompt,
			instructions: [...(options.instructions ?? [])],
			thinkingLevel: options.thinkingLevel,
		},
		conversation: [],
		effects: {
			pending: [],
			fulfilled: [],
		},
		lifecycle: {
			state: "idle",
		},
		observability: {
			logReferences: (options.logReferences ?? []).map(clonePpprLogReference),
		},
	};
}

export function createPpprSnapshot(state: PpprRuntimeState): PpprSnapshot {
	return {
		session: {
			sessionId: state.session.sessionId,
			createdAt: state.session.createdAt,
			continuationMode: state.session.continuationMode,
		},
		context: {
			systemPrompt: state.context.systemPrompt,
			instructions: [...state.context.instructions],
			thinkingLevel: state.context.thinkingLevel,
			metadata: state.context.metadata ? { ...state.context.metadata } : undefined,
		},
		conversation: state.conversation.map(clonePpprConversationEntry),
		effects: {
			pending: state.effects.pending.map(clonePpprEffectRequest),
			fulfilled: state.effects.fulfilled.map((entry) => ({ ...entry })),
		},
		lifecycle: {
			runId: state.lifecycle.runId,
			state: state.lifecycle.state,
			lastReason: state.lifecycle.lastReason,
		},
		observability: clonePpprObservabilityState(state.observability),
	};
}

export function restorePpprRuntimeState(snapshot: PpprSnapshot): PpprRuntimeState {
	return createPpprSnapshot(snapshot);
}
