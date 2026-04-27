export interface PpprHostRunner {
	readonly kind: string;
	run(args: string[]): Promise<void>;
}

export function createPpprMain(hostRunner: PpprHostRunner) {
	return async function main(args: string[]): Promise<void> {
		return hostRunner.run(args);
	};
}
