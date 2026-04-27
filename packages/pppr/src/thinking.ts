export const PPPR_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;

export type PpprThinkingLevel = (typeof PPPR_THINKING_LEVELS)[number];

export function isPpprThinkingLevel(level: string): level is PpprThinkingLevel {
	return PPPR_THINKING_LEVELS.includes(level as PpprThinkingLevel);
}
