# pppr-ir-core Specification

## Purpose
TBD - created by archiving change refactor-pppr-as-agentic-ir. Update Purpose after archive.

## Requirements

### Requirement: `pppr` SHALL be defined as an intermediate representation layer

`pppr` SHALL be specified as a durable representation layer for agentic work rather than as a standalone harness or host bridge.

#### Scenario: planning defines the core identity

- **GIVEN** a planning artifact or implementation proposal for `pppr`
- **WHEN** it describes the purpose of the system
- **THEN** it MUST describe `pppr` as owning representational concerns such as intent, task structure, state, transitions, handoff semantics, or replayable artifacts
- **AND** it MUST NOT require `pppr` itself to be the enclosing agentic harness
### Requirement: host execution concerns SHALL remain outside the `pppr` core identity

Shell execution, local process management, transport, pod lifecycle, and host-specific tool surfaces SHALL be treated as adapter concerns unless a requirement explicitly places them in the core.

#### Scenario: evaluating a new feature

- **GIVEN** a proposed new `pppr` capability
- **WHEN** that capability is specific to one host or runtime substrate
- **THEN** the default planning outcome MUST place it at the adapter edge rather than in the core `pppr` identity
### Requirement: inherited `pi` structure SHALL require positive justification

Inherited packages, workflows, module boundaries, and runtime assumptions from `pi` SHALL NOT be preserved by default.

#### Scenario: auditing inherited repo structure

- **GIVEN** an inherited package, script, or subsystem from `pi`
- **WHEN** maintainers evaluate whether it remains part of `pppr`
- **THEN** the burden of proof is to show that it directly protects the `pppr` intermediate representation contract or a deliberately thin host adapter
- **AND** otherwise it SHOULD be moved, quarantined, or deleted
### Requirement: `pppr` MAY collapse to a minimal TypeScript implementation

The implementation MAY collapse to a single TypeScript file or another very small code shape if that is sufficient to expose the `pppr` intermediate representation contract cleanly.

#### Scenario: selecting an implementation shape

- **GIVEN** maintainers are choosing between preserving inherited multi-package structure and collapsing the implementation
- **WHEN** a smaller implementation satisfies the required `pppr` contract
- **THEN** the smaller implementation SHOULD be preferred
- **AND** preserving larger inherited structure is NOT required
### Requirement: the `pppr` core SHALL be sans-I/O

The `pppr` core under `packages/pppr/src/` SHALL be sans-I/O. Concretely:

- The core MUST NOT import platform-specific modules. This includes (but is not limited to) `node:*` (e.g. `node:crypto`, `node:fs`, `node:path` for behavior, `node:process`), `cloudflare:*`, `bun:*`, and `deno:*`.
- The core MUST NOT call ambient global I/O surfaces from inside transitions or constructors. This includes (but is not limited to) `fetch`, `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`, `crypto.randomUUID` (whether via the Web Crypto global or a Node import), `Date.now` / `new Date()`, `performance.now`, `console.*` used for control flow (incidental diagnostic logging is permitted but MUST NOT influence state transitions), and any filesystem, network, or process-spawning API.
- The core MUST receive identity (event ids, run ids, request ids) and time (timestamps) as **inputs**, either as caller-supplied fields on input events / explicit helper arguments or via a capability bag passed at runtime construction. Self-sourcing identity or time inside the core is a violation of this requirement.
- Side effects on the outside world (model invocation, persistence, log append/resolve, command execution, content read/write/patch) MUST be expressed as effect requests through the existing effect contract (`PROTOCOL.md` §4) and fulfilled by a host adapter.

`structuredClone` is explicitly permitted: it is a standard cross-platform global with no I/O semantics.

This requirement strengthens, and does not conflict with, the existing `pppr-ir-core` requirement that "host execution concerns SHALL remain outside the `pppr` core identity." That requirement names the *outcome* (host concerns live outside the core); this one names the *mechanism* (no ambient I/O, no platform imports, identity and time as inputs).

#### Scenario: a static check finds a `node:*` import in the core

- **GIVEN** any file under `packages/pppr/src/`
- **WHEN** a maintainer or CI checks the file's imports
- **THEN** there MUST be no import from `node:*`, `cloudflare:*`, `bun:*`, or `deno:*`
- **AND** any existing such import (today: `import { randomUUID } from "node:crypto"` in `runtime.ts` and `runtime-protocol.ts`) is a bug to be filed against the implementation, not a counter-example to this requirement

#### Scenario: a static or runtime check finds ambient identity or time at the core boundary

- **GIVEN** any function exported from `packages/pppr/src/` whose behavior is reachable from `advancePpprRuntime`, `requestPpprEffect`, `appendPpprAssistantMessage`, `createPpprSnapshot`, `restorePpprRuntimeState`, or any envelope-constructing helper (`createPpprInputEvent`, `createPpprOutputEvent`, `createPpprEffectRequest`, `createPpprEffectResult`, `createPpprRuntimeState`)
- **WHEN** that function is examined for calls to `randomUUID()`, `Date.now()`, `new Date()`, `performance.now`, `fetch`, `setTimeout`/`setInterval`, or any filesystem / network / process API
- **THEN** any such call is a violation of the sans-I/O invariant
- **AND** any current occurrence is a bug to be filed against the implementation under follow-up change `evict-ambient-io-from-pppr-core`

#### Scenario: a new core feature is proposed that would require time, identity, randomness, or network access

- **GIVEN** a proposed addition to `packages/pppr/src/`
- **WHEN** that addition requires reading a clock, generating an id, generating randomness, or contacting an external resource
- **THEN** the addition MUST be designed to receive the value as an input, request the work as an effect, or expose a capability for the host adapter to supply
- **AND** the addition MUST NOT call the ambient global directly inside the core
### Requirement: host adapter SHALL be a first-class architectural noun, with Paseo as the first concrete target

The architecture of `pppr` SHALL distinguish three nouns:

- **the core** — the sans-I/O runtime under `packages/pppr/src/`, governed by `pppr-ir-core` and described by `packages/pppr/PROTOCOL.md`,
- **the protocol** — the input/output/effect/snapshot vocabulary defined by the core's exported types and documented in `packages/pppr/PROTOCOL.md`,
- **a host adapter** (equivalently: runtime adapter) — code outside the core that supplies identity, time, persistence, model access, log handling, and command execution by fulfilling effect requests and feeding input events into the core.

**Paseo** (the user's Cloudflare-backed application, one of the projects inside the `nuveris-v1` reffy workspace) is named as the first concrete runtime adapter target. The legacy CLI host (`legacy-pi-host` / the `pi`-derived shell) is retroactively reclassified as **one host adapter among others**, not the canonical or sole consumer of the core.

This requirement does not introduce a new package or directory. It introduces the planning vocabulary.

#### Scenario: a maintainer evaluates where a proposed capability belongs

- **GIVEN** a proposed new capability (for example: snapshot persistence, log streaming, terminal rendering, or pod lifecycle management)
- **WHEN** the maintainer applies this requirement together with the existing `pppr-ir-core` "host execution concerns SHALL remain outside" requirement
- **THEN** the capability MUST be placed in a host adapter unless it can be expressed purely as a state transition over inputs/outputs/effects defined by the protocol
- **AND** "the host" is no longer a sufficient locator — the change MUST name which adapter (or that a new adapter is needed) and treat Paseo and `legacy-pi-host` as concrete adapters rather than abstract sinks

#### Scenario: a planning document refers to a "second harness will reveal X"

- **GIVEN** any prior planning document or `PROTOCOL.md` section that defers a question to "a second harness"
- **WHEN** the question is revisited after this change is in force
- **THEN** the question's resolution path is the Paseo runtime adapter, not a hypothetical second harness
- **AND** the deferred question MAY be answered by Paseo adapter work without first requiring an additional consumer to exist
