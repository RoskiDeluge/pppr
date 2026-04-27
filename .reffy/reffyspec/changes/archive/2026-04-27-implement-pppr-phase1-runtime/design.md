# Design

## Intent

This change is not another protocol-planning pass. It is the implementation bridge from the approved Phase 1 protocol contract to executable runtime code.

The implementation should prioritize:

- preserving the core/host boundary
- keeping the first runtime artifact minimal
- making state transitions and effect handling directly testable

## Delivery shape

The implementation should be staged so each slice leaves behind a usable, testable increment.

### Stage 1: protocol modules

Deliver:

- TypeScript definitions for input events, output events, effect requests, effect results, snapshots, lifecycle values, and assistant segment categories
- basic validation helpers or constructors where needed to avoid ad hoc object assembly across the codebase

Constraints:

- no `any`
- no provider-specific shapes in required protocol fields
- avoid coupling protocol modules to host or CLI code

### Stage 2: runtime state container and transitions

Deliver:

- a runtime state container that can start, resume, accept user messages, emit effect requests, and consume effect results
- transition helpers for `idle`, `running`, `awaiting_effect`, `stopped`, and `failed`
- output emission consistent with the approved lifecycle/status payload categories

Constraints:

- transitions must be serializable and deterministic enough for synthetic tests
- active effect correlation must remain explicit
- no direct shell, file, network, or model SDK ownership in the core

### Stage 3: snapshot/restore path

Deliver:

- snapshot creation from runtime state
- restore/resume from snapshot
- opaque observability references carried in snapshots without storage-backend assumptions

Constraints:

- snapshots stay continuation-oriented, not full log dumps
- persistence stays at the effect boundary, not as direct storage I/O in the core

### Stage 4: synthetic-host test harness

Deliver:

- tests that feed protocol inputs into the runtime and inspect protocol outputs
- tests that fulfill effect requests with synthetic results
- tests for success, denied, failed, and resumed flows

Constraints:

- tests should not require live shell execution or real file/network access in the runtime layer
- fixtures should model host behavior through protocol objects, not through hidden mocking of core internals

## Suggested work order

1. Define protocol types and shared constructors.
2. Implement runtime state shape and transition helpers.
3. Implement effect request/result handling and lifecycle output emission.
4. Implement snapshot serialization and restoration.
5. Add synthetic-host tests covering the approved transition paths.

## Verification expectations

Before this change is considered complete, implementation should demonstrate:

- protocol objects can be created and consumed without host-specific imports
- runtime lifecycle transitions match the Phase 1 spec
- pending effect handling survives snapshot/restore
- external observability references survive snapshot/restore without backend-specific assumptions
- tests exercise the runtime entirely through the protocol boundary

## Open Questions

- Which repo package or module should own the first `pppr` runtime artifact so it can evolve cleanly into the future CLI host without inheriting unrelated `pi` surface?
