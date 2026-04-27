# Proposal: phase `pppr` host-neutral MVP

## Why

The active `define-pppr-minimal-core` change now captures the right baseline constraints:

- `pppr` should have a host-neutral core
- the visible contract should stay small
- observability and explicit seams should remain protected

The newer Reffy artifacts add the next planning requirement:

- `pppr` should be a host-neutral runtime rather than a terminal-defined app
- the core should evolve state and request effects instead of directly performing host I/O
- the first concrete host should prove the architecture without defining it

Before implementation starts, the repo needs a phased plan that turns those constraints into build order and implementation checkpoints.

## What Changes

This proposal defines a phased MVP plan for building `pppr` as a minimal host-neutral runtime with one concrete first-host rollout.

The plan establishes four phases:

### Phase 1: define the pure runtime boundary

- create `pppr-core` as the stateful but host-neutral runtime
- create `pppr-protocol` for inputs, outputs, effect requests, effect results, and snapshots
- define the runtime loop around state transitions and explicit effect boundaries
- keep the protocol intentionally small and biased toward deterministic testing

### Phase 2: ship the first concrete CLI host

- build a thin CLI host adapter on top of the core and protocol
- preserve the minimal visible contract from earlier `pppr` planning
- expose the default user-facing tools `read`, `edit`, `write`, and `bash`
- route those tools through host-mediated capability fulfillment rather than direct core execution
- preserve observability, session replay potential, and hierarchical instruction loading

### Phase 3: harden capability seams

- separate capability contracts from host implementation details
- define local providers for command execution, content access, patch application, model inference, and persistence
- make approval, policy, and execution outcomes explicit in effect results
- ensure the first local implementation does not collapse the boundary between core and host

### Phase 4: prove the architecture with one non-CLI harness path

- add one secondary proof surface that is not the interactive CLI
- acceptable proofs include a headless test host, replay host, or embedded programmatic host
- use that second surface to validate that the protocol and effect model are real architectural seams rather than renamed CLI internals

## Impact

Affected planning areas:

- `pppr` runtime architecture
- protocol and event model
- CLI host shape
- capability/provider boundaries
- sequencing of implementation work

Expected impact:

- implementation can stay minimal without locking the system to terminal-first assumptions
- the existing minimal tool contract survives as a user-facing baseline
- future hosts become downstream consumers of a real core instead of ports of a terminal-defined application
- review can distinguish MVP-essential abstractions from speculative framework work

## Reffy References

- `pppr_sans_io_neutral_host.md` - defines the core thesis that `pppr` should be host-neutral and structured around effect requests instead of direct host I/O
- `pppr_abstraction_shift.md` - clarifies the broader move from substrate-centered design to protocol, capability, and invariant-centered design
