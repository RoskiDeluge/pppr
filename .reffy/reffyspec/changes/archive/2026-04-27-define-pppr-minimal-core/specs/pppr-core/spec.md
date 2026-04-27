# `pppr` Core Specification Delta

## ADDED Requirements

### Requirement: `pppr` shall be defined as a minimal host-neutral coding agent harness

The system shall define `pppr` as a general-purpose coding agent harness with a host-neutral core whose first concrete interaction surface may be the command line interface.

#### Scenario: establishing the initial product boundary
- **WHEN** maintainers define the first `pppr` implementation scope
- **THEN** the core is defined independently of direct terminal or shell ownership
- **AND** the CLI may be treated as the first user-facing host without becoming the architectural center

### Requirement: `pppr` shall preserve a minimal visible operating contract

The system shall provide an operating contract that remains small enough for a user to inspect directly, including the effective system prompt, the default tool surface, and the applicable local instruction files.

#### Scenario: inspecting default behavior
- **WHEN** a user wants to understand what behavior the harness is enforcing
- **THEN** the user can inspect a concise prompt and tool contract
- **AND** the behavior is not primarily defined by hidden orchestration or broad undocumented injections

### Requirement: `pppr` shall define explicit non-goals for the minimal v1 scope

The system shall define explicit non-goals for the initial `pppr` scope so the MVP boundary is protected from accidental inheritance and premature platform expansion.

#### Scenario: evaluating additional inherited or speculative features
- **WHEN** maintainers evaluate a capability inherited from `pi` or proposed for future hosts
- **THEN** they can compare it against explicit v1 non-goals
- **AND** features outside the minimal boundary are deferred unless a later change approves them

### Requirement: `pppr` shall provide a minimal default toolset

The system shall define the default mutable toolset as `read`, `edit`, `write`, and `bash`.

#### Scenario: selecting the default v1 tool contract
- **WHEN** the initial `pppr` tool surface is configured
- **THEN** the default mutable tools are limited to `read`, `edit`, `write`, and `bash`
- **AND** additional built-in tools are treated as optional future scope rather than required baseline behavior

### Requirement: `pppr` shall express host work through explicit effect boundaries

The system shall require host actions to cross an explicit boundary between the core runtime and host capability fulfillment.

#### Scenario: fulfilling a host action
- **WHEN** the core needs a command, content, persistence, or other host-mediated action
- **THEN** that need is represented through an explicit effect-oriented contract
- **AND** the host fulfills it outside the core runtime

### Requirement: `pppr` shall support hierarchical local instruction loading

The system shall support loading local instruction files in a hierarchical manner so project-specific guidance can refine broader defaults without requiring protocol-heavy integration layers.

#### Scenario: applying project-local guidance
- **WHEN** `pppr` runs inside a project with local instructions
- **THEN** the harness loads those instructions as part of the active context contract
- **AND** the instruction-loading model remains compatible with future host environments that wrap the CLI

### Requirement: `pppr` shall define explicit session continuation behavior

The system shall make session continuation behavior explicit enough that users and future hosts can understand whether a session is resumed, restarted, or forked from prior state.

#### Scenario: continuing prior work
- **WHEN** a user or host resumes a previous `pppr` session
- **THEN** the continuation mode is explicit in the harness behavior and session model
- **AND** session state reuse is not left to implicit host-side convention

### Requirement: `pppr` shall keep session activity observable

The system shall preserve observable records of session behavior, including model-visible exchanges and user-visible tool activity, so operators can inspect what the harness did.

#### Scenario: auditing a prior session
- **WHEN** a user reviews an earlier `pppr` session
- **THEN** the session contains enough transcript and event information to understand the agent's visible decisions and actions
- **AND** the format supports later reuse by alternate interfaces or post-processing tools

### Requirement: `pppr` shall define a first-host interaction model without making it architectural law

The system shall define the expected behavior of the first interactive host while keeping those interaction details outside the core architectural contract.

#### Scenario: implementing the first interactive host
- **WHEN** maintainers build the first `pppr` host
- **THEN** it supports interactive request handling, visible tool progress, and local capability fulfillment
- **AND** those host behaviors do not require the core runtime to own terminal-specific mechanics

### Requirement: `pppr` shall prefer synchronous execution in the first host

The system shall prefer synchronous command execution and composition with host tools instead of built-in background orchestration for the initial host implementation.

#### Scenario: handling longer-running workflows
- **WHEN** a workflow requires process management beyond a single synchronous command
- **THEN** the initial `pppr` design prefers composition with external host tools such as terminal multiplexers
- **AND** background process supervision is not required for the minimal v1 scope

### Requirement: `pppr` shall selectively reuse `pi` internals

The system shall allow reuse of `pi` internals where that reuse supports the minimal `pppr` scope, but it shall not require inheriting unrelated `pi` product surface as part of defining `pppr`.

#### Scenario: deciding whether an existing `pi` capability belongs in `pppr`
- **WHEN** maintainers evaluate an existing `pi` subsystem or feature
- **THEN** it may be reused if it supports the minimal harness scope
- **AND** it may be excluded if it primarily represents broader product surface rather than core harness requirements
