# ShiftPatch

Next.js 16.4.1 App Router + TypeScript. Session 1 establishes the data and agent workflow; business endpoints and screens come next.

## Development

Use Node 24 (`nvm use`) and `npm ci`, then `npm run dev`.

```sh
npm run typecheck
npm run lint
npm run build
```

Copy `.env.example` to `.env.local` when configuring the backend. Never commit real database URLs, JWT secrets or raw AI captures. All runtime credentials stay server-only.

## Supabase trial database

Manage the database directly in a dedicated Supabase project. For now the repository keeps only SQL migrations under `db/migrations/`; apply them in order in the Supabase SQL Editor:

1. `001_initial.sql`: private schema, tables, constraints and RLS. Apply once on a fresh database.
2. `002_trial_seed.sql`: the two agencies, two nurses, one admin and three exact shifts. Stores only bcrypt password hashes; published trial password is `Trial2026!`.

Record which migrations were applied in the feature tasks.md. The fixture migration upserts the trial IDs and restores their baseline values if re-executed; it does not delete unrelated rows. Use only a dedicated trial database. No hosted database has been connected or migrated yet.

There are no local database runners or one-off utilities. See `specs/001-shiftpatch/plan.md`, `AGENTS.md`, and `specs/CONSTITUTION.md` for architecture and manual transcript preservation.

## Spec-driven development and guides

Start with `specs/README.md` and `specs/001-shiftpatch/`: requirements, plan, tasks and actual verification evidence. The feature plan includes architecture and guidance for Hallmark, Supabase, the existing Ponytail setup and installed Next.js. Skill sources/checksums are recorded in `.agents/skills-lock.json`. Project documentation is written in English; original evidence keeps its source language.
