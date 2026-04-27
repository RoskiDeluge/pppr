# Proposal: define `pppr` runtime protocol

## Why

The completed `define-pppr-minimal-core` change establishes the MVP boundary, and `phase-pppr-host-neutral-mvp` establishes the order of work.

The next unresolved question is the first implementation-driving one:

- what state belongs to the host-neutral core
- what crosses the core/host boundary
- what the minimum protocol needs to be for the first host to exist without collapsing that boundary

If this is left implicit, implementation will drift back toward a terminal-defined runtime with renamed abstractions.

## What Changes

This change defines the Phase 1 runtime/protocol plan for `pppr`.

It establishes:

- the minimum runtime-owned state model
- the minimum input and output event model
- the minimum effect request and effect result model
- the minimum snapshot and serialization boundary
- a bias toward minimal snapshots plus host-managed append-only observability logs
- a preferred opaque log-reference shape for reconnecting snapshots to external observability data
- the concrete Phase 1 protocol contents needed to start implementation
- the smallest initial effect kinds needed to support the first interactive host
- model inference as a host-mediated capability from the first protocol cut
- the testing and validation expectations that prove the core does not depend on direct host I/O

This change does not implement every protocol detail for all future hosts or all future capabilities. It defines the first durable contract the CLI host and later proof hosts must consume.

## Impact

Affected planning areas:

- `pppr-core` state model
- `pppr-protocol` event and effect schema
- session serialization and continuation
- Phase 1 testing strategy

Expected impact:

- implementation can begin at the core/protocol seam without reopening the product boundary
- the first host can be built against explicit inputs, outputs, and effects instead of ad hoc callbacks
- later provider and host work can reuse a concrete runtime contract rather than infer one from CLI behavior
- ephemeral or multi-host runtimes can externalize event logs cheaply without forcing object-storage assumptions into the core
- Phase 1 work can move from architectural intent to a concrete contract for runtime and host integration

## Reffy References

- `pppr_sans_io_neutral_host.md` - defines the effect-oriented host boundary and argues for a pure runtime that consumes effect results rather than performing host I/O directly
- `pppr_abstraction_shift.md` - frames the protocol, capability, and invariant-centered architecture that Phase 1 needs to make concrete
