# Exploring `pppr`: cross-pollinating `pi` minimalism with Hermes capabilities

## Why this artifact exists
This note explores how `pppr` could borrow selected ideas from Hermes without abandoning the minimal harness direction laid out in [`pppr_minimal_harness.md`](./pppr_minimal_harness.md).

The question is not whether `pppr` should become "like Hermes." Hermes is a broad agent product with messaging surfaces, memory systems, skills, scheduling, delegation, and many runtime backends. The useful question is narrower:

Which Hermes ideas strengthen a small, observable, CLI-first agent harness, and which ideas should stay outside the `pppr` core?

## The basic tension
The existing `pppr` direction inherits its philosophical center from `pi`:

- small visible surface area
- minimal tool contract
- hierarchical context files
- explicit, inspectable state
- CLI-first execution

Hermes, by contrast, is attractive because it treats the agent as a durable operator that can learn, remember, move across surfaces, and keep working over time.

These are not automatically incompatible. But they live at different layers.

The `pi` influence says the harness should stay small and legible.
The Hermes influence says the agent should accumulate leverage across sessions and environments.

The right synthesis is probably:

`pppr` core should stay `pi`-shaped, while some Hermes-style capabilities should be designed as explicit, optional layers around that core.

## What Hermes seems to contribute conceptually
From the Hermes README, the most relevant ideas are not the full product surface. The useful ideas are the ones that imply durable agent behavior:

- persistent memory across sessions
- explicit skills as reusable procedural knowledge
- conversation and session search
- multiple interaction surfaces beyond a local terminal
- scheduled execution
- a core agent that can run in different runtime environments

These are powerful because they answer a real weakness in many minimal harnesses: a session can be clean and inspectable, but also disposable and forgetful.

That matters for `pppr` if it is intended to become more than a one-shot CLI wrapper.

## Where Hermes and `pi` actually align
At first glance Hermes looks much larger than `pi`, but there are a few deeper alignments.

### 1. Context files as a durable control surface
Hermes explicitly calls out context files. `pi` already treats hierarchical `AGENTS.md` loading as one of its strongest portable ideas.

This suggests a strong shared principle:

- durable agent behavior should be shaped by user-owned files

That means `pppr` can combine:

- `pi`'s visible, hierarchical instruction model
- Hermes's emphasis on long-lived context shaping

without adding hidden agent state too early.

### 2. The agent should improve through use
Hermes pushes hard on learning loops, memory, and skill accumulation. `pi` is more skeptical of harness complexity, but it does not reject improvement through use. It rejects hidden, hard-to-audit machinery.

So the real compatibility test is not "should `pppr` learn?"

It is:

- can `pppr` make learning explicit, file-backed, inspectable, and optional?

If yes, then Hermes is additive rather than contradictory.

### 3. A stable core should outlive its first UI
`pppr_minimal_harness.md` argues for a UI-agnostic core event stream so the CLI can remain primary while future hosts consume the same model. Hermes's runtime story points in a similar direction: the same agent can live in terminal and messaging environments.

This is a real cross-pollination opportunity:

- use `pi` to define the minimal agent core
- use Hermes to pressure-test whether that core can survive multiple surfaces later

## What `pppr` should probably borrow from Hermes

### 1. Explicit skill artifacts, not hidden self-modification
Hermes's most interesting idea may be skill creation from experience. For `pppr`, the important adaptation is not autonomous self-improvement as a magic behavior. The important adaptation is to treat successful workflows as explicit, user-reviewable artifacts.

That suggests:

- skills should be plain files
- skill generation should create drafts, not silently mutate behavior
- skill usage should be visible in the transcript
- skill revision should be inspectable and attributable

This fits both `pi`'s observability requirement and Hermes's leverage-through-reuse story.

### 2. Searchable session memory built on event logs
`pppr_minimal_harness.md` already argues for append-only session and event logs. Hermes suggests a practical extension:

- those logs should not only exist, they should be searchable and summarizable

For `pppr`, this should likely begin with the most boring possible version:

- local transcript storage
- deterministic metadata
- grep-friendly or SQLite-backed indexing
- explicit retrieval actions initiated by the user or plainly announced by the harness

This turns "memory" from mystical personalization into inspectable retrieval over prior work.

### 3. Optional durable user/project memory
Hermes emphasizes a deepening cross-session model of the user. In `pppr`, that should likely be narrowed and grounded:

- stable user preferences
- durable project constraints
- known environment facts
- recurring workflow notes

These should live in visible files or a clearly inspectable local store, with obvious boundaries between:

- repo-local memory
- user-global memory
- session-local state

This preserves portability and prevents invisible drift.

### 4. Surface portability as a design test, not a v1 feature target
Hermes shows the value of not binding the agent to one machine interface. But `pppr` does not need Telegram, Discord, or Slack to validate its first release.

The useful Hermes lesson is architectural:

- define the `pppr` core so it can later be hosted by CLI, Rust shell, Tauri terminal, or remote transports

This should influence interface boundaries now, without forcing a multi-surface product build immediately.

### 5. Scheduled or unattended work as a narrow future extension
Hermes includes cron-style automation. That should not be a core `pppr` concern yet, but it exposes a valid future use case:

- the harness may need a way to resume a saved session or execute a bounded task non-interactively

That can be deferred, but it is worth keeping in mind when defining session serialization and CLI entrypoints.

## What `pppr` should not borrow yet

### 1. Product breadth
Hermes bundles many things:

- messaging gateway
- many runtime backends
- broad provider support
- large tool surface
- delegation and RPC scripting
- autonomous schedulers

These may be useful in their own right, but importing them into `pppr` now would break the minimal-core discipline described in `pppr_minimal_harness.md`.

### 2. Autonomy that hides causality
Hermes's "self-improving agent" framing is compelling, but `pppr` should be careful. If learning, memory retrieval, or skill selection happens in ways the user cannot inspect, the harness drifts away from the clarity that makes `pi` compelling.

The rule should be:

- no Hermes-style capability belongs in `pppr` core unless its inputs, outputs, and persistence model are easy to inspect

### 3. Parallelization and subagent complexity
Hermes foregrounds delegates and parallel workstreams. `pppr_minimal_harness.md` is right to treat subagents and orchestration layers as likely complexity traps for a first harness.

If parallelism ever arrives in `pppr`, it should come after the single-agent event model, file state model, and transcript model are already strong.

## A useful synthesis for `pppr`
The most coherent hybrid looks like this:

### Layer 1: `pppr` core
This remains close to the current minimal harness thesis:

- CLI-first
- short prompt
- minimal tools
- explicit context loading
- append-only event log
- inspectable file operations

### Layer 2: durable knowledge layer
This is where the best Hermes ideas can land, carefully:

- explicit skills as files
- searchable transcript archive
- optional project/user memory stores
- visible summarization and retrieval workflows

### Layer 3: host adapters
Only later, if needed:

- Rust shell integration
- Tauri terminal integration
- remote or messaging transports
- scheduled entrypoints

This layering lets `pppr` remain coherent as a harness while still gaining some of Hermes's durability and reuse advantages.

## One concrete product thesis worth exploring
A promising interpretation is:

`pppr` should become a minimal coding-agent harness with explicit durable knowledge.

That phrase matters because it keeps the center of gravity on the harness, not on automation theater.

In practice, that would mean:

- `pi` contributes the harness discipline
- Hermes contributes the idea that useful work should leave behind reusable artifacts
- `pppr` turns those artifacts into visible skills, memory notes, and searchable transcripts

This feels more coherent than either extreme:

- not just a stateless CLI wrapper
- not a sprawling multi-surface autonomous agent product

## Suggested next planning move
If this direction still feels right, the next proposal should likely focus on one bounded question:

How should `pppr` represent durable knowledge so that skills, memory, and transcript retrieval remain explicit, local, and compatible with a minimal CLI-first harness?

That proposal should probably cite:

- `what_i_learned.md`
- `pppr_minimal_harness.md`
- `pppr_hermes_cross_pollination.md`
