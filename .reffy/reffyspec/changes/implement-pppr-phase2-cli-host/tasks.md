# Tasks

## 1. Define the Phase 2 host boundary

- [x] 1.1 Define the CLI host responsibilities versus Phase 1 runtime responsibilities.
- [x] 1.2 Identify the module boundary that will own the host/runtime driver loop.
- [x] 1.3 Define how interactive session actions map to `session.start`, `session.resume`, `message.user`, `effect.result`, and `session.cancel`.

## 2. Implement the host/runtime driver loop

- [x] 2.1 Implement a host-owned loop that advances the runtime through protocol inputs and outputs.
- [x] 2.2 Ensure lifecycle state and pending-effect state come from the runtime rather than hidden CLI-owned execution state.
- [x] 2.3 Implement stop, resume, and fork continuation paths through the runtime contract.

## 3. Implement host-owned effect fulfillment

- [x] 3.1 Map `read`, `edit`, `write`, and `bash` onto the approved Phase 1 effect kinds.
- [x] 3.2 Implement local host fulfillment for `content.read`, `content.write`, `content.patch`, and `command.exec`.
- [x] 3.3 Implement host-mediated fulfillment for `model.infer`.
- [x] 3.4 Implement host-owned fulfillment for `session.persist`, `log.append`, and `log.resolve`.
- [x] 3.5 Normalize success, denial, and failure outcomes into approved effect results without leaking provider-specific requirements into the core contract.

## 4. Preserve the visible CLI contract

- [x] 4.1 Preserve hierarchical instruction loading through the host entry path.
- [x] 4.2 Render assistant output, lifecycle state, and effect progress from runtime outputs.
- [x] 4.3 Preserve the default visible tool contract of `read`, `edit`, `write`, and `bash`.
- [x] 4.4 Keep command execution operationally synchronous in the first host unless a concrete requirement proves otherwise.

## 5. Add verification coverage

- [x] 5.1 Add host-integration tests for start, progress, effect wait, effect fulfillment, and completion flows.
- [x] 5.2 Add resume and fork tests showing the host can reconstruct execution from snapshots and approved log references.
- [x] 5.3 Add tests proving the CLI host consumes the runtime protocol rather than bypassing it with hidden direct-execution paths.

## 6. Validate and integrate

- [x] 6.1 Align implementation planning with `define-pppr-minimal-core`.
- [x] 6.2 Align implementation planning with `define-pppr-runtime-protocol`.
- [x] 6.3 Align implementation planning with `phase-pppr-host-neutral-mvp`.
- [x] 6.4 Validate this change with `reffy plan validate implement-pppr-phase2-cli-host`.
