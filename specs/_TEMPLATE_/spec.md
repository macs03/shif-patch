# {{FEATURE_NAME}} — Specification

Feature ID: {{NNN-slug}} · Date: {{YYYY-MM-DD}} · Status: Draft

Request/contract source: {{SOURCE}}. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version {{VERSION}}.

Copy this document together with `plan.md` and `tasks.md` into `specs/NNN-slug/`. Replace all `{{...}}` placeholders and remove irrelevant instructions. Write the completed documents in English. This template is not implemented work. R/AC/Q IDs belong to the selected feature.

## Problem and expected outcome

{{Describe the concrete problem, affected user and observable outcome. Explain what should happen without choosing the implementation yet.}}

## Scope

- Included: {{BEHAVIORS}}
- Outside this feature's scope: {{EXCLUSIONS}}

## Scenarios and acceptance criteria

| Criterion | Requirement | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC01 | R01 | {{PRECONDITION}} | {{ACTION}} | {{OBSERVABLE_RESULT}} |
| AC02 | R01 | {{ERROR_OR_BOUNDARY_PRECONDITION}} | {{ACTION}} | {{EXPECTED_ERROR_OR_LIMIT}} |

Cover relevant success, error and boundary cases, including roles and permissions when accessing data. Do not invent states or messages absent from the contract.

For changes to existing flows, identify the current owner and compatibility invariants, including relevant session/request protections and form/dialog lifetimes. Record explicitly authorized interaction/error-contract changes rather than treating a refactor as implicit permission. Define separate criteria for native-browser or hosted checks when those are needed; local mocks do not satisfy them.

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | {{REQUIREMENT}} | AC01, AC02 |

## Contracts and data

{{If applicable: method/route, identity and permissions, request, response/status, errors, exact fixtures, local dates/times and data-testid. Otherwise explain why this section is not applicable. Never include real secrets.}}

## Open questions and assumptions

| ID | Question or assumption | Affected criteria | Resolution and source |
| --- | --- | --- | --- |
| Q01 | {{QUESTION}} | {{AC_IDS}} | Pending |

Resolve questions before implementing dependent tasks. State assumptions explicitly; an unanswered question does not block independent work.

## Delivery condition

{{Criteria that must be satisfied, required checks and expected evidence. Preparing files does not prove execution or deployment.}}

## Change history

| Date | Change | Reason / source |
| --- | --- | --- |
| {{YYYY-MM-DD}} | Initial specification | {{SOURCE}} |
