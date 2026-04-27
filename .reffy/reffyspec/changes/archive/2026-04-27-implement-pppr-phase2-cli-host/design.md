# Design

## Intent

This change is the implementation bridge from the completed Phase 1 runtime to the first concrete host.

The host should prove four things at once:

- the runtime can be driven without CLI-owned hidden state
- the default tool contract can be mapped through explicit effect fulfillment
- model inference, persistence, and observability can stay host-owned
- the operator experience can still feel like a usable CLI

## Design stance

The CLI is the first host, not the control plane.

That means the host is responsible for:

- collecting interactive user input
- loading applicable instructions and visible defaults
- advancing the runtime with protocol events
- fulfilling effect requests with local providers
- rendering runtime outputs for the operator
- persisting snapshots and observability references

The host is not responsible for:

- owning canonical session state outside the runtime snapshot
- inventing alternate tool semantics that bypass protocol effects
- embedding provider-specific execution details into the core protocol

## Delivery shape

### Stage 1: host/runtime adapter

Deliver:

- a host adapter that owns the outer loop around `session.start`, `session.resume`, `message.user`, `effect.result`, and `session.cancel`
- translation from CLI session actions into protocol inputs
- routing from runtime outputs into host rendering or host effect fulfillment

Constraints:

- the adapter must treat the runtime as the source of truth for lifecycle and effect state
- the host may keep ephemeral UI state, but not execution-critical hidden state the runtime cannot serialize

### Stage 2: local capability fulfillment

Deliver:

- host-owned fulfillment for `content.read`, `content.write`, `content.patch`, `command.exec`, `model.infer`, `session.persist`, `log.append`, and `log.resolve`
- a clear mapping from visible CLI tools to the underlying effect requests they trigger
- normalization of provider or host outcomes into approved effect result envelopes

Constraints:

- local providers may be synchronous in the first host where that simplifies execution
- denial, failure, and success must remain explicit in effect results
- provider-specific data may be attached only as optional metadata, not required core payload

### Stage 3: host observability and continuation

Deliver:

- snapshot persistence at the host boundary
- host-managed append and resolve behavior for observability logs
- resume and fork flows that reconstruct runtime state only from snapshot and approved log references

Constraints:

- snapshots remain minimal and continuation-oriented
- observability logs remain external to the core snapshot
- the host may choose local disk, object storage, or other backing stores without changing the runtime contract

### Stage 4: CLI rendering and operator contract

Deliver:

- rendering of `run.started`, `message.assistant`, `effect.requested`, `status.changed`, `run.completed`, and `run.failed`
- visible progress around tool fulfillment and effect waiting
- preservation of the minimal visible contract: prompt context, instructions, and default tool surface

Constraints:

- rendering should consume protocol outputs rather than duplicate runtime inference
- command execution should stay operationally synchronous in the first host unless a concrete blocker emerges
- the host should remain thin enough that a later proof host can reuse the same runtime contract

## Suggested work order

1. Define the CLI host responsibilities and module boundaries.
2. Implement the host/runtime driver loop.
3. Implement host-owned fulfillment for the Phase 1 effect kinds.
4. Wire snapshot/log persistence through the host boundary.
5. Render protocol outputs into the CLI operator experience.
6. Add integration tests that exercise the host through the runtime seam.

## Verification expectations

Before this change is considered complete, implementation should demonstrate:

- the CLI can start and resume sessions by driving the runtime through protocol inputs
- the default tool surface maps to host-fulfilled effect requests rather than direct core execution
- model inference remains a host-mediated effect
- snapshot persistence and observability handling stay below the host boundary
- the CLI-visible workflow works without introducing new hidden orchestration state in the core

## Open Questions

- Which existing package and module boundaries should own the first host adapter so the CLI can evolve without re-centralizing architecture around current `pi` internals?
- How much of the current CLI session loop can be reused directly, and where should reuse stop to avoid dragging terminal-defined assumptions back into `pppr`?
