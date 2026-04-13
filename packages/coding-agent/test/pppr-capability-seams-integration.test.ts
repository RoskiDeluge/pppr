import { describe, expect, test } from "vitest";
import {
	createPpprCliEffectFulfillmentHost,
	fulfillPpprEffectRequest,
	mapPpprCliToolCallToEffectRequest,
} from "../src/pppr/cli-effect-fulfillment.js";
import { createPpprCliHostState, dispatchPpprCliHostAction } from "../src/pppr/cli-host.js";
import { createPpprEffectPolicyDecision } from "../src/pppr/effect-policy.js";
import { requestPpprEffect } from "../src/pppr/runtime.js";

describe("pppr capability seam integration", () => {
	test("swaps provider implementations behind the same contracts for representative effect kinds", async () => {
		const readRequest = mapPpprCliToolCallToEffectRequest("session-1", {
			toolName: "read",
			input: { path: "notes.txt" },
		});
		const bashRequest = mapPpprCliToolCallToEffectRequest("session-1", {
			toolName: "bash",
			input: { command: "echo hello", timeout: 5 },
		});

		const providerA = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					return { content: "provider-a" };
				},
				async write() {
					return { target: "notes.txt", written: true };
				},
				async patch() {
					return { target: "notes.txt", applied: true };
				},
			},
			command: {
				async exec() {
					return { exitCode: 0, stdout: "provider-a-cmd", stderr: "" };
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
		const providerB = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					return { content: "provider-b" };
				},
				async write() {
					return { target: "notes.txt", written: true };
				},
				async patch() {
					return { target: "notes.txt", applied: true };
				},
			},
			command: {
				async exec() {
					return { exitCode: 0, stdout: "provider-b-cmd", stderr: "" };
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

		const [readResultA, bashResultA, readResultB, bashResultB] = await Promise.all([
			fulfillPpprEffectRequest(providerA, readRequest),
			fulfillPpprEffectRequest(providerA, bashRequest),
			fulfillPpprEffectRequest(providerB, readRequest),
			fulfillPpprEffectRequest(providerB, bashRequest),
		]);

		expect(readRequest.kind).toBe("content.read");
		expect(bashRequest.kind).toBe("command.exec");
		expect(readResultA.payload).toMatchObject({ content: "provider-a" });
		expect(readResultB.payload).toMatchObject({ content: "provider-b" });
		expect(bashResultA.payload).toMatchObject({ stdout: "provider-a-cmd" });
		expect(bashResultB.payload).toMatchObject({ stdout: "provider-b-cmd" });
		expect(readResultA.outcome).toBe("success");
		expect(readResultB.outcome).toBe("success");
		expect(bashResultA.outcome).toBe("success");
		expect(bashResultB.outcome).toBe("success");
	});

	test("covers approval-required, denied, failed, and success outcomes through normalized effect results", async () => {
		const successHost = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					return { content: "ok" };
				},
				async write() {
					return { target: "notes.txt", written: true };
				},
				async patch() {
					return { target: "notes.txt", applied: true };
				},
			},
			command: {
				async exec() {
					return { exitCode: 0, stdout: "ok", stderr: "" };
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
		const approvalHost = createPpprCliEffectFulfillmentHost({
			content: successHost.content,
			command: successHost.command,
			persistence: successHost.persistence,
			logs: successHost.logs,
			policy: {
				evaluate(request) {
					if (request.kind === "command.exec") {
						return createPpprEffectPolicyDecision("approval_required", {
							reason: "operator approval required",
						});
					}
					return createPpprEffectPolicyDecision("allow");
				},
			},
		});
		const deniedHost = createPpprCliEffectFulfillmentHost({
			content: successHost.content,
			command: successHost.command,
			persistence: successHost.persistence,
			logs: successHost.logs,
			policy: {
				evaluate(request) {
					if (request.kind === "content.write") {
						return createPpprEffectPolicyDecision("deny", {
							code: "writes_disabled",
							reason: "writes disabled",
						});
					}
					return createPpprEffectPolicyDecision("allow");
				},
			},
		});
		const failedHost = createPpprCliEffectFulfillmentHost({
			content: successHost.content,
			command: {
				async exec() {
					throw new Error("command exploded");
				},
			},
			persistence: successHost.persistence,
			logs: successHost.logs,
		});

		const successResult = await fulfillPpprEffectRequest(
			successHost,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "read",
				input: { path: "notes.txt" },
			}),
		);
		const approvalRequired = await fulfillPpprEffectRequest(
			approvalHost,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "bash",
				input: { command: "pwd", timeout: 5 },
			}),
		);
		const deniedResult = await fulfillPpprEffectRequest(
			deniedHost,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "write",
				input: { path: "notes.txt", content: "hello" },
			}),
		);
		const failedResult = await fulfillPpprEffectRequest(
			failedHost,
			mapPpprCliToolCallToEffectRequest("session-1", {
				toolName: "bash",
				input: { command: "pwd", timeout: 5 },
			}),
		);

		expect(successResult.outcome).toBe("success");
		expect(approvalRequired.outcome).toBe("denied");
		expect(approvalRequired.error).toMatchObject({ code: "approval_required" });
		expect(deniedResult.outcome).toBe("denied");
		expect(deniedResult.error).toMatchObject({ code: "writes_disabled" });
		expect(failedResult.outcome).toBe("failed");
		expect(failedResult.error).toMatchObject({ message: "command exploded" });
	});

	test("proves the cli host consumes normalized effect results rather than provider-specific side channels", async () => {
		let providerCalls = 0;
		let hiddenSignal = "unset";
		const host = createPpprCliEffectFulfillmentHost({
			content: {
				async read() {
					providerCalls += 1;
					hiddenSignal = "provider-ran";
					return {
						content: "payload-visible-value",
						digest: "provider-private-digest",
					};
				},
				async write() {
					return { target: "notes.txt", written: true };
				},
				async patch() {
					return { target: "notes.txt", applied: true };
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

		const started = dispatchPpprCliHostAction(createPpprCliHostState(), {
			type: "start_session",
			sessionId: "session-1",
			payload: { systemPrompt: "system", continuationMode: "new" },
			options: { id: "start-1", timestamp: 100 },
		});
		const request = mapPpprCliToolCallToEffectRequest("session-1", {
			toolName: "read",
			input: { path: "notes.txt" },
		});
		const waiting = requestPpprEffect(started.hostState.runtimeState!, request);
		const waitingHostState = createPpprCliHostState({
			runtimeState: waiting.state,
			inputHistory: started.hostState.inputHistory,
			outputHistory: [...started.hostState.outputHistory, ...waiting.outputs],
		});

		const fulfilled = await fulfillPpprEffectRequest(host, waiting.state.effects.pending[0]!);
		const resolved = dispatchPpprCliHostAction(waitingHostState, {
			type: "deliver_effect_result",
			sessionId: "session-1",
			result: fulfilled,
			options: { id: "evt-1", timestamp: 101 },
		});

		expect(providerCalls).toBe(1);
		expect(hiddenSignal).toBe("provider-ran");
		expect(fulfilled.outcome).toBe("success");
		expect(fulfilled.payload).toMatchObject({
			content: "payload-visible-value",
			digest: "provider-private-digest",
		});
		expect(resolved.runtimeView.lifecycle).toMatchObject({
			state: "running",
			lastReason: "effect_resolved",
		});
		expect(resolved.outputs).toEqual([
			expect.objectContaining({
				kind: "status.changed",
				payload: expect.objectContaining({
					from: "awaiting_effect",
					to: "running",
					reason: "effect_resolved",
				}),
			}),
		]);
	});
});
