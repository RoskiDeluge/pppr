import { describe, expect, test } from "vitest";
import {
	buildPpprCliVisibleContract,
	PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT,
	resolvePpprVisibleToolContract,
} from "../src/pppr/visible-contract.js";

describe("pppr visible contract", () => {
	test("preserves the default visible tool contract unless explicitly overridden", () => {
		expect(resolvePpprVisibleToolContract()).toEqual(["read", "edit", "write", "bash"]);
		expect(resolvePpprVisibleToolContract(["read", "bash"])).toEqual(["read", "bash"]);
		expect(resolvePpprVisibleToolContract(undefined, true)).toEqual([]);
		expect(PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT).toEqual(["read", "edit", "write", "bash"]);
	});

	test("builds the visible contract from hierarchical instruction files and prompt sources", () => {
		const contract = buildPpprCliVisibleContract(
			{
				getAgentsFiles() {
					return {
						agentsFiles: [
							{ path: "/tmp/global/AGENTS.md", content: "global instructions" },
							{ path: "/tmp/project/AGENTS.md", content: "project instructions" },
						],
					};
				},
				getSystemPrompt() {
					return "system";
				},
				getAppendSystemPrompt() {
					return ["append 1", "append 2"];
				},
			},
			["read", "edit", "write", "bash"],
		);

		expect(contract).toEqual({
			systemPrompt: "system",
			appendSystemPrompt: ["append 1", "append 2"],
			instructionFiles: [
				{ path: "/tmp/global/AGENTS.md", content: "global instructions" },
				{ path: "/tmp/project/AGENTS.md", content: "project instructions" },
			],
			instructionTexts: ["global instructions", "project instructions"],
			tools: ["read", "edit", "write", "bash"],
		});
	});
});
