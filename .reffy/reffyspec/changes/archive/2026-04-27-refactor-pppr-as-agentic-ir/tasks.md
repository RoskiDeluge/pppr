# Tasks

## 1. Define the new architectural baseline

- [x] 1.1 State explicitly that `pppr` is an intermediate representation layer, not a harness.
- [x] 1.2 State explicitly that host bridges, shell execution, and runtime orchestration are edge concerns.
- [x] 1.3 State explicitly that preserving inherited `pi` structure is not a planning goal.

## 2. Define the minimum viable implementation target

- [x] 2.1 Define the minimum IR contract `pppr` must own.
- [x] 2.2 Define the smallest acceptable Node-host adapter boundary.
- [x] 2.3 State explicitly that a single TypeScript file is an acceptable first clean implementation if it satisfies the contract.

## 3. Audit inherited `pi` surface

- [x] 3.1 Inventory inherited packages, scripts, and runtime surfaces in the repo.
- [x] 3.2 Classify each as `keep`, `move to adapter`, `migration-only`, or `delete`.
- [x] 3.3 Identify which current package boundaries are unjustified under the new IR framing.

## 4. Plan the collapse

- [x] 4.1 Define the preferred target repo shape after refactor.
- [x] 4.2 Define the migration sequence from current monorepo layout to the preferred target shape.
- [x] 4.3 Define deletion criteria for inherited `pi` code once the new path is proven.

## 5. Prepare implementation follow-up

- [x] 5.1 Identify the first implementation slice that proves the new architecture with the least code.
- [x] 5.2 Identify validation criteria that prove `pppr` is no longer architecturally defined by `pi`.
- [x] 5.3 Validate this change with `reffy plan validate refactor-pppr-as-agentic-ir`.
