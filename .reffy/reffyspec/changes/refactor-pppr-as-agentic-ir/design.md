# Design: refactor `pppr` as an agentic intermediate representation

## Design goal

The refactor should answer one question cleanly:

`What is the smallest implementation that still makes pppr a durable, reusable intermediate representation for agentic work?`

That question matters more than preserving the current repo shape.

## Core design judgment

The plan should optimize for conceptual correctness before code reuse.

That means:

- inherited `pi` structure is presumptively disposable
- multi-package boundaries need positive justification
- the CLI does not get to define the architecture
- host execution concerns live at the edge
- representation and transition semantics live in the center

## Target shape

The preferred end state is intentionally small.

At minimum, `pppr` needs:

1. a representation contract
- session or task state
- intent representation
- transition rules
- handoff and replay shape
- serialized artifact shape

2. a minimal runtime boundary
- a way to accept inputs
- a way to evolve state
- a way to emit outputs or next actions

3. an optional Node host adapter
- enough logic to let a Node-powered harness call into the IR layer
- no authority to redefine the meaning of the representation

If that can be expressed in one TypeScript file, that outcome is acceptable.

## What should be actively removed from the center

The following categories should be treated as non-core unless a hard requirement proves otherwise:

- shell-oriented harness logic
- local IPC assumptions
- pod- or machine-lifecycle concerns
- transport-specific contracts
- package layering inherited from `pi`
- UX conventions inherited from `pi`
- host-owned tool execution semantics

These may exist in adapters, experiments, or migration shims, but they should not define `pppr`.

## Refactor sequence

### 1. Define the irreducible IR

Write down the minimum stable shape for:

- intent
- tasks
- state
- transitions
- outputs
- serialized artifacts

This is the contract everything else must obey.

### 2. Audit inherited code against the IR

For each inherited package or subsystem, classify it as one of:

- keep in core
- move to adapter
- quarantine as migration-only
- delete

The default should be `delete` unless the code protects the IR or the minimal Node adapter.

### 3. Collapse the implementation

Prefer collapsing modules, packages, and abstractions until the code shape matches the conceptual shape.

This may mean:

- replacing multiple packages with one package
- replacing one package with one file
- turning former runtime layers into plain data structures and pure functions

### 4. Reintroduce structure only when justified

Any new module boundary should exist because it protects:

- the IR contract
- testability
- host isolation
- serialization stability

Not because the old repo already had that boundary.

## Migration guidance

The plan should be willing to break from the current monorepo aggressively.

A practical migration path is:

1. define a new minimal `pppr` entrypoint
2. route one thin Node adapter through it
3. mark inherited `pi` surfaces as deprecated or out of scope
4. delete unused packages and scripts once the new path is proven

## Main risk

The main risk is half-refactoring:

- preserving too much inherited `pi` structure
- renaming harness code as “protocol”
- keeping a large repo whose core identity is still actually a CLI harness

That would produce more abstraction but not the right abstraction.

## Success criterion

The refactor succeeds if a new engineer can inspect the repo and conclude:

- `pppr` is a small representation layer
- host execution concerns are clearly outside it
- inherited `pi` structure no longer defines the product
- the implementation is no larger than the abstraction requires
