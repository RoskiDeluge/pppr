import type { BashToolInput } from "../core/tools/bash.js";
import type { EditToolInput } from "../core/tools/edit.js";
import type { ReadToolInput } from "../core/tools/read.js";
import type { WriteToolInput } from "../core/tools/write.js";
import { getShellConfig } from "../utils/shell.js";
import { createPpprStructuredPatchDocument } from "./local-capability-providers.js";
import {
	createPpprCommandExecRequest,
	createPpprContentPatchRequest,
	createPpprContentReadRequest,
	createPpprContentWriteRequest,
	type PpprEffectRequest,
} from "./runtime-protocol.js";

export type PpprCliToolName = "read" | "edit" | "write" | "bash";

export interface PpprCliReadToolCall {
	toolName: "read";
	input: ReadToolInput;
}

export interface PpprCliEditToolCall {
	toolName: "edit";
	input: EditToolInput;
}

export interface PpprCliWriteToolCall {
	toolName: "write";
	input: WriteToolInput;
}

export interface PpprCliBashToolCall {
	toolName: "bash";
	input: BashToolInput;
}

export type PpprCliToolCall = PpprCliReadToolCall | PpprCliEditToolCall | PpprCliWriteToolCall | PpprCliBashToolCall;

export interface PpprCliEffectRequestOptions {
	id?: string;
	requestedAt?: number;
	correlation?: Record<string, unknown>;
}

export interface PpprCliToolSemanticDefinition {
	toolName: PpprCliToolName;
	effectKind: PpprEffectRequest["kind"];
	purpose: string;
}

export const PPPR_CLI_TOOL_TO_EFFECT_KIND: Readonly<Record<PpprCliToolName, PpprEffectRequest["kind"]>> = {
	read: "content.read",
	edit: "content.patch",
	write: "content.write",
	bash: "command.exec",
};

export const PPPR_CLI_TOOL_SEMANTICS: Readonly<Record<PpprCliToolName, PpprCliToolSemanticDefinition>> = {
	read: {
		toolName: "read",
		effectKind: "content.read",
		purpose: "inspect existing content without mutating it",
	},
	edit: {
		toolName: "edit",
		effectKind: "content.patch",
		purpose: "apply a targeted mutation to existing content",
	},
	write: {
		toolName: "write",
		effectKind: "content.write",
		purpose: "replace file content at a target path",
	},
	bash: {
		toolName: "bash",
		effectKind: "command.exec",
		purpose: "execute a synchronous shell command through the host",
	},
};

export function mapPpprCliToolCallToEffectRequest(
	sessionId: string,
	toolCall: PpprCliToolCall,
	options: PpprCliEffectRequestOptions = {},
): PpprEffectRequest {
	switch (toolCall.toolName) {
		case "read": {
			const startLine = toolCall.input.offset;
			const endLine =
				toolCall.input.offset !== undefined && toolCall.input.limit !== undefined
					? toolCall.input.offset + toolCall.input.limit - 1
					: undefined;
			return createPpprContentReadRequest(
				sessionId,
				{
					target: toolCall.input.path,
					range:
						startLine !== undefined || endLine !== undefined
							? {
									startLine,
									endLine,
								}
							: undefined,
					mode: "text",
				},
				options,
			);
		}
		case "edit":
			return createPpprContentPatchRequest(
				sessionId,
				{
					target: toolCall.input.path,
					mode: "structured",
					patch: JSON.stringify(createPpprStructuredPatchDocument(toolCall.input.oldText, toolCall.input.newText)),
				},
				options,
			);
		case "write":
			return createPpprContentWriteRequest(
				sessionId,
				{
					target: toolCall.input.path,
					content: toolCall.input.content,
					mode: "overwrite",
				},
				options,
			);
		case "bash": {
			const shell = getShellConfig();
			return createPpprCommandExecRequest(
				sessionId,
				{
					command: [shell.shell, ...shell.args, toolCall.input.command],
					timeoutMs: toolCall.input.timeout ? toolCall.input.timeout * 1000 : undefined,
					cwd: process.cwd(),
					envPolicy: "inherit",
				},
				options,
			);
		}
	}
}
