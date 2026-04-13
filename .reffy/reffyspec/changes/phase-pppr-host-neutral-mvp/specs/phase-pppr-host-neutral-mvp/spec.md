# `pppr` Host-Neutral MVP Specification Delta

## ADDED Requirements

### Requirement: `pppr` shall sequence MVP work around a host-neutral runtime first

The system shall treat the pure runtime and protocol boundary as the first implementation phase of the MVP instead of treating the CLI as the architectural root.

#### Scenario: planning implementation order
- **WHEN** maintainers sequence the first `pppr` implementation work
- **THEN** they define the runtime state and protocol boundary before depending on CLI-specific execution paths
- **AND** the CLI is implemented as a host on top of that boundary

### Requirement: `pppr` shall represent host actions as effect requests and results

The system shall model host-mediated work through explicit effect requests and effect results rather than allowing the core runtime to directly perform host I/O.

#### Scenario: requesting command execution
- **WHEN** the runtime needs a shell command to be executed
- **THEN** it emits a structured effect request describing that need
- **AND** the host returns a structured effect result that the runtime consumes

### Requirement: `pppr` shall preserve the minimal visible tool contract in the first CLI host

The first CLI host shall preserve a small user-facing tool contract centered on `read`, `edit`, `write`, and `bash`, while fulfilling those tools through host capability providers.

#### Scenario: using the first default tool surface
- **WHEN** a user runs the initial `pppr` CLI host
- **THEN** the visible mutable toolset remains limited to `read`, `edit`, `write`, and `bash`
- **AND** those tools map to explicit host-mediated capabilities instead of direct core-owned I/O

### Requirement: `pppr` shall keep capability contracts distinct from host implementations

The system shall define capability and provider boundaries explicitly enough that local provider implementations can change without redefining core runtime semantics.

#### Scenario: swapping or revising a local provider
- **WHEN** maintainers replace or refine a local command, persistence, model, or content provider
- **THEN** the core runtime contract remains stable
- **AND** behavior changes are expressed through provider results and policy decisions rather than hidden core changes

### Requirement: `pppr` shall prove the architecture with at least one non-CLI execution path

The MVP plan shall include at least one secondary proof surface that exercises the same core and protocol without depending on the interactive CLI.

#### Scenario: validating host-neutrality
- **WHEN** maintainers assess whether the architecture is genuinely host-neutral
- **THEN** they can run the same core through a non-CLI proof host such as a replay, embedded, or headless harness
- **AND** core execution does not require hidden CLI-only state
