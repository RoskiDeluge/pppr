# Proposal: version `pppr` snapshots

> Superseded notice: This proposal is being archived as superseded by `reframe-pppr-as-sans-io-harness`. Snapshot versioning remains valid follow-up work, but this standalone proposal is no longer the active framing for the current planning set.

## Why

`PROTOCOL.md` §5.4 and §5.5 are explicit: snapshots have no version field today, and there is no rule for what a runtime accepts, rejects, or migrates. The implicit guarantee is "this snapshot can be restored by the same `packages/pppr` build that produced it." That is fine while there is one consumer in one process and no persistence outside that process.

It stops being fine the moment any of the following becomes true:

- a snapshot is persisted across a `packages/pppr` upgrade
- a second consumer (the structurally different harness from step 3) needs to load a snapshot it did not produce
- a future change reshapes the snapshot schema and silently sanitizes load-time

The cheapest move that prevents all three failure modes is to introduce a version stamp on snapshots and a documented compatibility rule, before any of those situations actually arise.

This change is step 2 of the direction set out in `pppr_next_steps_toward_true_ir.md`. It is intentionally narrow:

- it stamps snapshots only — event envelopes are deliberately out of scope
- it introduces version `1` and does **not** graduate to version `2` as part of this change
- it adds a migration *seam* with an empty registry, not actual migrations
- it changes no runtime behavior beyond load/persist boundaries

## What Changes

1. **Version stamp.** `PpprSnapshot` SHALL carry an explicit `protocolVersion: number` field. The current value is `1`. `createPpprSnapshot` SHALL stamp the current version on every snapshot it produces.

2. **Compatibility rule (accept-and-migrate).** `restorePpprRuntimeState` SHALL inspect a snapshot's `protocolVersion` and route it through a migration registry that produces a current-version snapshot before restoration proceeds.

3. **Migration registry seam.** A small registry maps `(fromVersion → toVersion, migrator)`. The registry is empty in this change because there is no prior version. The seam is what is being delivered; future protocol-shape changes will land alongside a registry entry, not by silently accepting older shapes.

4. **Explicit rejection.** A snapshot whose `protocolVersion` is not the current version and cannot be migrated to it through the registry SHALL be rejected with an explicit error. Newer-than-current versions SHALL also be rejected; downgrade migrations are not in scope and are not implied by the seam's shape.

5. **Backwards compatibility for unstamped snapshots.** Any snapshot loaded today predates this change and therefore lacks a `protocolVersion` field. The runtime SHALL treat an absent `protocolVersion` as a load-time error and emit a clear message naming the field. Silent absorption would defeat the point of versioning. (If callers need to re-import legacy unstamped snapshots, that is its own follow-up change with an explicit migration entry from `undefined` to `1`.)

## Out of scope

Explicitly deferred:

- event envelope versioning (deferred until a second harness or a wire transport actually exists)
- cross-version replay tests (step 6 of the next-steps arc)
- any actual migration content — the registry ships empty
- protocol-version bump to `2` — this change introduces version `1` and does not break it
- any change to runtime progression, lifecycle, effect handling, or output emission

## Impact

Affected planning areas:
- `pppr-ir-core` capability — gains explicit versioning requirements
- `packages/pppr/src/runtime-protocol.ts` — `PpprSnapshot` gains a field, `createPpprSnapshot` and `restorePpprRuntimeState` gain version-aware behavior
- `packages/pppr/test/*` — gains version-stamping and rejection tests
- `packages/pppr/PROTOCOL.md` — §5 is updated to reflect the new contract; §6.x ambiguities related to versioning (specifically §6.12's framing) are revisited if appropriate

Expected impact:
- snapshots produced by current `packages/pppr` carry an explicit `protocolVersion: 1`
- the migration seam exists, so the next protocol-shape change has a place to plug in instead of mutating the schema in place
- a rejected snapshot fails loudly rather than silently sanitizing into the current shape
- the IR claim grows one durable property: snapshots stop being version-free

## Reffy References

- `pppr_next_steps_toward_true_ir.md` — sets out this work as step 2 in earning the IR claim
- `pppr_as_intermediate_representation.md` — establishes the durability framing the version field protects

## Superseding Direction

Continues the `pppr-package-boundary` direction. Does not revive any host-neutral MVP framing.
