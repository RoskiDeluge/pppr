import {
	advancePpprRuntime,
	appendPpprAssistantMessage,
	type PpprRuntimeTransitionResult,
	requestPpprEffect,
} from "./runtime.js";
import {
	createPpprInputEvent,
	createPpprSnapshot,
	type PpprAssistantMessagePayload,
	type PpprEffectRequest,
	type PpprEffectResult,
	type PpprInputEvent,
	type PpprInputEventKind,
	type PpprOutputEvent,
	type PpprRuntimeState,
	type PpprSnapshot,
	restorePpprRuntimeState,
} from "./runtime-protocol.js";

export * from "./runtime.js";
export * from "./runtime-protocol.js";
export * from "./thinking.js";

export interface PpprIrSession {
	readonly sessionId: string;
	getState(): PpprRuntimeState | undefined;
	apply<K extends PpprInputEventKind>(
		kind: K,
		payload: PpprInputEvent<K>["payload"],
		options?: { id?: string; timestamp?: number },
	): PpprOutputEvent[];
	ingest(input: PpprInputEvent): PpprOutputEvent[];
	appendAssistant(message: PpprAssistantMessagePayload): PpprOutputEvent[];
	requestEffect(request: PpprEffectRequest): PpprOutputEvent[];
	resolveEffect(result: PpprEffectResult, options?: { id?: string; timestamp?: number }): PpprOutputEvent[];
	snapshot(): PpprSnapshot | undefined;
	restore(snapshot: PpprSnapshot): void;
}

function commitTransition(result: PpprRuntimeTransitionResult): PpprRuntimeTransitionResult {
	return {
		state: result.state,
		outputs: result.outputs,
	};
}

export function createPpprIrSession(sessionId: string, initialState?: PpprRuntimeState | PpprSnapshot): PpprIrSession {
	let state = initialState === undefined ? undefined : restorePpprRuntimeState(initialState as PpprSnapshot);

	return {
		sessionId,
		getState() {
			return state ? restorePpprRuntimeState(createPpprSnapshot(state)) : undefined;
		},
		apply(kind, payload, options) {
			const transition = advancePpprRuntime(state, createPpprInputEvent(kind, sessionId, payload, options));
			const committed = commitTransition(transition);
			state = committed.state;
			return committed.outputs;
		},
		ingest(input) {
			const transition = advancePpprRuntime(state, input);
			const committed = commitTransition(transition);
			state = committed.state;
			return committed.outputs;
		},
		appendAssistant(message) {
			if (!state) {
				throw new Error("Cannot append an assistant message before the session has started");
			}
			const transition = appendPpprAssistantMessage(state, message);
			const committed = commitTransition(transition);
			state = committed.state;
			return committed.outputs;
		},
		requestEffect(request) {
			if (!state) {
				throw new Error("Cannot request an effect before the session has started");
			}
			const transition = requestPpprEffect(state, request);
			const committed = commitTransition(transition);
			state = committed.state;
			return committed.outputs;
		},
		resolveEffect(result, options) {
			return this.apply("effect.result", result, options);
		},
		snapshot() {
			return state ? createPpprSnapshot(state) : undefined;
		},
		restore(snapshot) {
			state = restorePpprRuntimeState(snapshot);
		},
	};
}
