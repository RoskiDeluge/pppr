# Proposal: define `pppr` minimal core

## Why

The current repository contains `pi` packages and capabilities that solve more than the immediate `pppr` goal requires. Without an explicit spec boundary, adapting `pi` into `pppr` risks becoming one of two incoherent efforts:

- a shallow rename of `pi` with accidental feature inheritance
- a sprawling redesign driven by future runtime hosts without preserving an MVP boundary

Both outcomes work against the stated intent for `pppr`: a small, observable, predictable coding agent harness with a minimal visible contract and explicit architectural seams.

The purpose of this proposal is to define the initial product and architecture boundary for `pppr` before implementation work starts.

## What Changes

This proposal defines `pppr` as a minimal general-purpose coding agent harness with a host-neutral core and a deliberately small first visible contract. It may selectively reuse `pi` internals without inheriting unnecessary product surface.

The change establishes these required v1 characteristics:

- a minimal visible system prompt contract
- a minimal default toolset: `read`, `edit`, `write`, `bash`
- hierarchical local instruction loading
- observable session and event logging
- explicit host-mediated effect boundaries
- synchronous command execution as the first host preference
- explicit session continuation behavior

The change also establishes these scope constraints:

- `pppr` is not required to reach feature parity with `pi`
- the CLI may be the first host, but it is not the architectural center of the system
- future runtime hosts such as a custom Rust shell or Tauri terminal remain downstream consumers until the core boundary is proven
- broad provider compatibility, custom TUI work, MCP support, built-in planning systems, and sub-agent orchestration are outside the minimal v1 scope

The change also makes these non-goals explicit:

- defining the full runtime protocol for every effect kind
- supporting multiple first-class hosts in the initial implementation
- preserving `pi` UX or orchestration layers that do not protect the minimal `pppr` contract
- treating transport abstraction or embedding flexibility as more important than a small understandable MVP

## Impact

This proposal does not implement `pppr`, but it creates the planning baseline for subsequent implementation work.

Expected impact:

- later implementation work can evaluate `pi` subsystems against an explicit minimal-core boundary
- future proposals can extend `pppr` deliberately instead of inheriting existing `pi` surface accidentally
- the visible contract and observability remain protected without forcing CLI-first architecture
- host-neutral core boundaries become part of the baseline rather than deferred cleanup
- the first implementation-oriented change can focus on the core/protocol seam instead of reopening product-boundary questions

## Reffy References
- `what_i_learned.md` - source philosophy and constraints from Zechner's explanation of why `pi` was built the way it was
- `pppr_minimal_harness.md` - exploration of what to preserve from `pi`, what to exclude, and the proposed minimal v1 shape
- `pppr_sans_io_neutral_host.md` - defines the shift toward host-neutral runtime structure and effect-mediated host work
- `pppr_abstraction_shift.md` - explains the move from substrate-centered design to protocol and capability-centered design
