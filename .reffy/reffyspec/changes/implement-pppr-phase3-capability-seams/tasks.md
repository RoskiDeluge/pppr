# Tasks

## 1. Extract provider contracts

- [x] 1.1 Define explicit provider interfaces for content, command, model, persistence, and observability work.
- [x] 1.2 Separate provider contract definitions from the first local provider implementations.
- [x] 1.3 Define the composition boundary that wires providers into Phase 2 effect fulfillment.

## 2. Make policy and approval semantics explicit

- [x] 2.1 Define where approval and policy evaluation happens before provider execution.
- [x] 2.2 Normalize `approval_required`, `denied`, `failed`, and `success` paths across representative effect kinds.
- [x] 2.3 Preserve optional policy and denial details without turning provider-local fields into required protocol structure.

## 3. Stabilize visible tool semantics

- [x] 3.1 Preserve the visible `read`, `edit`, `write`, and `bash` contract above the provider boundary.
- [x] 3.2 Ensure tool-to-capability mapping remains stable if provider implementations change.
- [x] 3.3 Prevent provider-specific shortcuts from redefining user-facing tool meaning.

## 4. Add substitution-oriented verification

- [x] 4.1 Add tests that swap provider implementations behind the same contracts for representative effect kinds.
- [x] 4.2 Add policy-path tests covering approval-required, denied, failed, and success outcomes.
- [x] 4.3 Add tests proving the CLI host still consumes normalized effect results rather than provider-specific side channels.

## 5. Validate and integrate

- [x] 5.1 Align implementation planning with `define-pppr-minimal-core`.
- [x] 5.2 Align implementation planning with `define-pppr-runtime-protocol`.
- [x] 5.3 Align implementation planning with `phase-pppr-host-neutral-mvp`.
- [x] 5.4 Align implementation planning with `implement-pppr-phase2-cli-host`.
- [x] 5.5 Validate this change with `reffy plan validate implement-pppr-phase3-capability-seams`.
