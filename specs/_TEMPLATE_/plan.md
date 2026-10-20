# {{FEATURE_NAME}} — Plan

Specification: [spec.md](spec.md) · Date: {{YYYY-MM-DD}} · Status: Draft

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version {{VERSION}}. Complete in English after defining acceptance criteria and before implementation.

## Minimal technical decision

{{Explain how existing stack and patterns meet the requirements. Discuss alternatives only for material tradeoffs. Do not add layers, scripts or tools for hypothetical work. Keep technical decisions here and verification summaries in tasks.md.}}

## Constitution review

| Principle | Application to this task | Authorized exception / source |
| --- | --- | --- |
| I. Spec before code | {{CRITERIA_AND_OPEN_QUESTIONS}} | None |
| II. Exact contracts | {{CONTRACTS_AND_FIXTURES_OR_NOT_APPLICABLE}} | None |
| III. Minimal scope | {{REUSE_AND_SCOPE}} | None |
| IV. Security | {{TRUST_BOUNDARIES_OR_NOT_APPLICABLE}} | None |
| V. Verification | {{CHECKS_AND_REQUIREMENT_IDS}} | None |
| VI. Evidence | {{MANUAL_CAPTURE_AND_REPORT}} | None |
| VII. Governance | {{CONSTITUTION_VERSION_AND_IMPACT}} | None |

Do not claim compliance by default: replace placeholders and record actual exceptions. Resolve unauthorized exceptions before dependent work.

## Planned changes

| Requirements / criteria | Files or components | Required change |
| --- | --- | --- |
| R01 / AC01, AC02 | {{PATHS}} | {{CHANGE}} |

## Data, contracts and security

For application work, trace the affected UI/form → typed action → client transport → route → server/data operation and public response path. Name each owner, reused components/helpers/schemas, identity/ownership checks, body/response limits and relevant stale/pending/uncertain/form-lifetime invariants. Follow the project's engineering conventions; explain any necessary departure instead of adding a parallel pattern. Skip unrelated boundaries for a genuinely local or documentation-only change.

{{If applicable: Supabase migrations, access boundaries, input validation, authentication, authorization, atomicity and serialization. For documentation-only tasks, state that these do not apply.}}

## Planned verification

Use the current constitution version above. Identify observable baseline/post-change regressions for affected flows; for UI consider session/stale requests, pending/uncertain actions, actual confirmation controls and form/dialog lifetimes. Select offline unit/UI separately from hosted suites. Plan native-browser focus/Escape/modality checks separately from jsdom mocks. Avoid tests that merely mirror the implementation.

| Criterion | Check | Expected result | Evidence reference |
| --- | --- | --- | --- |
| AC01 | {{CHECK_OR_COMMAND}} | {{EXPECTED_RESULT}} | {{EVIDENCE_REFERENCE}} |
| AC02 | {{CHECK_OR_COMMAND}} | {{EXPECTED_RESULT}} | {{EVIDENCE_REFERENCE}} |

## Dependencies and limitations

{{Unresolved Q IDs, preceding tasks, required access and environmental limits. Do not claim a connection, service or check is available without verifying it.}}

## Implementation sequence

1. {{FIRST_STEP}}
2. {{NEXT_STEP}}
3. Verify criteria, review the diff and record actual results in [tasks.md](tasks.md).
