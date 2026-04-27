## ADDED Requirements

### Requirement: `packages/pppr` SHALL be the canonical `pppr` package boundary

The repository SHALL treat `packages/pppr` as the primary package for `pppr` code, exports, tests, and direct build validation.

#### Scenario: maintaining core `pppr` behavior

- **GIVEN** a maintainer is changing `pppr` IR types, runtime progression, or the public `pppr` package surface
- **WHEN** they choose where to make the change
- **THEN** the canonical source location MUST be `packages/pppr`

### Requirement: executable compatibility paths SHALL consume `packages/pppr`

Any temporary or legacy executable path that continues to expose `pppr` behavior during migration SHALL consume `packages/pppr` rather than owning a competing core implementation.

#### Scenario: legacy host remains during extraction

- **GIVEN** `packages/coding-agent` still exposes a `pppr` executable or host adapter
- **WHEN** that path needs core `pppr` runtime or IR behavior
- **THEN** it MUST import that behavior from `packages/pppr`
- **AND** it MUST remain clearly identifiable as legacy or compatibility code

### Requirement: duplicate `pppr` core ownership in `packages/coding-agent` SHALL be reduced

The repository SHALL avoid maintaining two authoritative copies of `pppr` core runtime logic.

#### Scenario: duplicate core files exist during migration

- **GIVEN** `packages/coding-agent/src/pppr/*` still contains files that duplicate core `pppr` IR or runtime logic
- **WHEN** extraction work proceeds
- **THEN** those files SHOULD be removed or replaced with thin migration-safe re-exports
- **AND** future core changes SHOULD have one obvious home
