import { PpprEffectDeniedError } from "./effect-errors.js";
import type { PpprEffectRequest } from "./runtime-protocol.js";

export type PpprEffectPolicyDecisionType = "allow" | "approval_required" | "deny";

export interface PpprEffectPolicyDecision {
	decision: PpprEffectPolicyDecisionType;
	code?: string;
	reason?: string;
	details?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export interface PpprEffectPolicyEvaluator {
	evaluate(request: PpprEffectRequest): Promise<PpprEffectPolicyDecision> | PpprEffectPolicyDecision;
}

export function createPpprEffectPolicyDecision(
	decision: PpprEffectPolicyDecisionType,
	options: Omit<PpprEffectPolicyDecision, "decision"> = {},
): PpprEffectPolicyDecision {
	return {
		decision,
		code: options.code,
		reason: options.reason,
		details: options.details,
		metadata: options.metadata,
	};
}

export function createPpprPolicyMetadata(
	decision: Pick<PpprEffectPolicyDecision, "decision" | "code" | "reason" | "details" | "metadata">,
): Record<string, unknown> {
	return {
		host_policy: {
			decision: decision.decision,
			code: decision.code,
			reason: decision.reason,
			details: decision.details,
			metadata: decision.metadata,
		},
	};
}

export function createPpprPolicyDecisionError(decision: PpprEffectPolicyDecision): PpprEffectDeniedError {
	const code = decision.code ?? (decision.decision === "approval_required" ? "approval_required" : "policy_denied");
	const message =
		decision.reason ??
		(decision.decision === "approval_required"
			? "Effect request requires host approval"
			: "Effect request denied by host policy");
	return new PpprEffectDeniedError(message, {
		code,
		details: decision.details,
	});
}

export async function evaluatePpprEffectPolicy(
	evaluator: PpprEffectPolicyEvaluator | undefined,
	request: PpprEffectRequest,
): Promise<PpprEffectPolicyDecision> {
	if (evaluator) {
		return evaluator.evaluate(request);
	}
	if (request.policy?.approvalRequired) {
		return createPpprEffectPolicyDecision("approval_required", {
			code: "approval_required",
			reason: "Effect request requires host approval",
			details: request.policy.sandbox ? { sandbox: request.policy.sandbox } : undefined,
		});
	}
	return createPpprEffectPolicyDecision("allow");
}
