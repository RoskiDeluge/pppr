# Tasks

## 1. Introduce the version stamp

- [ ] 1.1 Add `PPPR_PROTOCOL_VERSION = 1` and `PpprProtocolVersion` to `packages/pppr/src/runtime-protocol.ts`.
- [ ] 1.2 Add a required `protocolVersion: PpprProtocolVersion` field to `PpprSnapshot`.
- [ ] 1.3 Update `createPpprSnapshot` to stamp `protocolVersion: PPPR_PROTOCOL_VERSION` on every snapshot it produces.

## 2. Wire the migration seam

- [ ] 2.1 Add `PpprSnapshotMigrator` type and a module-level migration registry to `runtime-protocol.ts`.
- [ ] 2.2 Add `registerPpprSnapshotMigrator(fromVersion, toVersion, migrator)`.
- [ ] 2.3 Add `PpprSnapshotVersionError` with `snapshotVersion` and `currentVersion` fields and a clear default message.
- [ ] 2.4 Update `restorePpprRuntimeState` to inspect `protocolVersion`, run registered migrators if needed, and throw `PpprSnapshotVersionError` on missing or unknown versions.

## 3. Tests

- [ ] 3.1 Assert every snapshot produced by `createPpprSnapshot` carries `protocolVersion: PPPR_PROTOCOL_VERSION`.
- [ ] 3.2 Round-trip test: a current-version snapshot restores to equivalent observable state.
- [ ] 3.3 Rejection test: a snapshot missing `protocolVersion` throws `PpprSnapshotVersionError` whose message names the field.
- [ ] 3.4 Rejection test: a snapshot with an unknown future `protocolVersion` throws `PpprSnapshotVersionError` whose message names the version.
- [ ] 3.5 Migration-seam test: register a hypothetical v0→v1 migrator, load a v0-shaped snapshot, confirm it restores cleanly. Clean up the registry after the test so it does not leak.

## 4. Documentation

- [ ] 4.1 Update `packages/pppr/PROTOCOL.md` §5.1 to include the `protocolVersion` field.
- [ ] 4.2 Update `packages/pppr/PROTOCOL.md` §5.4 to describe the migration seam, the rejection rules for missing/unknown versions, and the meaning of `protocolVersion: 1`.
- [ ] 4.3 Revisit Open ambiguities §6.12 (silent sanitization) and clarify how it relates to the new explicit version-mismatch behavior.

## 5. Validate

- [ ] 5.1 Run `npm run validate:pppr` and confirm all tests pass.
- [ ] 5.2 Run `reffy plan validate version-pppr-snapshots`.

## 6. Archive

- [ ] 6.1 Archive the change with `reffy plan archive version-pppr-snapshots` so the new requirements merge into `pppr-ir-core`.
- [ ] 6.2 Push the canonical specs and archive entry to remote workspaces (`reffy remote push --workspace-id pppr` and `--workspace-id nuveris-v1`).
