# Proposal: implement `pppr` Phase 3 capability seams

## Why

The repo now has the first two MVP layers in place:

- `define-pppr-minimal-core` defines the product boundary
- `define-pppr-runtime-protocol` defines the Phase 1 runtime contract
- `implement-pppr-phase1-runtime` realizes that contract in code
- `implement-pppr-phase2-cli-host` proves the first concrete host can drive the runtime

That leaves the next MVP risk:

- local providers can still harden into accidental architecture
- approval and policy behavior can still remain too implicit
- visible tool semantics can still drift if provider details leak upward

Phase 3 should therefore tighten the capability seams before Phase 4 adds a second proof host. The goal is not broader provider support yet. The goal is to make the existing provider boundary durable enough that another host or provider implementation can reuse it without inheriting CLI-local assumptions.

## What Changes

This proposal defines the implementation plan for realizing Phase 3 of `pppr`:

- extract and stabilize capability/provider contracts around the approved Phase 1 effect kinds
- make approval, denial, policy, and execution metadata explicit at the host/provider boundary
- define a stable normalization layer from provider outcomes into runtime-visible effect results
- preserve the visible `read` / `edit` / `write` / `bash` contract while allowing provider implementations to vary
- add verification that provider swaps and policy decisions do not alter core/runtime semantics

This phase should harden the seam between:

- runtime protocol and host
- host and provider implementations
- visible tool semantics and underlying local providers

It should not expand the product surface or introduce the second non-CLI proof host. That remains Phase 4 work.

## Implementation Slices

### Slice 1: provider contract extraction

- define stable provider interfaces for content, command, model, persistence, and observability work
- separate provider contracts from the first local implementations
- make the capability boundary readable without depending on CLI entrypoints

### Slice 2: policy and approval semantics

- make approval requirements and execution policy explicit in requests and provider decisions
- define denied, failed, and success outcomes consistently across provider classes
- ensure policy metadata stays optional and host-owned rather than becoming core-owned provider detail

### Slice 3: normalization and tool stability

- centralize normalization from provider outcomes into approved effect result envelopes
- preserve stable visible tool semantics even if providers or policy logic change
- verify that user-facing `read`, `edit`, `write`, and `bash` behavior is still expressed through the same capability surface

### Slice 4: provider-swap and policy verification

- add tests that swap provider implementations behind the same contracts
- add tests for approval-required, denied, and failed paths across representative effect kinds
- prove that runtime and host progression still depend only on protocol events and normalized effect results

## Impact

Affected code areas will likely include:

- provider contract and adapter modules under `packages/coding-agent/src/pppr/`
- local provider implementations for content, command, model, persistence, and logs
- effect normalization helpers and host-policy plumbing
- Phase 3 tests around provider substitution and policy-denial behavior

Expected impact:

- the current local provider set stops looking like hidden architecture
- later provider changes can be reviewed as boundary-preserving implementation swaps
- Phase 4 can add a second host without first untangling provider leakage from the CLI host

## Reffy References

- `pppr_sans_io_neutral_host.md` - source rationale for keeping host work behind explicit capability seams
- `pppr_abstraction_shift.md` - source rationale for treating capabilities and invariants as primary architectural structure
