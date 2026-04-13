# Proposal: implement `pppr` Phase 4 proof host

## Why

The repo now has the first three MVP layers in place:

- `define-pppr-minimal-core` defines the product boundary
- `define-pppr-runtime-protocol` defines the Phase 1 runtime contract
- `implement-pppr-phase1-runtime` realizes the host-neutral runtime
- `implement-pppr-phase2-cli-host` proves the first concrete CLI host
- `implement-pppr-phase3-capability-seams` hardens provider and policy seams below that host

That leaves the final MVP proof obligation from the phased plan:

- can `pppr` run in a non-CLI host without hidden terminal assumptions?
- can the host/runtime boundary survive a remote, addressable, distributed host shape?
- can provider fulfillment, persistence, and observability remain host-owned even when the host is not a local interactive shell?

The `paseo` direction you described is the right kind of pressure test:

- remotely addressable micro-agents
- agent loops and MCP engines composed as actors
- host-managed workspaces, persistence, and execution inside a sandboxed remote substrate

Phase 4 should therefore plan a non-CLI proof host that is compatible with a `paseo`-style environment without making `pppr` depend on `paseo` internals. The proof should show that a distributed or embedded host can drive `pppr` through the same protocol and effect model already established for the CLI host.

## What Changes

This proposal defines the implementation plan for realizing Phase 4 of `pppr`:

- implement one non-CLI proof host on top of the existing runtime and protocol
- shape that host around remote or embedded execution rather than terminal interaction
- prove that snapshots, observability, policy, and provider fulfillment remain host-owned
- verify that the same runtime can run without CLI-local state, rendering assumptions, or direct shell ownership
- explore a `paseo`-compatible host shape where `pppr` is hosted by a remote actor substrate rather than embedded into the core

The proof host should be intentionally small. It does not need to become a new product surface. Its purpose is to validate host-neutrality under a remote or embedded execution model.

## Implementation Slices

### Slice 1: proof-host contract and module boundary

- define the non-CLI proof-host boundary
- choose a host form such as:
  - a headless embedded harness
  - a replay-oriented host
  - a remote actor-style host adapter
- ensure the host drives the runtime only through protocol inputs and outputs

### Slice 2: remote or embedded host execution loop

- implement a host loop that can:
  - start and resume sessions
  - fulfill effect requests
  - persist snapshots and logs
  - expose progress and completion without terminal rendering assumptions
- make host addressing and transport concerns stay outside the runtime

### Slice 3: `paseo`-compatible host shape

- define a proof-host shape that could be hosted by a `paseo`-like actor system
- treat remote workspace execution, model access, persistence, and MCP-style capability fulfillment as host concerns
- verify that `pppr` remains unaware of whether the host is local CLI, embedded process, or remote actor runtime

### Slice 4: host-neutrality verification

- add tests or proof scenarios that run the same runtime through the non-CLI host
- verify resume, replay, or embedded invocation flows
- verify that no CLI-only hidden state or terminal-specific shortcut is required

## Impact

Affected code areas will likely include:

- a new non-CLI proof-host module under `packages/coding-agent/src/pppr/`
- host adapters for embedded or remote execution
- proof-host tests around remote-style continuation and effect fulfillment
- possible supporting serialization or host-driver helpers

Expected impact:

- the MVP claim of host-neutrality becomes materially demonstrated rather than inferred
- future `paseo`-style integration gets a defined architectural landing zone
- `pppr` remains a minimal runtime that can be hosted by richer remote substrates without importing those substrates into the core

## Reffy References

- `pppr_sans_io_neutral_host.md` - source rationale for host-neutral execution and effect-mediated host work
- `pppr_abstraction_shift.md` - source rationale for treating protocols, seams, and invariants as the real architectural center
