# Tasks

## 1. Author the deprecation delta

- [x] 1.1 Write the spec delta against `phase-pppr-host-neutral-mvp` removing all five host-neutral MVP requirements.
- [x] 1.2 Author proposal and design that explain the pivot and cite `pppr-package-boundary` as the superseding direction.
- [x] 1.3 Confirm specs describing shipped legacy code are out of scope for this delta.

## 2. Validate the change

- [x] 2.1 Run `reffy plan validate deprecate-host-neutral-mvp-direction`.

## 3. Archive

- [x] 3.1 Archive the change so the delta is merged into the canonical `phase-pppr-host-neutral-mvp` spec.
- [x] 3.2 Verify `.reffy/reffyspec/specs/phase-pppr-host-neutral-mvp/spec.md` no longer asserts the deprecated requirements.
