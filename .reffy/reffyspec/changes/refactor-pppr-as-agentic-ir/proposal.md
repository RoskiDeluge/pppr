# Proposal: refactor `pppr` as an agentic intermediate representation

## Why

The current `pppr` repo is still structurally dominated by inherited `pi` assumptions:

- monorepo package boundaries shaped around `pi`
- runtime expectations shaped around being a harness
- CLI and host execution concerns treated as central
- local execution mechanics treated as part of product identity

The newer Reffy artifact establishes a different direction:

- `pppr` should be an intermediate representation between human or agent intent and any enclosing agentic harness
- `pppr` should not itself be defined as the harness
- `pppr` should not inherit host-bridge or local-runtime assumptions by default

That reframing is stronger than the current phased host-neutral plans. Those plans moved in the right direction, but they still assume a multi-phase runtime architecture descended from a `pi`-like harness. We now need a refactor plan that starts from the higher-level abstraction and only keeps implementation shape that protects that abstraction.

## What Changes

This proposal defines a full refactor plan for `pppr` around one governing principle:

`pppr` is the durable representation layer for agentic work, not a minimal harness and not a host bridge.`

The plan establishes the following:

1. `pppr` core identity
- `pppr` owns intent, task structure, planning state, execution metadata, transitions, handoff semantics, and replayable artifacts.
- `pppr` does not own shell execution, local process management, pod lifecycle, transport, or host-specific tool surfaces.

2. implementation simplification as a first-class goal
- the implementation should collapse aggressively if inherited `pi` structure does not protect the new abstraction
- it is acceptable for the first clean version of `pppr` to become a single TypeScript file or a tiny set of TypeScript modules
- package count, monorepo structure, and CLI surface are implementation details, not architectural requirements

3. removal of inherited `pi` assumptions
- `pppr` should not preserve `pi` packages, adapters, workflows, or UX solely because they already exist
- inherited code should survive only if it directly serves the IR layer or a deliberately thin Node-host adapter
- `pi` runtime assumptions should be treated as migration liabilities until proven otherwise

4. adapter-at-the-edge architecture
- any Node/CLI host should be treated as a consumer of `pppr`, not the thing that defines it
- host adapters may perform model calls, file access, command execution, persistence, and transport, but those concerns should remain outside the representational core

5. refactor sequencing
- first define the minimum IR contract
- then identify the smallest Node host adapter needed to exercise it
- then remove or quarantine inherited `pi` surfaces that no longer belong
- only then decide whether any larger modularization is justified

## Impact

Affected planning areas:

- repo architecture and package layout
- `pppr` core/runtime identity
- Node host boundary
- CLI scope
- migration and deletion strategy for inherited `pi` code

Expected impact:

- `pppr` can be reduced to the minimum implementation that actually matches its intended abstraction
- unnecessary `pi` monorepo structure can be removed without guilt
- future harnesses can embed `pppr` as a representation layer instead of porting a CLI-shaped runtime
- implementation decisions become easier to evaluate: keep only what serves the IR contract

## Reffy References

- `pppr_as_intermediate_representation.md` - establishes the new architectural center: `pppr` as an intermediate representation rather than a harness or host bridge
- `pppr_abstraction_shift.md` - earlier articulation of the move from host/substrate-centered design toward protocol, capability, and invariant-centered design
