# Design

## Intent

This change exists to harden the boundary that Phase 2 proved only in a first local form.

Phase 2 established that the CLI can drive the runtime through protocol events and fulfill effects through host-owned providers. That is enough to prove the architectural direction, but not enough to stabilize it. Without a Phase 3 pass, the first local provider set can quietly become the real contract.

## Design stance

The capability seam must become more explicit than the first implementation required.

That means:

- effect kinds remain the protocol-level unit of host work
- provider contracts remain host-owned, not core-owned
- provider implementations become replaceable behind explicit interfaces
- normalization of provider outcomes becomes a deliberate layer rather than incidental control flow

This phase is not about adding more capabilities. It is about keeping the existing ones honest.

## Delivery shape

### Stage 1: provider boundary extraction

Deliver:

- stable provider interfaces for:
  - content access and mutation
  - command execution
  - model inference
  - snapshot persistence
  - observability log append and resolve
- a host-facing composition point that wires those providers into effect fulfillment without collapsing them back into one ad hoc module

Constraints:

- the contracts should follow Phase 1 effect shapes closely enough that translation remains small
- provider interfaces should not require CLI-only concepts such as terminal rendering state or parsed argv objects
- local implementations may stay in-process for now, but the interface shape should not assume that

### Stage 2: explicit policy handling

Deliver:

- a policy/approval evaluation point ahead of provider execution
- a normalized way to express:
  - approval required
  - denied by policy
  - execution failure
  - execution success
- explicit propagation of optional policy metadata and denial/failure details

Constraints:

- the runtime still only sees normalized effect results and optional request policy metadata
- policy decisions remain host/provider concerns, not new runtime state machinery
- provider-specific denial reasons may be preserved as details, but not as required protocol fields

### Stage 3: stable visible tool semantics

Deliver:

- a stable mapping layer from visible tools to capability requests
- tests that prove the visible contract survives provider substitution
- explicit separation between:
  - visible tool meaning
  - capability request shape
  - provider implementation detail

Constraints:

- changing a provider implementation must not silently change the user-facing meaning of `read`, `edit`, `write`, or `bash`
- tool semantics may still evolve later, but only through explicit spec work rather than provider-local drift

### Stage 4: substitution-oriented verification

Deliver:

- integration tests with at least two provider behaviors behind one contract for representative effect kinds
- policy-path coverage for approval-required, denied, and failed outcomes
- assertions that the CLI host still progresses exclusively through protocol inputs, outputs, and normalized effect results

Constraints:

- the tests should prove seam integrity, not just raw local provider functionality
- this phase should not introduce the second host yet; it should prepare for that host by making provider replacement safe

## Suggested work order

1. Extract provider interfaces and composition boundaries from the current local fulfillment layer.
2. Introduce explicit host policy evaluation and normalized decision paths.
3. Refactor effect normalization into a reusable boundary layer.
4. Add provider substitution and policy-path tests.
5. Reconfirm alignment with the core, runtime protocol, and phased MVP changes.

## Verification expectations

Before this change is considered complete, implementation should demonstrate:

- provider contracts are explicit and separately readable from local provider implementations
- policy and approval paths are normalized consistently across representative effect kinds
- the visible tool contract remains stable across provider substitutions
- the CLI host still consumes normalized effect results rather than provider-specific side channels

## Risks

### Risk: abstraction inflation

Mitigation:

- keep the provider set limited to the approved Phase 1 effect surface
- avoid inventing new provider categories unless the current effect kinds require them
- keep translation layers thin and close to existing protocol payloads

### Risk: fake provider neutrality

Mitigation:

- test at least one swapped provider path rather than trusting interface names
- keep local provider specifics out of required contracts
- ensure denial and failure behavior is verified at the normalized result layer

### Risk: policy logic recentralizes hidden orchestration

Mitigation:

- keep policy evaluation explicit and host-owned
- require normalized outcomes to pass back through the existing protocol seam
- avoid adding new hidden execution state outside runtime snapshots and host-local ephemeral flow
