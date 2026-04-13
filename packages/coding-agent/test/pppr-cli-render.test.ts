import { describe, expect, test } from "vitest";
import { renderPpprAssistantSegments, renderPpprOutputEvent, renderPpprOutputEvents } from "../src/pppr/cli-render.js";
import { createPpprEffectRequest, createPpprOutputEvent } from "../src/pppr/runtime-protocol.js";

describe("pppr cli rendering", () => {
	test("renders assistant segments into cli-visible lines", () => {
		expect(
			renderPpprAssistantSegments([
				{ type: "text", text: "hello" },
				{ type: "thinking", text: "reasoning" },
				{ type: "tool_intent", toolName: "read", summary: "Inspect README.md" },
				{ type: "artifact_ref", artifact: { kind: "file", label: "Spec", ref: "spec.md" } },
			]),
		).toEqual(["hello", "[thinking] reasoning", "[tool:read] Inspect README.md", "[artifact:file] Spec -> spec.md"]);
	});

	test("renders lifecycle, effect, and failure outputs from runtime events", () => {
		const request = createPpprEffectRequest("content.read", "session-1", { target: "README.md" }, { id: "req-1" });
		const started = createPpprOutputEvent("run.started", "session-1", {
			run_id: "run-1",
			state: "running",
		});
		const effect = createPpprOutputEvent("effect.requested", "session-1", request);
		const failed = createPpprOutputEvent("run.failed", "session-1", {
			run_id: "run-1",
			state: "failed",
			error: { message: "boom" },
		});

		expect(renderPpprOutputEvent(started)).toEqual(["[run.started] run-1 -> running"]);
		expect(renderPpprOutputEvent(effect)).toEqual(["[effect.requested] content.read README.md"]);
		expect(renderPpprOutputEvent(failed)).toEqual(["[run.failed] run-1 boom"]);
		expect(renderPpprOutputEvents([started, effect, failed])).toEqual([
			"[run.started] run-1 -> running",
			"[effect.requested] content.read README.md",
			"[run.failed] run-1 boom",
		]);
	});
});
