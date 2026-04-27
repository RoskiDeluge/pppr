# pppr-ir-core Specification

## Purpose
TBD - created by archiving change refactor-pppr-as-agentic-ir. Update Purpose after archive.

## Requirements
### Requirement: `pppr` SHALL be defined as an intermediate representation layer

`pppr` SHALL be specified as a durable representation layer for agentic work rather than as a standalone harness or host bridge.

#### Scenario: planning defines the core identity

- **GIVEN** a planning artifact or implementation proposal for `pppr`
- **WHEN** it describes the purpose of the system
- **THEN** it MUST describe `pppr` as owning representational concerns such as intent, task structure, state, transitions, handoff semantics, or replayable artifacts
- **AND** it MUST NOT require `pppr` itself to be the enclosing agentic harness
### Requirement: host execution concerns SHALL remain outside the `pppr` core identity

Shell execution, local process management, transport, pod lifecycle, and host-specific tool surfaces SHALL be treated as adapter concerns unless a requirement explicitly places them in the core.

#### Scenario: evaluating a new feature

- **GIVEN** a proposed new `pppr` capability
- **WHEN** that capability is specific to one host or runtime substrate
- **THEN** the default planning outcome MUST place it at the adapter edge rather than in the core `pppr` identity
### Requirement: inherited `pi` structure SHALL require positive justification

Inherited packages, workflows, module boundaries, and runtime assumptions from `pi` SHALL NOT be preserved by default.

#### Scenario: auditing inherited repo structure

- **GIVEN** an inherited package, script, or subsystem from `pi`
- **WHEN** maintainers evaluate whether it remains part of `pppr`
- **THEN** the burden of proof is to show that it directly protects the `pppr` intermediate representation contract or a deliberately thin host adapter
- **AND** otherwise it SHOULD be moved, quarantined, or deleted
### Requirement: `pppr` MAY collapse to a minimal TypeScript implementation

The implementation MAY collapse to a single TypeScript file or another very small code shape if that is sufficient to expose the `pppr` intermediate representation contract cleanly.

#### Scenario: selecting an implementation shape

- **GIVEN** maintainers are choosing between preserving inherited multi-package structure and collapsing the implementation
- **WHEN** a smaller implementation satisfies the required `pppr` contract
- **THEN** the smaller implementation SHOULD be preferred
- **AND** preserving larger inherited structure is NOT required
