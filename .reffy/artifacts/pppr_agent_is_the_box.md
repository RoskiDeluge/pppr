# Summary: `pppr`, `pi`, and "the agent is the box"

## Why this artifact exists

This note captures the main architectural conclusion from a recent discussion about how `pppr` should be understood relative to `pi`, its forks, and other local agentic applications.

The core question was whether `pppr` is simply another host-shaped agent app, or whether it is trying to invert that pattern more fundamentally.

## Main claim

`pppr` is trying to codify a different primary assumption:

- not that the host environment is the box and the agent lives inside it
- but that the agent runtime is the box and host environments surround it

That is the architectural inversion.

## How many local agent apps are usually organized

Many local agentic applications, including projects built from or influenced by `pi` primitives, seem to organize themselves around a concrete host environment first.

In practice, that often means:

- a local terminal is the main interaction surface
- a local process boundary is the main execution boundary
- IPC, localhost services, or containers are treated as the natural substrate
- tools are understood as operations performed directly inside that host

This is not necessarily a mistake. It is often a pragmatic choice that optimizes for:

- speed of implementation
- known operator workflows
- direct access to local machine resources
- a simpler initial product model

## How `pppr` differs

`pppr` is trying to reverse the center of gravity.

The intended architecture is:

- the runtime owns the session boundary
- the runtime owns serializable state and continuation semantics
- the runtime expresses work as effects
- the host fulfills those effects
- the host does not define what the agent fundamentally is

In this framing, the CLI, a remote actor host, an embedded harness, or some future distributed substrate are all just different host shapes around the same runtime contract.

## The phrase "the agent is the box"

The phrase "the agent is the box" is a useful shorthand for the architectural move:

- the unit of execution is the agent runtime
- the machine is only one possible substrate
- persistence, observability, model access, command execution, and capability access are all host-mediated resources around that runtime
<!-- WebMCP, for instance, is a move in this direction. Agentic tool affordances will become native to the web platform, which means that any agent navigating a website will be able to interact with the website and its data through tools. This style of interaction already puts tool management in the broader web host environment. -->

More precisely:

- `pppr` defines the execution boundary
- hosts provide resources to that boundary
- snapshots, effects, and event history belong to the agent contract rather than to one machine-local process model

## Fairness to `pi`

It would be unfair to say `pi` got the architecture wrong.

A better and more accurate contrast is:

- `pi` and many of its forks are optimized around a concrete host reality
- `pppr` is optimized around a host-neutral agent reality

That means the difference is not mainly about quality. It is about architectural center.

`pi` can still provide very useful primitives and implementation ideas. But `pppr` is trying to move the center of abstraction upward:

- from local hosts to runtime contracts
- from machine assumptions to effect boundaries
- from environment-specific orchestration to portable agent state

## What the MVP proved

The MVP work established that this is more than a slogan.

It now has explicit architectural form:

- a host-neutral core
- a runtime protocol
- effect-oriented host boundaries
- a CLI host on top of that boundary
- hardened provider and policy seams
- a non-CLI proof host that runs the same runtime without hidden CLI-only state

That is what makes it reasonable to say that `pppr` has actually codified the idea that the agent is the box.

## Bottom line

The cleanest summary is:

- `pi`-style systems often treat the host as primary and the agent as something organized inside that host
- `pppr` tries to treat the agent runtime as primary and the host as a fulfillment layer around it

That is the inversion, and it is the main conceptual identity of `pppr` so far.
