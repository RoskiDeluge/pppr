# Proposal: implement `pppr` Phase 2 CLI host

## Why

The repo now has a concrete Phase 1 runtime artifact:

- `define-pppr-minimal-core` defines the product boundary
- `define-pppr-runtime-protocol` defines the Phase 1 runtime contract
- `implement-pppr-phase1-runtime` turns that contract into code

That leaves the next MVP question:

- how does one concrete host actually drive the runtime?
- how are host capabilities fulfilled without collapsing the core boundary?
- how does the first user-facing `read` / `edit` / `write` / `bash` experience map onto the new effect model?

The next step should therefore not be more core work. It should be the first host integration layer that proves the runtime contract is usable in a real CLI flow.

## What Changes

This proposal defines the implementation plan for realizing Phase 2 of `pppr`:

- build a thin CLI host adapter on top of the Phase 1 runtime and protocol
- translate interactive CLI inputs into runtime protocol events
- fulfill runtime effect requests through host-owned local capability providers
- render lifecycle, assistant output, and tool progress from runtime outputs instead of hidden CLI-only orchestration
- persist snapshots and observability references at the host boundary

The first implementation should prove that the CLI is a consumer of the runtime contract, not its replacement. It should keep terminal concerns, provider concerns, and persistence concerns outside the core.

## Implementation Slices

### Slice 1: CLI host runtime bridge

- define the host-owned loop that starts, resumes, advances, and stops the Phase 1 runtime
- map interactive user actions into protocol inputs
- consume runtime outputs for host rendering and effect dispatch

### Slice 2: tool and capability fulfillment

- map `read`, `edit`, `write`, and `bash` onto the approved effect kinds
- fulfill requests through host-owned providers for content access, patch application, and command execution
- keep model inference fulfillment host-owned as well

### Slice 3: host observability and continuation

- persist snapshots through the host-owned persistence path
- append and resolve observability logs through host-managed references
- preserve explicit continuation behavior for new, resumed, and forked sessions

### Slice 4: CLI-visible operator experience

- render assistant output, lifecycle state, and effect progress from protocol outputs
- preserve the small visible contract from the earlier `pppr` changes
- keep the first host operationally synchronous unless a concrete requirement forces otherwise

## Impact

Affected code areas will likely include:

- CLI/session runner modules
- host-owned effect-fulfillment modules
- instruction-loading and prompt assembly entrypoints
- host persistence and log-reference adapters
- Phase 2 integration tests around the runtime/host seam

Expected impact:

- `pppr` gets its first real host built on top of the new runtime contract
- the minimal tool surface becomes usable without moving execution back into the core
- later non-CLI hosts can reuse the same runtime and effect model rather than forking CLI orchestration

## Reffy References

- `pppr_sans_io_neutral_host.md` - source rationale for keeping host I/O outside the core and making effect fulfillment explicit
- `pppr_abstraction_shift.md` - source rationale for treating protocol and capability seams as the primary architectural layer
