import chalk from "chalk";
import { allTools, type ToolName } from "../core/tools/index.js";
import { PPPR_APP_NAME, PPPR_CONFIG_DIR_NAME, PPPR_ENV_AGENT_DIR } from "./config.js";
import { isPpprThinkingLevel, PPPR_THINKING_LEVELS, type PpprThinkingLevel } from "./thinking.js";

export type PpprMode = "text" | "json";

export interface PpprArgs {
	provider?: string;
	model?: string;
	apiKey?: string;
	systemPrompt?: string;
	appendSystemPrompt?: string;
	thinking?: PpprThinkingLevel;
	continue?: boolean;
	help?: boolean;
	version?: boolean;
	mode?: PpprMode;
	print?: boolean;
	noSession?: boolean;
	session?: string;
	sessionDir?: string;
	tools?: ToolName[];
	noTools?: boolean;
	messages: string[];
	fileArgs: string[];
}

export function isValidPpprThinkingLevel(level: string): level is PpprThinkingLevel {
	return isPpprThinkingLevel(level);
}

export function parsePpprArgs(args: string[]): PpprArgs {
	const result: PpprArgs = {
		messages: [],
		fileArgs: [],
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else if (arg === "--version" || arg === "-v") {
			result.version = true;
		} else if (arg === "--provider" && i + 1 < args.length) {
			result.provider = args[++i];
		} else if (arg === "--model" && i + 1 < args.length) {
			result.model = args[++i];
		} else if (arg === "--api-key" && i + 1 < args.length) {
			result.apiKey = args[++i];
		} else if (arg === "--system-prompt" && i + 1 < args.length) {
			result.systemPrompt = args[++i];
		} else if (arg === "--append-system-prompt" && i + 1 < args.length) {
			result.appendSystemPrompt = args[++i];
		} else if (arg === "--thinking" && i + 1 < args.length) {
			const level = args[++i];
			if (isValidPpprThinkingLevel(level)) {
				result.thinking = level;
			} else {
				console.error(
					chalk.yellow(
						`Warning: Invalid thinking level "${level}". Valid values: ${PPPR_THINKING_LEVELS.join(", ")}`,
					),
				);
			}
		} else if (arg === "--mode" && i + 1 < args.length) {
			const mode = args[++i];
			if (mode === "text" || mode === "json") {
				result.mode = mode;
			}
		} else if (arg === "--print" || arg === "-p") {
			result.print = true;
		} else if (arg === "--continue" || arg === "-c") {
			result.continue = true;
		} else if (arg === "--no-session") {
			result.noSession = true;
		} else if (arg === "--session" && i + 1 < args.length) {
			result.session = args[++i];
		} else if (arg === "--session-dir" && i + 1 < args.length) {
			result.sessionDir = args[++i];
		} else if (arg === "--no-tools") {
			result.noTools = true;
		} else if (arg === "--tools" && i + 1 < args.length) {
			const toolNames = args[++i].split(",").map((s) => s.trim());
			const validTools: ToolName[] = [];
			for (const name of toolNames) {
				if (name in allTools) {
					validTools.push(name as ToolName);
				} else {
					console.error(
						chalk.yellow(`Warning: Unknown tool "${name}". Valid tools: ${Object.keys(allTools).join(", ")}`),
					);
				}
			}
			result.tools = validTools;
		} else if (arg.startsWith("@")) {
			result.fileArgs.push(arg.slice(1));
		} else if (!arg.startsWith("-")) {
			result.messages.push(arg);
		}
	}

	return result;
}

export function printPpprHelp(): void {
	console.log(`${chalk.bold(PPPR_APP_NAME)} - minimal CLI coding agent harness

${chalk.bold("Usage:")}
  ${PPPR_APP_NAME} [options] [@files...] [message]

${chalk.bold("Options:")}
  --provider <name>              Provider name
  --model <pattern>              Model pattern or ID (supports "provider/id" and optional ":<thinking>")
  --api-key <key>                API key override
  --system-prompt <text>         Replace the default pppr system prompt
  --append-system-prompt <text>  Append text or file contents to the system prompt
  --mode <mode>                  Output mode: text (default) or json
  --print, -p                    Process the prompt and exit
  --continue, -c                 Continue the most recent session
  --session <path>               Use a specific session file
  --session-dir <dir>            Directory for session storage and lookup
  --no-session                   Ephemeral mode
  --no-tools                     Disable all built-in tools
  --tools <tools>                Comma-separated tools (default: read,bash,edit,write)
  --thinking <level>             ${PPPR_THINKING_LEVELS.join(", ")}
  --help, -h                     Show help
  --version, -v                  Show version

${chalk.bold("Examples:")}
  ${PPPR_APP_NAME}
  ${PPPR_APP_NAME} "Review the current repository"
  ${PPPR_APP_NAME} -p "Summarize README.md"
  ${PPPR_APP_NAME} --continue
  ${PPPR_APP_NAME} --model openai/gpt-5.4 "Refactor this module"

${chalk.bold("Environment Variables:")}
  ${PPPR_ENV_AGENT_DIR}            Override config/session directory (default: ~/${PPPR_CONFIG_DIR_NAME}/agent)
  ANTHROPIC_API_KEY              Anthropic API key
  OPENAI_API_KEY                 OpenAI API key
  GEMINI_API_KEY                 Google Gemini API key
  GROQ_API_KEY                   Groq API key
  CEREBRAS_API_KEY               Cerebras API key
  XAI_API_KEY                    xAI API key
  OPENROUTER_API_KEY             OpenRouter API key
  AI_GATEWAY_API_KEY             Vercel AI Gateway API key
  ZAI_API_KEY                    ZAI API key
  MISTRAL_API_KEY                Mistral API key
  MINIMAX_API_KEY                MiniMax API key
  OPENCODE_API_KEY               OpenCode API key
  KIMI_API_KEY                   Kimi API key

${chalk.bold("Available Tools:")}
  read, bash, edit, write
`);
}
