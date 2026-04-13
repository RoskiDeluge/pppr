# Design

## Intent

The goal is to sequence implementation so `pppr` gets the architectural benefit of a sans I/O design without paying the cost of a speculative framework.

The plan therefore keeps two constraints in tension:

- the architecture must move the core away from direct ownership of host I/O
- the MVP must remain small enough to ship through a single CLI-first implementation path

## Design stance

The key design choice is to treat the CLI as the first host, not the defining abstraction.

That means:

- the CLI remains the first operator experience
- the minimal four-tool contract remains the first visible workflow
- direct shell utility still matters

But:

- core runtime behavior is defined in terms of events, state transitions, and effects
- host actions are fulfilled outside the core
- portability is enforced structurally, not promised aspirationally

## Phase rationale

### Phase 1: core and protocol first

This phase exists to force the most important boundary early.

If implementation starts by wiring tools directly into the CLI again, the architecture will harden around that shortcut and later extraction will become a refactor instead of an outcome of the original design.

Phase 1 should therefore define:

- runtime-owned state
- input and output event types
- effect request and effect result schemas
- session snapshot shape
- serialization expectations needed for replay and testing

This phase should not introduce a large taxonomy of effect kinds. It only needs the smallest set required to support the first host.

### Phase 2: thin CLI host on top of the protocol

The CLI should prove the architecture, not bypass it.

The host should:

- translate terminal/user input into protocol inputs
- render runtime outputs and status events
- fulfill capability requests with local providers
- stream effect progress back into the runtime as results

The host should not:

- become a second copy of the orchestration layer
- own hidden state that the core depends on
- define alternate tool semantics that do not map to protocol effects

### Phase 3: explicit capability seams

The MVP can start with local implementations, but the contract must stay explicit.

This phase should stabilize:

- capability request envelopes
- provider result normalization
- policy and denial paths
- error propagation
- the mapping from user-facing tools to underlying capabilities

The point is not to support every provider class immediately. The point is to prevent the local provider set from becoming accidental core behavior.

### Phase 4: second-host proof

A second proof surface is the cheapest real test of whether the architecture is honest.

This should not become product sprawl. A headless harness or replay host is enough if it exercises the same core without requiring terminal rendering or interactive shell control.

If that proof requires large exceptions or CLI-only shortcuts, the earlier phases should be revised before broader implementation continues.

## Relationship to the existing minimal-core proposal

The older `define-pppr-minimal-core` change remains useful for preserving:

- the small visible contract
- observability
- instruction loading
- synchronous execution as the initial operational preference

This proposal refines, rather than discards, those constraints by relocating them:

- from core-defining assumptions
- to first-host and first-provider assumptions

## Risks

### Risk: abstraction inflation

Mitigation:

- keep the protocol small
- only add effect kinds needed by the current phase
- do not add host adapters beyond the CLI and one proof surface during MVP

### Risk: fake portability

Mitigation:

- require the CLI to consume the same effect protocol the core emits
- require a second proof surface before declaring the architecture stable

### Risk: local-provider leakage into core behavior

Mitigation:

- keep capability/provider interfaces explicit
- preserve policy and denial outcomes in protocol results
- test the core against mocked effect fulfillment

## Reffy Inputs

- `pppr_sans_io_neutral_host.md`
- `pppr_abstraction_shift.md`
