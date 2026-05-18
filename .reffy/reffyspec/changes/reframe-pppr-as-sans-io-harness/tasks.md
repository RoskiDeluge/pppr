# Tasks

## 1. Re-read context before writing

- [ ] 1.1 Re-read `pppr_sans_io_neutral_host.md` end-to-end to recover the original sans-I/O framing in the user's words.
- [ ] 1.2 Re-read `pppr_next_steps_toward_true_ir.md` and note every place the "second harness" question is invoked; the answers to those need to flow into the protocol revision.
- [ ] 1.3 Re-read `specs/phase-pppr-host-neutral-mvp/spec.md` (the deprecation) and confirm the proposal's distinction between sequencing-deprecation and structural sans-I/O holds up.
- [ ] 1.4 Re-read `specs/pppr-ir-core/spec.md` to confirm the two new requirements compose cleanly with the existing four (do not conflict with the "host execution concerns SHALL remain outside" requirement; in fact, the sans-I/O invariant strengthens it).

## 2. Author the two new `pppr-ir-core` requirements

- [ ] 2.1 Write the sans-I/O invariant requirement: the core MUST NOT import platform modules, MUST NOT call ambient global I/O, MUST receive identity and time as inputs.
- [ ] 2.2 Write at least one scenario for the invariant covering: (a) static check — no `node:*` / `cloudflare:*` imports under `packages/pppr/src/`, (b) runtime check — `randomUUID` / `Date.now` not invoked at the core boundary.
- [ ] 2.3 Write the host-adapter requirement: host adapter is a named architectural noun; Paseo is named as the first concrete adapter; CLI/`legacy-pi-host` is reclassified as one adapter among others.
- [ ] 2.4 Write at least one scenario for the host-adapter requirement covering planning vocabulary (e.g., a new feature is evaluated and the result correctly places it in core vs. adapter).

## 3. Revise `packages/pppr/PROTOCOL.md`

- [ ] 3.1 Add a Preface clause titled "Sans-I/O invariant" stating the rule and its consequences.
- [ ] 3.2 Replace the "Source of truth" subsection: PROTOCOL.md is the binding contract; disagreements between prose and code are filed as code bugs.
- [ ] 3.3 Update §4.1 so effect kinds are described as owned by the core; remove the "inherited from the legacy host" framing; the names themselves are unchanged.
- [ ] 3.4 Replace each "step 3: a second harness will reveal X" / "step 3 of the next-steps arc" framing with "the Paseo runtime adapter will exercise X" or equivalent. Sections to sweep: §1.5, §4.1, §6 preface, footer.
- [ ] 3.5 Amend the §6 "Open ambiguities" preface so ambiguities are framed as protocol-design questions to be answered, not just documentation artifacts. Do NOT answer any individual ambiguity in this change.

## 4. Surface, do not fix

- [ ] 4.1 Confirm no file under `packages/pppr/src/` has been modified by this change.
- [ ] 4.2 Confirm no new package directories or exports have been added by this change.
- [ ] 4.3 Confirm no individual open ambiguity from `PROTOCOL.md` §6 has been answered substantively.

## 5. Validate

- [ ] 5.1 Run `reffy plan validate reframe-pppr-as-sans-io-harness` and resolve any failures.
- [ ] 5.2 Read the revised `PROTOCOL.md` cold and confirm the sans-I/O invariant reads as the document's binding rule and Paseo is named as the first runtime adapter.

## 6. Archive

- [ ] 6.1 Archive the change with `reffy plan archive reframe-pppr-as-sans-io-harness` so the two new requirements merge into `pppr-ir-core`.
- [ ] 6.2 Push the canonical specs and archive entry to the remote workspace (`reffy remote push --workspace-id nuveris-v1`).
