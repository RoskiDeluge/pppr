# Project Context

## Purpose
This repository is the current reference implementation of `popper-agent`: a local-first, multi-surface AI agent platform that can receive messages, route them through agent sessions, invoke tools, and respond across connected clients and channels.

The codebase currently reflects the structure and capabilities of the OpenClaw project it is derived from, but for reffyspec work it should be treated as the evolving implementation of `popper-agent`. That means specifications should describe intended behavior and architecture at the time of writing, not assume current features are permanent. Some, or most, features may change substantially as the project evolves.

For this fork, the immediate product priority is the `pppr` CLI harness. Inherited `pi` monorepo surfaces that do not directly contribute to building, running, or validating the `pppr` CLI should not block `pppr` planning or implementation work by default.

Primary goals:
- Provide a practical end-to-end agent runtime, not just isolated demos.
- Support local and self-hosted operation with strong operator control.
- Expose a reference architecture for messaging, routing, tool execution, device integration, and extension/plugin development.
- Remain adaptable while the product direction and feature set are still moving.

## Tech Stack
- TypeScript with strict ESM modules as the primary implementation language.
- Node.js 22+ as the runtime baseline for builds, CLI usage, and production installs.
- `pnpm` as the default package manager for repo development; Bun is also supported for TypeScript execution and some local workflows.
- Vitest for tests and coverage.
- Oxlint and Oxfmt for linting and formatting.
- `tsc`, `tsdown`, and repo scripts under `scripts/` for builds, type outputs, and code generation.
- Workspace-style monorepo layout with core code in `src/`, extensions in `extensions/`, UI in `ui/`, and platform apps in `apps/`.
- Swift / SwiftUI for Apple platform apps and Kotlin / Gradle for Android components.

## Project Conventions

### Code Style
- Prefer strict typing and explicit data flow; avoid `any`.
- Use TypeScript ESM consistently.
- Format with Oxfmt and lint with Oxlint; the standard repo check is `pnpm check`.
- Keep files focused and extract helpers instead of creating copy-on-write variants like `FooV2`.
- Add brief comments only where logic is genuinely non-obvious.
- Prefer ASCII in source unless an existing file already justifies Unicode.
- Avoid prototype mutation and implicit behavior sharing; prefer explicit composition or inheritance.
- Do not mix static and dynamic imports for the same module in production paths; use dedicated runtime boundaries when lazy loading is needed.

### Architecture Patterns
- The system is organized around a gateway/control-plane model with agent sessions, messaging ingress, routing, and tool execution.
- Core implementation lives in `src/`; extensions and channel integrations live in `extensions/*`.
- Treat channels, clients, and device nodes as pluggable surfaces around shared routing and agent logic.
- Shared logic should be channel-agnostic where possible; when changing routing, allowlists, pairing, onboarding, or command gating, consider all built-in and extension channels.
- Prefer explicit dependency boundaries and existing repo patterns over introducing parallel abstractions.
- Specs should assume this is a reference implementation: architecture may be refactored aggressively if it improves the long-term shape of `popper-agent`.

### Testing Strategy
- Use Vitest for unit and integration coverage with tests colocated as `*.test.ts` and end-to-end tests as `*.e2e.test.ts`.
- Run `pnpm test` for the standard suite and `pnpm test:coverage` when coverage matters.
- Run tests when changing logic, and run `pnpm build` after touching lazy-loading or module-boundary behavior.
- Prefer focused tests around routing, channel behavior, tool execution, and extension boundaries rather than only snapshot-style assertions.
- When adding behavior that spans core and extensions, verify both the shared path and at least one representative integration path.

### Git Workflow
- Keep changes scoped and grouped by intent.
- Follow concise, action-oriented commit messages.
- Avoid reverting unrelated user changes or restructuring unrelated work in a dirty tree.
- Do not switch branches, rewrite history, or use destructive git commands unless explicitly requested.
- For spec work, read `openspec/project.md`, inspect current specs/changes, and keep proposals aligned with the actual repo state before implementation.

## Domain Context
`popper-agent` is an agent platform rather than a single app screen or API. Important domain concepts include:
- Multi-channel messaging and command ingress.
- Agent/session routing and isolation.
- Local-first or self-hosted control of tools, credentials, and device capabilities.
- Extension/plugin-based integrations for channels, tools, auth flows, and memory features.
- Cross-device surfaces including CLI, web UI, and native/mobile node integrations.

Because this repo is a reference implementation, domain assumptions should stay flexible. Specs should document what the system should do now, while leaving room for major capability shifts, removals, or redesigns.

## Important Constraints
- Runtime baseline is Node.js 22+.
- Maintain compatibility with the current repo layout and existing scripts unless a spec explicitly changes them.
- Do not assume the current OpenClaw naming or feature set is the final product surface for `popper-agent`.
- New work should preserve extension boundaries: plugin-only dependencies belong in the relevant extension package, not automatically in the root package.
- Changes to shared messaging/routing logic must account for both core and extension channels.
- Avoid speculative permanence in specs; this project is still evolving and large portions of behavior may change.
- For this fork, validation and implementation priorities should favor the `pppr` CLI path. Unrelated inherited packages or surfaces should only be treated as blocking when they directly affect the CLI runtime, its reusable core dependencies, or the repo policies explicitly retained for this fork.

## External Dependencies
- Messaging/channel providers and platform-specific integrations used by core and extensions.
- Model providers and authentication flows for LLM access.
- Native platform toolchains for macOS/iOS/Android components.
- Build and validation tooling such as `pnpm`, Bun, Vitest, Oxlint, Oxfmt, and TypeScript.
- Additional extension-specific services may exist under `extensions/*`; treat those as optional integrations rather than core assumptions unless a spec explicitly requires them.
