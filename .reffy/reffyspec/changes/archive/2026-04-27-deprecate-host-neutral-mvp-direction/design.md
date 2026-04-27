# Design: deprecate host-neutral MVP direction

## Design goal

Make the canonical spec tree faithful to the project's current direction. The `phase-pppr-host-neutral-mvp` requirements describe a planning intent we are no longer pursuing; leaving them in `.reffy/reffyspec/specs/` would silently misdirect future maintainers.

## Main design judgment

Distinguish two kinds of specs in the tree:

1. **Specs that describe shipped behavior** — these remain faithful to the current code regardless of whether the surface is legacy. They SHALL be retained even when the underlying direction is deprecated.
2. **Specs that describe planning intent** — these are claims about how future work is sequenced. When the direction changes, they MUST be removed or rewritten so the tree does not assert a direction the project no longer pursues.

`phase-pppr-host-neutral-mvp` falls in category 2. Its requirements speak in terms of "the system shall sequence MVP work...", "the system shall preserve the minimal visible tool contract in the first CLI host", "the MVP plan shall include at least one secondary proof surface". These are sequencing and planning claims, not descriptions of shipped behavior.

The four `implement-pppr-phase*` specs and `define-pppr-runtime-protocol` fall in category 1. They describe runtime states, protocol shapes, capability seams, and proof-host behavior that actually shipped in `legacy-pi-host` and the host-side files in `packages/coding-agent/src/pppr/`. Even though that surface is now legacy, the specs remain accurate.

## Required outcomes

### 1. Canonical tree honesty

`.reffy/reffyspec/specs/phase-pppr-host-neutral-mvp/spec.md` SHALL no longer contain the five host-neutral MVP requirements.

### 2. Citation trail preserved

The deprecation event itself SHALL exist as an archived change in `.reffy/reffyspec/changes/archive/`, naming `pppr-package-boundary` as the superseding direction.

### 3. Shipped-code specs untouched

The following specs SHALL remain in `.reffy/reffyspec/specs/` exactly as they are now:

- `define-pppr-runtime-protocol`
- `implement-pppr-phase1-runtime`
- `implement-pppr-phase2-cli-host`
- `implement-pppr-phase3-capability-seams`
- `implement-pppr-phase4-proof-host`
- `pppr-core`
- `pppr-ir-core`
- `pppr-package-boundary`

## Migration sequence

1. Author this change with a REMOVED-Requirements delta against `phase-pppr-host-neutral-mvp`
2. Validate the change with `reffy plan validate`
3. Archive the change so the delta is applied to canonical specs and the change moves to `archive/`
4. Confirm the canonical `phase-pppr-host-neutral-mvp/spec.md` no longer contains the deprecated requirements

## Main risk

The risk is partial deprecation: removing some requirements but not others, or accidentally removing requirements that describe shipped behavior. Mitigation: the REMOVED block lists all five requirements explicitly by header, and shipped-behavior specs are out of scope for this delta.

## Success criterion

This change succeeds when:

- `phase-pppr-host-neutral-mvp` no longer asserts host-neutral MVP planning intent in the canonical tree
- the archived change documents the pivot and cites `pppr-package-boundary` as the superseding direction
- specs describing shipped legacy code remain intact
