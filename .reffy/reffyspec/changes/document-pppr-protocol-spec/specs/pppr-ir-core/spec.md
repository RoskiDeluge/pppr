## ADDED Requirements

### Requirement: `packages/pppr` SHALL include an authoritative protocol specification document

`packages/pppr` SHALL contain a top-level document at `packages/pppr/PROTOCOL.md` that authoritatively describes the current `pppr` protocol. The document SHALL cover lifecycle, input event vocabulary, output event vocabulary, effect contract, and snapshot shape. The document SHALL describe the current IR rather than redesign it; where prose and code disagree, the disagreement SHALL be recorded as an open ambiguity rather than silently resolved.

#### Scenario: a maintainer needs to understand the IR without reading the source

- **GIVEN** a maintainer has not read `packages/pppr/src/`
- **WHEN** they read `packages/pppr/PROTOCOL.md`
- **THEN** they can describe the lifecycle states and legal transitions
- **AND** they can describe the input event kinds and their required fields
- **AND** they can describe the output event kinds and the rules under which they are emitted
- **AND** they can describe the effect request/result contract
- **AND** they can describe what a snapshot contains and what round-trip behavior it guarantees

#### Scenario: prose and code disagree

- **GIVEN** writing the protocol document forces a question that the source code does not clearly answer
- **WHEN** the document is authored
- **THEN** the question MUST be recorded in an "Open ambiguities" section in the document
- **AND** the document MUST NOT invent a normative answer that hardens the current single consumer's behavior

### Requirement: the protocol specification document SHALL identify itself as describing the current IR

The document SHALL state that it describes the current `pppr` IR as it stands at the time of writing, that protocol versioning and a second consuming harness are explicitly future work, and that disagreements between the document and the source code are bugs to be filed rather than silently resolved.

#### Scenario: a reader checks whether the document is normative across versions

- **GIVEN** a reader is considering relying on the document for cross-version guarantees
- **WHEN** they read the document's preface
- **THEN** they find an explicit statement that the document describes the current IR only
- **AND** they find an explicit pointer to `pppr_next_steps_toward_true_ir.md` for the larger arc

### Requirement: the protocol specification document SHALL NOT be the trigger for protocol changes in this change

Authoring `packages/pppr/PROTOCOL.md` SHALL NOT modify `packages/pppr/src/*`. Any rough edges, ambiguities, or implicit single-consumer assumptions surfaced by the writing exercise SHALL be recorded as open ambiguities or follow-up work, not resolved by editing source code in this change.

#### Scenario: writing the document surfaces a rough edge

- **GIVEN** the writing exercise reveals a place where the current IR's behavior is shaped by `legacy-pi-host` rather than by a clean protocol intent
- **WHEN** the change is delivered
- **THEN** the rough edge is recorded in the document's "Open ambiguities" section
- **AND** no source file under `packages/pppr/src/` is modified to "fix" the rough edge as part of this change
