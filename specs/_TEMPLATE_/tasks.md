# {{FEATURE_NAME}} — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: {{YYYY-MM-DD}}

Derive only necessary tasks from the plan. Each task should deliver a small, verifiable outcome. T IDs belong to this feature. Write task descriptions and verification summaries in English; do not create tasks for hypothetical steps.

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T01 | R01 / AC01, AC02 | {{WORK_AND_PATHS}} | {{NONE_OR_TASK_OR_QUESTION_IDS}} | Pending | {{CHECKS}} |

Statuses: Pending, In progress, Blocked, Completed. For blocked tasks, identify the cause and what resolves it. Complete only when criteria are satisfied and required checks have evidence; an unexecuted check is not a passed check.

## Coverage

| Criterion | Responsible task | Current evidence |
| --- | --- | --- |
| AC01 | T01 | Pending |
| AC02 | T01 | Pending |

Every criterion needs a responsible task. Every task must cover a requirement or delivery condition from the specification.

## Execution log

Add an entry for significant progress without replacing the original session:

- Date and task: {{YYYY-MM-DD}} / {{TASK_ID}}.
- Covered criteria and changed files: {{CRITERIA_AND_PATHS}}.
- Executed check: {{COMMAND_OR_MANUAL_CHECK}}.
- Actual result and limits: {{PASS_FAIL_OR_NOT_EXECUTED_WITH_REASON}}.
- Evidence: {{TASK_LOG_AND_PRIVATE_EVIDENCE_REFERENCE}}; original transcript {{PRIVATE_LOCATION_AND_COMPLETENESS}}.
- Status and next step: {{STATUS_AND_NEXT_STEP}}.

Preserve evidence manually according to `specs/CONSTITUTION.md`; do not create custom scripts. Keep originals private, unchanged and in their source language. Review shared copies for secrets and record redactions.
