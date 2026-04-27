# implement-pppr-phase4-proof-host Specification

## Purpose
TBD - created by archiving change implement-pppr-phase4-proof-host. Update Purpose after archive.

## Requirements
### Requirement: `pppr` shall implement one non-CLI proof host on top of the existing runtime and protocol

The system shall implement one non-CLI proof host that drives the approved runtime and protocol without depending on the interactive CLI as the controlling execution environment.

#### Scenario: running `pppr` outside the CLI host
- **WHEN** maintainers execute the Phase 4 proof host
- **THEN** it starts, resumes, fulfills effects, and completes sessions through the same protocol contract used by the CLI host
- **AND** it does not require terminal interaction or CLI-local orchestration state for correctness
### Requirement: `pppr` shall keep remote or embedded host concerns outside the core runtime

The system shall treat remote invocation, transport, addressing, workspace ownership, persistence, observability, model access, and capability routing as host concerns even when the host is embedded or distributed.

#### Scenario: hosting `pppr` in a remote or embedded substrate
- **WHEN** a non-CLI host runs `pppr` inside a remote or embedded environment
- **THEN** those environment-specific concerns remain below the host boundary
- **AND** the core runtime continues to observe only protocol events, effect requests, effect results, and snapshots
### Requirement: `pppr` shall support a `paseo`-compatible proof-host shape without depending on `paseo` internals

The system shall define a proof-host shape that is compatible with a remote actor substrate like `paseo`, while avoiding direct dependence on `paseo`-specific transport or actor primitives in the core runtime.

#### Scenario: reasoning about a `paseo`-style host
- **WHEN** maintainers evaluate whether a remote actor environment can host `pppr`
- **THEN** they can map `pppr` onto a host that owns remote workspace execution, capability fulfillment, persistence, and observability
- **AND** no `paseo`-specific exception is required in the runtime contract
### Requirement: `pppr` shall verify host-neutrality by comparing CLI-host and proof-host execution at the protocol seam

The system shall verify host-neutrality through tests or proof scenarios that show both the CLI host and the proof host consuming the same runtime boundary.

#### Scenario: validating the Phase 4 proof
- **WHEN** maintainers run the Phase 4 verification suite
- **THEN** they can observe equivalent runtime progression under both hosts at the protocol seam
- **AND** the proof demonstrates that no CLI-only hidden state is required for runtime execution
