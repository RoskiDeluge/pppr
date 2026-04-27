# implement-pppr-phase2-cli-host Specification

## Purpose
TBD - created by archiving change implement-pppr-phase2-cli-host. Update Purpose after archive.

## Requirements
### Requirement: `pppr` shall implement a first CLI host on top of the Phase 1 runtime

The system shall implement the first concrete `pppr` CLI host as a consumer of the approved Phase 1 runtime and protocol rather than as an alternate orchestration layer with independent execution semantics.

#### Scenario: starting a CLI-driven session
- **WHEN** the first `pppr` CLI host starts a new session
- **THEN** it drives the runtime through protocol inputs and consumes runtime outputs
- **AND** it does not replace the runtime as the canonical owner of session lifecycle and effect state
### Requirement: `pppr` shall fulfill visible CLI tools through host-owned effect handling

The system shall implement the visible CLI tools through host-owned effect fulfillment that maps onto the approved Phase 1 effect kinds instead of direct core execution.

#### Scenario: invoking a default CLI tool
- **WHEN** a CLI-driven session needs `read`, `edit`, `write`, or `bash`
- **THEN** the host fulfills the corresponding runtime effect request through host-owned capabilities
- **AND** the runtime continues to observe the work only through approved effect requests and results
### Requirement: `pppr` shall keep model inference, persistence, and observability host-mediated in the first host

The system shall implement the first CLI host so model inference, snapshot persistence, and observability-log handling remain below the host boundary rather than becoming internal core behavior.

#### Scenario: advancing a session through model work and continuation
- **WHEN** the runtime requires model inference or the host persists and later restores a session
- **THEN** the host fulfills those needs through the approved effect and snapshot contracts
- **AND** the core runtime does not directly acquire provider or storage ownership
### Requirement: `pppr` shall render the CLI operator experience from protocol outputs

The system shall implement the first CLI host so lifecycle changes, assistant output, and effect progress are rendered from runtime outputs rather than inferred through hidden CLI-only orchestration state.

#### Scenario: observing a running CLI session
- **WHEN** the CLI host renders a live `pppr` session
- **THEN** it renders run status, assistant-visible output, and effect progress from the runtime's structured outputs
- **AND** it preserves the minimal visible contract without redefining runtime semantics inside the renderer
### Requirement: `pppr` shall verify the first host through integration tests at the runtime seam

The system shall verify the Phase 2 host through tests that exercise the CLI host as a driver and effect-fulfillment layer around the runtime rather than bypassing the protocol boundary.

#### Scenario: testing the first CLI host
- **WHEN** maintainers run the Phase 2 host tests
- **THEN** the tests cover start, progress, effect fulfillment, resume, and completion flows through the runtime seam
- **AND** they demonstrate that the CLI host consumes the runtime contract instead of duplicating it
