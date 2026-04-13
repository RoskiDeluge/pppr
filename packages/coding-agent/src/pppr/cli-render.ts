import type {
	PpprAssistantArtifactRefSegment,
	PpprAssistantSegment,
	PpprEffectRequest,
	PpprOutputEvent,
} from "./runtime-protocol.js";

function renderArtifactSegment(segment: PpprAssistantArtifactRefSegment): string {
	return segment.artifact.label
		? `[artifact:${segment.artifact.kind}] ${segment.artifact.label} -> ${segment.artifact.ref}`
		: `[artifact:${segment.artifact.kind}] ${segment.artifact.ref}`;
}

export function renderPpprAssistantSegments(segments: PpprAssistantSegment[]): string[] {
	return segments.map((segment) => {
		switch (segment.type) {
			case "text":
				return segment.text;
			case "thinking":
				return `[thinking] ${segment.text}`;
			case "tool_intent":
				return segment.summary ? `[tool:${segment.toolName}] ${segment.summary}` : `[tool:${segment.toolName}]`;
			case "artifact_ref":
				return renderArtifactSegment(segment);
		}

		return "[unknown-assistant-segment]";
	});
}

function summarizeEffectRequest(request: PpprEffectRequest): string {
	switch (request.kind) {
		case "content.read":
		case "content.write":
		case "content.patch": {
			const typedRequest = request as PpprEffectRequest<"content.read" | "content.write" | "content.patch">;
			return `${typedRequest.kind} ${typedRequest.payload.target}`;
		}
		case "command.exec": {
			const typedRequest = request as PpprEffectRequest<"command.exec">;
			return `${typedRequest.kind} ${typedRequest.payload.command.join(" ")}`;
		}
		case "model.infer": {
			const typedRequest = request as PpprEffectRequest<"model.infer">;
			return `${typedRequest.kind} ${typedRequest.payload.model ?? "default-model"}`;
		}
		case "session.persist": {
			const typedRequest = request as PpprEffectRequest<"session.persist">;
			return `${typedRequest.kind} ${typedRequest.payload.intent ?? "checkpoint"}`;
		}
		case "log.append": {
			const typedRequest = request as PpprEffectRequest<"log.append">;
			return `${typedRequest.kind} ${typedRequest.payload.entries.length} entries`;
		}
		case "log.resolve": {
			const typedRequest = request as PpprEffectRequest<"log.resolve">;
			return `${typedRequest.kind} ${typedRequest.payload.reference.stream}`;
		}
	}
}

export function renderPpprOutputEvent(output: PpprOutputEvent): string[] {
	switch (output.kind) {
		case "run.started": {
			const typedOutput = output as PpprOutputEvent<"run.started">;
			return [`[run.started] ${typedOutput.payload.run_id} -> ${typedOutput.payload.state}`];
		}
		case "message.assistant": {
			const typedOutput = output as PpprOutputEvent<"message.assistant">;
			return renderPpprAssistantSegments(typedOutput.payload.segments);
		}
		case "effect.requested": {
			const typedOutput = output as PpprOutputEvent<"effect.requested">;
			return [`[effect.requested] ${summarizeEffectRequest(typedOutput.payload)}`];
		}
		case "status.changed": {
			const typedOutput = output as PpprOutputEvent<"status.changed">;
			return [
				`[status.changed] ${typedOutput.payload.from} -> ${typedOutput.payload.to} (${typedOutput.payload.reason})`,
			];
		}
		case "run.completed": {
			const typedOutput = output as PpprOutputEvent<"run.completed">;
			return [`[run.completed] ${typedOutput.payload.run_id} (${typedOutput.payload.completion_reason})`];
		}
		case "run.failed": {
			const typedOutput = output as PpprOutputEvent<"run.failed">;
			return [`[run.failed] ${typedOutput.payload.run_id} ${typedOutput.payload.error.message}`];
		}
	}
}

export function renderPpprOutputEvents(outputs: PpprOutputEvent[]): string[] {
	return outputs.flatMap(renderPpprOutputEvent);
}
