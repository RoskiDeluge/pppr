import { advancePpprRuntime } from "./runtime.js";
import {
	createPpprInputEvent,
	createPpprSnapshot,
	type PpprEffectResult,
	type PpprEventOptions,
	type PpprInputEvent,
	type PpprLogReference,
	type PpprOutputEvent,
	type PpprRuntimeState,
	type PpprSessionCancelPayload,
	type PpprSessionResumePayload,
	type PpprSessionStartPayload,
	type PpprSnapshot,
	type PpprUserMessagePayload,
} from "./runtime-protocol.js";

export const PPPR_CLI_HOST_DRIVER_MODULE = "packages/coding-agent/src/pppr/cli-host.ts";

export const PPPR_CLI_HOST_RESPONSIBILITIES = [
	"collect_interactive_input",
	"load_visible_context",
	"drive_runtime_protocol",
	"fulfill_effect_requests",
	"render_runtime_outputs",
	"persist_snapshots_and_logs",
] as const;

export const PPPR_RUNTIME_RESPONSIBILITIES = [
	"own_session_lifecycle_state",
	"own_conversation_state",
	"emit_protocol_outputs",
	"emit_effect_requests",
	"consume_effect_results",
	"serialize_resumable_state",
] as const;

export type PpprCliHostResponsibility = (typeof PPPR_CLI_HOST_RESPONSIBILITIES)[number];
export type PpprRuntimeResponsibility = (typeof PPPR_RUNTIME_RESPONSIBILITIES)[number];

export interface PpprCliHostBoundary {
	driverModule: string;
	hostResponsibilities: readonly PpprCliHostResponsibility[];
	runtimeResponsibilities: readonly PpprRuntimeResponsibility[];
	actionMappings: Readonly<Record<PpprCliSessionAction["type"], PpprInputEvent["kind"]>>;
}

export interface PpprCliStartSessionAction {
	type: "start_session";
	sessionId: string;
	payload: PpprSessionStartPayload;
	options?: PpprEventOptions;
}

export interface PpprCliResumeSessionAction {
	type: "resume_session";
	sessionId: string;
	snapshot: PpprSnapshot;
	logReferences?: PpprLogReference[];
	metadata?: Record<string, unknown>;
	options?: PpprEventOptions;
}

export interface PpprCliSubmitPromptAction {
	type: "submit_prompt";
	sessionId: string;
	payload: PpprUserMessagePayload;
	options?: PpprEventOptions;
}

export interface PpprCliDeliverEffectResultAction {
	type: "deliver_effect_result";
	sessionId: string;
	result: PpprEffectResult;
	options?: PpprEventOptions;
}

export interface PpprCliCancelRunAction {
	type: "cancel_run";
	sessionId: string;
	payload?: PpprSessionCancelPayload;
	options?: PpprEventOptions;
}

export type PpprCliSessionAction =
	| PpprCliStartSessionAction
	| PpprCliResumeSessionAction
	| PpprCliSubmitPromptAction
	| PpprCliDeliverEffectResultAction
	| PpprCliCancelRunAction;

export const PPPR_CLI_ACTION_TO_INPUT_KIND: Readonly<Record<PpprCliSessionAction["type"], PpprInputEvent["kind"]>> = {
	start_session: "session.start",
	resume_session: "session.resume",
	submit_prompt: "message.user",
	deliver_effect_result: "effect.result",
	cancel_run: "session.cancel",
};

export const PPPR_CLI_HOST_BOUNDARY: PpprCliHostBoundary = {
	driverModule: PPPR_CLI_HOST_DRIVER_MODULE,
	hostResponsibilities: PPPR_CLI_HOST_RESPONSIBILITIES,
	runtimeResponsibilities: PPPR_RUNTIME_RESPONSIBILITIES,
	actionMappings: PPPR_CLI_ACTION_TO_INPUT_KIND,
};

export interface CreatePpprCliHostStateOptions {
	runtimeState?: PpprRuntimeState;
	inputHistory?: PpprInputEvent[];
	outputHistory?: PpprOutputEvent[];
}

export interface PpprCliHostState {
	runtimeState?: PpprRuntimeState;
	inputHistory: PpprInputEvent[];
	outputHistory: PpprOutputEvent[];
}

export interface PpprCliHostRuntimeView {
	lifecycle?: PpprRuntimeState["lifecycle"];
	pendingEffects: PpprRuntimeState["effects"]["pending"];
}

export interface PpprCliHostDispatchResult {
	hostState: PpprCliHostState;
	input: PpprInputEvent;
	outputs: PpprOutputEvent[];
	runtimeView: PpprCliHostRuntimeView;
}

export interface CreatePpprForkSessionActionOptions {
	id?: string;
	sessionId: string;
	timestamp?: number;
	logReferences?: PpprLogReference[];
	metadata?: Record<string, unknown>;
}

function toResumePayload(action: PpprCliResumeSessionAction): PpprSessionResumePayload {
	return {
		snapshot: action.snapshot,
		logReferences: action.logReferences,
		metadata: action.metadata,
	};
}

export function mapPpprCliActionToInputEvent(action: PpprCliSessionAction): PpprInputEvent {
	switch (action.type) {
		case "start_session":
			return createPpprInputEvent("session.start", action.sessionId, action.payload, action.options);
		case "resume_session":
			return createPpprInputEvent("session.resume", action.sessionId, toResumePayload(action), action.options);
		case "submit_prompt":
			return createPpprInputEvent("message.user", action.sessionId, action.payload, action.options);
		case "deliver_effect_result":
			return createPpprInputEvent("effect.result", action.sessionId, action.result, action.options);
		case "cancel_run":
			return createPpprInputEvent("session.cancel", action.sessionId, action.payload ?? {}, action.options);
	}
}

export function createPpprCliHostState(options: CreatePpprCliHostStateOptions = {}): PpprCliHostState {
	return {
		runtimeState: options.runtimeState,
		inputHistory: [...(options.inputHistory ?? [])],
		outputHistory: [...(options.outputHistory ?? [])],
	};
}

export function getPpprCliHostRuntimeView(hostState: PpprCliHostState): PpprCliHostRuntimeView {
	return {
		lifecycle: hostState.runtimeState?.lifecycle,
		pendingEffects: hostState.runtimeState?.effects.pending ?? [],
	};
}

export function dispatchPpprCliHostAction(
	hostState: PpprCliHostState,
	action: PpprCliSessionAction,
): PpprCliHostDispatchResult {
	const input = mapPpprCliActionToInputEvent(action);
	const transition = advancePpprRuntime(hostState.runtimeState, input);
	const nextHostState = createPpprCliHostState({
		runtimeState: transition.state,
		inputHistory: [...hostState.inputHistory, input],
		outputHistory: [...hostState.outputHistory, ...transition.outputs],
	});

	return {
		hostState: nextHostState,
		input,
		outputs: transition.outputs,
		runtimeView: getPpprCliHostRuntimeView(nextHostState),
	};
}

export function createPpprForkSessionAction(
	hostState: Pick<PpprCliHostState, "runtimeState">,
	options: CreatePpprForkSessionActionOptions,
): PpprCliResumeSessionAction {
	const runtimeState = hostState.runtimeState;
	if (!runtimeState) {
		throw new Error("Cannot fork a pppr CLI host session without runtime state");
	}

	const snapshot = createPpprSnapshot(runtimeState);
	snapshot.session.sessionId = options.sessionId;
	snapshot.session.createdAt = options.timestamp ?? Date.now();
	snapshot.session.continuationMode = "fork";
	snapshot.effects.pending = [];
	snapshot.lifecycle = {
		state: "idle",
	};

	return {
		type: "resume_session",
		sessionId: options.sessionId,
		snapshot,
		logReferences: options.logReferences,
		metadata: options.metadata,
		options: {
			id: options.id,
			timestamp: options.timestamp,
		},
	};
}
