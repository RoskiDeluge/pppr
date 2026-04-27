import { describe, expect, test } from "vitest";
import { createPpprContentReadRequest, createPpprEffectResult, createPpprIrSession } from "../src/ir.js";

describe("pppr ir session", () => {
	test("drives a session through start, message, effect wait, and effect resolution", () => {
		const ir = createPpprIrSession("session-1");

		expect(
			ir.apply("session.start", {
				systemPrompt: "system",
				instructions: ["keep things durable"],
			}),
		).toHaveLength(2);

		expect(ir.apply("message.user", { text: "read README.md" })).toEqual([]);

		const request = createPpprContentReadRequest("session-1", { target: "README.md" }, { id: "req-1" });
		expect(ir.requestEffect(request).map((event) => event.kind)).toEqual(["effect.requested", "status.changed"]);

		const result = createPpprEffectResult(
			request,
			"success",
			{ content: "# README", digest: "sha256:1" },
			{ id: "result-1" },
		);
		expect(ir.resolveEffect(result).map((event) => event.kind)).toEqual(["status.changed"]);

		const snapshot = ir.snapshot();
		expect(snapshot?.session.sessionId).toBe("session-1");
		expect(snapshot?.effects.fulfilled).toHaveLength(1);
	});

	test("restores snapshots without exposing mutable internal state", () => {
		const ir = createPpprIrSession("session-2");
		ir.apply("session.start", {});
		const snapshot = ir.snapshot();

		expect(snapshot).toBeDefined();

		const restored = createPpprIrSession("session-2", snapshot!);
		const state = restored.getState();

		expect(state?.session.sessionId).toBe("session-2");
		expect(state?.context.instructions).toEqual([]);
		state!.context.instructions.push("mutated");
		expect(restored.getState()?.context.instructions).toEqual([]);
	});
});
