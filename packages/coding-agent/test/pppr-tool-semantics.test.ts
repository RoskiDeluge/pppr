import { describe, expect, test } from "vitest";
import { createPpprCliEffectFulfillmentHost, fulfillPpprEffectRequest } from "../src/pppr/cli-effect-fulfillment.js";
import {
	mapPpprCliToolCallToEffectRequest,
	PPPR_CLI_TOOL_SEMANTICS,
	PPPR_CLI_TOOL_TO_EFFECT_KIND,
} from "../src/pppr/tool-semantics.js";
import { PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT } from "../src/pppr/visible-contract.js";

describe("pppr tool semantics", () => {
	test("preserves the visible four-tool contract above the provider boundary", () => {
		expect(PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT).toEqual(["read", "edit", "write", "bash"]);
		expect(Object.keys(PPPR_CLI_TOOL_SEMANTICS)).toEqual(PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT);
		expect(PPPR_CLI_TOOL_TO_EFFECT_KIND).toEqual({
			read: "content.read",
			edit: "content.patch",
			write: "content.write",
			bash: "command.exec",
		});
	});

	test("keeps tool-to-capability mapping stable independent of provider implementation", () => {
		const readRequest = mapPpprCliToolCallToEffectRequest(
			"session-1",
			{
				toolName: "read",
				input: { path: "README.md", offset: 2, limit: 3 },
			},
			{ id: "read-1" },
		);
		const writeRequest = mapPpprCliToolCallToEffectRequest(
			"session-1",
			{
				toolName: "write",
				input: { path: "notes.txt", content: "hello" },
			},
			{ id: "write-1" },
		);
		const bashRequest = mapPpprCliToolCallToEffectRequest(
			"session-1",
			{
				toolName: "bash",
				input: { command: "pwd", timeout: 5 },
			},
			{ id: "bash-1" },
		);

		expect(readRequest).toMatchObject({
			id: "read-1",
			kind: "content.read",
			payload: {
				target: "README.md",
				range: { startLine: 2, endLine: 4 },
				mode: "text",
			},
		});
		expect(writeRequest).toMatchObject({
			id: "write-1",
			kind: "content.write",
			payload: {
				target: "notes.txt",
				content: "hello",
				mode: "overwrite",
			},
		});
		expect(bashRequest).toMatchObject({
			id: "bash-1",
			kind: "command.exec",
			payload: {
				envPolicy: "inherit",
			},
		});
	});

	test("does not let provider substitution redefine visible tool meaning", async () => {
		const request = mapPpprCliToolCallToEffectRequest("session-1", {
			toolName: "read",
			input: { path: "notes.txt" },
		});

		const hostA = createPpprCliEffectFulfillmentHost({
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
				async resolve(requestPayload) {
					return { reference: requestPayload.reference, entries: [] };
				},
			},
		});
		const hostB = createPpprCliEffectFulfillmentHost({
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
				async resolve(requestPayload) {
					return { reference: requestPayload.reference, entries: [] };
				},
			},
		});

		const resultA = await fulfillPpprEffectRequest(hostA, request);
		const resultB = await fulfillPpprEffectRequest(hostB, request);

		expect(request.kind).toBe("content.read");
		expect(request.payload).toMatchObject({
			target: "notes.txt",
			mode: "text",
		});
		expect(resultA.payload).toMatchObject({ content: "provider-a" });
		expect(resultB.payload).toMatchObject({ content: "provider-b" });
	});
});
