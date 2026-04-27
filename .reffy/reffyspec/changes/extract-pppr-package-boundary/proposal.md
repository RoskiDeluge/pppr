# Proposal: extract `pppr` package boundary

## Why

The `refactor-pppr-as-agentic-ir` change established the architectural direction and completed the audit:

- `pppr` should be its own package
- the old CLI UX is scaffolding
- `packages/coding-agent` is an extraction site, not the destination
- `legacy-pi-host` may survive temporarily, but only as a migration adapter

We have already created `packages/pppr` and moved the core IR files there. The next change needs to make that package boundary operationally canonical.

Right now the repo still has two competing centers:

- the new `packages/pppr` IR package
- the older `packages/coding-agent/src/pppr/*` path that still owns the current executable flow

That ambiguity will slow the refactor and encourage drift back into the inherited `pi` structure.

## What Changes

This change makes `packages/pppr` the canonical home for `pppr`.

It establishes that:

1. package ownership
- `packages/pppr` becomes the primary package for `pppr` code, exports, tests, and build validation
- `packages/coding-agent/src/pppr/*` stops being treated as the authoritative source of `pppr`

2. entrypoint redirection
- the current `pppr` executable path should be retargeted to call into `packages/pppr`
- any remaining `pi`-backed runtime path should be explicitly named as compatibility or legacy adapter behavior

3. dependency direction
- `packages/pppr` must not depend on `pi-agent-core`
- `packages/pppr` may use temporary adapter-side dependencies only where they remain outside the IR core
- `packages/coding-agent` should depend on `packages/pppr` for shared `pppr` behavior rather than duplicating source ownership

4. migration cleanup
- duplicate IR/runtime files in `packages/coding-agent/src/pppr/*` should be removed or replaced with thin re-exports only if strictly needed during migration
- root scripts and workspace expectations should start preferring `packages/pppr` as the target package for `pppr` work

## Impact

Affected planning areas:

- package boundaries
- executable entrypoints
- dependency direction
- migration cleanup inside `packages/coding-agent`

Expected impact:

- there is one obvious place where `pppr` lives
- new work stops accumulating in the inherited `pi` package
- compatibility code remains possible, but no longer defines the package structure
- later deletion of inherited `pi` surfaces becomes simpler and less risky

## Reffy References

- `pppr_as_intermediate_representation.md` - defines the architectural identity of `pppr` as representation rather than harness
- `pppr_pi_surface_audit.md` - classifies the inherited `pi` surface and identifies `packages/coding-agent` as an extraction site rather than a destination
