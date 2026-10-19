# Project-wide Code Review — Plan

Specification: [spec.md](spec.md) · Constitution: [CONSTITUTION.md](../CONSTITUTION.md) 1.2.0 · Date: 2026-10-19

## Minimal approach and skills

Review HEAD `85fef9e` and current first-party code, not a recent-commit diff. Initial tree clean. Apply Ponytail, Vercel React guidance, bundled Next.js Server/Client Component and Jest guides, Hallmark interaction/error guidance with locked design.md, and Supabase least-privilege/RLS guidance for static SQL review. No agents delegated, dependencies installed or skill utilities executed.

Keep local UI state local; retain derived filters/counts, session epochs/read tickets and synchronous refs that prevent duplicate mutations. Do not add useMemo, reducers, global stores, general-purpose hooks or split a component only because it is large. Reuse the two real tab sets through one controlled RoleTabs component with refs only for focus; panel selection stays with its current owner.

## Findings and work

| Finding | Evidence / consequence | Priority / disposition |
| --- | --- | --- |
| F01 | Nurse/admin tablists use ARIA tabs but have no arrow-key focus handling or roving tabindex; every tab is a normal tab stop | P2, T01: share the actual repeated tab markup/keyboard behavior; keep existing IDs/classes and provide a focusable active panel |
| F02 | CredentialForm has a single unassociated error paragraph; invalid fields lack aria-invalid/describedby | P2, T02: model error as field plus message, announce it and associate it with the correct input; preserve messages/validation order |
| F03 | lib/client/api.ts preserves AbortError during fetch but normalizes it during response.json on success/error paths | P2, T03: rethrow cancellation consistently before generic parsing/error normalization; test transport/schema failure semantics too |
| F04 | Hosted test cleanup deletes shifts only; migration 009 gives audit_events.shift_id a restrictive FK and successful mutations create audit rows | P2, T04 pending: cleanup can fail and leave disposable test rows after audit is enabled. Do not run that suite until safe transactional cleanup is designed and verified in the dedicated project |
| F05 | 004 spec/plan had planning-only headers despite implemented code and partial verification logs | P3, T05 corrected: reconciled current summaries without rewriting historical evidence or claiming all acceptance checks passed |

008 previously left keyboard tabs unchanged because buttons remained operable. This broader review reassesses the declared ARIA widget against its expected keyboard pattern; keep that earlier decision in history rather than claiming it never happened. F04 is inferred from actual FK/cleanup code; no hosted failure or deletion was executed here.

## Correction sequence and checks

1. Add focused UI tests for both existing tab sets and credential error associations, plus client API body-abort tests. Run against current code to establish failing baselines.
2. Implement F01–F03 in existing component/client boundaries; a shared component is justified by two current consumers, not future reuse. Preserve conditional panels, form/session behavior and CSS.
3. Run local unit/UI suites, typecheck and lint on installed Node 24. Current production-build restriction is already recorded in 009 (CSS helper cannot bind a port even after escalation); record a not-rerun build as unverified, never passed. Do not repeat known environmental failures without a changed condition.
4. Review all code/doc diffs and record final coverage. No hosted tests, fixture writes, Storage probes or dependency advisory scan are implied. T04/T05 remain visible follow-up work if not delivered.

## Primary references

- [WAI-ARIA tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): keyboard/focus behavior for the roles already used.
- [React state structure](https://react.dev/learn/choosing-the-state-structure): avoid redundant/contradictory state; do not replace useful synchronous locks with render state.

## Constitution review

Criteria precede corrections; exact contracts and original evidence remain intact. Changes are small and source-backed, with no secrets/client database imports or database edits. Each task maps to acceptance criteria; actual failures and unverified environments remain explicit. No constitution amendment needed.
