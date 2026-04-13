# Tasks

## 1. Define the proof-host boundary

- [x] 1.1 Define the module boundary for a non-CLI proof host on top of the current runtime.
- [x] 1.2 Define the caller-facing input/output shape for embedded or remote invocation.
- [x] 1.3 Confirm that the proof host consumes only protocol inputs, outputs, effects, and snapshots.

## 2. Implement the non-CLI proof-host loop

- [x] 2.1 Implement a host loop for start, resume, effect fulfillment, and completion outside terminal interaction.
- [x] 2.2 Reuse the Phase 3 provider and policy seams in the proof host.
- [x] 2.3 Return structured results suitable for embedding or remote invocation instead of terminal-specific rendering.

## 3. Shape the host for `paseo`-compatible execution

- [x] 3.1 Define a proof-host shape compatible with a remote actor substrate like `paseo`.
- [x] 3.2 Keep workspace, model, persistence, observability, and MCP-style capability access host-owned.
- [x] 3.3 Avoid introducing `paseo`-specific transport or actor assumptions into `pppr-core`.

## 4. Add host-neutrality verification

- [x] 4.1 Add tests or proof scenarios that run the same runtime through the non-CLI host.
- [x] 4.2 Add verification for resume, replay, or embedded invocation flows in the proof host.
- [x] 4.3 Add proof that no CLI-only hidden state is required for runtime execution.

## 5. Validate and integrate

- [x] 5.1 Align implementation planning with `define-pppr-minimal-core`.
- [x] 5.2 Align implementation planning with `define-pppr-runtime-protocol`.
- [x] 5.3 Align implementation planning with `phase-pppr-host-neutral-mvp`.
- [x] 5.4 Align implementation planning with `implement-pppr-phase2-cli-host`.
- [x] 5.5 Align implementation planning with `implement-pppr-phase3-capability-seams`.
- [x] 5.6 Validate this change with `reffy plan validate implement-pppr-phase4-proof-host`.
