## MODIFIED Requirements

### Requirement: `pppr` shall sequence MVP work around a host-neutral runtime first

**DEPRECATED.** This requirement is no longer in force. It has been superseded by `pppr-package-boundary`, which establishes `packages/pppr` as the canonical home for `pppr` and treats `pppr` as an intermediate representation rather than a host-neutral CLI MVP. Future planning SHALL cite `pppr-package-boundary` and `pppr-ir-core` instead of this requirement.

#### Scenario: planning future `pppr` work after the pivot

- **WHEN** maintainers plan future `pppr` work
- **THEN** they cite `pppr-package-boundary` rather than the host-neutral MVP sequencing
- **AND** this deprecated requirement does not gate or shape that planning

### Requirement: `pppr` shall represent host actions as effect requests and results

**DEPRECATED at the planning level.** The MVP-level claim that effect-request modeling defines the architectural root is no longer in force. The shipped effect-request behavior in the legacy host remains specified — see `define-pppr-runtime-protocol` and `implement-pppr-phase1-runtime` for the authoritative descriptions of that behavior.

#### Scenario: locating the canonical effect-request specification

- **WHEN** a maintainer looks for the canonical specification of effect-request modeling
- **THEN** they find it in `define-pppr-runtime-protocol` and `implement-pppr-phase1-runtime`, not in this deprecated requirement

### Requirement: `pppr` shall preserve the minimal visible tool contract in the first CLI host

**DEPRECATED at the planning level.** The framing of "the first CLI host" is no longer accurate — with the pivot to `packages/pppr`, the CLI host is legacy rather than the architectural first consumer. The shipped tool surface remains specified by `implement-pppr-phase2-cli-host`.

#### Scenario: locating the canonical CLI tool contract

- **WHEN** a maintainer looks for the canonical specification of the legacy CLI host's tool contract
- **THEN** they find it in `implement-pppr-phase2-cli-host`, not in this deprecated requirement

### Requirement: `pppr` shall keep capability contracts distinct from host implementations

**DEPRECATED at the planning level.** The MVP-level framing of capability/provider boundaries is no longer in force. The shipped capability-seam behavior remains specified by `implement-pppr-phase3-capability-seams`.

#### Scenario: locating the canonical capability-seam specification

- **WHEN** a maintainer looks for the canonical specification of capability/provider boundaries
- **THEN** they find it in `implement-pppr-phase3-capability-seams`, not in this deprecated requirement

### Requirement: `pppr` shall prove the architecture with at least one non-CLI execution path

**DEPRECATED.** Host-neutrality is no longer the planning target, so the requirement to include a non-CLI proof surface as evidence of host-neutrality is withdrawn. The shipped proof-host code remains specified by `implement-pppr-phase4-proof-host`; new work is not required to extend or maintain a proof surface for host-neutrality reasons.

#### Scenario: locating the canonical proof-host specification

- **WHEN** a maintainer looks for the canonical specification of the non-CLI proof surface
- **THEN** they find it in `implement-pppr-phase4-proof-host`, not in this deprecated requirement
