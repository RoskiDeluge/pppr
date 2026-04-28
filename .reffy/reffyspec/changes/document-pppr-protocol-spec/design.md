# Design: document the `pppr` protocol specification

## Design goal

Produce one authoritative, in-tree document that names what the `pppr` protocol is, so that subsequent IR work has a written target rather than an implicit one.

## Main design judgment

This is a description, not a redesign.

The single most important discipline for this change is to resist the temptation to "fix" the protocol while writing it down. The current shape was extracted from `legacy-pi-host`'s needs, so it almost certainly has rough edges. Those rough edges are exactly what step 3 of the next-steps artifact (a second harness) is designed to reveal. Writing them down faithfully is more useful than guessing at fixes now.

Concretely: where the prose forces a question the code does not clearly answer, the prose SHOULD record the ambiguity and create a follow-up entry, rather than invent an answer that hardens the implicit consumer's behavior into a normative claim.

## Document location and form

The document SHALL live at `packages/pppr/PROTOCOL.md`. Reasons:

- top-level placement makes it discoverable without inviting subdirectory drift
- a single file is easier to keep coherent than a multi-file documentation tree at this stage
- `PROTOCOL.md` (uppercase, like `README.md`) signals authority

The document SHALL be prose-first. Where types or shapes are required for clarity, they SHALL appear as illustrative TypeScript fragments, not as the source of truth — `runtime-protocol.ts` remains the source of truth for now, and the document explicitly says so.

## Document structure

The five sections from the proposal MUST appear, in this order, with these responsibilities:

### 1. Lifecycle
- enumerate every lifecycle state the runtime can occupy
- list legal transitions between states with the input event(s) that drive each
- name terminal vs. resumable states
- call out any state that exists in code but lacks a clear meaning — that is a follow-up, not a fix

### 2. Input event vocabulary
- list every input event kind the runtime accepts
- for each: required fields, semantic meaning, and any ordering or precondition rules
- distinguish input events that drive lifecycle transitions from those that are content-only

### 3. Output event vocabulary
- list every output event kind the runtime emits
- for each: when it is emitted, what consumers can rely on, and what is incidental
- name any output that is currently emitted but whose contract is unclear

### 4. Effect contract
- structure of effect requests and effect results as protocol entities
- rules governing when the runtime is permitted to request effects
- rules governing when results may be applied (matching id, ordering, idempotency expectations if any)
- explicit statement that effect *kinds* are inherited from the legacy host and are out of scope for renaming in this change

### 5. Snapshot shape
- what a snapshot contains
- the round-trip guarantee: snapshot → restore → continue produces equivalent observable behavior
- what is deliberately not promised yet (notably: cross-version stability, since versioning is a future change)

## Cross-cutting requirements

- the document SHALL identify itself as describing the *current* IR and SHALL note that step 2 (versioning) and step 3 (second harness) are pending
- the document SHALL link back to `pppr_next_steps_toward_true_ir.md` so the reader sees the larger arc
- the document SHOULD include a short "how to use this document" preface explaining that disagreements between code and prose are bugs to be filed, not silently resolved

## Out of scope (restated)

- no runtime code changes
- no new exports
- no new tests
- no protocol versioning
- no effect renaming
- no second consumer

## Verification

The change is verifiable by reading. There is no automated check that prose matches code; that is precisely the gap step 6 (IR-level invariant tests) is meant to close in a future change. For this change, verification consists of:

- the document exists at `packages/pppr/PROTOCOL.md`
- it covers all five sections in the proposal
- it identifies itself as describing the current IR, not a redesigned one
- the change validates with `reffy plan validate`

## Main risk

The risk is scope creep — using the writing exercise as cover for unannounced redesign. Mitigation: the design explicitly forbids it, and the tasks list separates "describe what exists" from "file follow-up entries for ambiguities."

## Success criterion

This change succeeds when a maintainer who has never read `runtime-protocol.ts` can read `PROTOCOL.md` and form an accurate mental model of the IR's lifecycle, vocabulary, effect contract, and snapshot shape, including its current limitations.
