# Proposal: reframe `pppr` as a sans-I/O agentic harness

## Why

`pppr` was previously framed as Roberto's analogue to the `pi` project's agentic harness — a coding harness with a CLI host as the first concrete shell. That framing baked in a host shape. As of 2026-05-17, the direction has shifted: `pppr` is to become a **sans-I/O agentic harness** — a runtime-agnostic engine that any host can embed and drive, with **Paseo** (Cloudflare-backed, one of the projects inside the `nuveris-v1` reffy workspace) as the first concrete runtime target.

"Sans-I/O" is used here in the same sense as `h11` or `httpcore`: the core takes structured inputs, produces deterministic state transitions, emits structured outputs, and describes side effects it wants performed — but never performs them itself. Time, identity, persistence, network, model invocation, filesystem, and rendering all live behind the effect boundary.

This change is **descriptive and prose-only**. It does not modify `packages/pppr/src/`. Its job is to align the planning record and the protocol document with the new direction so subsequent implementation changes have a clear written target to argue against. Two implementation changes are foreseen — see *Follow-up work*.

## What Changes

1. **A new requirement in `pppr-ir-core`** stating the sans-I/O invariant: the core MUST NOT import platform modules (`node:*`, `cloudflare:*`, etc.), MUST NOT call ambient global I/O (`fetch`, `setTimeout`, `crypto.randomUUID`, `Date.now`, `console.*` for control flow, etc.), and MUST receive identity (ids) and time (timestamps) as inputs rather than self-sourcing them.

2. **A new requirement in `pppr-ir-core`** naming the *host adapter* (or *runtime adapter*) as a first-class noun in the architecture, and identifying **Paseo** as the first concrete runtime target. The CLI/`legacy-pi-host` adapter is retroactively reclassified as one host adapter among others, not the canonical consumer.

3. **A revision to `packages/pppr/PROTOCOL.md`** that:
   - adds a Preface clause stating the sans-I/O invariant as the document's binding contract,
   - inverts the "source of truth" stance — the protocol document becomes the binding contract; disagreements between prose and code become **code bugs to be filed**, not ambiguities to be recorded,
   - amends §4.1 to describe the effect kinds as **owned by the core**, not "inherited from the legacy host,"
   - rewrites the recurring "step 3: a second harness will reveal X" framing to note that Paseo is now that second driver — as a runtime adapter, not a co-equal consumer.

4. **A clarifying note** distinguishing the new sans-I/O direction from the previously-deprecated `phase-pppr-host-neutral-mvp` framing. The deprecated phase was about *sequencing CLI/MVP work around a host-neutral runtime first*; sans-I/O is a *structural property of the core*, not a sequencing claim. The deprecation of `phase-pppr-host-neutral-mvp` stands; this change does not revive it.

## Out of scope

Explicitly deferred to follow-up changes:

- Removing `import { randomUUID } from "node:crypto"` from `runtime.ts` and `runtime-protocol.ts`.
- Replacing the six `randomUUID()` and five `Date.now()` call sites inside the core with caller-supplied capability inputs (clock + id source) or with a "constructor lives in the adapter, core takes pre-built envelopes" split. The design choice between those two shapes is itself a follow-up change.
- Building the first Paseo runtime adapter under `packages/pppr/` or in a new package.
- Resolving any of the open ambiguities in `PROTOCOL.md` §6. Some (§6.5 `cwd`, §6.8 effect requests from terminal states) become easier to answer under the new direction, but answering them is not in scope here.
- Renaming any effect kinds in §4.1.

## Impact

Affected planning areas:

- `pppr-ir-core` — gains two requirements (sans-I/O invariant; host-adapter as first-class noun).
- `packages/pppr/PROTOCOL.md` — Preface and §4.1 revised; recurring "second harness" notes amended.

Expected impact:

- The protocol stops being framed as a description of what the legacy consumer happens to need and starts being framed as a binding contract the implementation must satisfy.
- A subsequent change can mechanically check the sans-I/O invariant (no `node:*` imports, no ambient time/id calls inside the core) and treat any violation as a bug.
- Paseo can be implemented as a runtime adapter without litigating whether it's a "real" consumer.

## Follow-up work (out of scope here, listed for traceability)

1. `evict-ambient-io-from-pppr-core` — remove `node:crypto`, `Date.now`, `randomUUID` from the core; introduce the capability bag or relocate envelope construction to the adapter.
2. `paseo-runtime-adapter` — first concrete sans-I/O host adapter, targeting the Paseo Cloudflare-backed runtime.

## Reffy References

- `pppr_sans_io_neutral_host.md` — direct precursor; established the sans-I/O framing in artifact form.
- `pppr_next_steps_toward_true_ir.md` — sets out the multi-step arc toward a true IR; this change partially answers "step 3: a second harness" by reframing Paseo as a runtime adapter.
- `pppr_as_intermediate_representation.md` — establishes the IR framing the sans-I/O invariant binds to.

## Superseding Direction

Continues the `pppr-package-boundary` and `pppr-ir-core` directions. Does **not** revive `phase-pppr-host-neutral-mvp` — that direction was deprecated for being about *sequencing* (CLI-first vs. host-neutral-first). The sans-I/O direction is *structural* and orthogonal to sequencing. The earlier deprecation stands.
