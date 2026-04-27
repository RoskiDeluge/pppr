# `pppr` as an intermediate representation

## Why this note exists
This captures a sharper architectural break from `pi`.

The earlier direction still carried too much of the `pi` mental model:
- a minimal harness
- a narrow bridge to the host system
- runtime concerns centered on local execution mechanics

That is likely the wrong foundation for `pppr`.

## New framing
`pppr` should be treated as an intermediate representation between:
- a human or agent expressing intent
- an agentic harness that executes inside some host

Under this model:
- `pppr` is not itself the harness
- `pppr` is not primarily a host bridge
- `pppr` is the portable representational layer that a harness can interpret, persist, transform, replay, and hand off

## The key distinction from `pi`
`pi` still assumes it is a minimal agentic harness.

That means `pi` naturally cares about:
- process boundaries
- shell access
- local IPC
- host-level execution details
- narrow runtime bridges

`pppr` should assume something higher-level:
- it can exist within any harness
- the enclosing harness may already own tools, permissions, memory, orchestration, and execution
- the host may be local, remote, embedded, browser-based, or service-based

So `pppr` should not inherit `pi` assumptions by default.

## What `pppr` should own
`pppr` should own the durable shape of the work:
- intent
- task structure
- planning state
- execution metadata
- transitions
- handoff semantics
- replayable artifacts

This is the layer that should remain stable across harnesses and hosts.

## What should move to the edge
Harness-specific or host-specific concerns should stay outside the core `pppr` abstraction:
- shell execution
- local process management
- host bridging
- pod or machine lifecycle
- runtime-specific tool surfaces
- transport details

Those are adapter concerns, not the identity of `pppr`.

## Design test
For any new `pppr` feature, the default question should be:

`Is this part of the portable representation of the work, or is it specific to one harness or host?`

If it is specific to a harness or host, it belongs at the edge.
If it is necessary for durable cross-harness work, it belongs in `pppr`.

## Bottom line
`pppr` should be understood as an intermediate representation layer for agentic work.

That is a higher level of abstraction than `pi`, and it should let us discard many of the assumptions that only make sense when the system itself is trying to be the harness.
