# Tasks

## 1. Spec the boundary

- [x] Define the required minimal `pppr` harness capabilities and explicit non-goals.
- [x] Specify how `pppr` relates to `pi` internals: selective reuse is allowed, product-surface inheritance is not required.
- [x] State explicitly that the CLI is a first host, not the architectural center.

## 2. Spec the runtime shape

- [x] Define the required host-neutral core boundary.
- [x] Define the required first-host CLI interaction model.
- [x] Define the required minimal tool contract.
- [x] Define the required instruction-loading behavior.
- [x] Define the required observability and session logging expectations.

## 3. Prepare implementation follow-up

- [x] Identify the core architectural seams that later implementation work must preserve for future embedding.
- [x] Align this change with `phase-pppr-host-neutral-mvp` so the two plans do not encode conflicting architecture.
- [x] Validate the change so it can serve as the planning baseline for subsequent implementation proposals.
