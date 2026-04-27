# Proposal: deprecate host-neutral MVP direction

## Why

The `phase-pppr-host-neutral-mvp` spec captures planning intent that the project no longer pursues. It frames the MVP around:

- a host-neutral runtime as the architectural root
- a small CLI host as the first consumer of that runtime
- a non-CLI proof surface that re-exercises the same core

That direction was overtaken by the canonical pivot established in `extract-pppr-package-boundary`. The `pppr` identity is now an **intermediate representation** owned by `packages/pppr`, not a host-neutral CLI MVP. Existing host code (CLI host, capability seams, proof host) lives on as a named legacy adapter (`legacy-pi-host`) consuming the canonical package, but it is no longer the planning target.

Leaving `phase-pppr-host-neutral-mvp` requirements in `.reffy/reffyspec/specs/` makes the canonical spec tree dishonest about the project's current direction. A future maintainer would read it and conclude that work is being sequenced around host-neutrality, when in fact `packages/pppr` is the source of truth and the host-neutral track is closed.

## What Changes

This change removes the planning-level host-neutral MVP requirements from the canonical spec tree. It does **not** remove specs that describe shipped code:

- `define-pppr-runtime-protocol`, `implement-pppr-phase1-runtime`, `implement-pppr-phase2-cli-host`, `implement-pppr-phase3-capability-seams`, `implement-pppr-phase4-proof-host` all describe behavior that actually shipped inside the legacy host. Even though that surface is now legacy, the specs remain faithful to the current state of the code and SHALL be retained.
- `phase-pppr-host-neutral-mvp` is different: it is a planning/sequencing spec, not a description of shipped behavior. Its requirements direct *future* work toward host-neutrality, which is the direction we are abandoning.

Specifically:

1. all five requirements in `phase-pppr-host-neutral-mvp` are REMOVED
2. the canonical direction going forward is the `pppr-package-boundary` spec, which already establishes `packages/pppr` as the source of truth
3. legacy host behavior remains documented in the four `implement-pppr-phase*` specs, untouched

## Impact

Affected planning areas:

- canonical spec faithfulness
- direction citation trail for future work

Expected impact:

- the canonical spec tree stops asserting a planning direction the project no longer pursues
- future maintainers reading `.reffy/reffyspec/specs/` see `pppr-package-boundary` as the active direction without a competing host-neutral MVP narrative
- specs describing shipped legacy code remain intact, so the spec tree stays honest about what exists in the codebase

## Reffy References

- `pppr_as_intermediate_representation.md` — establishes the IR framing that supersedes the host-neutral MVP framing
- `pppr_pi_surface_audit.md` — classifies the inherited `pi` surface (including the host-neutral track's host code) as an extraction site rather than a destination

## Superseding Direction

The active direction for `pppr` work is established in:

- `pppr-package-boundary` — `packages/pppr` is the canonical home
- `pppr-ir-core` — `pppr` is an intermediate representation
- `pppr-core` — minimal core requirements

Any future planning that would otherwise reach for the host-neutral MVP framing SHOULD instead cite these specs.
