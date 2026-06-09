# Tasks

## 1. Read the current IR before writing about it

- [x] 1.1 Re-read `packages/pppr/src/runtime-protocol.ts` end-to-end and note every input event kind, output event kind, lifecycle state, and effect shape currently defined.
- [x] 1.2 Re-read `packages/pppr/src/runtime.ts` and note every transition rule, including any rules that are encoded only by control flow rather than by named state machines.
- [x] 1.3 Skim `packages/pppr/src/ir.ts`, `main.ts`, and `thinking.ts` for any contract surface that belongs in the protocol document.
- [x] 1.4 Skim the `packages/pppr/test/*` suite for any invariants that exist as tests but not as named protocol rules.

## 2. Draft `packages/pppr/PROTOCOL.md`

- [x] 2.1 Write the preface: scope of the document, identification as a description of the current IR, link to `pppr_next_steps_toward_true_ir.md`, and a "how to use this document" note about disagreements being filable bugs.
- [x] 2.2 Write the Lifecycle section: states, legal transitions, driving inputs, terminal vs. resumable.
- [x] 2.3 Write the Input event vocabulary section: every kind, required fields, semantics, ordering rules.
- [x] 2.4 Write the Output event vocabulary section: every kind, emission triggers, what consumers can rely on.
- [x] 2.5 Write the Effect contract section: request/result structure, request-permission rules, result-application rules, explicit deferral of effect renaming.
- [x] 2.6 Write the Snapshot shape section: contents, round-trip guarantee, deliberate non-promises (including versioning).

## 3. Surface, do not fix

- [x] 3.1 Maintain a short "Open ambiguities" section at the bottom of `PROTOCOL.md` listing every place where writing the prose forced a question the code did not clearly answer.
- [x] 3.2 Confirm no source code under `packages/pppr/src/` has been modified by this change.

## 4. Validate the change

- [x] 4.1 Run `reffy plan validate document-pppr-protocol-spec`.
- [x] 4.2 Have a maintainer who is not the author read `PROTOCOL.md` cold and confirm they can describe the IR's lifecycle, vocabulary, effects, and snapshot guarantees from the document alone.

## 5. Archive

- [ ] 5.1 Archive the change with `reffy plan archive document-pppr-protocol-spec` so the new requirement merges into `pppr-ir-core`.
- [ ] 5.2 Push the canonical specs and archive entry to remote workspaces (`reffy remote push --workspace-id pppr` and `--workspace-id nuveris-v1`).
