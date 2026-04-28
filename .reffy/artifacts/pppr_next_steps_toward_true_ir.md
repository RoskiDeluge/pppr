# Next steps toward `pppr` as a true harness-agnostic IR

## Why this artifact exists

`packages/pppr` now exists as a first-class package, the legacy host has been demoted to a named adapter, and the host-neutral MVP framing has been formally deprecated in favor of the `packages/pppr` boundary.

That work made `pppr` operationally canonical. It did **not** yet make `pppr` an IR in any strong sense.

This note collects the next moves needed to turn the package from "the place pppr code lives" into "the durable representational layer agentic harnesses can interpret, persist, transform, replay, and hand off."

## What "true IR" means here

An IR earns the name when:

- its semantics are defined independently of any one harness
- its on-the-wire form is stable, versioned, and round-trippable
- multiple unrelated harnesses can drive it and observe consistent behavior
- its effect vocabulary is protocol-shaped, not host-shaped
- its lifecycle is replay-friendly: a snapshot plus a stream of inputs reconstructs state

By that bar, today's `packages/pppr` is closer to "a runtime extracted from one harness" than to a true IR. The shape was implicitly defined by what `legacy-pi-host` needed. That is not a failure — it is the natural starting point — but it is the gap to close.

## The honest gap audit

Before sequencing work, the gap should be named explicitly:

- the public surface (`PpprIrSession`, runtime, runtime-protocol, thinking) was extracted from the legacy host's needs and may carry assumptions that only feel neutral because there is only one consumer
- `createPpprMain` lives in the IR package but is shaped like a host runner, not an IR concept
- effect kinds and message shapes have not been stress-tested by a non-CLI harness, so we cannot yet tell which fields are essential and which are residue
- there is no written specification of the protocol — the code is the spec, which is fine for one consumer and fragile for many
- snapshots are serializable in practice but have no version field, no migration story, and no guarantee of structural stability across `packages/pppr` versions

Each of these is a concrete next-step seam.

## Proposed direction

### 1. Write the protocol specification before adding features

Right now the protocol is whatever `runtime-protocol.ts` happens to export. Before the package gains another consumer, the protocol should be described in prose and scenarios so divergence becomes visible.

The deliverable is a document inside `packages/pppr` that names:

- the lifecycle states and legal transitions
- the input event vocabulary and required fields
- the output event vocabulary and emission rules
- the effect request/result contract, in protocol terms
- the snapshot shape and what it must guarantee

Once this exists, drift between the spec and `runtime-protocol.ts` becomes a real bug rather than a private worry.

### 2. Version snapshots and protocol envelopes

A serializable IR with no version stamp is a hostage to the next refactor.

Before any second harness consumes snapshots, add:

- an explicit protocol version on snapshots and on every event envelope
- a documented compatibility rule (what the runtime accepts, what it rejects, what it migrates)
- a small migration scaffold so future shape changes do not silently break older snapshots

This is cheap to add now and very expensive to retrofit once external snapshots exist.

### 3. Prove portability with a second, structurally different harness

The single most informative next move is to drive `packages/pppr` from a harness that shares nothing with `legacy-pi-host`.

Candidates, roughly in order of signal-to-effort:

- a pure replay harness that consumes a recorded event log and asserts deterministic state
- a thin Anthropic SDK driver that turns assistant turns into pppr inputs and effect requests, with no CLI involvement
- an HTTP service shell that exposes the IR as a session API

The point is not to ship any of these as products. The point is that the first time a structurally different harness tries to drive the IR, every implicit CLI assumption in the protocol becomes visible. That is the only reliable way to find out what is actually in the IR versus what only looked like IR because the original consumer happened to need it.

This is *not* a revival of the deprecated host-neutral MVP framing. The host-neutral MVP treated host-neutrality as the architectural goal. Here, portability is a falsification test for the IR claim. The goal is `pppr-package-boundary`; the second harness is how we check we actually achieved it.

### 4. Move host-shaped surfaces out of the IR package

`createPpprMain` is the clearest example. Its signature ("kind, run(args)") is the shape of a host runner, not an IR concept. It probably belongs in an adapter package or in `legacy-pi-host` directly.

A useful filter for everything currently exported from `packages/pppr`:

- if removing the export would only break harness code, the export probably does not belong in the IR package
- if removing the export would break a description of the work itself (state, transitions, events, effects, snapshots), it belongs in the IR

Apply the filter once, deliberately. Anything that fails goes to an adapter.

### 5. Audit the effect vocabulary against protocol-shaped nouns

The current effect kinds inherit terminology from the CLI harness. For a true IR they should be re-examined as protocol-level nouns:

- not "bash" but "command execution request, with a structured intent"
- not "read/edit/write" but content-access and content-mutation requests with explicit scope and provenance
- not host-shaped tool names but capability requests the harness can resolve however it likes

This is mostly a renaming and semantic-tightening exercise, but it should be done with at least one non-CLI harness in flight (step 3) so the new names are pulled by real usage rather than designed in the abstract.

### 6. Make the package's tests describe the IR, not the legacy host

The current `packages/pppr` tests are useful and necessary, but many of them read as "did the runtime do what the legacy host expected." That is fine for a runtime extraction; it is insufficient for an IR.

Add a layer of tests that describe IR-level invariants without reference to any host:

- a snapshot round-trips through serialize → deserialize → resume to identical observable behavior
- replaying the same input stream against the same starting snapshot produces the same outputs
- effect requests carry enough structure that any conformant harness could fulfill them
- protocol version mismatches are detected, not absorbed silently

Tests at this level are the executable form of the spec from step 1.

### 7. Reduce reach back into `coding-agent`

`legacy-pi-host` exists to be the migration adapter. Ideally, over time, every other file under `packages/coding-agent/src/pppr/*` either:

- moves into `legacy-pi-host` as private host implementation details, or
- moves into a new adapter package, or
- is deleted as residue

The shim re-exports (`ir.ts`, `runtime.ts`, etc.) under coding-agent are fine during migration but should be removable once no in-tree code imports them. Treat them as a debt counter, not a permanent feature.

## Sequencing

A defensible order is:

1. specification document inside `packages/pppr` (step 1)
2. snapshot/protocol versioning (step 2)
3. one second harness, even a minimal replay one (step 3)
4. host-surface eviction informed by what step 3 surfaces (step 4)
5. effect vocabulary tightening pulled by step 3's usage (step 5)
6. IR-level invariant tests (step 6)
7. ongoing reduction of `coding-agent/src/pppr/*` (step 7)

Steps 1 and 2 are cheap and unblock the rest. Step 3 is the highest-information move and should happen as soon as 1 and 2 are in place. Steps 4–6 follow naturally from 3. Step 7 is a continuous background task.

## What should not happen

A few moves would feel productive but would set the project back:

- adding more capability surface to `packages/pppr` before step 3 — every addition without a second consumer hardens whatever harness assumptions are already there
- introducing abstract interfaces "in case" a future harness needs them — without a real second harness, these interfaces are guesses shaped by the only existing one
- treating `legacy-pi-host` as the proof that the IR is harness-agnostic — it is not, by construction, since the IR was extracted from it
- reviving the host-neutral MVP framing — the active direction remains `pppr-package-boundary`; portability work serves that direction rather than restoring the deprecated one

## Bottom line

The package boundary is now real. The IR claim is not yet earned.

The cheapest way to earn it is to write the protocol down, version the wire format, and put one structurally different consumer in front of it. Almost every other open question — what to evict from the package, which effect names to keep, what tests to add — answers itself once a second harness is exercising the surface.

Until that happens, `packages/pppr` is best understood as "the canonical home for an IR-in-progress." That is a strict improvement over the prior state and a strict step short of the goal.
