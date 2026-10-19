# Project-wide Code Review — Specification

Feature ID: 010-project-wide-review · Date: 2026-10-19 · Status: Static review and focused corrections complete; hosted follow-ups pending

Source: user requested frontend/component/state/utility review, then explicitly expanded it to the entire current project rather than recent changes. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Preserve features 001–009 contracts and recorded evidence.

## Scope and outcome

Review all current first-party runtime code, SQL migrations, tests, configuration, CI and documentation summaries. Classify findings with source evidence and distinguish static review, local verification and hosted/browser gaps. Correct justified small application defects under the user's existing implementation authorization. No business-rule change, new dependency, redesign, database mutation, hosted test run, commit or publication.

## Requirements and acceptance criteria

| Requirement | Criterion | Observable outcome |
| --- | --- | --- |
| R01 | AC01 | Every project area has a review disposition; existing skills/vendor files and generated assets are guidance/artifacts, not targets for unsolicited rewrites |
| R02 | AC02 | Nurse/admin horizontal tabs expose one tab stop, navigate/wrap with Left/Right and Home/End, preserve click selection, IDs and panels, and do not intercept vertical scrolling keys |
| R03 | AC03 | Credential validation errors are announced and associated with the actual invalid document/date input, preserving existing messages and submit/pending behavior |
| R04 | AC04 | Client API preserves AbortError from response-body reads on success/error responses; genuine transport/schema failures retain existing uncertain-mutation behavior |
| R05 | AC05 | Findings have source/impact and a correction or pending task; actual baseline/regression/typecheck/lint outcomes and unexecuted checks are recorded without certifying deployed security |

## Contracts and limits

Keep API methods/shapes, exact fixtures, dates/local hours, required test IDs, cross-agency reads, own-agency writes, session clearing and request tickets. Reuse locked design.md and current CSS classes. New keyboard/error semantics are accessibility corrections; no theme/layout change. Preserve existing conditional panel mounting and form lifetime. Carry forward 009/Q03–Q04 rather than pretending static review closes them.

## Delivery condition

Whole-project review coverage and focused corrections are complete only with actual evidence in tasks.md. SQL/test-cleanup findings requiring hosted verification stay explicitly pending; no live database changes or new environment are authorized. Native transcripts stay private; post-turn export status must be honest.
