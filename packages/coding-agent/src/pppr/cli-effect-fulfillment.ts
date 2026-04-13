import type {
	CreatePpprCapabilityProvidersOptions,
	PpprCapabilityProviders,
	PpprCommandProvider,
	PpprContentProvider,
	PpprLogProvider,
	PpprModelProvider,
	PpprSessionPersistenceProvider,
} from "./capability-providers.js";
import { createPpprCapabilityProviders } from "./capability-providers.js";
import { PpprEffectDeniedError, PpprEffectFailureError } from "./effect-errors.js";
import { createPpprPolicyDecisionError, createPpprPolicyMetadata, evaluatePpprEffectPolicy } from "./effect-policy.js";
import {
	type CreateLocalPpprCapabilityProvidersOptions,
	createLocalPpprCapabilityProviders,
} from "./local-capability-providers.js";
import {
	createPpprEffectResult,
	createPpprLogAppendRequest,
	createPpprLogResolveRequest,
	createPpprSessionPersistRequest,
	type PpprEffectRequest,
	type PpprEffectResult,
	type PpprLogAppendRequestPayload,
	type PpprLogResolveRequestPayload,
	type PpprSessionPersistRequestPayload,
} from "./runtime-protocol.js";
import type { PpprCliEffectRequestOptions } from "./tool-semantics.js";

export type {
	PpprCliBashToolCall,
	PpprCliEditToolCall,
	PpprCliReadToolCall,
	PpprCliToolCall,
	PpprCliToolName,
	PpprCliToolSemanticDefinition,
	PpprCliWriteToolCall,
} from "./tool-semantics.js";
export {
	mapPpprCliToolCallToEffectRequest,
	PPPR_CLI_TOOL_SEMANTICS,
	PPPR_CLI_TOOL_TO_EFFECT_KIND,
} from "./tool-semantics.js";

export type PpprCliContentProvider = PpprContentProvider;
export type PpprCliCommandProvider = PpprCommandProvider;
export type PpprCliModelProvider = PpprModelProvider;
export type PpprCliSessionPersistenceProvider = PpprSessionPersistenceProvider;
export type PpprCliLogProvider = PpprLogProvider;
export type PpprCliEffectFulfillmentHost = PpprCapabilityProviders;
export type CreatePpprCliEffectFulfillmentHostOptions = CreatePpprCapabilityProvidersOptions;
export type CreateLocalPpprCliEffectHostOptions = CreateLocalPpprCapabilityProvidersOptions;

export function createPpprCliEffectFulfillmentHost(
	options: CreatePpprCliEffectFulfillmentHostOptions,
): PpprCliEffectFulfillmentHost {
	return createPpprCapabilityProviders(options);
}

export function createLocalPpprCliEffectHost(
	options: CreateLocalPpprCliEffectHostOptions = {},
): PpprCliEffectFulfillmentHost {
	return createLocalPpprCapabilityProviders(options);
}

function createDeniedEffectResult<K extends PpprEffectRequest["kind"]>(
	request: PpprEffectRequest<K>,
	error: PpprEffectDeniedError,
	metadata?: Record<string, unknown>,
): PpprEffectResult<K> {
	return createPpprEffectResult(request, "denied", {} as PpprEffectResult<K>["payload"], {
		error: {
			code: error.code,
			message: error.message,
			details: error.details,
		},
		metadata,
	});
}

function createFailedEffectResult<K extends PpprEffectRequest["kind"]>(
	request: PpprEffectRequest<K>,
	error: Error,
): PpprEffectResult<K> {
	const failure = error instanceof PpprEffectFailureError ? error : new PpprEffectFailureError(error.message);
	return createPpprEffectResult(request, "failed", {} as PpprEffectResult<K>["payload"], {
		error: {
			code: failure.code,
			message: failure.message,
			details: failure.details,
		},
	});
}

export async function fulfillPpprEffectRequest(
	host: PpprCliEffectFulfillmentHost,
	request: PpprEffectRequest,
): Promise<PpprEffectResult> {
	try {
		const policyDecision = await evaluatePpprEffectPolicy(host.policy, request);
		if (policyDecision.decision !== "allow") {
			return createDeniedEffectResult(
				request,
				createPpprPolicyDecisionError(policyDecision),
				createPpprPolicyMetadata(policyDecision),
			);
		}

		switch (request.kind) {
			case "content.read": {
				const typedRequest = request as PpprEffectRequest<"content.read">;
				return createPpprEffectResult(typedRequest, "success", await host.content.read(typedRequest.payload));
			}
			case "content.write": {
				const typedRequest = request as PpprEffectRequest<"content.write">;
				return createPpprEffectResult(typedRequest, "success", await host.content.write(typedRequest.payload));
			}
			case "content.patch": {
				const typedRequest = request as PpprEffectRequest<"content.patch">;
				return createPpprEffectResult(typedRequest, "success", await host.content.patch(typedRequest.payload));
			}
			case "command.exec": {
				const typedRequest = request as PpprEffectRequest<"command.exec">;
				return createPpprEffectResult(typedRequest, "success", await host.command.exec(typedRequest.payload));
			}
			case "model.infer": {
				const typedRequest = request as PpprEffectRequest<"model.infer">;
				if (!host.model) {
					throw new PpprEffectDeniedError("No model provider is configured for the current host", {
						code: "model_provider_unavailable",
					});
				}
				return createPpprEffectResult(typedRequest, "success", await host.model.infer(typedRequest.payload));
			}
			case "session.persist": {
				const typedRequest = request as PpprEffectRequest<"session.persist">;
				return createPpprEffectResult(
					typedRequest,
					"success",
					await host.persistence.persist(typedRequest.payload, typedRequest.session_id),
				);
			}
			case "log.append": {
				const typedRequest = request as PpprEffectRequest<"log.append">;
				return createPpprEffectResult(
					typedRequest,
					"success",
					await host.logs.append(typedRequest.payload, typedRequest.session_id),
				);
			}
			case "log.resolve": {
				const typedRequest = request as PpprEffectRequest<"log.resolve">;
				return createPpprEffectResult(typedRequest, "success", await host.logs.resolve(typedRequest.payload));
			}
		}
	} catch (error) {
		if (error instanceof PpprEffectDeniedError) {
			return createDeniedEffectResult(request, error);
		}
		const failure = error instanceof Error ? error : new Error("Unknown effect fulfillment failure");
		return createFailedEffectResult(request, failure);
	}
}

export function createPpprSessionPersistEffectRequest(
	sessionId: string,
	payload: PpprSessionPersistRequestPayload,
	options: PpprCliEffectRequestOptions = {},
): PpprEffectRequest<"session.persist"> {
	return createPpprSessionPersistRequest(sessionId, payload, options);
}

export function createPpprLogAppendEffectRequest(
	sessionId: string,
	payload: PpprLogAppendRequestPayload,
	options: PpprCliEffectRequestOptions = {},
): PpprEffectRequest<"log.append"> {
	return createPpprLogAppendRequest(sessionId, payload, options);
}

export function createPpprLogResolveEffectRequest(
	sessionId: string,
	payload: PpprLogResolveRequestPayload,
	options: PpprCliEffectRequestOptions = {},
): PpprEffectRequest<"log.resolve"> {
	return createPpprLogResolveRequest(sessionId, payload, options);
}
