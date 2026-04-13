import type { PpprEffectPolicyEvaluator } from "./effect-policy.js";
import type {
	PpprCommandExecRequestPayload,
	PpprCommandExecResultPayload,
	PpprContentPatchRequestPayload,
	PpprContentPatchResultPayload,
	PpprContentReadRequestPayload,
	PpprContentReadResultPayload,
	PpprContentWriteRequestPayload,
	PpprContentWriteResultPayload,
	PpprLogAppendRequestPayload,
	PpprLogAppendResultPayload,
	PpprLogResolveRequestPayload,
	PpprLogResolveResultPayload,
	PpprModelInferRequestPayload,
	PpprModelInferResultPayload,
	PpprSessionPersistRequestPayload,
	PpprSessionPersistResultPayload,
} from "./runtime-protocol.js";

export interface PpprContentProvider {
	read(request: PpprContentReadRequestPayload): Promise<PpprContentReadResultPayload>;
	write(request: PpprContentWriteRequestPayload): Promise<PpprContentWriteResultPayload>;
	patch(request: PpprContentPatchRequestPayload): Promise<PpprContentPatchResultPayload>;
}

export interface PpprCommandProvider {
	exec(request: PpprCommandExecRequestPayload): Promise<PpprCommandExecResultPayload>;
}

export interface PpprModelProvider {
	infer(request: PpprModelInferRequestPayload): Promise<PpprModelInferResultPayload>;
}

export interface PpprSessionPersistenceProvider {
	persist(request: PpprSessionPersistRequestPayload, sessionId: string): Promise<PpprSessionPersistResultPayload>;
}

export interface PpprLogProvider {
	append(request: PpprLogAppendRequestPayload, sessionId: string): Promise<PpprLogAppendResultPayload>;
	resolve(request: PpprLogResolveRequestPayload): Promise<PpprLogResolveResultPayload>;
}

export interface PpprCapabilityProviders {
	content: PpprContentProvider;
	command: PpprCommandProvider;
	model?: PpprModelProvider;
	persistence: PpprSessionPersistenceProvider;
	logs: PpprLogProvider;
	policy?: PpprEffectPolicyEvaluator;
}

export interface CreatePpprCapabilityProvidersOptions {
	content: PpprContentProvider;
	command: PpprCommandProvider;
	model?: PpprModelProvider;
	persistence: PpprSessionPersistenceProvider;
	logs: PpprLogProvider;
	policy?: PpprEffectPolicyEvaluator;
}

export function createPpprCapabilityProviders(options: CreatePpprCapabilityProvidersOptions): PpprCapabilityProviders {
	return {
		content: options.content,
		command: options.command,
		model: options.model,
		persistence: options.persistence,
		logs: options.logs,
		policy: options.policy,
	};
}
