# State of the Union: `pppr`

## Why this artifact exists

This note is meant to give an external project a concise picture of where `pppr` is headed, what has already been established, and what assumptions are safe to make if that project intends to connect to `pppr`.

## Main direction

`pppr` is being built as a minimal, host-neutral agent runtime.

The governing idea is:

- the agent runtime is the primary execution boundary
- host environments are fulfillment layers around that boundary
- the machine, terminal, container, actor host, or web substrate are all secondary concerns

In short:

- the agent is the box

## What has been established so far

The MVP architecture has been sketched and implemented around four main phases:

- a host-neutral core definition
- a concrete runtime protocol for session state, lifecycle, effects, snapshots, and observability references
- a first CLI host built around that runtime boundary
- a non-CLI proof host showing that the runtime can be driven outside terminal assumptions

This means `pppr` is no longer just a CLI-shaped app with abstractions around it. It now has an explicit core/host split.

## Architectural center

The main architectural commitments of `pppr` are now:

- runtime-owned session and lifecycle state
- host-mediated effect fulfillment
- serializable continuation via snapshots
- append-only, host-managed observability/log references
- provider and policy seams that stay outside the core

The design bias is always to push as much environment-specific behavior as possible out of the core.

## Relationship to host environments

`pppr` should not need to know whether it is running:

- in a local CLI
- in a remote actor system
- in a sandboxed workspace
- in a distributed or embedded execution substrate

What changes is the host.

What should remain stable is:

- the runtime contract
- the effect contract
- the continuation model
- the visible agent semantics

## What an external project should assume

If another project wants to connect to `pppr`, the safest current assumption is:

- `pppr` wants to be hosted, not embedded as a bag of local-machine assumptions

In practical terms, an external host should expect to provide or mediate:

- model inference
- content and command capabilities
- persistence and snapshot storage
- observability/event storage
- approval and policy decisions
- operator or caller-facing rendering

That host can be local or remote. The key is that those responsibilities stay outside the core.

## Likely integration direction

For a project that wants to connect to `pppr`, the strongest fit is to treat `pppr` as:

- a small runtime kernel for agent execution
- a portable state/effect machine
- a substrate that can sit inside a larger host environment without becoming host-specific itself

That includes actor-oriented systems, remote micro-agent fabrics, and environments where capabilities are already exposed as addressed services rather than local process calls.

## Current practical status

The MVP architectural shape is in place, but the project should still be understood as a foundation rather than a finished product surface.

The important thing that is now true is:

- the core/host boundary is explicit
- multiple host shapes have been modeled against it
- the project direction is now structurally clear

The important thing that remains true is:

- future work will deepen the live execution path, real host integrations, and richer runtime behavior on top of this boundary

## Bottom line

The current state of `pppr` is:

- a minimal cross-host agent runtime project
- organized around the claim that the agent, not the machine, is the primary unit of execution
- intended to support both local and remote host environments without making any one of them architecturally central

That is the main direction of the project at this stage.
