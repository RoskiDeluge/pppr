# `pppr` Phase 1 Runtime Implementation Specification Delta

## ADDED Requirements

### Requirement: `pppr` shall implement the approved Phase 1 protocol types

The system shall implement the protocol types required by the approved Phase 1 runtime contract, including inputs, outputs, effect requests, effect results, snapshots, lifecycle values, and assistant output segments.

#### Scenario: consuming the runtime protocol from code
- **WHEN** maintainers implement or test the Phase 1 runtime
- **THEN** they can import concrete protocol types from code
- **AND** those types do not require direct dependency on CLI or provider-specific modules

### Requirement: `pppr` shall implement a host-neutral runtime state machine for Phase 1

The system shall implement a host-neutral runtime state machine that can start, resume, accept user input, emit effect requests, consume effect results, and emit lifecycle outputs according to the approved Phase 1 protocol.

#### Scenario: advancing a session through the runtime
- **WHEN** a caller drives the runtime through protocol inputs
- **THEN** the runtime advances through the approved lifecycle states and output events
- **AND** it does so without directly owning shell, filesystem, network, or terminal behavior

### Requirement: `pppr` shall implement snapshot serialization and restoration for Phase 1

The system shall implement snapshot serialization and restoration consistent with the approved Phase 1 snapshot categories, including opaque observability references and resumable effect state.

#### Scenario: restoring a previously serialized runtime state
- **WHEN** a caller restores a snapshot into the Phase 1 runtime
- **THEN** the runtime can resume from that snapshot with preserved lifecycle and effect-correlation state
- **AND** the snapshot does not require backend-specific persistence details

### Requirement: `pppr` shall implement the approved Phase 1 effect-kind surface

The system shall implement the approved Phase 1 effect-kind surface so the runtime can emit and consume requests/results for content access, command execution, model inference, session persistence, and log operations.

#### Scenario: emitting a Phase 1 effect request
- **WHEN** the runtime requires host-mediated work
- **THEN** it emits an implemented Phase 1 effect kind with the approved envelope and payload shape
- **AND** later result ingestion uses the same correlation and outcome contract

### Requirement: `pppr` shall verify the runtime through synthetic-host tests

The system shall verify the Phase 1 runtime through tests that drive it exclusively through protocol inputs and synthetic effect results rather than direct shell, filesystem, terminal, or network ownership.

#### Scenario: testing the Phase 1 runtime
- **WHEN** maintainers run the Phase 1 runtime tests
- **THEN** the tests cover start, progress, effect wait, success, denial, failure, and restore/resume flows
- **AND** they validate the runtime through the protocol boundary rather than hidden host integrations
