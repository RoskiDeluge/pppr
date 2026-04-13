import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { resolveReadPath, resolveToCwd } from "../core/tools/path-utils.js";
import type {
	PpprCapabilityProviders,
	PpprCommandProvider,
	PpprContentProvider,
	PpprLogProvider,
	PpprModelProvider,
	PpprSessionPersistenceProvider,
} from "./capability-providers.js";
import { createPpprCapabilityProviders } from "./capability-providers.js";
import { PpprEffectDeniedError, PpprEffectFailureError } from "./effect-errors.js";
import type { PpprEffectPolicyEvaluator } from "./effect-policy.js";
import type {
	PpprCommandExecResultPayload,
	PpprLogReference,
	PpprLogResolveResultPayload,
	PpprSessionPersistRequestPayload,
} from "./runtime-protocol.js";

export interface CreateLocalPpprCapabilityProvidersOptions {
	cwd?: string;
	model?: PpprModelProvider;
	persistence?: PpprSessionPersistenceProvider;
	logs?: PpprLogProvider;
	policy?: PpprEffectPolicyEvaluator;
}

export interface PpprStructuredPatchDocument {
	oldText: string;
	newText: string;
}

interface PpprInMemorySessionRecord {
	snapshot: PpprSessionPersistRequestPayload["snapshot"];
	reference: PpprLogReference;
	checkpoint: string;
}

interface PpprInMemoryLogRecord {
	entries: PpprLogResolveResultPayload["entries"];
	checkpoint: string;
}

function createStructuredPatchDocument(oldText: string, newText: string): PpprStructuredPatchDocument {
	return {
		oldText,
		newText,
	};
}

function parseStructuredPatchDocument(patch: string): PpprStructuredPatchDocument {
	const parsed = JSON.parse(patch) as Partial<PpprStructuredPatchDocument>;
	if (typeof parsed.oldText !== "string" || typeof parsed.newText !== "string") {
		throw new PpprEffectFailureError("Structured content.patch requires oldText and newText", {
			code: "invalid_patch_payload",
		});
	}

	return {
		oldText: parsed.oldText,
		newText: parsed.newText,
	};
}

export function createLocalPpprContentProvider(cwd: string): PpprContentProvider {
	return {
		async read(request) {
			const path = resolveReadPath(request.target, cwd);
			const buffer = await readFile(path);
			const text = buffer.toString("utf-8");
			const allLines = text.split("\n");
			const startLine = request.range?.startLine ? Math.max(1, request.range.startLine) : 1;
			const startIndex = startLine - 1;
			const endIndex = request.range?.endLine ? Math.min(allLines.length, request.range.endLine) : allLines.length;

			return {
				content: allLines.slice(startIndex, endIndex).join("\n"),
				range: request.range,
			};
		},

		async write(request) {
			const path = resolveToCwd(request.target, cwd);
			const exists = await stat(path)
				.then(() => true)
				.catch(() => false);

			if (request.expectExists && !exists) {
				throw new PpprEffectDeniedError(`Refusing write to missing target: ${request.target}`, {
					code: "target_missing",
				});
			}

			await mkdir(dirname(path), { recursive: true });

			let content = request.content;
			if (request.mode === "append" && exists) {
				const previous = await readFile(path, "utf-8");
				content = previous + request.content;
			}

			await writeFile(path, content, "utf-8");
			return {
				target: request.target,
				written: true,
			};
		},

		async patch(request) {
			if (request.mode === "unified") {
				throw new PpprEffectDeniedError("Unified patches are not supported by the local Phase 2 host yet", {
					code: "unsupported_patch_mode",
				});
			}

			const path = resolveToCwd(request.target, cwd);
			const current = await readFile(path, "utf-8");
			const patchDocument = parseStructuredPatchDocument(request.patch);
			const occurrences = current.split(patchDocument.oldText).length - 1;

			if (occurrences === 0) {
				throw new PpprEffectFailureError(`Could not find target text in ${request.target}`, {
					code: "patch_target_not_found",
				});
			}
			if (occurrences > 1) {
				throw new PpprEffectDeniedError(`Patch target is ambiguous in ${request.target}`, {
					code: "patch_target_ambiguous",
				});
			}

			const next = current.replace(patchDocument.oldText, patchDocument.newText);
			await writeFile(path, next, "utf-8");

			return {
				target: request.target,
				applied: true,
			};
		},
	};
}

export function createLocalPpprCommandProvider(cwd: string): PpprCommandProvider {
	return {
		async exec(request) {
			const resolvedCwd = request.cwd ?? cwd;
			return new Promise<PpprCommandExecResultPayload>((resolve, reject) => {
				if (request.command.length === 0) {
					reject(
						new PpprEffectFailureError("command.exec requires at least one argv entry", {
							code: "empty_command",
						}),
					);
					return;
				}

				const child = spawn(request.command[0]!, request.command.slice(1), {
					cwd: resolvedCwd,
					env: process.env,
				});
				const startedAt = Date.now();
				let stdout = "";
				let stderr = "";
				let terminated = false;

				const timeoutHandle =
					request.timeoutMs && request.timeoutMs > 0
						? setTimeout(() => {
								terminated = true;
								child.kill("SIGTERM");
							}, request.timeoutMs)
						: undefined;

				child.stdout.on("data", (chunk: Buffer | string) => {
					stdout += chunk.toString();
				});
				child.stderr.on("data", (chunk: Buffer | string) => {
					stderr += chunk.toString();
				});
				child.on("error", (error) => {
					if (timeoutHandle) clearTimeout(timeoutHandle);
					reject(new PpprEffectFailureError(error.message, { code: "command_spawn_failed" }));
				});
				child.on("close", (code) => {
					if (timeoutHandle) clearTimeout(timeoutHandle);
					resolve({
						exitCode: code ?? -1,
						stdout,
						stderr,
						durationMs: Date.now() - startedAt,
						terminated,
					});
				});
			});
		},
	};
}

export function createInMemoryPpprSessionPersistenceProvider(): PpprSessionPersistenceProvider {
	const store = new Map<string, PpprInMemorySessionRecord>();
	return {
		async persist(request, sessionId) {
			const checkpoint = `${Date.now()}:${randomUUID()}`;
			const reference = { stream: `session:${sessionId}`, checkpoint };
			store.set(sessionId, {
				snapshot: request.snapshot,
				reference,
				checkpoint,
			});
			return {
				persisted: true,
				reference,
				checkpoint,
			};
		},
	};
}

export function createInMemoryPpprLogProvider(): PpprLogProvider {
	const store = new Map<string, PpprInMemoryLogRecord>();

	function parseCursor(value: string | undefined, fallback: number): number {
		if (!value) return fallback;
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? fallback : parsed;
	}

	return {
		async append(request, sessionId) {
			const stream = request.reference?.stream ?? `log:${sessionId}`;
			const record = store.get(stream) ?? { entries: [], checkpoint: "0" };
			record.entries.push(...request.entries.map((entry) => ({ type: entry.type, data: { ...entry.data } })));
			record.checkpoint = String(record.entries.length);
			store.set(stream, record);
			return {
				reference: {
					stream,
					checkpoint: record.checkpoint,
				},
				checkpoint: record.checkpoint,
				appended: request.entries.length,
			};
		},

		async resolve(request) {
			const record = store.get(request.reference.stream) ?? { entries: [], checkpoint: "0" };
			const start = parseCursor(request.bounds?.start ?? request.reference.start, 0);
			const end = parseCursor(request.bounds?.end ?? request.reference.end, record.entries.length);
			return {
				reference: {
					stream: request.reference.stream,
					start: request.reference.start,
					end: request.reference.end,
					checkpoint: request.reference.checkpoint ?? record.checkpoint,
					digest: request.reference.digest,
				},
				entries: record.entries.slice(start, end).map((entry) => ({ type: entry.type, data: { ...entry.data } })),
				checkpoint: record.checkpoint,
			};
		},
	};
}

export function createLocalPpprCapabilityProviders(
	options: CreateLocalPpprCapabilityProvidersOptions = {},
): PpprCapabilityProviders {
	const cwd = options.cwd ?? process.cwd();
	return createPpprCapabilityProviders({
		content: createLocalPpprContentProvider(cwd),
		command: createLocalPpprCommandProvider(cwd),
		model: options.model,
		persistence: options.persistence ?? createInMemoryPpprSessionPersistenceProvider(),
		logs: options.logs ?? createInMemoryPpprLogProvider(),
		policy: options.policy,
	});
}

export function createPpprStructuredPatchDocument(oldText: string, newText: string): PpprStructuredPatchDocument {
	return createStructuredPatchDocument(oldText, newText);
}
