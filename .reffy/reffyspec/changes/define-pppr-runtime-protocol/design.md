# Design

## Intent

Phase 1 should define the smallest real runtime contract that prevents architectural backsliding.

The goal is not to build an elaborate universal protocol. The goal is to make the core/host seam concrete enough that the first host cannot bypass it.

## Scope

This change should define four things:

### 1. Runtime-owned state

The core should own only the state required to advance a session independently of a host implementation.

At minimum that likely includes:

- session identity
- conversation/history state
- instruction-context state
- pending effect state
- stop/completion state
- serializable metadata needed for continuation or replay

The core should not own terminal rendering state, process handles, filesystem handles, or provider-specific live objects.

### 2. Input and output events

The protocol should distinguish:

- inputs the host sends into the runtime
- outputs the runtime emits for rendering, logging, and orchestration

The first cut should stay narrow. It only needs enough event kinds to support:

- starting or resuming a session
- delivering a user message
- delivering an effect result
- emitting assistant-visible output
- emitting host-visible status and stop information

### 3. Effect requests and results

The runtime must describe host work without performing it.

For Phase 1, the effect model should be intentionally small and should cover only the first-host baseline:

- content read
- patch/edit application
- content write
- command execution
- persistence operations needed for session continuation or observability
- model inference

The exact set can still be normalized during implementation, but the change should state the minimum initial kinds and the envelope shape all kinds share.

Each effect result should make room for:

- success
- denial/policy rejection
- execution failure
- structured output payload
- metadata needed for observability

Persistence effects should remain generic.

The core may request snapshot persistence, log append, or log reference resolution, but it should not know whether the host fulfills those requests through local disk, object storage, a database, or another backend.

### 4. Snapshot and serialization boundary

Phase 1 needs a serializable session shape that proves the runtime is not hiding essential state in the host.

The initial snapshot design should preserve:

- enough state to resume a session
- references or checkpoints sufficient to reconnect the session to host-managed observability data
- enough determinism to support replay-oriented testing

It should not assume the snapshot is the final persistence format for every future host.

The persistence bias for Phase 1 should be:

- keep the snapshot minimal and continuation-oriented
- keep append-only observability logs outside the core state by default
- allow snapshots to reference host-managed log segments, object identifiers, or checkpoints when a host chooses external persistence

This keeps the core portable while allowing hosts to use cheap remote object storage or other append-friendly backends for observability.

The preferred log-reference shape should stay minimal and opaque to the core. A snapshot-level log reference should be able to carry:

- `stream`: a host-defined stream identifier
- `start`: an optional lower replay bound
- `end`: an optional upper replay bound
- `checkpoint`: an optional resume token or cursor
- `digest`: an optional integrity or version marker

This shape is intentionally not tied to object storage, databases, local files, or broker-specific semantics. It gives hosts enough room to support chunked logs, append-only objects, cursors, or checkpointed replay while keeping provider details below the host boundary.

## Phase 1 protocol contents

The Phase 1 protocol should now be specified concretely enough for implementation planning.

### Runtime-owned session state

The preferred first-cut state shape should include these categories:

- `session`: session identity, creation metadata, continuation mode
- `context`: resolved instruction context and runtime configuration needed to advance the session
- `conversation`: ordered model-visible messages and assistant outputs needed for subsequent turns
- `effects`: pending effect requests, fulfilled effect summaries, and correlation state
- `lifecycle`: run status such as idle, awaiting_effect, running, stopped, or failed
- `observability`: minimal log references, checkpoints, and summary metadata required to reconnect to external logs

The state should exclude:

- terminal layout or rendering state
- live command handles or process objects
- open file descriptors
- network sockets or clients
- provider SDK objects
- raw credential material

### Input event kinds

The minimum host-to-runtime input kinds should be:

- `session.start`
  Starts a new runtime session with initial configuration and context inputs.
- `session.resume`
  Restores a session from serialized state plus any referenced continuation metadata.
- `message.user`
  Delivers a new user message or command payload to the runtime.
- `effect.result`
  Delivers the host outcome for a previously requested effect.
- `session.cancel`
  Requests cancellation or stop for the active run.

These should share a common envelope with:

- `id`
- `session_id`
- `kind`
- `timestamp`
- `payload`

### Output event kinds

The minimum runtime-to-host output kinds should be:

- `run.started`
  Signals that the runtime has accepted work and started advancing the session.
- `message.assistant`
  Emits assistant-visible content for rendering and logging, with structured segments inside the payload rather than multiple output event kinds.
- `effect.requested`
  Describes host-mediated work required for the runtime to continue.
- `status.changed`
  Exposes important lifecycle transitions such as awaiting_effect or stopped.
- `run.completed`
  Signals successful completion for the current run step.
- `run.failed`
  Signals unrecoverable failure at the runtime-contract level.

These should share a common envelope with:

- `id`
- `session_id`
- `kind`
- `timestamp`
- `payload`

For Phase 1, `message.assistant` should remain a single output event kind.

Its payload may carry structured segments for different assistant-visible content forms, but the protocol should avoid splitting assistant output into multiple top-level event kinds until a later change proves that distinction is necessary.

The preferred Phase 1 `message.assistant` payload should include:

- `message_id`
- `role`
- `segments`
- optional `stop_reason`
- optional `usage`

The preferred Phase 1 assistant segment categories should be:

- `text`
  Human-readable assistant text.
- `thinking`
  Optional internal reasoning content if the host/provider chooses to expose it.
- `tool_intent`
  Optional assistant-visible representation of a forthcoming tool or effect action.
- `artifact_ref`
  Optional structured reference to a generated or relevant artifact without embedding provider-specific transport details.

The preferred Phase 1 lifecycle and status payload categories should be:

- `run.started`
  `run_id`, initial lifecycle state, triggering input reference, and optional execution metadata.
- `status.changed`
  `from`, `to`, reason category, optional active `request_id`, and optional summary metadata.
- `run.completed`
  `run_id`, final lifecycle state, completion reason, and optional usage or summary metadata.
- `run.failed`
  `run_id`, final lifecycle state, structured error summary, and optional failed `request_id` or failure metadata.

For Phase 1, the preferred lifecycle state values should include:

- `idle`
- `running`
- `awaiting_effect`
- `stopped`
- `failed`

The preferred status-change reason categories should include:

- `session_started`
- `assistant_progress`
- `effect_requested`
- `effect_resolved`
- `run_completed`
- `run_failed`
- `cancelled`

### Effect request envelope

The preferred common effect request shape should include:

- `id`: unique effect request identifier
- `session_id`: owning session
- `kind`: effect kind such as `content.read` or `model.infer`
- `requested_at`: timestamp
- `payload`: kind-specific request payload
- `policy`: optional host-facing policy hints or approval requirements
- `correlation`: optional correlation metadata for observability or retries

Kind-specific request payloads in Phase 1 should be concrete at the category level:

- `content.read`
  Path or resource target, optional range selectors, and read-mode hints.
- `content.write`
  Path or resource target, content payload, write mode, and overwrite expectations.
- `content.patch`
  Path or resource target, structured patch payload, and patch application mode.
- `command.exec`
  Command argv or equivalent structured invocation, working-directory hint, environment-policy hint, and timeout hint.
- `model.infer`
  Model selection hint, input messages/context, inference options, and tool/effect visibility configuration needed for the turn.
- `session.persist`
  Snapshot payload or snapshot reference target, persistence intent, and continuation metadata.
- `log.append`
  Log stream target or reference, append entries, and ordering/checkpoint hints.
- `log.resolve`
  Log reference payload, replay bounds, and resolution intent.

### Effect result envelope

The preferred common effect result shape should include:

- `id`: unique result identifier
- `session_id`: owning session
- `request_id`: the effect request being fulfilled
- `kind`: repeated effect kind
- `completed_at`: timestamp
- `outcome`: one of `success`, `denied`, or `failed`
- `payload`: kind-specific result payload
- `error`: optional structured error data
- `metadata`: optional observability metadata

Kind-specific result payloads in Phase 1 should be concrete at the category level:

- `content.read`
  Read content, normalization metadata, and truncation or range information.
- `content.write`
  Write acknowledgment, version or digest metadata, and resulting target reference.
- `content.patch`
  Patch outcome summary, changed-target metadata, and any generated diff or failure context.
- `command.exec`
  Exit status, stdout, stderr, termination metadata, and execution timing.
- `model.infer`
  Assistant output payload, usage metadata, stop reason, and provider/model metadata exposed through the host.
- `session.persist`
  Persistence acknowledgment, resulting snapshot reference, and checkpoint metadata.
- `log.append`
  Append acknowledgment, resulting log cursor or checkpoint, and ordering metadata.
- `log.resolve`
  Resolved log entries or entry references, replay bounds actually used, and continuation checkpoint metadata.

### Initial effect kinds

The Phase 1 effect kinds should be limited to:

- `content.read`
- `content.write`
- `content.patch`
- `command.exec`
- `model.infer`
- `session.persist`
- `log.append`
- `log.resolve`

This set is intentionally narrow. It covers the minimal tool contract, model access, continuation, and externalized observability without pulling in unrelated capability classes.

The Phase 1 payload rule should be:

- payloads are structured by category rather than raw provider blobs
- hosts may include provider metadata only in explicitly optional metadata fields
- the core should not depend on backend-specific payload details to advance state

### Snapshot categories

The Phase 1 snapshot should be defined at the category level as:

- session metadata
- resolved instruction/context metadata
- conversation state required for continuation
- pending or resumable effect state
- lifecycle status
- observability log references and checkpoints

The snapshot should not be treated as a full observability export or provider-specific persistence document.

## Minimal effect taxonomy

This change should resist effect-taxonomy sprawl.

The right rule for Phase 1 is:

- define only effect kinds required by the first host and the minimal tool contract
- normalize envelopes and result shapes before expanding the kind list
- defer capability classes that are not needed for `read`, `edit`, `write`, `bash`, instruction loading, session persistence, observability, or model inference

## Testing implications

Phase 1 is only successful if the core can be exercised without direct terminal, filesystem, shell, or network dependencies.

That implies tests should be able to:

- advance the runtime by sending protocol inputs
- inspect emitted output events
- capture emitted effect requests
- feed synthetic effect results back into the runtime
- serialize and restore snapshots

If those tests require a real shell, real terminal, or direct file access in the core layer, the boundary is too weak.

Tests should also be able to treat observability storage as external:

- snapshots can be serialized without bundling the full event log
- synthetic log references can be attached to snapshots
- replay-oriented tests can resolve those references through host-provided fixtures

Tests should also be able to assert lifecycle behavior through protocol outputs:

- that `run.started`, `status.changed`, `run.completed`, and `run.failed` carry stable category-shaped payloads
- that lifecycle transitions do not depend on terminal rendering state
- that awaiting-effect and failure paths are observable without inspecting host internals

## Relationship to later phases

This change is narrower than the full phased MVP plan.

- Phase 1 here defines the core/protocol contract.
- Phase 2 will define and implement the first interactive host against that contract.
- Phase 3 will stabilize provider contracts behind the effect layer.
- Phase 4 will prove host-neutrality with a non-CLI execution path.

## Open Questions

- None yet.
