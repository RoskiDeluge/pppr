# Design: version `pppr` snapshots

## Design goal

Add the smallest possible set of changes that makes "what version of the protocol does this snapshot speak" a load-bearing question the runtime can answer. Everything else — what the migrations contain, how event envelopes get versioned, what cross-version replay looks like — is downstream of this seam existing.

## Main design judgments

### 1. Snapshots only, not envelopes

Event envelopes are mostly in-process today. Adding a version field to every input/output event is real overhead — every `createPpprInputEvent` and `createPpprOutputEvent` call would need to set it, every test would need to assert it, and the only payoff would be hypothetical (no transport currently spans a version boundary).

Snapshots are different: they cross persistence boundaries by intent. `session.persist` exists precisely to put them on the other side of a process boundary, and `session.resume` exists to bring them back. That is where version mismatches will actually bite.

When event envelopes need versioning — most likely when the second harness in step 3 introduces a wire transport — that change can introduce versioning honestly, with the migration scaffolding already in place from this change.

### 2. Accept-and-migrate, with an empty registry

Strict-equal is simpler today and harder tomorrow. The first time we ship a v2 snapshot shape, strict-equal would force every v1 snapshot in the wild to fail loading — meaning the day we want to bump the version is the day we have to retrofit the migration seam. That is the exact scenario the artifact warns against ("very expensive to retrofit once external snapshots exist").

Accept-and-migrate costs about thirty lines today (a registry, a `migrate(from, snapshot)` function, a wire-up in `restorePpprRuntimeState`) and turns the next bump into a one-line registry entry plus a tested migrator.

The empty registry is a feature, not a placeholder. It says: "there is currently no migration content, because there is currently nothing to migrate from." When v2 ships, it ships with `register(1, 2, migrateV1ToV2)`.

### 3. Loud rejection on unknown or unstamped snapshots

The single biggest hazard versioning is meant to fix is silent acceptance — a v0 snapshot loading into a v2 runtime by being sanitized through `createPpprSnapshot` until it happens to fit the new schema. That is what `PROTOCOL.md` §5.4 calls out as a hazard.

Therefore:

- a snapshot with `protocolVersion === currentVersion` loads as today
- a snapshot with a known older `protocolVersion` runs through the registry, then loads
- a snapshot with an unknown `protocolVersion` (gap in registry, or newer than current) is rejected with an explicit error naming the version
- a snapshot with no `protocolVersion` field is rejected with an explicit error naming the field

The error MUST name the field or version. A maintainer reading the error should know what the runtime saw and what it expected.

### 4. Single integer version

Semver implies multiple compatibility axes (breaking, additive, fixes). The current IR has one axis: "what shape is this snapshot." A single integer is the honest representation. Version `1` is the current shape; version `2` will be whatever shape the next breaking change produces.

If we later need additive-but-non-breaking distinctions, the right move at that time is to add a separate field (e.g., `featureLevel`), not to overload the integer.

## Concrete shape

### Public API

```ts
// In runtime-protocol.ts
export const PPPR_PROTOCOL_VERSION = 1 as const;
export type PpprProtocolVersion = number;

export interface PpprSnapshot {
  protocolVersion: PpprProtocolVersion;
  // ...existing fields
}

export class PpprSnapshotVersionError extends Error {
  readonly snapshotVersion: number | undefined;
  readonly currentVersion: number;
  // ...
}

export type PpprSnapshotMigrator = (snapshot: unknown) => unknown;

export function registerPpprSnapshotMigrator(
  fromVersion: number,
  toVersion: number,
  migrator: PpprSnapshotMigrator,
): void;
```

Whether the migration registry is module-level state or an injected object is a detail; module-level is simpler and matches the existing module shape. The registry is empty by default.

### Behavior changes

- `createPpprSnapshot`: stamps `protocolVersion: PPPR_PROTOCOL_VERSION` on every snapshot.
- `restorePpprRuntimeState`: inspects `protocolVersion`, runs registered migrators if needed, throws `PpprSnapshotVersionError` on unknown/missing version.

### Tests to add

- `createPpprSnapshot` always sets `protocolVersion`.
- A snapshot at the current version round-trips unchanged.
- A snapshot missing `protocolVersion` is rejected with a recognizable error.
- A snapshot at a future version is rejected with a recognizable error.
- Registering a migrator from a hypothetical v0 → v1 lets a v0 snapshot load as v1 (proves the seam is wired up, even though the registry ships empty).

## What this change deliberately does *not* do

- It does not migrate any real prior shape. There is no v0; the field's absence in pre-existing snapshots is a load-time error, not a migration trigger.
- It does not version any output event, input event, or effect request/result envelope.
- It does not introduce a "version" concept inside `PpprRuntimeState`. Versioning lives at snapshot boundaries; in-memory state is the current version by definition.
- It does not change any other behavior: lifecycle, transitions, effect handling, sanitization rules all remain as `PROTOCOL.md` describes them.

## Documentation

`PROTOCOL.md` §5 needs updates after the code lands:

- §5.1 gains the `protocolVersion` field on the snapshot shape
- §5.4 changes from "no version field today" to a concrete description of the migration seam, the rejection rules, and what `protocolVersion: 1` means
- the open-ambiguity entries that hinge on versioning should be revisited; §6.12 (silent sanitization) becomes more sharply true now — sanitization is silent, but version mismatch is not

The PROTOCOL.md update is part of the implementation; the doc and the code should not diverge inside this change.

## Main risk

The risk is that the migration registry feels like dead weight (empty today, theoretical tomorrow) and a future maintainer reaches for "just add a field directly" instead of "register a v1→v2 migrator." Mitigation: the design.md and PROTOCOL.md both call out that the seam is the deliverable, and the rejection behavior makes it expensive to bypass — a snapshot at the wrong version simply will not load.

## Success criterion

This change succeeds when:

- every snapshot produced by `packages/pppr` carries `protocolVersion: 1`
- a snapshot at the current version round-trips unchanged
- a snapshot at an unknown version fails loudly with a recognizable error
- the migration registry is wired into `restorePpprRuntimeState` and demonstrably accepts a registered migrator (verified by a test)
- `PROTOCOL.md` §5 reflects the new contract, and the change validates with `reffy plan validate`
