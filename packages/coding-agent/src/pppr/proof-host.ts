import type { PpprCapabilityProviders } from "./capability-providers.js";
import { fulfillPpprEffectRequest } from "./cli-effect-fulfillment.js";
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

export const PPPR_PROOF_HOST_DRIVER_MODULE = "packages/coding-agent/src/pppr/proof-host.ts";

export const PPPR_PROOF_HOST_RESPONSIBILITIES = [
	"accept_embedded_or_remote_invocation",
	"drive_runtime_protocol",
	"fulfill_effect_requests",
	"persist_snapshots_and_logs",
	"return_structured_invocation_results",
] as const;

export const PPPR_PROOF_HOST_RUNTIME_RESPONSIBILITIES = [
	"own_session_lifecycle_state",
	"own_conversation_state",
	"emit_protocol_outputs",
	"emit_effect_requests",
	"consume_effect_results",
	"serialize_resumable_state",
] as const;

export type PpprProofHostResponsibility = (typeof PPPR_PROOF_HOST_RESPONSIBILITIES)[number];
export type PpprProofHostRuntimeResponsibility = (typeof PPPR_PROOF_HOST_RUNTIME_RESPONSIBILITIES)[number];

export interface PpprProofHostBoundary {
	driverModule: string;
	hostResponsibilities: readonly PpprProofHostResponsibility[];
	runtimeResponsibilities: readonly PpprProofHostRuntimeResponsibility[];
	invocationMappings: Readonly<Record<PpprProofHostInvocation["operation"], PpprInputEvent["kind"]>>;
}

export interface PpprProofHostStartInvocation {
	operation: "start";
	sessionId: string;
	payload: PpprSessionStartPayload;
	options?: PpprEventOptions;
	invocationMetadata?: Record<string, unknown>;
}

export interface PpprProofHostResumeInvocation {
	operation: "resume";
	sessionId: string;
	snapshot: PpprSnapshot;
	logReferences?: PpprLogReference[];
	metadata?: Record<string, unknown>;
	options?: PpprEventOptions;
	invocationMetadata?: Record<string, unknown>;
}

export interface PpprProofHostPromptInvocation {
	operation: "prompt";
	sessionId: string;
	payload: PpprUserMessagePayload;
	options?: PpprEventOptions;
	invocationMetadata?: Record<string, unknown>;
}

export interface PpprProofHostEffectResultInvocation {
	operation: "effect_result";
	sessionId: string;
	result: PpprEffectResult;
	options?: PpprEventOptions;
	invocationMetadata?: Record<string, unknown>;
}

export interface PpprProofHostCancelInvocation {
	operation: "cancel";
	sessionId: string;
	payload?: PpprSessionCancelPayload;
	options?: PpprEventOptions;
	invocationMetadata?: Record<string, unknown>;
}

export type PpprProofHostInvocation =
	| PpprProofHostStartInvocation
	| PpprProofHostResumeInvocation
	| PpprProofHostPromptInvocation
	| PpprProofHostEffectResultInvocation
	| PpprProofHostCancelInvocation;

export const PPPR_PROOF_HOST_OPERATION_TO_INPUT_KIND: Readonly<
	Record<PpprProofHostInvocation["operation"], PpprInputEvent["kind"]>
> = {
	start: "session.start",
	resume: "session.resume",
	prompt: "message.user",
	effect_result: "effect.result",
	cancel: "session.cancel",
};

export const PPPR_PROOF_HOST_BOUNDARY: PpprProofHostBoundary = {
	driverModule: PPPR_PROOF_HOST_DRIVER_MODULE,
	hostResponsibilities: PPPR_PROOF_HOST_RESPONSIBILITIES,
	runtimeResponsibilities: PPPR_PROOF_HOST_RUNTIME_RESPONSIBILITIES,
	invocationMappings: PPPR_PROOF_HOST_OPERATION_TO_INPUT_KIND,
};

export interface CreatePpprProofHostStateOptions {
	runtimeState?: PpprRuntimeState;
	inputHistory?: PpprInputEvent[];
	outputHistory?: PpprOutputEvent[];
}

export interface PpprProofHostState {
	runtimeState?: PpprRuntimeState;
	inputHistory: PpprInputEvent[];
	outputHistory: PpprOutputEvent[];
}

export interface PpprProofHostRuntimeView {
	lifecycle?: PpprRuntimeState["lifecycle"];
	pendingEffects: PpprRuntimeState["effects"]["pending"];
}

export interface PpprProofHostInvocationResult {
	hostState: PpprProofHostState;
	input: PpprInputEvent;
	outputs: PpprOutputEvent[];
	runtimeView: PpprProofHostRuntimeView;
	snapshot?: PpprSnapshot;
	invocationResult: {
		sessionId: string;
		lifecycle?: PpprRuntimeState["lifecycle"];
		pendingEffects: PpprRuntimeState["effects"]["pending"];
		outputs: PpprOutputEvent[];
		snapshot?: PpprSnapshot;
		invocationMetadata?: Record<string, unknown>;
	};
}

export const PPPR_PROOF_HOST_HOST_OWNED_RESOURCE_AREAS = [
	"workspace",
	"model",
	"persistence",
	"observability",
	"capability_access",
] as const;

export type PpprProofHostHostOwnedResourceArea = (typeof PPPR_PROOF_HOST_HOST_OWNED_RESOURCE_AREAS)[number];

export interface PpprProofHostExecutionAddress {
	mode: "embedded" | "remote_actor";
	hostId: string;
	agentId: string;
	sessionId?: string;
	namespace?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostWorkspaceBinding {
	workspaceRef: string;
	isolationBoundary?: "sandbox" | "container" | "opaque";
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostModelBinding {
	providerRef: string;
	modelRef?: string;
	invocationMode?: "sync" | "async" | "opaque";
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostPersistenceBinding {
	snapshotStoreRef?: string;
	logStoreRef?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostObservabilityBinding {
	streamRef?: string;
	sinkRef?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostCapabilityBinding {
	kind: "content" | "command" | "model" | "persistence" | "observability" | "mcp";
	providerRef: string;
	capabilityRef?: string;
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostExecutionEnvironment {
	workspace?: PpprProofHostWorkspaceBinding;
	model?: PpprProofHostModelBinding;
	persistence?: PpprProofHostPersistenceBinding;
	observability?: PpprProofHostObservabilityBinding;
	capabilityAccess: PpprProofHostCapabilityBinding[];
	metadata?: Record<string, unknown>;
}

export interface CreatePpprProofHostRemoteInvocationOptions {
	address: PpprProofHostExecutionAddress;
	environment?: PpprProofHostExecutionEnvironment;
	invocation: PpprProofHostInvocation;
	metadata?: Record<string, unknown>;
}

export interface PpprProofHostRemoteInvocation {
	address: PpprProofHostExecutionAddress;
	environment: PpprProofHostExecutionEnvironment;
	invocation: PpprProofHostInvocation;
	metadata?: Record<string, unknown>;
}

export interface ExecutePpprProofHostInvocationOptions {
	effectHost?: PpprCapabilityProviders;
	autoFulfillPendingEffects?: boolean;
	maxEffectRounds?: number;
}

export interface PpprProofHostExecutionResult {
	hostState: PpprProofHostState;
	initial: PpprProofHostInvocationResult;
	effectResults: PpprEffectResult[];
	outputs: PpprOutputEvent[];
	runtimeView: PpprProofHostRuntimeView;
	snapshot?: PpprSnapshot;
	executionResult: {
		sessionId: string;
		lifecycle?: PpprRuntimeState["lifecycle"];
		pendingEffects: PpprRuntimeState["effects"]["pending"];
		outputs: PpprOutputEvent[];
		effectResults: PpprEffectResult[];
		snapshot?: PpprSnapshot;
		invocationMetadata?: Record<string, unknown>;
	};
}

export interface PpprProofHostRemoteExecutionResult extends PpprProofHostExecutionResult {
	remote: {
		address: PpprProofHostExecutionAddress;
		environment: PpprProofHostExecutionEnvironment;
		metadata?: Record<string, unknown>;
	};
}

function toResumePayload(invocation: PpprProofHostResumeInvocation): PpprSessionResumePayload {
	return {
		snapshot: invocation.snapshot,
		logReferences: invocation.logReferences,
		metadata: invocation.metadata,
	};
}

function cloneMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
	return metadata ? { ...metadata } : undefined;
}

function cloneExecutionAddress(address: PpprProofHostExecutionAddress): PpprProofHostExecutionAddress {
	return {
		...address,
		metadata: cloneMetadata(address.metadata),
	};
}

function cloneCapabilityBinding(binding: PpprProofHostCapabilityBinding): PpprProofHostCapabilityBinding {
	return {
		...binding,
		metadata: cloneMetadata(binding.metadata),
	};
}

export function createPpprProofHostExecutionEnvironment(
	environment: PpprProofHostExecutionEnvironment = { capabilityAccess: [] },
): PpprProofHostExecutionEnvironment {
	return {
		workspace: environment.workspace
			? {
					...environment.workspace,
					metadata: cloneMetadata(environment.workspace.metadata),
				}
			: undefined,
		model: environment.model
			? {
					...environment.model,
					metadata: cloneMetadata(environment.model.metadata),
				}
			: undefined,
		persistence: environment.persistence
			? {
					...environment.persistence,
					metadata: cloneMetadata(environment.persistence.metadata),
				}
			: undefined,
		observability: environment.observability
			? {
					...environment.observability,
					metadata: cloneMetadata(environment.observability.metadata),
				}
			: undefined,
		capabilityAccess: environment.capabilityAccess.map((binding) => cloneCapabilityBinding(binding)),
		metadata: cloneMetadata(environment.metadata),
	};
}

export function createPpprProofHostRemoteInvocation(
	options: CreatePpprProofHostRemoteInvocationOptions,
): PpprProofHostRemoteInvocation {
	return {
		address: cloneExecutionAddress(options.address),
		environment: createPpprProofHostExecutionEnvironment(options.environment),
		invocation: options.invocation,
		metadata: cloneMetadata(options.metadata),
	};
}

export function mapPpprProofHostInvocationToInputEvent(invocation: PpprProofHostInvocation): PpprInputEvent {
	switch (invocation.operation) {
		case "start":
			return createPpprInputEvent("session.start", invocation.sessionId, invocation.payload, invocation.options);
		case "resume":
			return createPpprInputEvent(
				"session.resume",
				invocation.sessionId,
				toResumePayload(invocation),
				invocation.options,
			);
		case "prompt":
			return createPpprInputEvent("message.user", invocation.sessionId, invocation.payload, invocation.options);
		case "effect_result":
			return createPpprInputEvent("effect.result", invocation.sessionId, invocation.result, invocation.options);
		case "cancel":
			return createPpprInputEvent(
				"session.cancel",
				invocation.sessionId,
				invocation.payload ?? {},
				invocation.options,
			);
	}
}

export function createPpprProofHostState(options: CreatePpprProofHostStateOptions = {}): PpprProofHostState {
	return {
		runtimeState: options.runtimeState,
		inputHistory: [...(options.inputHistory ?? [])],
		outputHistory: [...(options.outputHistory ?? [])],
	};
}

export function getPpprProofHostRuntimeView(hostState: PpprProofHostState): PpprProofHostRuntimeView {
	return {
		lifecycle: hostState.runtimeState?.lifecycle,
		pendingEffects: hostState.runtimeState?.effects.pending ?? [],
	};
}

export function dispatchPpprProofHostInvocation(
	hostState: PpprProofHostState,
	invocation: PpprProofHostInvocation,
): PpprProofHostInvocationResult {
	const input = mapPpprProofHostInvocationToInputEvent(invocation);
	const transition = advancePpprRuntime(hostState.runtimeState, input);
	const nextHostState = createPpprProofHostState({
		runtimeState: transition.state,
		inputHistory: [...hostState.inputHistory, input],
		outputHistory: [...hostState.outputHistory, ...transition.outputs],
	});
	const runtimeView = getPpprProofHostRuntimeView(nextHostState);
	const snapshot = nextHostState.runtimeState ? createPpprSnapshot(nextHostState.runtimeState) : undefined;

	return {
		hostState: nextHostState,
		input,
		outputs: transition.outputs,
		runtimeView,
		snapshot,
		invocationResult: {
			sessionId: invocation.sessionId,
			lifecycle: runtimeView.lifecycle,
			pendingEffects: runtimeView.pendingEffects,
			outputs: transition.outputs,
			snapshot,
			invocationMetadata: invocation.invocationMetadata,
		},
	};
}

export async function executePpprProofHostInvocation(
	hostState: PpprProofHostState,
	invocation: PpprProofHostInvocation,
	options: ExecutePpprProofHostInvocationOptions = {},
): Promise<PpprProofHostExecutionResult> {
	const initial = dispatchPpprProofHostInvocation(hostState, invocation);
	const effectResults: PpprEffectResult[] = [];
	const outputs = [...initial.outputs];
	let currentHostState = initial.hostState;
	let runtimeView = initial.runtimeView;
	const autoFulfillPendingEffects = options.autoFulfillPendingEffects ?? true;
	const maxEffectRounds = options.maxEffectRounds ?? 20;
	let rounds = 0;

	while (autoFulfillPendingEffects && options.effectHost && runtimeView.pendingEffects.length > 0) {
		rounds += 1;
		if (rounds > maxEffectRounds) {
			throw new Error("Exceeded proof-host effect fulfillment round limit");
		}

		const pendingRequest = runtimeView.pendingEffects[0];
		if (!pendingRequest) {
			break;
		}

		const effectResult = await fulfillPpprEffectRequest(options.effectHost, pendingRequest);
		effectResults.push(effectResult);
		const resolved = dispatchPpprProofHostInvocation(currentHostState, {
			operation: "effect_result",
			sessionId: invocation.sessionId,
			result: effectResult,
			invocationMetadata: invocation.invocationMetadata,
		});
		currentHostState = resolved.hostState;
		runtimeView = resolved.runtimeView;
		outputs.push(...resolved.outputs);
	}

	const snapshot = currentHostState.runtimeState ? createPpprSnapshot(currentHostState.runtimeState) : undefined;
	return {
		hostState: currentHostState,
		initial,
		effectResults,
		outputs,
		runtimeView,
		snapshot,
		executionResult: {
			sessionId: invocation.sessionId,
			lifecycle: runtimeView.lifecycle,
			pendingEffects: runtimeView.pendingEffects,
			outputs,
			effectResults,
			snapshot,
			invocationMetadata: invocation.invocationMetadata,
		},
	};
}

export async function executePpprProofHostRemoteInvocation(
	hostState: PpprProofHostState,
	remoteInvocation: PpprProofHostRemoteInvocation,
	options: ExecutePpprProofHostInvocationOptions = {},
): Promise<PpprProofHostRemoteExecutionResult> {
	const execution = await executePpprProofHostInvocation(hostState, remoteInvocation.invocation, options);
	return {
		...execution,
		remote: {
			address: cloneExecutionAddress(remoteInvocation.address),
			environment: createPpprProofHostExecutionEnvironment(remoteInvocation.environment),
			metadata: cloneMetadata(remoteInvocation.metadata),
		},
	};
}
