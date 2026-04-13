import type { ResourceLoader } from "../core/resource-loader.js";
import type { ToolName } from "../core/tools/index.js";

export const PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT = ["read", "edit", "write", "bash"] as const;

export type PpprVisibleToolName = (typeof PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT)[number];

export interface PpprCliVisibleInstructionFile {
	path: string;
	content: string;
}

export interface PpprCliVisibleContract {
	systemPrompt?: string;
	appendSystemPrompt: string[];
	instructionFiles: PpprCliVisibleInstructionFile[];
	instructionTexts: string[];
	tools: ToolName[];
}

export function resolvePpprVisibleToolContract(tools?: ToolName[], noTools?: boolean): ToolName[] {
	if (noTools) {
		return [...(tools ?? [])];
	}
	if (tools && tools.length > 0) {
		return [...tools];
	}
	return [...PPPR_DEFAULT_VISIBLE_TOOL_CONTRACT];
}

export function buildPpprCliVisibleContract(
	resourceLoader: Pick<ResourceLoader, "getAgentsFiles" | "getSystemPrompt" | "getAppendSystemPrompt">,
	tools: ToolName[],
): PpprCliVisibleContract {
	const instructionFiles = resourceLoader.getAgentsFiles().agentsFiles.map((file) => ({
		path: file.path,
		content: file.content,
	}));

	return {
		systemPrompt: resourceLoader.getSystemPrompt(),
		appendSystemPrompt: [...resourceLoader.getAppendSystemPrompt()],
		instructionFiles,
		instructionTexts: instructionFiles.map((file) => file.content),
		tools: [...tools],
	};
}
