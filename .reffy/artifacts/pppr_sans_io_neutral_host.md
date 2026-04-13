# Exploring `pppr` as a sans I/O agent harness

## Why this artifact exists

This note captures a shift in direction for `pppr`.

The earlier framing treated the CLI as the primary host environment and assumed that useful agent harnesses would mostly live inside familiar containers such as:

- local terminals
- localhost services
- IPC-connected processes
- standard Linux or desktop environments

That assumption now looks too narrow.

The stronger future-facing assumption is that an agent harness should be able to operate inside a neutral computational environment and assemble its functional stack from whatever capabilities are available where it is invoked.

That suggests building `pppr` with a sans I/O architecture.

## Core thesis

`pppr` should not fundamentally be a terminal app, an IPC app, or a localhost app.

It should be a host-neutral agent runtime that:

- accepts inputs
- evolves state
- emits outputs
- requests effects
- consumes effect results

Without intrinsically owning:

- stdin/stdout
- process spawning
- filesystem access
- sockets
- terminal rendering
- HTTP serving
- local model execution

Those concerns belong to host adapters and capability providers, not to the core.

## Why this matters

If agent harnesses are built around a specific host assumption, then every new environment becomes an awkward port.

But if the harness is built sans I/O, then the same core can be embedded in:

- a CLI
- a shell
- a terminal emulator
- a browser sandbox
- a local daemon
- a remote executor
- a peer-to-peer environment
- a future runtime that dynamically assembles its own stack

The CLI can still be the first host. It should just stop being the conceptual center of the architecture.

## Reframing the product

The earlier minimal-v1 idea for `pppr` was still useful, but it now needs a different center of gravity.

Instead of:

`pppr` = a minimal CLI coding harness

The better framing is:

`pppr` = a minimal host-neutral agent runtime with a CLI host adapter as the first concrete shell

That keeps the minimalism while removing the terminal from the architectural center.

## What “sans I/O” means here

In this context, sans I/O means the core runtime should be pure with respect to environmental effects.

The core should:

- take structured input
- produce deterministic state transitions
- emit structured events
- describe requested side effects

The core should not:

- directly run commands
- directly read or write files
- directly call model providers
- directly open network connections
- directly persist state
- directly render UI

Those operations should be requested as effects and fulfilled by an external host.

## Architectural consequence

The central boundary should shift from “tool calls” to “effect requests”.

For example, instead of the runtime meaningfully executing `bash`, it should emit something like:

- `effect.requested { kind: "command", command: "rg foo src" }`

And the host environment decides:

- whether this effect is allowed
- how it is executed
- whether it runs locally, remotely, or via a synthetic stack
- how output is returned

The runtime then receives:

- `effect.completed { kind: "command", ...result }`

This keeps the core pure and makes host assumptions explicit.

## Capabilities instead of built-ins

Today it is tempting to define `read`, `edit`, `write`, and `bash` as built-in tools.

For a sans I/O architecture, those should be understood as capability contracts rather than intrinsic host actions.

Possible capability categories:

- content read
- content write
- structured patch/edit
- command execution
- network fetch
- persistence
- model inference
- identity/credential access
- clock/time

The runtime can still expose user-facing tools named `read`, `edit`, `write`, and `bash`, but internally they should resolve into capability requests rather than direct system behavior.

## The future-facing assumption

The important assumption is not that the host already provides the full stack.

The assumption is that the runtime may need to build or compose its own usable stack out of partial available capabilities.

That means `pppr` should be comfortable in environments where:

- command execution exists but filesystem access is virtual
- model access is remote but persistence is local
- edits must be represented as patches rather than file writes
- shell behavior is synthetic rather than POSIX-native
- there is no terminal at all

This is a better long-term fit for agentic systems than tying the product identity to traditional local-host assumptions.

## A minimal architecture sketch

The cleanest decomposition looks like this:

### 1. `pppr-core`

A pure runtime responsible for:

- session state
- prompt/context construction
- conversation progression
- effect planning
- event emission
- serialization

### 2. `pppr-protocol`

A schema layer for:

- input events
- output events
- effect requests
- effect results
- session snapshots

### 3. `pppr-host-*`

Concrete host adapters such as:

- `pppr-host-cli`
- `pppr-host-shell`
- `pppr-host-http`
- `pppr-host-browser`

### 4. `pppr-capability-*`

Capability providers such as:

- filesystem provider
- command provider
- model provider
- persistence provider

The host composes providers and mediates requests from the core.

## What should remain minimal

This direction should not become an excuse for a giant abstraction framework.

Minimalism still matters.

The first host-neutral cut only needs a few explicit boundaries:

- state
- events
- effects
- capability interfaces

The mistake would be to prematurely generalize everything else.

The right approach is:

- make the core pure
- keep the protocol small
- keep the CLI thin
- delay broader host proliferation until the core proves itself

## Relationship to the earlier CLI-first artifact

The earlier `pppr_minimal_harness.md` artifact is still useful, but some emphasis changes:

- the CLI remains a valid first host
- the four-tool baseline remains a valid first user-facing contract
- observability remains central

But:

- the CLI should no longer define the architecture
- tool execution should become host-mediated effects
- portability should be structural, not aspirational

In short, the minimal CLI idea remains tactically useful, but the strategic architecture should be sans I/O.

## Suggested planning implication

Future ReffySpec work should likely shift from:

- defining the smallest viable CLI harness

Toward:

- defining the smallest viable sans I/O `pppr` core
- defining the event/effect protocol
- defining the first CLI host adapter on top of that core

## Bottom line

If `pppr` is built as “a terminal coding agent,” it may be useful now but structurally dated.

If `pppr` is built as “a host-neutral agent runtime that can inhabit a terminal among other environments,” it has a much better chance of remaining relevant as agent execution environments evolve.
