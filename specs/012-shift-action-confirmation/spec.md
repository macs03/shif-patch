# Shift Action Confirmation — Specification

Feature ID: 012-shift-action-confirmation · Date: 2026-10-19 · Status: App-dialog implementation complete locally; browser verification pending

Source: user requests a confirmation popup before claiming a shift and similar consequential buttons, to avoid accidental actions. Constitution: [CONSTITUTION.md](../CONSTITUTION.md) 1.2.0. Preserve 004–011 API/business contracts and parent mutation safeguards.

## Scope and outcome

Require explicit confirmation before claim, reopen and valid publish submissions. Use the existing app dialog styling and shared native HTML dialog lifecycle with English copy matching the existing UI. It identifies the action and shift role/date/local hours; existing shifts include agency, and reopening identifies the selected reason and consequence. Cancel/dismiss never calls the mutation callback. This UI change adds an intentional confirmation step; underlying permissions, requests, response handling and business outcomes remain unchanged.

No confirmation for navigation, refresh, login, logout or opening the publish form. Credential replacement is outside this shift-action request. No server/SQL/CSS/dependency change, hosted mutation, commit or publication. Preserve existing staged globals.css changes.

## Requirements and acceptance criteria

| Requirement | Criterion | Observable outcome |
| --- | --- | --- |
| R01 | AC01 | Claim click asks whether to claim the identified shift. Only accepting invokes onClaim once with the same ID; cancelling/dismissing invokes nothing |
| R02 | AC02 | Reopen submission confirms selected shift/reason and explains it becomes available again. Cancel preserves selection; accept passes the original ID/reason |
| R03 | AC03 | Publish validates first; invalid input never prompts. Valid input prompts with the parsed role/date/hours; cancel preserves values and open form, accept submits the existing Zod result |
| R04 | AC04 | Existing pending/locked guards prevent prompts and callbacks; rapid submissions retain existing parent synchronous locks and reconciliation. API request shapes/roles/errors and form lifetimes unchanged |
| R06 | AC06 | App-styled dialog is labelled/described, Cancel initially focused, dismissal never mutates, duplicate acceptance guarded, Strict Mode/native-close cleanup preserved; publication draft survives nested confirmation |
| R05 | AC05 | Before/after tests demonstrate cancel causes zero mutations and accepted actions preserve normal requests/results. Run Node 24 unit/UI, typecheck/lint and diff review; record browser/build limits honestly |

## Decisions and delivery

User follow-up replaces window.confirm with the existing application dialog. Extract the current PostShiftDialog shell/lifecycle into a shared Dialog used by publication and confirmation; retain modal classes, portal, Escape/backdrop/close behavior and focus return. Confirmation has descriptive title/details, Cancel and an explicit action button, with safe initial focus on Cancel. Store only the pending action/validated request; cancel, Escape and close never submit. Publication confirmation stacks above the existing form without discarding its draft. Accept invokes at most once and rechecks pending/locked/current shift eligibility. Confirmation is accident prevention, never authorization; server checks remain mandatory. No browser confirm remains.

Delivery requires focused rejection/acceptance/busy/invalid tests and existing app-flow regressions, actual checks and private evidence availability in tasks.md. Browser evidence must not be inferred from jsdom mocks.
