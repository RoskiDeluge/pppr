# Design

## Intent

This change is the final MVP proof that `pppr` is not a renamed CLI application.

Phases 1 through 3 established:

- a host-neutral runtime
- a first concrete CLI host
- hardened provider, policy, and tool-semantics seams

Phase 4 needs to prove that those seams can support a genuinely different host shape.

## Design stance

The non-CLI proof host should behave like a foreign environment hosting `pppr`, not like a stripped-down copy of the CLI.

That means:

- no terminal rendering is required for correctness
- no CLI session loop is treated as architectural law
- host addressing, transport, persistence, model access, and capability routing stay outside the core
- the runtime still advances only through protocol events and effect results

The `paseo` idea is a useful design pressure here, even without full implementation details:

- `pppr` can be treated as the small runtime hosted inside a richer actor substrate
- remote invocation, workspace sandboxing, persistence, and tool execution belong to the host environment
- a host may itself be composed of remote micro-agents, but `pppr` should only observe the normalized host contract

## Delivery shape

### Stage 1: proof-host interface

Deliver:

- a dedicated non-CLI proof-host module
- a host driver that is independent of interactive terminal concerns
- a clear statement of what the proof host owns:
  - transport or invocation entrypoint
  - effect fulfillment
  - persistence
  - observability
  - operator- or caller-visible result projection

Constraints:

- the proof host must not reach into runtime internals outside the approved protocol and snapshot boundary
- the proof host may render or return structured results, but should not depend on terminal-specific output formatting

### Stage 2: embedded or remote execution flow

Deliver:

- a proof-host loop that can start, resume, fulfill effects, and return structured outputs
- explicit handling for snapshot persistence and log references
- a caller-facing result surface suitable for embedding or remote invocation

Constraints:

- the host loop should reuse the hardened Phase 3 provider and policy seams
- addressing or transport identifiers belong to host metadata, not runtime-owned state
- the proof host should stay small enough to remain a proof artifact rather than a second product

### Stage 3: `paseo`-compatible actor-host shape

Deliver:

- a proof-host framing in which:
  - `pppr` is the hosted runtime
  - the outer environment provides remote workspace, model, persistence, and MCP-style capability access
  - session invocation can be thought of as an addressable host operation
- at least one code path or test scenario that demonstrates compatibility with this remote-host style

Constraints:

- do not encode `paseo`-specific transport, actor identity, or Cloudflare primitives into the core runtime
- keep the proof host generic enough that it remains useful even before a concrete `paseo` integration exists
- avoid introducing subagent orchestration into the core during this phase

### Stage 4: host-neutral proof scenarios

Deliver:

- scenarios showing the same runtime can run under:
  - the existing CLI host
  - the new proof host
- tests for start/resume/effect fulfillment/completion in the non-CLI path
- proof that the runtime does not depend on CLI-local hidden state

Constraints:

- tests should focus on boundary honesty, not on recreating the full CLI experience
- if the proof host requires CLI-only shortcuts, the earlier architecture should be treated as not yet proven

## Suggested work order

1. Define the proof-host interface and module placement.
2. Implement the non-CLI host driver on top of the current runtime and provider seams.
3. Add a `paseo`-compatible host framing and proof scenario.
4. Add verification that compares CLI-host and proof-host behavior at the protocol seam.
5. Reconfirm alignment with the MVP phase plan and the earlier core/host changes.

## Verification expectations

Before this change is considered complete, implementation should demonstrate:

- `pppr` can run through a non-CLI host without terminal assumptions
- the proof host consumes the same runtime contract as the CLI host
- persistence, observability, model access, and capability fulfillment remain host-owned
- a `paseo`-style remote actor host can be described or exercised without forcing new core-specific exceptions

## Risks

### Risk: accidentally building a second product surface

Mitigation:

- keep the proof host intentionally narrow
- optimize for architectural proof rather than UX completeness
- avoid duplicating the CLI feature surface unless needed for boundary verification

### Risk: leaking remote-host assumptions into the core

Mitigation:

- keep remote addressing and transport below the host boundary
- treat actor identity and remote routing as host metadata only
- require the same runtime protocol as the CLI host

### Risk: premature subagent architecture in the core

Mitigation:

- do not add subagent primitives to the runtime in Phase 4
- treat distributed orchestration as a host-level concern unless a later change explicitly promotes it into the protocol
- use this phase to validate the host model first, not to expand the core contract
