# Design: extract `pppr` package boundary

## Design goal

Make `packages/pppr` the place a maintainer would naturally modify first when changing `pppr`.

That is the practical meaning of extraction.

## Main design judgment

The next step is not to delete everything inherited from `pi` at once.

The next step is to reverse source ownership:

- `packages/pppr` owns the IR and the official `pppr` package surface
- legacy host code consumes that package
- compatibility paths become downstream adapters rather than upstream authorities

## Required outcomes

### 1. Canonical source ownership

There should be one canonical source tree for:

- `pppr` IR types
- runtime progression
- public `pppr` exports
- focused tests for the IR package

That source tree should be `packages/pppr`.

### 2. Compatibility from the edge inward

If `packages/coding-agent` still exposes a `pppr` executable during migration, it should do so by importing from `packages/pppr`.

The compatibility layer should be visibly secondary:

- thin
- named as legacy or compatibility
- unable to redefine the meaning of the core `pppr` package

### 3. No duplicate core evolution

We should avoid a state where:

- `packages/pppr` evolves one runtime
- `packages/coding-agent/src/pppr/*` evolves another

If duplicate files remain temporarily, they should be replaced by re-exports or removed.

### 4. Build and test bias

Root workflows do not need to be fully cleaned yet, but they should start biasing toward:

- testing `packages/pppr` directly
- building `packages/pppr` directly
- treating failures in unrelated `pi` packages as separate cleanup work rather than as reasons to avoid extraction

## Migration sequence

1. make `packages/pppr` the source of truth for the IR package
2. update legacy executable paths to import from `packages/pppr`
3. remove or flatten duplicate `pppr` core files from `packages/coding-agent`
4. tighten root scripts and docs around the new package boundary
5. only then consider deleting larger inherited packages that are no longer referenced

## Main risk

The main risk is nominal extraction without real ownership transfer.

That would leave:

- a new package that exists
- an old package that still actually owns execution
- two places where maintainers might change the same concept

That is exactly the ambiguity this change should remove.

## Success criterion

This change succeeds when:

- `packages/pppr` is the obvious source of truth
- the current executable path reaches `pppr` through that package
- duplicate `pppr` runtime ownership inside `packages/coding-agent` is reduced to compatibility scaffolding
