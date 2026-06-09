# `pppr` Protocol Specification

## Preface

### What this document is

This document specifies the `pppr` protocol for the core runtime inside `packages/pppr`. It names:

- the lifecycle states the runtime occupies and the legal transitions between them
- the input event vocabulary the runtime accepts
- the output event vocabulary the runtime emits
- the effect request and effect result contract
- the snapshot shape and what it guarantees on round-trip

### Sans-I/O invariant

This document's binding architectural rule is that the `pppr` core is **sans-I/O**.

That means the core owns structured state transitions, inputs, outputs, effects, and snapshots, but it MUST NOT own platform I/O. The core MUST NOT import platform modules such as `node:*` or `cloudflare:*`, MUST NOT call ambient globals such as `fetch`, `setTimeout`, `crypto.randomUUID`, or `Date.now()` to drive protocol behavior, and MUST receive identity and time as inputs supplied by a host adapter.

Hosts and runtime adapters sit outside the core. They supply time, identity, persistence, model access, command execution, log handling, and any other environmental capability, then fulfill the effect requests defined in this document. **Paseo** is the first concrete runtime adapter expected to exercise this contract; `legacy-pi-host` is one adapter among others, not the protocol's defining consumer.

### What this document is *not*

It is not a redesign note, an adapter implementation guide, or a license to preserve behavior that conflicts with the protocol contract. It does not, by itself, promise cross-version stability across `packages/pppr`; versioning remains separate follow-up work.

The current implementation was extracted from the needs of `legacy-pi-host`, and some code paths still reflect that history. Where prose and code disagree, the disagreement is a code bug to be filed against the implementation — see the **Open ambiguities** section at the end. Disagreements MUST NOT be resolved by silently editing source code under `packages/pppr/src/` as part of writing this document; they are recorded and deferred.

The larger arc this document fits into is `pppr_next_steps_toward_true_ir.md`. Snapshot/protocol versioning remains future work, and the Paseo runtime adapter is the first planned structurally different driver that will exercise whether this contract is clean in practice.

### How to use this document

If you are trying to understand what a `pppr` session looks like in motion, read sections 1–3 in order. If you are trying to fulfill effects from a host, read section 4. If you are trying to persist or resume sessions, read section 5.

If you find that this document and the source code disagree, file the disagreement as a code bug against `packages/pppr`; do not invent a silent local resolution.

### Source of truth

`PROTOCOL.md` is the binding contract for the `pppr` core.

`packages/pppr/src/runtime-protocol.ts`, `packages/pppr/src/runtime.ts`, and related helpers are implementations of this contract. If they disagree with this document, the implementation is wrong and the disagreement should be filed and fixed as a code bug. The contract is allowed to be stricter than the current implementation while follow-up work closes the gap.

---

## 1. Lifecycle

### 1.1 States

The runtime occupies exactly one of five lifecycle states at any time:

| State              | Meaning                                                                                          | Resumable? | Terminal? |
| ------------------ | ------------------------------------------------------------------------------------------------ | ---------- | --------- |
| `idle`             | A runtime state object exists but no run is in progress.                                         | Yes        | No        |
| `running`          | A run is in progress; the consumer may append assistant output or request effects.               | Yes        | No        |
| `awaiting_effect`  | A run has requested an effect and is waiting for the corresponding result before progressing.    | Yes        | No        |
| `stopped`          | The session has been deliberately ended (currently only via `session.cancel`).                   | Yes\*      | Yes       |
| `failed`           | The runtime entered a failure state because of a denied or failed effect result.                 | Yes\*      | Yes       |

\* Terminal states can be loaded back from a snapshot via `session.resume`, which restores the snapshot's lifecycle as-is. Whether further progress is meaningful from `stopped` or `failed` is a host concern; the runtime does not currently re-enter `running` from either state on its own.

### 1.2 The starting point

Before any input is delivered, there is no runtime state at all (`state === undefined`). The first input that produces a state is `session.start` (which constructs fresh state) or `session.resume` (which restores from a snapshot). Other input kinds delivered to `advancePpprRuntime` with `state === undefined` throw.

A freshly constructed state begins in `idle`, but `session.start` immediately transitions it to `running` in the same step. Consumers therefore never observe `idle` from a session-start path; `idle` is only directly observable from a snapshot that was persisted in that state.

### 1.3 Legal transitions

Transitions are driven either by input events delivered through `advancePpprRuntime` or by direct calls to runtime helpers (`requestPpprEffect`, `appendPpprAssistantMessage`). Both routes are part of the IR's surface today.

| From               | Driver                                                          | To                | Side effects                                                                                                                            |
| ------------------ | --------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| (no state)         | input `session.start`                                           | `running`         | Emits `run.started` and `status.changed(session_started)`.                                                                               |
| (no state)         | input `session.resume`                                          | snapshot's state  | Restores observability log references (merged with any provided in the input). No outputs.                                               |
| `running`          | input `message.user`                                            | `running`         | Appends the user entry to conversation. No outputs.                                                                                      |
| not `running`      | input `message.user`                                            | `running`         | Appends the user entry, allocates a fresh `run_id`, and emits `run.started` and `status.changed(session_started)`.                       |
| any                | helper `requestPpprEffect`                                      | `awaiting_effect` | Pushes the request onto `effects.pending`. Emits `effect.requested` and `status.changed(effect_requested, request_id)`.                  |
| `awaiting_effect`  | input `effect.result` with `outcome === "success"`              | `running`         | Removes the matching pending request, records a fulfillment entry, and emits `status.changed(effect_resolved, request_id)`.              |
| `awaiting_effect`  | input `effect.result` with `outcome === "denied"` or `"failed"` | `failed`          | Removes the matching pending request, records a fulfillment entry, emits `status.changed(run_failed, request_id)` and `run.failed`.      |
| any                | helper `appendPpprAssistantMessage`                             | unchanged         | Appends an assistant entry to conversation. Emits `message.assistant`. Does **not** alter lifecycle.                                     |
| any                | input `session.cancel`                                          | `stopped`         | Emits `status.changed(cancelled)` and `run.completed`. Allocates a `run_id` if none existed.                                             |

### 1.4 Run identity

Every transition into `running` allocates or reuses a `run_id`:

- `session.start` allocates one if none exists on the fresh state.
- `message.user` from a non-`running` state allocates a fresh `run_id` (overwriting any prior one — see Open ambiguity §6.2).
- `session.cancel` allocates a `run_id` if none existed, purely so the emitted `run.completed` event has a `run_id` field. This means even cancelling an `idle` session that never ran produces a `run_id`.

There is no formal "run end" except the lifecycle transition into `stopped` or `failed`. A run is the bracketed activity between a `run.started` emission and the next terminal transition.

### 1.5 What lifecycle does *not* track

- It does not track per-message progress within `running`. There is no `assistant_progress` reason emitted today, even though `PpprStatusChangeReason` lists one.
- It does not track explicit "run completed" as distinct from cancellation. The only path that produces `run.completed` today is `session.cancel`. There is no path that emits `run.completed` because the assistant chose to stop.
- It does not enforce that an `effect.result` matches a pending request; if no pending request matches the result's `request_id`, the result is still recorded as a fulfillment entry but no pending entry is removed.

---

## 2. Input event vocabulary

### 2.1 Envelope

Every input event shares the same envelope:

```ts
interface PpprEventEnvelope<K, TPayload> {
  id: string;          // unique per event; used as fallback for messageId on user messages
  session_id: string;  // the session this event belongs to
  kind: K;             // one of the input kinds below
  timestamp: number;   // when the event was created (Date.now() by default)
  payload: TPayload;   // kind-specific payload
}
```

`createPpprInputEvent` constructs envelopes; `id` defaults to `randomUUID()`, `timestamp` to `Date.now()`.
The protocol contract, however, is that identity and time are supplied by the caller or adapter. Any implementation path that self-sources them inside the core is a sans-I/O violation and should be treated as a bug against this document.

### 2.2 `session.start`

**Payload (`PpprSessionStartPayload`):**

| Field              | Required? | Meaning                                                                                                  |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------- |
| `systemPrompt`     | No        | Stored verbatim in `state.context.systemPrompt`.                                                         |
| `instructions`     | No        | Copied (shallow) into `state.context.instructions`. Defaults to `[]`.                                    |
| `continuationMode` | No        | One of `"new" \| "resume" \| "fork"`. Stored on `state.session.continuationMode`. Defaults to `"new"`.   |
| `thinkingLevel`    | No        | One of `PPPR_THINKING_LEVELS`. Stored on `state.context.thinkingLevel`.                                  |
| `metadata`         | No        | Copied into `state.context.metadata`. Also passed through to the emitted `run.started` payload.          |
| `cwd`              | No        | Accepted by the type but **not stored** in the runtime state today. See Open ambiguity §6.5.             |

**Preconditions:** none. `session.start` is the canonical entry point and is valid from `state === undefined`. It always constructs fresh state — it does not merge with any pre-existing state.

**Outputs:** `run.started`, then `status.changed(session_started)`.

### 2.3 `session.resume`

**Payload (`PpprSessionResumePayload`):**

| Field           | Required? | Meaning                                                                                                                                     |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `snapshot`      | Yes       | A previously produced `PpprSnapshot`. The runtime is restored from this snapshot exactly, modulo the sanitization rules in §5.              |
| `logReferences` | No        | Additional log references to merge into `state.observability.logReferences`. Duplicates (same stream/start/end/checkpoint/digest) are dropped.|
| `metadata`      | No        | Shallow-merged into `state.context.metadata`.                                                                                               |

**Preconditions:** none. `session.resume` is valid from `state === undefined`.

**Outputs:** none. Resume is silent; the runtime does not emit `run.started` even when the restored lifecycle is already `running`. See Open ambiguity §6.4.

### 2.4 `message.user`

**Payload (`PpprUserMessagePayload`):**

| Field         | Required? | Meaning                                                                                                                                |
| ------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `text`        | Yes       | The text body of the user's message. Stored on the conversation entry.                                                                |
| `messageId`   | No        | Stored on the conversation entry. Falls back to the input event's `id` if absent.                                                      |
| `attachments` | No        | An array of `PpprArtifactReference` values. Stored on the conversation entry (shallow copy).                                           |
| `metadata`    | No        | Passed through to `run.started.metadata` if a new run is started, but **not** stored on the conversation entry. See Open ambiguity §6.3. |

**Preconditions:** state must exist (a prior `session.start` or `session.resume`).

**Outputs:**

- If state is already `running`: no outputs (only conversation mutation).
- If state is not `running`: `run.started` followed by `status.changed(session_started)`. The reason `session_started` is reused even though no new session is starting; this is one of the more visible legacy quirks. See Open ambiguity §6.2.

### 2.5 `effect.result`

**Payload:** the entire payload is a `PpprEffectResult` (defined in §4.3). Note: this means the `id` and `session_id` fields appear on **both** the input event envelope and the inner `PpprEffectResult`. They are not required to match.

**Preconditions:** state must exist. The result *should* correlate to a pending request via `request_id`, but the runtime does not currently enforce this — see §1.5.

**Outputs:** depend on `outcome`:

- `success`: `status.changed(effect_resolved, request_id)` only.
- `denied` or `failed`: `status.changed(run_failed, request_id)` followed by `run.failed`. The `run.failed` payload's `error` defaults to a stock message (`"Effect request denied by host policy"` or `"Effect request failed during host execution"`) when the result does not provide one.

### 2.6 `session.cancel`

**Payload (`PpprSessionCancelPayload`):**

| Field    | Required? | Meaning                                                                                          |
| -------- | --------- | ------------------------------------------------------------------------------------------------ |
| `reason` | No        | Stored verbatim in `run.completed.completion_reason`. Defaults to `"cancelled"`.                  |

**Preconditions:** state must exist.

**Outputs:** `status.changed(cancelled)` followed by `run.completed`. See Open ambiguity §6.6 for the case where the prior state was `failed`.

---

## 3. Output event vocabulary

### 3.1 Envelope

Output events use the same envelope as input events. `createPpprOutputEvent` constructs them.

### 3.2 `run.started`

**Payload (`PpprRunStartedPayload`):**

```ts
{
  run_id: string;
  state: PpprLifecycleState;     // always "running" at the point of emission today
  triggering_input_id?: string;  // the id of the input event that started this run
  metadata?: Record<string, unknown>;
}
```

Emitted when:
- a `session.start` input creates fresh state, or
- a `message.user` input arrives with state in any non-`running` lifecycle.

It is **not** emitted on `session.resume`, even if the resumed snapshot's lifecycle is `running`.

### 3.3 `message.assistant`

**Payload (`PpprAssistantMessagePayload`):**

```ts
{
  message_id: string;
  role: "assistant";
  segments: PpprAssistantSegment[];   // text | thinking | tool_intent | artifact_ref
  stop_reason?: string;
  usage?: PpprUsageSummary;
}
```

Emitted exclusively by `appendPpprAssistantMessage`. Lifecycle is unchanged at emission. Consumers may rely on the runtime appending an assistant entry to `state.conversation` immediately before this event is emitted.

`usage` is stored on the conversation entry but is not aggregated by the runtime today. See Open ambiguity §6.7.

### 3.4 `effect.requested`

**Payload:** the full `PpprEffectRequest` (see §4.2).

Emitted exclusively by `requestPpprEffect`, immediately before the `status.changed(effect_requested)` event. The lifecycle has already transitioned to `awaiting_effect` at the point this event is emitted.

### 3.5 `status.changed`

**Payload (`PpprStatusChangedPayload`):**

```ts
{
  from: PpprLifecycleState;
  to: PpprLifecycleState;
  reason: PpprStatusChangeReason;
  request_id?: string;                  // populated for effect-related transitions
  metadata?: Record<string, unknown>;   // never populated by the runtime today
}
```

Emitted on every lifecycle transition that the runtime considers observable. The `reason` field is constrained to:

| Reason              | Emitted by                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `session_started`   | `session.start`; also reused by `message.user` from a non-`running` state (see §2.4).                                   |
| `assistant_progress`| **Never emitted today.** Reserved in the type, unused in the runtime. See Open ambiguity §6.1.                          |
| `effect_requested`  | `requestPpprEffect`.                                                                                                    |
| `effect_resolved`   | `effect.result` with `outcome === "success"`.                                                                           |
| `run_completed`     | **Never emitted today** as a `status.changed` reason. (`run.completed` the *event* is emitted; the *reason* is unused.) See Open ambiguity §6.1. |
| `run_failed`        | `effect.result` with `outcome === "denied"` or `"failed"`.                                                              |
| `cancelled`         | `session.cancel`.                                                                                                       |

The `metadata` field on `PpprStatusChangedPayload` exists but is never set by the runtime today.

### 3.6 `run.completed`

**Payload (`PpprRunCompletedPayload`):**

```ts
{
  run_id: string;
  state: "stopped";
  completion_reason: string;
  usage?: PpprUsageSummary;
  metadata?: Record<string, unknown>;
}
```

Emitted exclusively by `session.cancel`. There is currently no path that produces `run.completed` because the assistant has finished its work normally — see §1.5.

`usage` and `metadata` exist on the type but are never set by the runtime today.

### 3.7 `run.failed`

**Payload (`PpprRunFailedPayload`):**

```ts
{
  run_id: string;
  state: "failed";
  error: { code?: string; message: string; details?: Record<string, unknown> };
  request_id?: string;
  metadata?: Record<string, unknown>;
}
```

Emitted exclusively by `effect.result` with `outcome === "denied"` or `"failed"`. The `request_id` field is the failed effect request's id. The `error.message` falls back to a host-policy default if the result did not provide one (see §2.5).

`metadata` is forwarded from the inbound `effect.result`'s `metadata`.

---

## 4. Effect contract

### 4.1 Kinds

The runtime defines exactly eight effect kinds today:

| Kind              | Direction (intent)                                              |
| ----------------- | --------------------------------------------------------------- |
| `content.read`    | Host reads content for the runtime.                             |
| `content.write`   | Host writes content on behalf of the runtime.                   |
| `content.patch`   | Host applies a patch to existing content.                       |
| `command.exec`    | Host executes a structured command.                             |
| `model.infer`     | Host invokes a model and returns the assistant message.         |
| `session.persist` | Host persists a snapshot.                                       |
| `log.append`      | Host appends entries to an observability log.                   |
| `log.resolve`     | Host resolves prior log entries (replay/inspect/resume).        |

These names are owned by the core's effect contract, regardless of where earlier implementations first used them. Renaming them remains out of scope for this change, but they are protocol nouns now, not borrowed labels that belong to `legacy-pi-host`. The Paseo runtime adapter is the first planned structurally different driver that will exercise whether these names are clean enough as protocol vocabulary.

### 4.2 Request shape

```ts
interface PpprEffectRequest<K extends PpprEffectKind = PpprEffectKind> {
  id: string;
  session_id: string;
  kind: K;
  requested_at: number;
  payload: PpprEffectRequestPayloadMap[K];
  policy?: { approvalRequired?: boolean; sandbox?: string };
  correlation?: Record<string, unknown>;
}
```

`createPpprEffectRequest` and the per-kind helpers (`createPpprContentReadRequest` etc.) construct requests with default `id` (`randomUUID()`) and `requested_at` (`Date.now()`).
Under the sans-I/O contract, those values belong at the adapter boundary. Any helper path that still self-sources them inside the core is an implementation bug against this document rather than a normative property of the protocol.

The per-kind payload shapes are defined in `runtime-protocol.ts` and intentionally not duplicated here. See `PpprEffectRequestPayloadMap` for the authoritative list.

### 4.3 Result shape

```ts
interface PpprEffectResult<K extends PpprEffectKind = PpprEffectKind> {
  id: string;
  session_id: string;
  request_id: string;            // correlates to PpprEffectRequest.id
  kind: K;
  completed_at: number;
  outcome: PpprEffectOutcome;    // "success" | "denied" | "failed"
  payload: PpprEffectResultPayloadMap[K];
  error?: { code?: string; message: string; details?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}
```

`createPpprEffectResult` constructs results from a request (taking `id`, `session_id`, and `kind`), an outcome, a payload, and optional fields.

### 4.4 Request rules

- The runtime requests effects only via the `requestPpprEffect` helper. There is no path that auto-emits an effect request from inside an input handler.
- A request transitions the lifecycle to `awaiting_effect` regardless of the prior state. This means a request from `failed` or `stopped` is technically possible today and would appear to "resurrect" the lifecycle. See Open ambiguity §6.8.
- The `policy` and `correlation` fields are opaque to the runtime; they are stored on the pending request and round-trip through snapshots untouched (modulo `structuredClone` of the payload).

### 4.5 Result rules

- A result is delivered as the payload of an `effect.result` input event.
- The runtime removes from `effects.pending` any entry whose `id` matches the result's `request_id`. If no such entry exists, no pending entry is removed; this is silently tolerated. A fulfillment record is appended either way.
- A `success` result returns the lifecycle to `running`. A `denied` or `failed` result transitions to `failed` and emits `run.failed`.
- The runtime does not currently enforce any ordering or single-flight constraint: multiple requests can sit in `effects.pending` simultaneously if the consumer pushes them via `requestPpprEffect` without waiting. No code today exercises this path; it is a latent capability/defect.

### 4.6 What the runtime does *not* do with effects

- It does not fulfill them. Fulfillment is exclusively a host concern.
- It does not validate payload schema beyond TypeScript-level typing.
- It does not enforce `policy.approvalRequired` or `policy.sandbox`. These are advisory fields the host is free to interpret.
- It does not emit anything when an unmatched `effect.result` arrives.

---

## 5. Snapshot shape

### 5.1 Structure

```ts
interface PpprSnapshot {
  session: PpprSessionState;            // sessionId, createdAt, continuationMode
  context: PpprContextState;            // systemPrompt, instructions, thinkingLevel, metadata
  conversation: PpprConversationEntry[];// user and assistant entries
  effects: PpprEffectsState;            // pending requests + fulfilled records
  lifecycle: { runId?, state, lastReason? };
  observability: PpprObservabilityState;// logReferences, checkpoint
}
```

A `PpprRuntimeState` and a `PpprSnapshot` are structurally identical today. The distinction is conventional: `PpprSnapshot` is the form the runtime produces for transport/persistence, and `restorePpprRuntimeState` produces a fresh `PpprRuntimeState` from a snapshot.

### 5.2 Round-trip guarantee

`createPpprSnapshot(state)` followed by `restorePpprRuntimeState(snapshot)` produces a `PpprRuntimeState` such that subsequent runtime progressions behave identically to progressing from the original `state`. This is the IR's central durability claim.

The round-trip is implemented by structural copying with `structuredClone` for effect-request payloads; observability is rebuilt field by field; conversation entries are rebuilt by `clonePpprConversationEntry`. The intent is to make snapshots free of references back into the producing state.

### 5.3 Sanitization

Snapshots **strip unknown fields** in two places:

1. `PpprObservabilityState` is rebuilt to contain only `logReferences` and `checkpoint`. Any `metadata` or extra fields present on the input observability are dropped.
2. Each `PpprLogReference` in a snapshot is rebuilt to contain only `stream`, `start`, `end`, `checkpoint`, `digest`. Extra fields like `bucket` or provider-specific URLs are dropped.

Sanitization also applies on `restorePpprRuntimeState`, since restoration is implemented via `createPpprSnapshot`. This means a "dirty" snapshot loaded from external storage is sanitized in the same way an outgoing snapshot is.

The current set of approved fields is implicit in the source code. The intent — keep snapshots free of host-private storage details — is stronger than what is documented elsewhere; the test `pppr-runtime-protocol.test.ts > sanitizes persisted snapshots and restored snapshots while preserving lifecycle and correlation` is the closest thing to a normative statement.

### 5.4 Cross-version stability

There is no version field on a snapshot today. The current implicit guarantee is "this snapshot can be restored by the same `packages/pppr` build that produced it." Cross-version compatibility is **not promised** and is the explicit subject of step 2 of the next-steps arc.

A snapshot that was produced by an older `packages/pppr` and loaded by a newer one will be silently sanitized to the newer schema's approved fields. Whether this is a feature or a hazard depends on whether the snapshot's information was important; the runtime cannot tell.

### 5.5 What snapshots do *not* contain

- They do not contain a protocol or schema version.
- They do not contain references to in-memory functions, timers, or open file handles.
- They do not contain host-side capability state (provider configuration, sandbox state, log backends).
- They do not contain any field added to the runtime state outside the schema described in §5.1; sanitization will drop unknown additions.

---

## 6. Open ambiguities

These are protocol-design questions that remain open after writing this document. They are recorded here, not resolved. Each entry is fair game for follow-up work, and many of them are expected to become sharper once the Paseo runtime adapter exercises the contract from outside the legacy CLI shape. This section names unanswered questions; it does not answer them.

### 6.1 Unused `PpprStatusChangeReason` values

`assistant_progress` and `run_completed` are declared as legal values of `PpprStatusChangeReason` but the runtime never emits a `status.changed` with either reason. Are these:

- intentional reservations for upcoming behavior?
- residue from an earlier protocol shape?
- meant to be emitted by the runtime in cases the legacy host did not need?

The current code is silent on this.

### 6.2 `message.user` reuses `session_started` as a transition reason

When a `message.user` arrives in a non-`running` state, the runtime transitions to `running`, allocates a fresh `run_id`, and emits `status.changed(session_started)`. The reason `session_started` is reused even though no new *session* is starting — only a new run within the existing session.

This conflates "a new session began" with "a new run began within an existing session." A consumer cannot tell the two apart from the `status.changed` event alone.

It also overwrites any prior `runId` on the lifecycle state, with no notification. The prior run's identifier is lost.

### 6.3 `message.user.metadata` is dropped from the conversation entry

`PpprUserMessagePayload.metadata` is forwarded into the `run.started.metadata` field if a new run starts, but it is never persisted onto the conversation entry. A snapshot therefore loses any user-message metadata.

Is metadata meant to be transient (only relevant to the triggered run.started event) or durable (a property of the user message)? The type encodes it as a property of the *message*, but the runtime treats it as a property of the *event*.

### 6.4 `session.resume` produces no `run.started` even from `running` lifecycle

If a snapshot's lifecycle is `running`, restoring it via `session.resume` re-enters that lifecycle silently. A consumer downstream of the runtime cannot tell from the output stream that a run is in progress; it has to inspect the restored state.

This is asymmetric with `session.start`, which always emits `run.started`. The asymmetry is intentional in the sense that resume should not pretend a run is starting — but it also means consumers that rely on `run.started` events to drive UI cannot distinguish "no active run" from "active run, just silently resumed."

### 6.5 `session.start.cwd` is accepted but unused

`PpprSessionStartPayload.cwd` is declared in the type but the runtime does not store it on `state.session`, `state.context`, or anywhere else. It is dropped.

Is `cwd` a host-side concern that the runtime is expected to ignore (and the type only exists for the host to read off the input event)? Or was this an extraction oversight where the field should have moved to host-side metadata? The type's presence in the IR's protocol module suggests it is meant to be IR-relevant, but the behavior contradicts that.

### 6.6 `session.cancel` from `failed`

`session.cancel` is legal from any state, including `failed`. From `failed`, it transitions to `stopped` and emits `run.completed` — i.e., it claims the run completed normally even though it had previously failed.

Is "cancel-after-fail" a meaningful operation? Should `run.completed` be the right output, or should cancel from `failed` either be a no-op or emit a different event?

A related quirk: cancelling an `idle` session that never had a run still allocates a `run_id` purely so the `run.completed` event has the field populated. The result is a `run.completed` event for a run that never started.

### 6.7 `usage` is stored but not aggregated

`PpprAssistantMessagePayload.usage` and `PpprRunCompletedPayload.usage` both exist as `PpprUsageSummary`. Per-message usage is stored on the conversation entry. Per-run aggregate usage is not computed by the runtime, and `run.completed` never sets the field today.

Is run-level usage aggregation an IR concern that is incomplete, or is it a host concern that the IR happens to type? Either answer would make the protocol clearer; the current state is ambiguous.

### 6.8 Effect requests from terminal states

`requestPpprEffect` does not check the prior lifecycle state. A request from `stopped` or `failed` would silently transition the lifecycle to `awaiting_effect` and emit `effect.requested`. No code in `legacy-pi-host` exercises this, so its consequences are untested.

Should this be an error? Should it emit a transition that surfaces the prior terminal state (e.g., a `status.changed` with `from: "failed"`)? The runtime currently does the latter incidentally but does not call attention to it.

### 6.9 Multiple pending effects

`effects.pending` is an array, and `requestPpprEffect` pushes onto it without checking for an existing pending request. The current consumer is single-flight, so this never happens in practice.

If a future consumer fans out multiple effects in parallel, the runtime would accept that, but:

- the lifecycle is a single state, so it remains `awaiting_effect` regardless of how many requests are pending
- a `success` result transitions back to `running` even if other requests are still pending — i.e., the lifecycle does not reflect outstanding work

This is either a latent capability the runtime is silently ready for, or a defect that has not yet been triggered. Step 3 of the next-steps arc is the natural place to find out.

### 6.10 Unmatched `effect.result`

If an `effect.result` arrives whose `request_id` does not match any pending request, the runtime appends a fulfillment record but does not emit any warning. A consumer would have no protocol-level signal that an unexpected result arrived.

Is silent acceptance the intended behavior, or should the runtime reject (or at least flag) unmatched results?

### 6.11 `PpprStatusChangedPayload.metadata` is never set

The field exists on the type. No emission site populates it. It is functionally dead today.

### 6.12 Snapshot sanitization is invisible

Sanitization (§5.3) is significant behavior — it silently drops fields the runtime does not approve of. There is no event, no log, and no return signal that fields were dropped. A host that depends on a non-approved field surviving a round-trip will discover the loss only by inspection.

The behavior is correct given the IR's intent (snapshots should not carry host-private storage details), but its silence is a hazard. A more honest IR would surface the sanitization, perhaps via an event or by exposing a "snapshot lint" helper.

---

*End of `pppr` Protocol Specification (binding contract for the sans-I/O core; the Paseo runtime adapter is the first planned external driver of this surface).*
