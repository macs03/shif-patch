# Shift Action Confirmation — Plan

Specification: [spec.md](spec.md) · Constitution: [CONSTITUTION.md](../CONSTITUTION.md) 1.2.0 · Date: 2026-10-19

Status: Shared application-dialog implementation and local checks complete; native browser verification pending.

## Minimal change and guidance

Apply Ponytail, React and bundled Next.js client guidance; Hallmark only preserves design.md/current modal styles. Extract the existing PostShiftDialog shell, portal and effect/ref/close-event suppression into Dialog.tsx (title/children/onClose and optional description ID). PostShiftDialog becomes its existing form inside that shell. ConfirmationDialog.tsx composes the same Dialog with question/details, Cancel (initial focus) and specific confirmation label. No new dependencies, CSS or server changes; no delegation.

ShiftCard stores the proposed claim/reopen and selected reason; acceptance rechecks pending/locked and current mode/status, closes confirmation and calls original callback. CreateShiftForm stores the Zod-parsed request only after validation; confirmation stacks above the open publishing dialog. Cancel leaves the draft intact; acceptance closes confirmation and submits that snapshot. A synchronous confirmation-button lock prevents double acceptance before unmount. No effects invoke mutations. Native Escape/close/backdrop dismiss; cleanup retains Strict Mode async-close suppression and native focus restoration.

## Checks

Preserve prior 77-test baseline evidence. Replace confirm spies with real dialog interaction in component and parent tests. Cover cancel/accept, popup details, initial focus, pending/locked, duplicate accept, Escape/close/outside dismiss, stale shift status, validated snapshot and nested publication draft. Retain existing session/stale/conflict/uncertain/double-submit tests and PostShiftDialog lifecycle cases. Run Node 24 unit/UI, typecheck/lint, review diff and document limits. Browser modality/focus/Escape require actual browser evidence; jsdom mocks cannot prove them. Earlier build restriction and deployed gaps stay open. No hosted mutation, commit or publication.

Native browser-confirm implementation and its checks remain historical in tasks.md. This follow-up supersedes that UI choice; it does not rewrite earlier evidence. Complete private native export remains pending.
