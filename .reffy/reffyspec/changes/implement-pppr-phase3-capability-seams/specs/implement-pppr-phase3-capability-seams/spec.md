# `pppr` Phase 3 Capability Seams Specification Delta

## ADDED Requirements

### Requirement: `pppr` shall make provider contracts explicit below the host/runtime seam

The system shall define explicit provider contracts for the Phase 1 effect surface so host implementations can fulfill capability requests without making the first local provider set the implicit architecture.

#### Scenario: reading the provider boundary
- **WHEN** maintainers inspect the capability fulfillment layer
- **THEN** they can identify stable provider contracts for content, command, model, persistence, and observability work
- **AND** those contracts are readable separately from the first local provider implementations

### Requirement: `pppr` shall keep policy and approval evaluation host-owned and explicit

The system shall make policy and approval handling explicit at the host/provider boundary so effect fulfillment outcomes remain visible without moving provider policy logic into the core runtime.

#### Scenario: evaluating a request that requires host approval
- **WHEN** a host or provider determines that a request needs approval or must be denied
- **THEN** that decision is expressed through explicit host/provider evaluation and normalized effect outcomes
- **AND** the runtime continues to consume only approved request metadata and normalized effect results

### Requirement: `pppr` shall normalize provider outcomes before they re-enter the runtime

The system shall normalize provider outcomes into approved effect-result semantics before those outcomes are sent back through the runtime protocol.

#### Scenario: handling heterogeneous provider behavior
- **WHEN** different provider implementations return different local success, denial, or failure details
- **THEN** the host normalizes those outcomes into the approved effect-result contract
- **AND** runtime progression does not depend on provider-specific side channels or ad hoc return shapes

### Requirement: `pppr` shall preserve stable visible tool semantics across provider substitution

The system shall preserve the user-facing meaning of `read`, `edit`, `write`, and `bash` even if provider implementations or policy logic change behind the host boundary.

#### Scenario: swapping a provider implementation
- **WHEN** maintainers replace a local content, command, model, persistence, or observability provider
- **THEN** the visible tool contract remains stable at the host surface
- **AND** any semantic changes require explicit planning rather than drifting in through provider-local behavior

### Requirement: `pppr` shall verify seam integrity through provider substitution and policy-path tests

The system shall verify the Phase 3 seam by testing provider substitution and normalized policy paths rather than only testing the first local provider implementations in isolation.

#### Scenario: validating the hardened capability seam
- **WHEN** maintainers run the Phase 3 verification suite
- **THEN** the tests exercise representative provider swaps and approval/denial/failure paths
- **AND** the CLI host still advances through protocol inputs, outputs, and normalized effect results instead of provider-specific execution shortcuts
