# define-pppr-runtime-protocol Specification

## Purpose
TBD - created by archiving change define-pppr-runtime-protocol. Update Purpose after archive.

## Requirements
### Requirement: `pppr` shall define a minimum runtime-owned session state

The system shall define a host-neutral runtime state model containing the minimum serializable session state required to advance, pause, resume, and inspect a `pppr` session without depending on host-specific live objects.

#### Scenario: resuming a prior session
- **WHEN** a host restores a previous `pppr` session
- **THEN** the runtime can resume from serializable state owned by the core
- **AND** essential execution state is not stored only in terminal, filesystem, process, or provider handles
### Requirement: `pppr` shall define a minimum protocol for runtime inputs and outputs

The system shall define a minimum set of protocol inputs and outputs sufficient for a host to drive the runtime and consume its visible results without depending on terminal-specific behavior.

#### Scenario: driving the runtime from a host
- **WHEN** a host starts or continues a `pppr` session
- **THEN** it can send structured protocol inputs into the runtime
- **AND** it can consume structured runtime outputs for rendering, logging, or orchestration
### Requirement: `pppr` shall define common event envelopes for protocol inputs and outputs

The system shall define common event envelopes for protocol inputs and outputs so hosts and runtime implementations can exchange structured events consistently across event kinds.

#### Scenario: exchanging protocol events
- **WHEN** a host sends an input event or receives an output event
- **THEN** the event includes stable envelope fields for identity, session ownership, kind, timestamp, and payload
- **AND** event-specific data remains inside structured payload fields rather than ad hoc top-level shapes
### Requirement: `pppr` shall define category-shaped payloads for lifecycle and status outputs

The system shall define category-shaped payloads for lifecycle and status output events so hosts can observe runtime progress, waiting states, completion, and failure without depending on terminal-specific side effects.

#### Scenario: observing lifecycle transitions
- **WHEN** the runtime emits `run.started`, `status.changed`, `run.completed`, or `run.failed`
- **THEN** each event carries stable payload categories such as run identity, lifecycle state, transition reason, and optional request correlation
- **AND** hosts do not need to infer lifecycle meaning from free-form text or renderer-specific behavior
### Requirement: `pppr` shall define a minimum lifecycle state vocabulary for Phase 1

The system shall define a minimum lifecycle state vocabulary for Phase 1 sufficient to express idle, active execution, waiting on host work, successful stop, and failure.

#### Scenario: reporting runtime state
- **WHEN** the runtime reports its current lifecycle state
- **THEN** the reported state uses the Phase 1 lifecycle vocabulary
- **AND** hosts can distinguish running, awaiting-effect, stopped, and failed conditions without provider-specific interpretation
### Requirement: `pppr` shall keep assistant output in a single Phase 1 event kind

The system shall keep assistant-visible output in a single `message.assistant` output event kind in Phase 1, with structured segments contained inside the event payload rather than split across multiple top-level output event kinds.

#### Scenario: emitting assistant-visible output in the first protocol cut
- **WHEN** the runtime emits assistant-visible output
- **THEN** it uses the `message.assistant` event kind
- **AND** any distinctions between text and other assistant-visible content forms remain inside structured payload segments
### Requirement: `pppr` shall define structured payload categories for `message.assistant`

The system shall define structured payload categories for `message.assistant` so assistant-visible output remains one event kind while still carrying multiple content forms in a stable way.

#### Scenario: encoding assistant-visible output segments
- **WHEN** the runtime emits a `message.assistant` event
- **THEN** the payload contains structured segments such as text, optional thinking, optional tool intent, or artifact references
- **AND** those segment categories remain protocol-level concepts rather than provider-specific output blobs
### Requirement: `pppr` shall express host-mediated work through effect requests and results

The system shall define a common effect request and effect result contract for host-mediated work so the runtime can ask for work and consume outcomes without directly performing host I/O.

#### Scenario: requesting and completing host work
- **WHEN** the runtime requires a host-mediated action
- **THEN** it emits a structured effect request
- **AND** the host responds with a structured effect result describing success, denial, or failure
### Requirement: `pppr` shall define common envelopes for effect requests and effect results

The system shall define common envelopes for effect requests and effect results so every Phase 1 effect kind can share correlation, lifecycle, and observability fields.

#### Scenario: correlating effect work across the core and host
- **WHEN** the runtime emits an effect request and later receives an effect result
- **THEN** the request and result can be correlated through stable identifiers and shared envelope structure
- **AND** effect-specific data remains in structured payloads rather than bespoke transport contracts
### Requirement: `pppr` shall define category-shaped payloads for Phase 1 effect kinds

The system shall define request and result payloads for each Phase 1 effect kind at the category level so the runtime can consume stable data shapes without depending on provider-specific blobs.

#### Scenario: handling a Phase 1 effect kind
- **WHEN** a host fulfills a Phase 1 effect such as content read, command execution, model inference, or log resolution
- **THEN** the request and result payloads follow category-shaped protocol fields appropriate to that effect kind
- **AND** provider-specific metadata remains optional and outside the core-required payload categories
### Requirement: `pppr` shall treat model inference as a host-mediated effect

The system shall treat model inference as part of the host-mediated effect layer in the initial protocol cut rather than as an internal core dependency.

#### Scenario: requesting model work
- **WHEN** the runtime needs model inference to advance a session
- **THEN** it emits a structured model-inference effect request
- **AND** the host returns a structured effect result containing the model outcome or failure state
### Requirement: `pppr` shall define the smallest initial effect kinds needed for the first host

The system shall define only the minimum initial effect kinds required to support the first host, the minimal tool contract, instruction loading, and session persistence or observability.

#### Scenario: scoping the first protocol cut
- **WHEN** maintainers decide which effect kinds belong in Phase 1
- **THEN** they include only the kinds needed for the first MVP host and baseline tool surface
- **AND** they defer broader capability taxonomies until a later change requires them
### Requirement: `pppr` shall define a concrete initial set of Phase 1 effect kinds

The system shall define a concrete initial set of Phase 1 effect kinds sufficient for the first host, minimal tool surface, continuation behavior, and host-managed observability.

#### Scenario: enumerating the first protocol effect kinds
- **WHEN** maintainers prepare the Phase 1 implementation target
- **THEN** the initial effect kinds include content read, content write, content patch, command execution, model inference, session persistence, log append, and log resolution
- **AND** additional effect kinds remain out of scope until a later change requires them
### Requirement: `pppr` shall support synthetic host fulfillment in core tests

The system shall define the runtime/protocol boundary so the core can be advanced and verified with synthetic protocol inputs and synthetic effect results instead of depending on direct terminal, shell, filesystem, or network access.

#### Scenario: testing the host-neutral core
- **WHEN** maintainers test the Phase 1 runtime
- **THEN** they can drive it entirely through protocol inputs and synthetic effect fulfillment
- **AND** successful tests do not require the core layer to own direct host I/O
### Requirement: `pppr` shall define a snapshot boundary for continuation and replay-oriented tooling

The system shall define a snapshot or equivalent serialization boundary that preserves enough session state to support explicit continuation behavior and replay-oriented inspection.

#### Scenario: restoring serialized runtime state
- **WHEN** a host serializes and later restores runtime state
- **THEN** the continuation behavior remains explicit and consistent with the runtime contract
- **AND** the restored state supports inspection or replay-oriented tooling without depending on hidden host-only state
### Requirement: `pppr` shall define snapshot contents at the category level

The system shall define snapshot contents at the category level so continuation behavior is explicit without overcommitting to a provider-specific persistence document shape.

#### Scenario: serializing a session snapshot
- **WHEN** a host serializes runtime state
- **THEN** the snapshot contains session metadata, context metadata, conversation state, effect state, lifecycle state, and observability references needed for continuation
- **AND** it excludes provider-specific transport or storage fields that belong below the host boundary
### Requirement: `pppr` shall prefer external observability logs over embedding full event history in core snapshots

The system shall prefer a design in which core snapshots remain minimal and append-only observability logs are host-managed, with snapshots carrying only the references or checkpoints needed to reconnect to those logs.

#### Scenario: persisting session state with external observability storage
- **WHEN** a host persists a `pppr` session for later continuation or inspection
- **THEN** the core snapshot may remain minimal and reference external observability log data
- **AND** the snapshot does not require full embedded event history or provider-specific storage details
### Requirement: `pppr` shall use an opaque, minimal log-reference shape in snapshots

The system shall define a minimal snapshot log-reference shape that is opaque to the core and sufficient for hosts to reconnect snapshots to external observability data.

#### Scenario: carrying external log references in a snapshot
- **WHEN** a snapshot references host-managed observability data
- **THEN** the reference can carry a host-defined stream identifier plus optional replay bounds, checkpoint, and digest metadata
- **AND** the reference does not require provider-specific fields such as bucket names, URLs, filesystem paths, or credential details
