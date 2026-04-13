export class PpprEffectDeniedError extends Error {
	code?: string;
	details?: Record<string, unknown>;

	constructor(message: string, options: { code?: string; details?: Record<string, unknown> } = {}) {
		super(message);
		this.name = "PpprEffectDeniedError";
		this.code = options.code;
		this.details = options.details;
	}
}

export class PpprEffectFailureError extends Error {
	code?: string;
	details?: Record<string, unknown>;

	constructor(message: string, options: { code?: string; details?: Record<string, unknown> } = {}) {
		super(message);
		this.name = "PpprEffectFailureError";
		this.code = options.code;
		this.details = options.details;
	}
}
