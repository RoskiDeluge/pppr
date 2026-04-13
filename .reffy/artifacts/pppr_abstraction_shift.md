# Summary: `pppr` and the abstraction shift

## Why this artifact exists

This note summarizes the main ideas that emerged while rethinking `pppr` beyond a minimal CLI harness.

The discussion started from a practical design question about host environments and ended in a broader architectural shift:

- away from treating the terminal, localhost, or IPC as the natural center of the system
- toward treating `pppr` as a host-neutral runtime organized around protocols, capabilities, and invariants

## Main realization

Building `pppr` primarily for traditional host environments is likely too narrow.

The more future-facing assumption is that agent harnesses will increasingly need to:

- operate in varied environments
- compose their own usable stack from available capabilities
- avoid overcommitting to any single substrate such as shells, terminals, or local processes

This led to the idea that `pppr` should be approached using a sans I/O architecture.

## Sans I/O direction

The core of `pppr` should be a runtime that:

- accepts inputs
- evolves state
- emits outputs
- requests effects
- consumes effect results

Without directly owning:

- stdin/stdout
- terminals
- local filesystems
- process execution
- sockets
- local persistence
- direct model invocation

Those concerns should be handled by host adapters and capability providers.

## Reframing the role of the CLI

The CLI is still a useful and valid first host.

But it should no longer define the architecture.

The better framing is:

- `pppr` is not primarily a terminal coding agent
- `pppr` is a host-neutral runtime that can inhabit a terminal among other environments

This preserves the practicality of a CLI-first implementation while preventing the CLI from becoming the conceptual center of the system.

## Tools become capabilities

The familiar `read`, `edit`, `write`, and `bash` model is still useful at the user-facing layer.

But internally these should be understood as capability contracts rather than direct host actions.

That means the core should request effects such as:

- content reads
- structured edits
- command execution
- persistence operations
- network fetches
- model inference

And let the host decide how those requests are realized.

## Effect-oriented architecture

One of the key design shifts is from hardwired tool execution to explicit effect requests.

Instead of the core directly executing a shell command, it should emit a request such as:

- `effect.requested { kind: "command", ... }`

And later consume:

- `effect.completed { kind: "command", ... }`

This makes host assumptions explicit and keeps the core portable.

## The abstraction shift

Another major point in the discussion was philosophical rather than purely technical.

Older computing intuitions were grounded in relatively stable substrates such as:

- files
- processes
- sockets
- terminals
- kernels

The newer challenge is not to abandon intuition, but to relocate it.

The right grounding layer may increasingly be:

- invariants
- protocols
- capability boundaries
- state transition systems
- effect boundaries

So the shift is not from grounded thinking to ungrounded thinking.

It is from substrate-centered intuition to contract-centered intuition.

## Biological analogy

The ribosome analogy helped clarify the direction.

A ribosome does important work without directly forcing the whole organism to act. It transforms encoded instructions into outputs that are then taken up by surrounding systems.

That suggests a similar role for `pppr-core`:

- it should construct useful representations
- it should rely on surrounding systems to realize those representations
- it should not assume direct control over the entire stack

This makes `pppr` feel less like a direct operator and more like a representational constructor inside a larger execution ecology.

## Minimal future-facing architecture

The architectural shape implied by the discussion is roughly:

### 1. `pppr-core`

A pure runtime responsible for:

- session state
- context construction
- conversation progression
- event emission
- effect planning
- serialization

### 2. `pppr-protocol`

A small schema layer for:

- input events
- output events
- effect requests
- effect results
- snapshots

### 3. host adapters

Examples:

- CLI host
- shell host
- browser host
- HTTP host
- embedded runtime host

### 4. capability providers

Examples:

- filesystem provider
- command provider
- persistence provider
- model provider

## What should remain true

Even with this architectural broadening, several values from the original `pppr` and `pi` discussions remain intact:

- keep the visible contract small
- keep the core understandable
- preserve observability
- avoid speculative product sprawl
- defer complexity unless it protects a real invariant

So the direction is not “make `pppr` more abstract for its own sake.”

It is “make the right layer abstract while keeping the overall system minimal.”

## Bottom line

The main outcome of the discussion is this:

`pppr` should likely evolve from a minimal CLI harness into a minimal host-neutral runtime whose first host happens to be the CLI.

The deeper design discipline is to relocate intuition upward:

- from hosts to protocols
- from substrates to invariants
- from direct actions to effect contracts

That shift appears to be the most important conceptual move for `pppr` going forward.
