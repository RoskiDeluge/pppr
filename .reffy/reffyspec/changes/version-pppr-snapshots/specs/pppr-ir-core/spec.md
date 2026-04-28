## ADDED Requirements

### Requirement: `pppr` snapshots SHALL carry an explicit protocol version

Every `PpprSnapshot` produced by `packages/pppr` SHALL carry a `protocolVersion: number` field. The current value is exported as `PPPR_PROTOCOL_VERSION` and is `1`. `createPpprSnapshot` SHALL stamp the current version on every snapshot it produces.

#### Scenario: a snapshot is produced today

- **GIVEN** a runtime state in any lifecycle
- **WHEN** `createPpprSnapshot(state)` is called
- **THEN** the resulting snapshot has `protocolVersion === PPPR_PROTOCOL_VERSION`

#### Scenario: a snapshot is restored at the current version

- **GIVEN** a snapshot whose `protocolVersion` equals `PPPR_PROTOCOL_VERSION`
- **WHEN** `restorePpprRuntimeState(snapshot)` is called
- **THEN** the runtime state is restored without invoking any migrator
- **AND** subsequent runtime progression behaves identically to progressing from the snapshot's source state

### Requirement: snapshot restoration SHALL route through a migration registry

`restorePpprRuntimeState` SHALL inspect a snapshot's `protocolVersion` and route it through a registered migration path before producing a runtime state. A migration registry SHALL exist with the shape `(fromVersion → toVersion, migrator)` and SHALL ship empty in the change that introduces it.

#### Scenario: a future migrator is registered

- **GIVEN** a migrator from version `0` to version `1` has been registered via `registerPpprSnapshotMigrator(0, 1, migrator)`
- **WHEN** `restorePpprRuntimeState(snapshot)` is called with a snapshot whose `protocolVersion` is `0`
- **THEN** the registered migrator is invoked
- **AND** the resulting current-version snapshot is restored as if it had been produced at the current version

### Requirement: snapshots at unknown or missing protocol versions SHALL be rejected explicitly

A snapshot whose `protocolVersion` does not equal the current version and cannot be migrated to it through the registry SHALL be rejected with a `PpprSnapshotVersionError`. A snapshot whose `protocolVersion` field is absent SHALL be rejected with the same error type. The error message SHALL name the field or the offending version. Silent sanitization into the current schema SHALL NOT occur for unknown or missing versions.

#### Scenario: an unstamped snapshot is loaded

- **GIVEN** a snapshot with no `protocolVersion` field
- **WHEN** `restorePpprRuntimeState(snapshot)` is called
- **THEN** a `PpprSnapshotVersionError` is thrown
- **AND** the error message names `protocolVersion` so a maintainer can identify what was missing

#### Scenario: a future-version snapshot is loaded

- **GIVEN** a snapshot whose `protocolVersion` is greater than `PPPR_PROTOCOL_VERSION` and has no migration path
- **WHEN** `restorePpprRuntimeState(snapshot)` is called
- **THEN** a `PpprSnapshotVersionError` is thrown
- **AND** the error message names the offending version and the current version
- **AND** no fields from the snapshot are silently absorbed into a current-version state

### Requirement: protocol-version scope SHALL be limited to snapshots in this change

Event envelopes (`PpprInputEvent`, `PpprOutputEvent`) and effect requests/results SHALL NOT gain a `protocolVersion` field as part of this change. Versioning of those envelopes is deferred until a transport or second consumer makes the cost of versioning them justifiable.

#### Scenario: an event envelope is constructed today

- **GIVEN** any input or output event constructed through `createPpprInputEvent` or `createPpprOutputEvent`
- **WHEN** the resulting envelope is inspected
- **THEN** it does not carry a `protocolVersion` field
- **AND** the absence of the field is intentional and documented in the design

### Requirement: `PROTOCOL.md` SHALL describe the snapshot version contract

`packages/pppr/PROTOCOL.md` SHALL describe `protocolVersion`, the migration seam, the rejection rules for missing or unknown versions, and the explicit out-of-scope status of event envelope versioning. The document and the code SHALL NOT diverge inside this change.

#### Scenario: a maintainer reads `PROTOCOL.md` after this change lands

- **GIVEN** the change has landed
- **WHEN** a maintainer reads `PROTOCOL.md` §5
- **THEN** they find a description of the `protocolVersion` field on `PpprSnapshot`
- **AND** they find the rejection rules for missing or unknown versions
- **AND** they find an explicit statement that event envelopes are intentionally not versioned in this change
