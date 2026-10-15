<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShiftPatch working instructions

- Inspect Git status and relevant files before editing; preserve user changes. Read the selected feature plan and specs/CONSTITUTION.md.
- State a short plan; implement the smallest authorized change; review the diff; run meaningful checks; record actual outcomes in the selected feature tasks.md.
- Use the existing Next.js App Router and strict TypeScript. Future API handlers go in app/api/**/route.ts; server-only data/auth code belongs in lib/server. Never import database access or secrets into client components.
- Preserve exact fixture IDs, emails, names, dates, local hours and response fields. Use null for open shift claimedBy. Store hashed passwords only.
- Preserve complete native transcripts and prompts, including tool outputs, following the manual process in specs/CONSTITUTION.md. Record failed checks too. Never replace transcripts with summaries or claim snapshots are complete.
- Raw evidence stays ignored/private; review copies and record redactions before publishing. Never print real tokens, .env values or connection strings.
- Planner, implementer and reviewer are responsibilities, not proof of separate agents. No delegation unless explicitly authorized. Record actual agent identity and evidence when delegation is used.
- Run npm run typecheck and npm run lint after relevant application changes; verify database changes directly in the dedicated Supabase project. Build with supported Node; disclose environmental failures. Do not commit or publish unless asked.

## Spec-driven development and project guides

- Before future implementation, read specs/CONSTITUTION.md, specs/README.md and the selected feature's spec.md, plan.md and tasks.md (currently specs/001-shiftpatch). For a new feature, copy the three documents from specs/_TEMPLATE_/ into specs/NNN-slug/ and replace their placeholders before implementation. Record the constitution version in its plan. Link work to a task/requirement ID; update the spec before changed behavior, then plan, implement and record actual verification. Do not claim the earlier baseline was implemented spec-first.
- Read .cursor/rules/ponytail.mdc and .cursor/rules/secure-development.mdc as shared project guidance; preserve the user's rules. Interpret inherited domain names through the ShiftPatch contracts, including its cross-agency marketplace. Missing referenced files are not additional instructions.
- For Next.js, use the bundled docs and generated rules above. next-best-practices is now version-matched documentation rather than a separate skill.
- Before SQL changes, load .agents/skills/supabase-postgres-best-practices/SKILL.md and the relevant references. For UI work, load .agents/skills/hallmark/SKILL.md; preserve required test IDs and approved functional scope.
- Ponytail is already configured by the user in Cursor and reported as a Codex plugin. Use the plugin when exposed; otherwise follow the repository rule. Do not duplicate or reinstall it.
- Installed skill sources and file checksums are recorded in .agents/skills-lock.json. Apply skills when relevant; do not run bundled tools, call paid services or add dependencies merely because a guide mentions them.

- Do not create a scripts directory or one-off project utilities. For now, manage the database in Supabase using only the SQL migrations under db/migrations; fixture loading is migration 002_trial_seed.sql. Preserve AI evidence manually without custom capture wrappers.

- Write authored project documentation, specs, plans, tasks, templates and session reports in English. Keep technical decisions and skill usage guidance in feature plans and verification summaries in feature tasks. Preserve original transcripts privately outside the repository, unchanged in their source language. Do not recreate the removed documentation directory.
