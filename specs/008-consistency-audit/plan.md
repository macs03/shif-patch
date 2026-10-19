# Code Consistency Audit — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-19 · Status: Audit executed

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Minimal technical decision

Use manual code review and existing checks. Apply Ponytail full: trace every affected caller, prefer existing patterns, propose deletion or direct simplification only when it solves a concrete problem. Consistency means equivalent behavior follows equivalent rules; it does not require merging unrelated components or forcing server and client code into one abstraction.

## Compatibility and necessity gate — R06 / AC09–AC10

Leaving working code unchanged is the default. Recommend a refactor only for an evidenced finding whose impact justifies it, using the smallest complete change. No cosmetic rewrites, API redesign, new business rules, permission changes or incompatible validation changes belong in this scope. Review can report defects without authorizing fixes.

For every proposal, list affected callers and invariants: login/session behavior, cross-agency discovery, own-agency management, credential expiry, atomic claim/concurrency, both cancellation reasons, upload access and admin results as applicable. Preserve methods/routes, accepted inputs, full response fields, status codes/messages, IDs, local dates/hours, open/null and test IDs. Do not weaken existing tests or change expected business outcomes to make a refactor pass.

Before any later implementation, capture relevant baseline checks and add a focused regression case only where an affected behavior lacks meaningful coverage. Repeat those checks after the change, plus typecheck/lint and applicable existing suites. A new regression blocks completion; an environmental or pre-existing failure remains recorded and unresolved. If compatibility cannot be demonstrated with available checks, defer the refactor or explicitly leave its verification incomplete. Do not promise zero defects from static review or local tests.

Security findings requiring changed contracts or behavior remain visible and prioritized, but remediation requires separate scope and user authorization. This audit does not silently accept the risk or implement breaking security fixes.

The planning baseline is HEAD `7a51670`. Recent application commits to prioritize are `047e642` (login/password), `6d15701` (header/design) and `d4adb70` (admin tabs/metrics and create modal). Initial working changes are `skills-lock.json`, `.agents/skills/ponytail/` and `.claude/skills/ponytail`; preserve them. The audit starts by refreshing this inventory.

## Guidance and precedence

| Source | Application |
| --- | --- |
| AGENTS.md, constitution, feature contracts and shared Cursor rules | Required boundaries, exact data, security, traceability and actual verification. Read features 001–007 before reviewing their areas; retain historical logs |
| `.agents/skills/ponytail/SKILL.md` | Simplicity, caller coverage, no speculative helpers or dependencies; active full for this session |
| Bundled `node_modules/next/dist/docs/` | Version-matched App Router, Server/Client Components, route handlers, async APIs and testing guidance; read relevant pages before judging or changing Next.js code |
| `.agents/skills/vercel-react-best-practices/SKILL.md` | React data fetching, effects, derived state, rendering and bundle boundaries; read applicable rule files; require a concrete benefit before recommending optimization |
| `.agents/skills/hallmark/SKILL.md` and `references/verbs/audit.md` | UI audit only; read relevant interaction/responsive references, preserve `design.md`, existing tokens and functional scope; no new theme or redesign |
| `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Static SQL, privileges, RLS, constraints and atomicity; load relevant security/schema/locking references before database review or any later SQL changes |

Resolve generic examples against the installed stack: Jest/RTL is the current test harness, not the inherited rule's Vitest example. Do not add dependencies, caches, wrappers or comments solely to satisfy generic skill examples. Source-comment restrictions remain in effect. Compare the two skill lock records with actual installed paths, including the new Ponytail registration; record drift without reinstalling or rewriting vendor files.

## Constitution review

| Principle | Application | Exception |
| --- | --- | --- |
| I. Spec before code | Define audit criteria and tasks before execution or remediation | None |
| II. Exact contracts | Compare with features 001–006; preserve fixtures and responses | None |
| III. Minimal scope | Existing skills/checks; no tooling, scripts, redesign or implementation in planning | None |
| IV. Security | Review trust boundaries and secret exposure without printing secret values | None |
| V. Verification | Trace all findings and actual outcomes to R01–R06 | None |
| VI. Evidence | Native evidence retained manually/private; export status reported honestly | None |
| VII. Governance | Constitution 1.2.0; no amendment needed | None |

## Review sequence and coverage

| Order / task | Files and flows | Questions to resolve |
| --- | --- | --- |
| 1 / T01 | Git history/diffs, features 001–007, package/config, skill locks | What changed, which contracts apply, which checks remain withdrawn or unproven? |
| 2 / T02 | `app/api/**/route.ts`, `lib/server`, `lib/domain`, `lib/client/api.ts`, `db/migrations` | Are auth/roles/ownership enforced server-side, inputs validated and errors normalized? Are secrets and hashes private? Do RLS/functions preserve cross-agency reads, own-agency writes, atomic claim and cancellation semantics? |
| 3 / T07 | Every API operation, its consumers, serializers, authentication, logging and credential storage | Does the implemented API contract prevent unauthorized access and sensitive-data disclosure? Produce the operation-by-operation security matrix below |
| 4 / T03 | `app/components`, `app/page.tsx`, `app/layout.tsx`, shared client/domain code | Do equivalent flows share conventions? Check session cleanup/stale requests, duplicate submissions, uncertain outcomes, response parsing, component responsibilities, redundant state/effects and unnecessary abstractions |
| 5 / T04 | `design.md`, `app/globals.css`, header, icons, cards, forms, tabs and create modal | Are tokens, spacing, status language and controls consistent? Check keyboard tabs, modal focus/Escape/return focus, labels, announcements, loading/error/empty/disabled states, contrast and reduced motion |
| 6 / T05 | `__tests__`, Jest/TS/ESLint configs, `.github/workflows/ci.yml`, README/specs | Do tests assert contracts and failure paths? Are recent controls covered? Do docs match current implementation and actual verification? Does CI preserve quality-only scope? |
| 7 / T06 | Finding register and verification results in tasks.md | Have all areas been covered, priorities justified, smallest corrections proposed and remaining limits disclosed? |

For each core flow, follow UI → client transport/schema → handler/auth → database function/policy → response/UI state → existing tests. Trace credentials upload/read and admin overview/audit/hours through their corresponding paths too. Compare siblings explicitly: agency A/B, nurse/admin views, mutation handlers and equivalent UI controls.

## API contract security audit — T07 / R05 / AC06–AC08

Build a compact matrix in tasks.md for every implemented method/path, including login, shift discovery/create/claim/cancel, agency listings, credentials and admin operations. Record caller roles, ownership rule, input schema, permitted response fields, error behavior, evidence location and disposition. Inspect actual response construction, not just TypeScript types or declared schemas.

1. Compare field-by-field responses with the contract. Check nested objects, database row spreads, audit metadata, upload metadata/file URLs and error details for private fields. Check client imports/serialized props, browser storage, logging and tracked configuration for secret exposure without copying secret values into evidence.
2. Trace authentication and resource authorization inside each handler and the database boundary. Review missing/invalid/expired bearer credentials, wrong roles, tampered resource IDs and forged agency/user fields. Separate legitimate cross-agency marketplace reads from prohibited foreign management and other users' private credentials.
3. Review Zod boundary validation for bodies, path/query parameters and files: malformed JSON, unexpected fields/mass assignment, invalid enums/IDs, upload type/size and unsafe object paths. Assess generic authentication errors, normalized failures and whether rejected requests can still write data or disclose resource existence.
4. Assess HTTPS expectations, token lifecycle/clearing, sensitive-response cache controls, CORS and any cookie/CSRF implications of the actual Bearer-only model. Review login/upload abuse controls and request/resource limits; record application versus platform responsibility and unverified deployment settings. Do not prescribe unrelated infrastructure or change authentication as a planning shortcut.
5. Map relevant negative cases to existing Jest checks. Record missing coverage and the smallest focused check needed for each confirmed finding. During audit execution, use the already planned local unit/UI suites; hosted permission checks, real uploads and mutation tests remain outside scope. Static review or mocked tests cannot certify deployed RLS, transport or storage access.

Keep security findings in the common register to avoid duplicate reports from T02. If a security correction requires changing a contracted response or permission, identify the affected feature requirement and consumers before proposing remediation. Completing the matrix means review coverage, not a claim that every operation is secure.

## Finding format and priority

Use `F01`, `F02`, etc. in tasks.md with: category, priority, location, requirement/guideline, trigger, consequence, observed evidence, smallest correction and validation. Add a necessity rationale, affected callers, compatibility assessment and baseline/post-change regression plan for every proposed refactor. Classify each disposition as no change, necessary compatible refactor, or separate remediation required. Confirmed security/data/contract failures take precedence over accessibility and reliability defects, then consistency/maintenance improvements. P1 = security/data loss or blocked core flow; P2 = functional/accessibility defect with bounded impact; P3 = justified consistency or maintainability improvement. Mark uncertain issues as questions, with the check needed to resolve them. Do not manufacture findings or require a quota.

## Planned verification

1. Record Node/npm versions and Git state. Current planning runtime is Node `v22.20.0`; package.json requires `>=24 <25`. Locate an already available Node 24 before claiming supported-runtime results; do not install a runtime as part of this plan.
2. Run `npm run typecheck`, then `npm run lint`, then `npm test -- --selectProjects unit --selectProjects ui --runInBand`. Record suites/tests, skips, exit status and environmental failures. Do not run default tests that might include hosted integration.
3. Run `npm run build` on supported Node 24 if available. Keep type generation/build sequential. Record network/font failures honestly; follow sandbox escalation requirements if network access blocks a necessary command.
4. Use existing browser access for keyboard and visual review at 320/375/414/768px and desktop where available. Review login, role screens, tabs, filters and modal. Do not install Playwright or run fixture mutations to complete this audit. Mark inaccessible authenticated states as unverified.
5. Review SQL statically; this cannot certify deployed policies or data. Any later database correction must use migrations and direct verification in the dedicated project. Hosted checks and writes are not part of this planning scope.
6. Review the diff and documentation links; record all actual results and native evidence availability. Run the AGENTS.md Next.js feedback pass only if a qualifying issue was observed; retain resolved qualifying issues too.

## Exit and follow-up

Complete the audit when every area has a reviewed/unverified disposition and all findings have evidence and a proposed check. Apply the necessity/compatibility gate before recommending any refactor; an audit with no justified code changes is a valid outcome. Refactor implementation remains a later increment and must preserve behavior. Findings requiring business-rule or contract changes remain outside this scope and need separate authorization and specification before implementation. Do not declare the application fully verified while browser, deployed-policy or supported-runtime checks remain unobserved.

## Authorized follow-up — T08 / R06 / AC10–AC11

The user requested the next improvement phase after the audit. Preserve the existing F01 implementation and user changes. Close its credential/admin regression gap using the existing Jest/RTL harness and deferred fetch responses. A pending initial credential GET can outlive a successful POST; invalidate that earlier read using the existing credential read counter when applying the successful upload. Do not invalidate on upload failure, which must still permit the initial read to populate the current view.

Scope: `ShiftPatchApp.onCredential`, its `loadCredential` caller/guard, admin refresh and `__tests__/ui/shift-patch-app.test.tsx`. Keep the existing API requests, schemas, response handling, session epoch and error handling. Add tests for late credential success/error after save and newest admin dashboard/audit retention. First reproduce the credential failure, then apply the smallest fix and run unit/UI, typecheck and lint on installed Node 24. No runtime dependencies, UI redesign, database/hosted changes or speculative extraction.
