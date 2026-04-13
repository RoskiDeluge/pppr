# Tasks

## 1. Phase 1: define the host-neutral core

- [ ] 1.1 Define the minimal runtime state machine and serialization boundary.
- [ ] 1.2 Define protocol schemas for inputs, outputs, effect requests, effect results, and snapshots.
- [ ] 1.3 Identify the smallest initial effect kinds needed for MVP.
- [ ] 1.4 Validate that the core can be tested without direct filesystem, shell, network, or terminal dependencies.

## 2. Phase 2: build the CLI-first MVP host

- [ ] 2.1 Define the CLI host responsibilities versus core responsibilities.
- [ ] 2.2 Map `read`, `edit`, `write`, and `bash` to host-fulfilled capability requests.
- [ ] 2.3 Preserve hierarchical instruction loading and observable session/event output through the host boundary.
- [ ] 2.4 Keep command execution synchronous for the first CLI implementation unless a concrete requirement proves otherwise.

## 3. Phase 3: stabilize capability/provider contracts

- [ ] 3.1 Define local provider contracts for command execution, content access, patch application, model inference, and persistence.
- [ ] 3.2 Define explicit approval, denial, and failure result paths for effect fulfillment.
- [ ] 3.3 Verify that user-facing tool semantics remain stable even if provider implementations change.

## 4. Phase 4: prove host-neutrality

- [ ] 4.1 Implement one non-interactive or non-CLI proof host using the same core and protocol.
- [ ] 4.2 Exercise replay, testing, or embedding flows through that proof host.
- [ ] 4.3 Confirm that no CLI-only state or hidden side channel is required for core execution.

## 5. Verification and sequencing review

- [ ] 5.1 Validate this change with `reffy plan validate phase-pppr-host-neutral-mvp`.
- [ ] 5.2 Review overlap and tension with `define-pppr-minimal-core`.
- [ ] 5.3 Use this phased plan as the baseline for implementation proposals and code sequencing.
