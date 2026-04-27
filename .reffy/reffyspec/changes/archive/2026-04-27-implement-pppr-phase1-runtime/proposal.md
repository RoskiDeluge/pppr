# Proposal: implement `pppr` Phase 1 runtime

## Why

The repo now has enough planning clarity to stop refining Phase 1 at the abstract level.

Three upstream changes already define the necessary intent:

- `define-pppr-minimal-core` defines the MVP product boundary
- `phase-pppr-host-neutral-mvp` defines the overall sequencing
- `define-pppr-runtime-protocol` defines the concrete Phase 1 runtime contract

The next step is to turn that contract into implementation work with clear slices, file ownership, and verification expectations.

## What Changes

This proposal defines the implementation plan for realizing Phase 1 of `pppr`:

- implement the Phase 1 protocol types and core runtime state model
- implement the runtime loop and effect-request/effect-result progression
- implement snapshot serialization and restoration for continuation
- implement generic persistence/log-reference hooks at the protocol boundary
- implement test coverage that proves the core can run with synthetic host fulfillment

The first implementation should target a host-neutral runtime package or module boundary. It should not include the full interactive CLI host. It should instead produce the contract the first host will consume.

## Implementation Slices

### Slice 1: protocol and state types

- add TypeScript types for protocol inputs, outputs, effect requests, effect results, snapshots, lifecycle states, and assistant segments
- define the minimal serializable runtime state shape
- keep all provider-specific metadata optional and outside the required core contract

### Slice 2: runtime state machine

- implement session start, resume, message ingestion, effect waiting, completion, and failure transitions
- implement stable lifecycle and status output emission
- ensure effect correlation is explicit and serializable

### Slice 3: snapshot and observability references

- implement snapshot creation and restoration
- keep snapshots minimal and continuation-oriented
- represent observability logs through opaque references or checkpoints, not embedded provider-specific persistence details

### Slice 4: synthetic-host testing harness

- add tests that drive the runtime exclusively through protocol inputs and synthetic effect results
- verify success, denial, failure, awaiting-effect, and restore/resume flows
- verify that no direct shell, filesystem, terminal, or network ownership is required in the core layer

## Impact

Affected code areas will likely include:

- new or revised protocol type modules
- runtime state and runner modules
- snapshot/serialization helpers
- Phase 1 unit tests for state progression and effect handling

Expected impact:

- the repo gets a real host-neutral runtime artifact rather than only planning files
- the future CLI host can be built on top of an explicit contract instead of embedding orchestration in the UI layer
- later provider and host work can integrate against stable runtime behavior

## Reffy References

- `pppr_sans_io_neutral_host.md` - source rationale for effect-mediated host work and host-neutral runtime structure
- `pppr_abstraction_shift.md` - source rationale for treating protocols and capability boundaries as the primary design layer
