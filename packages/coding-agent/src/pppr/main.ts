import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { type Api, type ImageContent, type Model, supportsXhigh } from "@mariozechner/pi-ai";
import chalk from "chalk";
import { processFileArguments } from "../cli/file-processor.js";
import { VERSION } from "../config.js";
import { AuthStorage } from "../core/auth-storage.js";
import { ModelRegistry } from "../core/model-registry.js";
import { resolveCliModel } from "../core/model-resolver.js";
import { DefaultResourceLoader } from "../core/resource-loader.js";
import { createAgentSession } from "../core/sdk.js";
import { SessionManager } from "../core/session-manager.js";
import { SettingsManager } from "../core/settings-manager.js";
import { allTools } from "../core/tools/index.js";
import { type PpprArgs, parsePpprArgs, printPpprHelp } from "./args.js";
import { getPpprAgentDir } from "./config.js";
import { PPPR_SYSTEM_PROMPT } from "./system-prompt.js";
import { resolvePpprVisibleToolContract } from "./visible-contract.js";

async function readPipedStdin(): Promise<string | undefined> {
	if (process.stdin.isTTY) {
		return undefined;
	}

	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => {
			data += chunk;
		});
		process.stdin.on("end", () => {
			resolve(data.trim() || undefined);
		});
		process.stdin.resume();
	});
}

function createSessionManager(parsed: PpprArgs, cwd: string, agentDir: string): SessionManager {
	const sessionDir = parsed.sessionDir ?? join(agentDir, "sessions");

	if (parsed.noSession) {
		return SessionManager.inMemory(cwd);
	}
	if (parsed.session) {
		return SessionManager.open(parsed.session, sessionDir);
	}
	if (parsed.continue) {
		return SessionManager.continueRecent(cwd, sessionDir);
	}
	return SessionManager.create(cwd, sessionDir);
}

async function prepareInitialMessage(
	parsed: PpprArgs,
	autoResizeImages: boolean,
): Promise<{ initialMessage?: string; initialImages?: ImageContent[] }> {
	if (parsed.fileArgs.length === 0) {
		return {};
	}

	const { text, images } = await processFileArguments(parsed.fileArgs, { autoResizeImages });

	let initialMessage: string;
	if (parsed.messages.length > 0) {
		initialMessage = text + parsed.messages[0];
		parsed.messages.shift();
	} else {
		initialMessage = text;
	}

	return {
		initialMessage,
		initialImages: images.length > 0 ? images : undefined,
	};
}

function createTextSubscriber() {
	let wroteAssistantText = false;

	return {
		handleEvent(event: { type: string; assistantMessageEvent?: { type: string; delta?: string } }): void {
			if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
				const delta = event.assistantMessageEvent.delta ?? "";
				if (delta.length > 0) {
					process.stdout.write(delta);
					wroteAssistantText = true;
				}
			}
		},
		finishTurn(): void {
			if (wroteAssistantText) {
				process.stdout.write("\n");
			}
			wroteAssistantText = false;
		},
	};
}

async function runSinglePrompt(
	session: Awaited<ReturnType<typeof createAgentSession>>["session"],
	message: string,
	images: ImageContent[] | undefined,
	mode: "text" | "json",
): Promise<void> {
	const textSubscriber = createTextSubscriber();

	const unsubscribe = session.subscribe((event) => {
		if (mode === "json") {
			process.stdout.write(`${JSON.stringify(event)}\n`);
			return;
		}

		textSubscriber.handleEvent(event);
	});

	try {
		await session.prompt(message, { images });
		if (mode === "text") {
			textSubscriber.finishTurn();
		}
	} finally {
		unsubscribe();
	}

	const lastMessage = session.state.messages.at(-1);
	if (
		lastMessage?.role === "assistant" &&
		(lastMessage.stopReason === "error" || lastMessage.stopReason === "aborted")
	) {
		throw new Error(lastMessage.errorMessage || `Request ${lastMessage.stopReason}`);
	}
}

async function runInteractive(
	session: Awaited<ReturnType<typeof createAgentSession>>["session"],
	initialMessage?: string,
	initialImages?: ImageContent[],
): Promise<void> {
	if (initialMessage) {
		await runSinglePrompt(session, initialMessage, initialImages, "text");
	}

	const rl = createInterface({ input, output });

	try {
		for (;;) {
			const line = (await rl.question("pppr> ")).trim();
			if (line.length === 0) {
				continue;
			}
			if (line === "/quit" || line === "/exit") {
				break;
			}
			if (line === "/new") {
				await session.newSession();
				process.stdout.write("Started new session\n");
				continue;
			}
			await runSinglePrompt(session, line, undefined, "text");
		}
	} finally {
		rl.close();
	}
}

export async function main(args: string[]): Promise<void> {
	const parsed = parsePpprArgs(args);

	if (parsed.version) {
		process.stdout.write(`${VERSION}\n`);
		return;
	}

	if (parsed.help) {
		printPpprHelp();
		return;
	}

	const cwd = process.cwd();
	const agentDir = getPpprAgentDir();
	const settingsManager = SettingsManager.create(cwd, agentDir);
	const authStorage = AuthStorage.create(`${agentDir}/auth.json`);
	const modelRegistry = new ModelRegistry(authStorage, `${agentDir}/models.json`);
	const resourceLoader = new DefaultResourceLoader({
		cwd,
		agentDir,
		settingsManager,
		noExtensions: true,
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		systemPromptOverride: (base) => base ?? PPPR_SYSTEM_PROMPT,
		appendSystemPrompt: parsed.appendSystemPrompt,
		systemPrompt: parsed.systemPrompt,
	});
	await resourceLoader.reload();

	const pipedStdin = await readPipedStdin();
	if (pipedStdin !== undefined) {
		parsed.print = true;
		parsed.messages.unshift(pipedStdin);
	}

	const { initialMessage, initialImages } = await prepareInitialMessage(parsed, settingsManager.getImageAutoResize());

	let resolvedModel: Model<Api> | undefined;
	let cliThinking = parsed.thinking;
	if (parsed.model) {
		const resolution = resolveCliModel({
			cliProvider: parsed.provider,
			cliModel: parsed.model,
			modelRegistry,
		});
		if (resolution.warning) {
			process.stderr.write(`${chalk.yellow(`Warning: ${resolution.warning}`)}\n`);
		}
		if (resolution.error) {
			throw new Error(resolution.error);
		}
		resolvedModel = resolution.model;
		if (!cliThinking && resolution.thinkingLevel) {
			cliThinking = resolution.thinkingLevel;
		}
	}

	const sessionManager = createSessionManager(parsed, cwd, agentDir);
	const visibleToolContract = resolvePpprVisibleToolContract(parsed.tools, parsed.noTools);
	const toolList = visibleToolContract.map((name) => allTools[name]);

	if (parsed.apiKey && resolvedModel) {
		authStorage.setRuntimeApiKey(resolvedModel.provider, parsed.apiKey);
	}

	const { session } = await createAgentSession({
		cwd,
		agentDir,
		authStorage,
		modelRegistry,
		resourceLoader,
		settingsManager,
		sessionManager,
		model: resolvedModel,
		thinkingLevel: cliThinking,
		tools: toolList,
	});

	if (parsed.apiKey && !resolvedModel) {
		throw new Error("--api-key requires a model to be specified via --model");
	}

	if (session.model && cliThinking) {
		let effectiveThinking = cliThinking;
		if (!session.model.reasoning) {
			effectiveThinking = "off";
		} else if (effectiveThinking === "xhigh" && !supportsXhigh(session.model)) {
			effectiveThinking = "high";
		}
		session.setThinkingLevel(effectiveThinking);
	}

	const mode = parsed.mode ?? "text";
	const isInteractive = !parsed.print && parsed.messages.length === 0 && !initialMessage && process.stdin.isTTY;

	if (isInteractive) {
		await runInteractive(session, initialMessage, initialImages);
		return;
	}

	const messages = [...parsed.messages];
	if (initialMessage) {
		await runSinglePrompt(session, initialMessage, initialImages, mode);
	}
	for (const message of messages) {
		await runSinglePrompt(session, message, undefined, mode);
	}
}
