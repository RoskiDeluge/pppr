# Tasks

## 1. Land protocol and state types

- [x] 1.1 Add Phase 1 protocol types for inputs, outputs, effect requests, effect results, snapshots, lifecycle values, and assistant segments.
- [x] 1.2 Add helpers or constructors needed to keep protocol object creation consistent and strongly typed.
- [x] 1.3 Ensure the protocol layer has no direct dependency on CLI, shell, filesystem, network, or provider SDK modules.

## 2. Implement runtime progression

- [x] 2.1 Implement runtime state initialization for `session.start`.
- [x] 2.2 Implement snapshot restoration for `session.resume`.
- [x] 2.3 Implement user-message ingestion and the runtime progression entrypoint.
- [x] 2.4 Implement lifecycle transitions for `idle`, `running`, `awaiting_effect`, `stopped`, and `failed`.
- [x] 2.5 Implement output emission for `run.started`, `message.assistant`, `effect.requested`, `status.changed`, `run.completed`, and `run.failed`.

## 3. Implement effect handling

- [x] 3.1 Implement effect request creation with stable request identifiers and correlation metadata.
- [x] 3.2 Implement effect result ingestion for `success`, `denied`, and `failed` outcomes.
- [x] 3.3 Implement the Phase 1 effect kinds: `content.read`, `content.write`, `content.patch`, `command.exec`, `model.infer`, `session.persist`, `log.append`, and `log.resolve`.
- [x] 3.4 Ensure provider-specific data stays out of required core-owned payload handling.

## 4. Implement snapshot and observability references

- [x] 4.1 Implement snapshot serialization for the approved state categories.
- [x] 4.2 Implement snapshot restoration that preserves pending effect correlation and lifecycle state.
- [x] 4.3 Implement opaque log-reference handling in snapshots using `stream`, `start`, `end`, `checkpoint`, and `digest`.
- [x] 4.4 Ensure snapshots do not embed full observability logs or backend-specific persistence details.

## 5. Add verification coverage

- [x] 5.1 Add synthetic-host tests for start, progress, effect wait, effect success, effect denial, and effect failure flows.
- [x] 5.2 Add snapshot/restore tests covering resumed execution and preserved effect correlation.
- [x] 5.3 Add tests proving the runtime can be exercised through protocol objects without direct shell, filesystem, terminal, or network ownership.

## 6. Validate and integrate

- [x] 6.1 Align implementation with `define-pppr-minimal-core`.
- [x] 6.2 Align implementation with `define-pppr-runtime-protocol`.
- [x] 6.3 Run `npm run check` after code changes and resolve all reported issues.
- [x] 6.4 Validate the planning change with `reffy plan validate implement-pppr-phase1-runtime`.
