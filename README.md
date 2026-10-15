# ShiftPatch

Next.js 16.4.1 App Router + TypeScript. The MVP includes Supabase authentication, role-scoped shift APIs, nurse/agency screens, credentials and a read-only admin overview. CI and browser E2E closure are planned in `specs/007-ci-e2e/`; Vercel/deployment is deferred.

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
3. Continue with migrations `003` through `009` in filename order for server/API access, Auth identity mapping/permissions, private credentials and audit. Review the relevant feature plans before application; fixture Auth account provisioning/mapping also requires the process in `specs/004-auth-rbac-api/plan.md`. Do not replay already applied migrations blindly.

Record which migrations were applied in the feature tasks.md. The fixture migration upserts the trial IDs and restores their baseline values if re-executed; it does not delete unrelated rows. Use only a dedicated trial database. Hosted setup and subsequent migration/manual checks are recorded in features 002, 004 and 006. The demo nurse-1 credential expiry was changed during an upload test; the seed file remains unchanged. A separate CI backend is proposed but has not been provisioned.

There are no local database runners or one-off utilities. See `specs/001-shiftpatch/plan.md`, `AGENTS.md`, and `specs/CONSTITUTION.md` for architecture and manual transcript preservation.

## Spec-driven development and guides

Start with `specs/README.md` and `specs/001-shiftpatch/`: requirements, plan, tasks and actual verification evidence. The feature plan includes architecture and guidance for Hallmark, Supabase, the existing Ponytail setup and installed Next.js. Skill sources/checksums are recorded in `.agents/skills-lock.json`. Project documentation is written in English; original evidence keeps its source language.

## Verification status

Run `npm test -- --selectProjects unit ui --runInBand` for backend-independent unit/UI checks. Hosted integration tests currently need server configuration and mutation opt-in; they can skip when configuration is absent. A skipped run is not hosted verification. The strict CI mode and Playwright scripts described in `specs/007-ci-e2e/plan.md` are planned, not available commands yet.

The latest local review passed 38 tests across six unit/UI suites, typecheck and lint on Node 22.20.0. A Node 24 build, browser E2E and actual GitHub CI runs remain pending. See `specs/005-core-user-experience/tasks.md` and `specs/007-ci-e2e/tasks.md`; historical hosted results remain separate from new execution.
