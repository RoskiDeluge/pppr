# Design

## Intent

The purpose of this change is to lock the initial `pppr` effort to a disciplined scope. The design question is not "how much of `pi` can be kept?" The design question is "what is the smallest durable agent harness we can define while preserving the ideas that made `pi` compelling?"

## Core stance

`pppr` should selectively reuse `pi` internals and should not inherit `pi`'s broader product surface by default.

That means the spec should bias toward:

- preserving narrow interfaces
- preserving user-visible behavior
- preserving observability

And it should resist:

- carrying over optional UX/product layers just because they already exist
- introducing abstractions that are not needed to preserve real runtime boundaries
- treating compatibility with every current `pi` feature as success criteria

## Minimal architecture boundary

The spec should define `pppr` as two closely related layers:

- a host-neutral core responsible for model-visible state, context construction, effect planning, and session/event state
- a first host surface responsible for user interaction, local capability fulfillment, and output rendering

This keeps the design simple while preventing the CLI from becoming the conceptual root of the architecture.

## Why the CLI is no longer the architectural center

The CLI remains a valid and likely first operational environment. It is still the easiest place to ship an MVP and preserve operator control.

But the terminal should no longer define the architecture.

The important constraints are:

- the visible contract stays small
- shell outputs stay visible in the first host
- long-running or advanced workflows should still prefer external host tools like `tmux` over built-in process orchestration
- host effects remain explicit rather than baked into the core

## Why host-neutrality matters now

Deferring host-neutrality until after a CLI implementation would recreate the central mistake this pivot is trying to avoid. If direct terminal and shell behavior are wired into the core first, later extraction becomes a refactor instead of a design property.

The right constraint is narrower:

- define the smallest host-neutral core that can support the MVP
- build the CLI as the first concrete host on top of that core
- avoid adding extra hosts or framework layers until the core seam is proven

## First-host interaction model

The first host is expected to remain operationally simple.

The interaction model should be:

- accept a user request in a local interactive session
- resolve the effective instruction context
- run the core until it emits output, requests host work, or reaches a stop condition
- fulfill requested host work locally and feed results back into the core
- stream user-visible progress and outputs without hiding tool activity behind opaque orchestration

This preserves the practical strengths of the CLI environment without allowing terminal mechanics to define core semantics.

## Minimal implementation seams to preserve

Later implementation work should preserve at least these seams:

- a core state boundary that can be serialized and resumed
- an input/output event boundary that does not assume terminal rendering
- an effect request/result boundary for host work
- an instruction-loading boundary that allows local project guidance to be applied without coupling it to one host
- an observability boundary that records enough session and tool activity for inspection and replay-oriented tooling

These seams are intentionally narrow. They are not a mandate to build a large framework.

## Relationship to phased MVP planning

This change defines the baseline product boundary.

The separate `phase-pppr-host-neutral-mvp` change defines implementation sequencing on top of that boundary:

- this change answers what `pppr` is and is not
- the phased plan answers what should be built first, second, and later

The two changes should stay aligned, but this change remains the normative baseline for MVP scope.
