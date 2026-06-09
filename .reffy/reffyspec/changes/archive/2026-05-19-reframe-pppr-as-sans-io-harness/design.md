# Design: reframe `pppr` as a sans-I/O agentic harness

## Design goal

Land the planning-level reframe of `pppr` from "Roberto's analogue of the `pi` agentic harness with a CLI host as first shell" to "a sans-I/O agentic harness usable from any runtime, with Paseo as the first runtime adapter." Capture this in two `pppr-ir-core` requirements and a revision of `packages/pppr/PROTOCOL.md`. Touch no source code.

## Main design judgment

**Land the contract before the implementation.**

The implementation work — evicting `randomUUID`/`Date.now`/`node:crypto` from the core, building the Paseo runtime adapter — is real and obvious. But doing it before the contract is written invites two failure modes:

1. The eviction work resolves the I/O question one site at a time, without a single statement that captures the invariant. The result is a core that *happens* to be sans-I/O until the next change re-introduces ambient calls.
2. The Paseo adapter is built without a written boundary, so its accidental shape becomes the de facto contract — exactly the trap the original `legacy-pi-host` extraction already fell into once.

Writing the contract first means: any subsequent code change can be checked against a single, citable invariant. The eviction PR doesn't need to argue from first principles; it points at the requirement.

## Why this is a separate change from the eviction work

The earlier `document-pppr-protocol-spec` change established a strong precedent: descriptive work is its own change, kept rigorously free of code edits, so the writing exercise cannot quietly redesign the system. This change inherits that discipline. The only artifact it touches outside `.reffy/` is `packages/pppr/PROTOCOL.md`, which is itself a planning document the previous change established as the protocol's home.

A combined "reframe + evict ambient I/O + scaffold Paseo adapter" change would conflate three risks:

- prose vs. code drift,
- a real refactor of the core's identity sources,
- a brand-new package/adapter shape.

Splitting them gives each its own surface to argue against.

## Why "sans-I/O" rather than "host-neutral"

The previously-deprecated `phase-pppr-host-neutral-mvp` framing was about *sequencing*: build a host-neutral runtime first, then bolt on a CLI host. The deprecation note (in `specs/phase-pppr-host-neutral-mvp/spec.md`) makes clear it was a planning ordering claim, not a structural one.

"Sans-I/O" is structural: it names a property the core must have, regardless of which host adapter exists first or whether multiple host adapters exist at all. A core can be sans-I/O and still ship with only one host adapter (today: `legacy-pi-host`; soon: Paseo). The deprecation of `phase-pppr-host-neutral-mvp` therefore stands — that direction was about an MVP shape this change does not revive.

This distinction needs to be in the proposal explicitly; otherwise a future reader will read the deprecation and conclude that "host-neutral" framings are off-limits, including sans-I/O. The proposal's *Superseding Direction* section addresses this.

## Why two requirements, not one

The first requirement (the sans-I/O invariant) is the *prohibition*: what the core may not do.

The second requirement (host adapter as first-class noun, Paseo as first concrete target) is the *positive surface*: where the prohibited work goes instead.

Without the second, the first reads as a constraint without a home; reviewers will ask "OK, but then who calls `Date.now()`?" and the answer needs to exist as a named architectural noun, not as a vague "the host."

## `PROTOCOL.md` revision strategy

Four targeted edits, each justified:

### 1. Preface — sans-I/O invariant clause

A new clause near the top of the Preface stating the invariant. This is the single sentence that turns the rest of the document into a sans-I/O contract.

### 2. Preface — "Source of truth" inversion

The current Preface says `runtime-protocol.ts` is the source of truth and PROTOCOL.md is authoritative for *intent* only. The reframe inverts this: PROTOCOL.md is the binding contract, and any disagreement between prose and code is a code bug to be filed against the implementation.

This is the single most consequential prose edit. The earlier change deliberately set the asymmetry the other way around because it was describing — not redesigning — the current IR. The reframe is precisely the moment when description-only ends.

The previous "Open ambiguities" section in §6 SHOULD remain, but with a note added to the section header that the ambiguities are now *protocol-design questions to be answered*, not just documentation artifacts. Resolving them is out of scope here, but the framing of why they are open shifts.

### 3. §4.1 — effect kinds owned by the core

The current §4.1 calls the effect kinds "inherited from the legacy host" and out of scope for renaming "in this change." Under the reframe, these kinds are the core's effect vocabulary. Inheritance from `legacy-pi-host` is historical accident, not architectural mandate. The names still aren't being changed (that's a separate question), but the framing of where they come from is.

### 4. The "second harness" refrain

Multiple sections of `PROTOCOL.md` defer questions to "step 3: a second harness will reveal X." Step 3 is now answered structurally: Paseo is the second driver, but as a runtime adapter, not a co-equal consumer. The "second harness will reveal X" framing is replaced by "the Paseo adapter will exercise X." Sections affected:

- §1.5 (lifecycle non-tracking)
- §4.1 (effect kinds cleanliness)
- §6.* preface
- The footer

The edits are mechanical — replace the framing — not substantive.

## What this change does *not* touch

- No file under `packages/pppr/src/`.
- No new exports.
- No new tests.
- No new package directories.
- No changes to `runtime-protocol.ts` defaults (`randomUUID()`, `Date.now()`) — those become bug fixes against the new contract, filed as the follow-up `evict-ambient-io-from-pppr-core` change.
- No deprecation amendment to `phase-pppr-host-neutral-mvp` — that deprecation already stands and is correctly scoped.

## Verification

There is no automated check for the prose changes. Verification is by reading:

- `pppr-ir-core` gains exactly two new requirements, each with a scenario.
- `packages/pppr/PROTOCOL.md` Preface contains the sans-I/O invariant statement and the inverted source-of-truth stance.
- `packages/pppr/PROTOCOL.md` §4.1 no longer describes effect kinds as "inherited from the legacy host."
- The "second harness will reveal X" refrain is replaced everywhere it appears.
- `reffy plan validate reframe-pppr-as-sans-io-harness` passes.
- A maintainer reading the revised `PROTOCOL.md` cold can identify the sans-I/O invariant as the document's binding rule and can name Paseo as the first runtime adapter.

## Main risk

**Scope creep into the eviction work.** While editing `PROTOCOL.md` to assert the sans-I/O invariant, the temptation to also edit `runtime-protocol.ts` to remove `randomUUID()` defaults is strong — they are six lines and the change feels small. This change MUST resist that. The eviction is a separate change because the design of the replacement (capability bag vs. adapter-constructed envelopes) deserves its own argument.

If the contract lands and the implementation diverges from it, that divergence is exactly the kind of bug the new "Source of truth" stance is designed to catch — which is the right outcome.

## Success criterion

After this change is archived:

- `pppr-ir-core` includes a sans-I/O invariant requirement that subsequent changes can cite.
- `packages/pppr/PROTOCOL.md` reads as a binding contract, not a description.
- A new change titled `evict-ambient-io-from-pppr-core` can be scaffolded with no further planning argument needed — the invariant is already written down, and the eviction is mechanical bug-fixing against it.
- A new change titled `paseo-runtime-adapter` can be scaffolded with `host adapter` as a defined noun, not a coined term.
