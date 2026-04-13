# Tasks

## 1. Define runtime state and serialization

- [x] 1.1 Define the minimum runtime-owned session state.
- [x] 1.2 Define what state must remain outside the core.
- [x] 1.3 Define the initial snapshot shape and continuation boundary.
- [x] 1.4 Define how snapshots reference host-managed observability logs or checkpoints without embedding full provider details.
- [x] 1.5 Define the preferred opaque log-reference fields for snapshots.

## 2. Define protocol inputs and outputs

- [x] 2.1 Define the minimum input event kinds the host can send into the runtime.
- [x] 2.2 Define the minimum output event kinds the runtime emits.
- [x] 2.3 Define stop/completion signaling and host-visible status events.
- [x] 2.4 Define the common event envelope shared by protocol inputs and outputs.
- [x] 2.5 Keep `message.assistant` as a single output event kind with structured payload segments in Phase 1.
- [x] 2.6 Define the Phase 1 payload categories for `message.assistant` and its structured segments.

## 3. Define effect requests and results

- [x] 3.1 Define the common envelope for effect requests.
- [x] 3.2 Define the common envelope for effect results, including success, denial, and failure paths.
- [x] 3.3 Identify the smallest initial effect kinds needed for the first host and minimal tool contract.
- [x] 3.4 Define model inference as a host-mediated effect in the initial protocol cut.
- [x] 3.5 Define the initial payload categories expected for each Phase 1 effect kind.
- [x] 3.6 Confirm that effect payloads remain category-shaped rather than provider-specific blobs.

## 4. Define validation expectations

- [x] 4.1 Define how the core can be tested with synthetic effect fulfillment.
- [x] 4.2 Define snapshot/restore expectations for continuation and replay-oriented testing.
- [x] 4.3 Confirm the protocol does not require direct terminal, shell, filesystem, or network ownership in the core.
- [x] 4.4 Confirm that observability logs can be externalized without becoming part of required core-owned session state.

## 5. Align with MVP sequencing

- [x] 5.1 Align this Phase 1 change with `define-pppr-minimal-core`.
- [x] 5.2 Align this Phase 1 change with `phase-pppr-host-neutral-mvp`.
- [x] 5.3 Validate the change with `reffy plan validate define-pppr-runtime-protocol`.
