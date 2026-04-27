# Tasks

## 1. Make `packages/pppr` canonical

- [x] 1.1 Ensure `packages/pppr` owns the authoritative IR/runtime source files.
- [x] 1.2 Ensure `packages/pppr` owns the authoritative focused tests for the IR package.
- [x] 1.3 Ensure the public `pppr` package export surface comes from `packages/pppr`.

## 2. Retarget executable flow

- [x] 2.1 Update the current `pppr` executable path to import its core behavior from `packages/pppr`.
- [x] 2.2 Keep any remaining `pi`-backed host path explicitly marked as legacy or compatibility behavior.
- [x] 2.3 Prevent legacy host code from redefining the `pppr` core package surface.

## 3. Remove duplicate ownership from `packages/coding-agent`

- [x] 3.1 Identify duplicated `pppr` core files still living under `packages/coding-agent/src/pppr/*`.
- [x] 3.2 Remove them or replace them with thin migration-safe re-exports where needed.
- [x] 3.3 Ensure future `pppr` core edits have one obvious home.

## 4. Tighten build and validation bias

- [x] 4.1 Ensure `packages/pppr` builds and passes its focused tests directly.
- [x] 4.2 Ensure root workflows include `packages/pppr` as a first-class target.
- [x] 4.3 Avoid requiring unrelated inherited `pi` packages to define whether `pppr` extraction is valid.

## 5. Validate the change

- [x] 5.1 Run focused validation for the extracted `packages/pppr` package.
- [x] 5.2 Validate this change with `reffy plan validate extract-pppr-package-boundary`.
