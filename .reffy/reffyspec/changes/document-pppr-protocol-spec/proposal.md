# Proposal: document the `pppr` protocol specification

## Why

`packages/pppr` is now the canonical home for `pppr` code, but the protocol it implements is unspecified except by the source itself. As long as there is only one consumer (`legacy-pi-host`), that is tolerable. Before any second consumer arrives — or any non-trivial refactor of the IR — the protocol needs to exist as prose so divergence between intended semantics and current code becomes a visible bug rather than a private worry.

This change is step 1 of the direction set out in `pppr_next_steps_toward_true_ir.md`. It is intentionally the cheapest unblocking move:

- it adds no runtime behavior
- it adds no new exports
- it does not yet attempt portability or versioning

What it does is establish the IR's semantics in writing, so subsequent changes (snapshot versioning, second-harness portability, effect-vocabulary tightening) have a stable target to argue against.

## What Changes

A new authoritative protocol specification document SHALL live inside `packages/pppr`. Its scope is fixed for this change:

1. **Lifecycle** — the lifecycle states the runtime can occupy and the legal transitions between them.
2. **Input event vocabulary** — the kinds of input events the runtime accepts, their required fields, and any ordering or precondition rules.
3. **Output event vocabulary** — the kinds of output events the runtime emits, when each is emitted, and what consumers can rely on.
4. **Effect contract** — the structure of effect requests and effect results, the rules governing when the runtime requests effects, and the rules governing when results may be applied.
5. **Snapshot shape** — what a snapshot must contain, what it must guarantee on round-trip, and what it deliberately does not promise.

The document is a description of the current IR, not a redesign. Where the document and the code disagree, the disagreement is itself the artifact this change is meant to surface — those discrepancies become follow-up work, not in-scope rewrites.

## Out of scope

Explicitly deferred to later steps:

- snapshot versioning and migration semantics
- a second consumer driving the IR
- evicting host-shaped surfaces (e.g. `createPpprMain`) from the package
- renaming or reshaping the effect vocabulary
- adding IR-level invariant tests

These are real next moves, but each benefits from having the spec written first.

## Impact

Affected planning areas:

- `pppr-ir-core` capability — gains an authority/documentation requirement
- `packages/pppr` working tree — gains a specification document

Expected impact:

- the protocol stops being defined only by `runtime-protocol.ts` and the implicit needs of `legacy-pi-host`
- future work has a written target to test against, which is the prerequisite for any honest claim that `pppr` is harness-agnostic
- accidental protocol drift in subsequent refactors becomes immediately visible

## Reffy References

- `pppr_next_steps_toward_true_ir.md` — sets out this work as step 1 in earning the IR claim
- `pppr_as_intermediate_representation.md` — establishes the IR framing the spec will describe

## Superseding Direction

Continues the `pppr-package-boundary` direction. Does not revive any host-neutral MVP framing.
