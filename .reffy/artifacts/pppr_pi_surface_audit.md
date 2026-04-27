# `pppr` inherited `pi` surface audit

## Why this artifact exists
This audit supports step 3 of the `refactor-pppr-as-agentic-ir` plan:

- inventory inherited packages, scripts, and runtime surfaces
- classify them as `keep`, `move to adapter`, `migration-only`, or `delete`
- identify which current boundaries are unjustified under the `pppr` IR framing

This audit uses the current explicit product decisions:

- `pppr` should become its own package
- existing CLI UX is scaffolding, not product truth
- `pi-ai` may survive temporarily if it helps migration, but it does not get architectural privilege

## Main judgment
The current repo is still materially a `pi` monorepo with a `pppr` subtree inside `packages/coding-agent`.

That is the wrong center of gravity.

The correct target is:

- one first-class `pppr` package
- one thin Node-host adapter for the near term
- optional retained support code only where it directly serves `pppr`
- steady removal of unrelated `pi` packages, names, scripts, and release assumptions

## Inventory and classification

### Packages

#### `packages/coding-agent`
- current role: inherited `pi` coding agent package containing both the old `pi` CLI and the newer `pppr` subtree
- classification: `split`
- keep:
  - `src/pppr/*` as source material for the new `pppr` package
- move to adapter:
  - current `pppr` CLI host code, especially the explicit legacy path now isolated in `src/pppr/legacy-pi-host.ts`
- migration-only:
  - current `pi` CLI entrypoints and shared session/tool scaffolding that only exist to keep the old stack running during extraction
- delete:
  - any `pi`-specific CLI, TUI, extension, or session surfaces that are not needed once `pppr` has its own package and host adapter

judgment:
- `packages/coding-agent` is not a justified long-term boundary for `pppr`
- it is an extraction site, not the destination

#### `packages/agent`
- current role: `@mariozechner/pi-agent-core`
- classification: `delete` from the `pppr` architecture

judgment:
- this package encodes the exact harness-centered assumptions `pppr` is trying to stop inheriting
- any ideas worth keeping should be re-expressed in `pppr`-owned IR or adapter code, not preserved as a dependency

#### `packages/ai`
- current role: `@mariozechner/pi-ai`
- classification: `migration-only`

judgment:
- this is not part of `pppr` identity
- it may remain temporarily as a provider utility layer if it shortens migration
- it should not shape the core package structure or the meaning of the `pppr` abstraction

#### `packages/tui`
- current role: `@mariozechner/pi-tui`
- classification: `delete` from the `pppr` architecture

judgment:
- the current CLI UX is scaffolding
- a TUI library is not part of the representational core and should not block extraction

#### `packages/mom`
- current role: Slack bot built around the `pi` coding agent
- classification: `delete`

judgment:
- unrelated to the current `pppr` target
- should not be carried as part of the product shape

#### `packages/pods`
- current role: GPU pod / vLLM deployment tooling
- classification: `delete`

judgment:
- entirely outside the `pppr` IR direction
- this is a clear inherited `pi` concern

#### `packages/web-ui`
- current role: reusable web UI components built around `pi` surfaces
- classification: `delete`

judgment:
- not part of the current `pppr` refactor target
- may inspire future host work, but should not stay in the critical path now

### Root package and workspace layout

#### root `package.json`
- current role: `pi-monorepo` workspace orchestrator
- classification: `migration-only`, then `replace`

judgment:
- current workspace names, build scripts, and publish scripts all reflect `pi`
- the root should be replaced by a `pppr`-oriented package/workspace layout once extraction is underway

#### `pi-mono.code-workspace`
- classification: `delete`

#### root scripts that assume the old monorepo
- `scripts/release.mjs`
- `scripts/sync-versions.js`
- `scripts/build-binaries.sh`
- root `build`, `dev`, `publish`, and version scripts in `package.json`
- classification: `delete` or `replace`

judgment:
- these are release-management assumptions for the inherited monorepo, not `pppr` essentials

### Top-level support scripts

#### `scripts/browser-smoke-entry.ts`
- classification: `delete`

#### `scripts/cost.ts`
- classification: `migration-only`

#### `scripts/session-transcripts.ts`
- classification: `migration-only`

judgment:
- these may help inspect current behavior during extraction, but they are not part of the intended `pppr` core

### Current `pppr` surfaces inside `packages/coding-agent/src/pppr`

#### `ir.ts`, `runtime.ts`, `runtime-protocol.ts`, `thinking.ts`
- classification: `keep`

judgment:
- these are the closest current match to the desired `pppr` center
- they should move into the dedicated `pppr` package with minimal baggage

#### `main.ts`
- classification: `keep` as a thin entrypoint, but move

judgment:
- the tiny selector entrypoint is valid
- it belongs in the new `pppr` package, not inside `pi-coding-agent`

#### `legacy-pi-host.ts`
- classification: `migration-only`

judgment:
- useful only as an extraction bridge
- the name should remain blunt so nobody mistakes it for the future architecture

#### `cli-host.ts`, `proof-host.ts`, capability provider files, visible-contract files
- classification: `move to adapter`

judgment:
- these are host-side concerns, not the IR itself
- they may survive, but only as host adapters around a standalone `pppr` package

#### `system-prompt.ts`
- classification: `move to adapter`

judgment:
- a system prompt is host/runtime behavior, not the core representation layer

## Unjustified current boundaries

The following boundaries are unjustified under the new `pppr` framing:

1. `pppr` living inside `packages/coding-agent`
2. `pppr` depending on `pi-agent-core` for core meaning
3. `pppr` inheriting release/build orchestration from the full `pi` monorepo
4. `pppr` treating TUI-oriented CLI infrastructure as part of product identity
5. `pppr` sharing package identity, naming, and publishing assumptions with unrelated `pi` products

## Practical consequence

The repo should move toward this bias:

- extract a new `packages/pppr`
- move `src/pppr/*` there
- keep only a thin legacy compatibility bridge where needed
- stop treating unrelated `pi` packages as first-class workspace citizens
- delete whole packages once the new path no longer imports them

## Deletion criteria

Inherited `pi` code should be deleted when all of the following are true:

1. `packages/pppr` provides an equivalent or better `pppr`-owned path for the same responsibility
2. no `pppr` entrypoint imports the inherited surface directly
3. the inherited surface is not needed as a temporary migration adapter
4. focused `pppr` tests cover the replacement path
5. removing the inherited surface does not reintroduce `pi` assumptions through a different dependency edge

This means:

- `migration-only` code stays only while it bridges extraction
- `move to adapter` code survives only if it remains clearly outside the IR core
- whole packages should be deleted once they are no longer on the `pppr` execution path

## Recommended next move

The next implementation step should be:

1. create `packages/pppr`
2. move the current `pppr` IR files there
3. move the thin entrypoint there
4. keep the `legacy-pi-host` only as a temporary adapter
5. retarget the root workspace and scripts around `pppr`, not `pi`

That is the first move that changes the repo shape to match the plan.
