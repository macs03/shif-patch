# Code Consistency Audit — Specification

Feature ID: 008-consistency-audit · Date: 2026-10-19 · Status: Audit executed; one compatible refactor applied

Source: user request for an audit plan using available skills and Ponytail, prioritizing consistency, concise code and project guidelines. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Problem and expected outcome

Recent application and tooling changes need a systematic review against the project's contracts and established patterns. Produce actionable findings supported by code locations and observable consequences, with the smallest complete correction proposed for each. A preference for shorter code alone is not a defect.

## Scope

- Included: the current first-party application, server/client/domain boundaries, SQL migrations, tests, CI configuration, design system, specifications and skill provenance. Prioritize recent login, header, admin tabs/metrics and create-shift modal changes, then follow their callers and shared dependencies.
- Review installed skill files as guidance and provenance, not as product code to rewrite.
- This request delivers the audit plan. Audit execution and corrective implementation remain separate tasks.
- Any later refactor within this audit's scope must be strictly necessary to address an evidenced finding and preserve existing business logic and externally observable behavior. Cosmetic cleanup alone does not justify changes. Breaking changes, business-rule changes and API contract changes are excluded.
- Excluded: dependency installation, new tools/scripts, redesign, new features, database writes, hosted mutation tests, withdrawn browser E2E, external configuration, deployment, commits and publication.

## Requirements and acceptance criteria

| Requirement | Required outcome | Criteria |
| --- | --- | --- |
| R01 | Explicit baseline and complete review scope | AC01 |
| R02 | Review consistency and simplicity using applicable guidance | AC02 |
| R03 | Protect behavior, security, accessibility and exact contracts | AC03 |
| R04 | Evidence-based findings and honest verification | AC04–AC05 |
| R05 | Explicit security audit of API contracts and data exposure | AC06–AC08 |
| R06 | Necessary refactors preserve compatibility and business behavior | AC09–AC11 |

| Criterion | Given / when | Observable result |
| --- | --- | --- |
| AC01 | Planning and audit execution begin | Record Git baseline, user changes, file inventory and dependencies; distinguish uncommitted changes from committed code |
| AC02 | Similar flows or implementations are compared | Review naming, types, component ownership, validation, error handling, loading/session state, UI tokens and tests; each proposed simplification preserves the whole flow and avoids speculative abstraction |
| AC03 | Security, contracts and UI are reviewed | Trace login/session, role permissions, cross-agency discovery, create/claim/cancel, credentials and admin flows; preserve fixtures, full responses, local times, open/null and required test IDs; distinguish static SQL review from deployed verification |
| AC04 | A finding is reported | Include priority, file/line, requirement or guideline, trigger, consequence, evidence, smallest proposed correction and validation; separate confirmed defects, consistency improvements and unverified questions |
| AC05 | The audit closes | Every review area has a result or explicit limit; record actual checks, failures/skips, outstanding findings and private evidence status; passing local checks do not prove hosted or browser behavior |
| AC06 | Every API operation and its callers are reviewed | Record method/path, permitted identities/roles, resource ownership, accepted inputs and allowed response fields; compare actual serialization with the contract and identify excess data in success/error responses, logs, browser state and credential-file access |
| AC07 | Unauthorized or malformed requests are considered | Review absent/invalid/expired authentication, wrong role, foreign resource IDs, forged identity fields, unexpected input fields, malformed bodies and upload type/size limits; identify whether server validation and authorization reject each relevant case without disclosure or unauthorized side effects |
| AC08 | Security review is reported | Each operation has an evidence-backed disposition or explicit verification gap; assess transport, token handling, caching, cross-origin access and abuse protections according to the actual authentication model; findings preserve legitimate cross-agency reads and identify contract changes needed before remediation |
| AC09 | A refactor is proposed | Link it to an evidenced finding, explain why leaving the code unchanged is insufficient, identify all affected callers and demonstrate that routes, accepted inputs, response fields/statuses/messages, permissions, fixtures and business outcomes remain compatible; otherwise leave it outside this scope |
| AC10 | A later refactor is considered complete | Record relevant baseline and post-change regression results for affected success, failure and boundary cases, plus required typecheck/lint and applicable suites; new failures block completion, existing failures remain explicit, and unverified behavior is never described as guaranteed |
| AC11 | An initial credential read settles after a successful credential upload | The saved metadata/status remains visible; the older read's success or error cannot replace it or expire the current session. Overlapping admin refreshes likewise retain the newest dashboard and audit snapshot |

AC11 extends R06 with focused regression coverage for the follow-up implementation requested on 2026-10-19. It preserves authoritative API results and existing business rules; it adds no endpoint or permission.

## Contracts and data

Use the contracts in features 001–006 and the quality-only scope of 007. No product behavior changes are authorized by this planning artifact. Preserve IDs, names, fixture emails/dates, facility-local hours, error/response shapes and test IDs. Interpret inherited organization/security terminology through ShiftPatch's cross-agency marketplace and own-agency management rules.

Classify contracted public fields separately from private data. Passwords/hashes, service credentials, connection strings, other users' tokens and private credential documents must not leak through responses, errors, logs or client bundles. The login access token is an intentional authentication response; review its handling rather than treating its contracted presence as a leak. If an existing contract exposes sensitive data, report the conflict as a security finding requiring separately authorized remediation; do not silently remove fields or change the contract in this refactor scope.

## Assumptions

The user did not name a comparison branch. Review the current repository as a whole, prioritizing recent application commits rather than inventing a PR base. Re-record HEAD and the working tree before executing the audit. No delegation is authorized.

## Delivery condition

Planning delivery: this spec, an executable plan and traced tasks, reviewed for consistency and local links. Audit delivery later requires AC01–AC09 and a regression plan under AC10 for each proposed refactor, plus an evidence-backed finding register and API security matrix in tasks.md. Actual before/after AC10 results are required only when a later refactor is implemented. Planning completion does not certify the codebase or authorize implementation.
