# ShiftPatch

ShiftPatch is a staffing marketplace. Nurses see shifts from both agencies and claim an open one when their credential is still valid. Each agency publishes and reopens only its own shifts. An admin can read every shift, the audit log and a scheduled-hours preview. Credential documents stay private.

Claiming, reopening and publishing require confirmation in the shared app dialog. Cancel, Close, Escape or backdrop dismissal sends no mutation; cancelling publication confirmation keeps the draft. The server still enforces permissions and shift eligibility.

The app is Next.js 16.4.1 on the App Router, with TypeScript, Zod and Supabase Auth. Protected requests are authorized on the server. The browser does not receive database secrets.

This repository does not deploy the app. GitHub Actions runs quality checks only and does not connect to Supabase.

## Run locally

Node 24 is required.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local` needs `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep both server-only: do not use a `NEXT_PUBLIC_` prefix, and do not commit real values.

The five trial accounts use the published password `Trial2026!`. The database stores a hash of that password.

| Role | Email |
| --- | --- |
| Agency, Sunrise Health Staffing | `admin@sunrisehealth.example` |
| Agency, Metro Care Partners | `admin@metrocare.example` |
| Nurse | `maria.lopez@example.com` |
| Nurse, credential expired | `james.cook@example.com` |
| Admin | `alex.kim@example.com` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local application |
| `npm run typecheck` | Generate route types, then typecheck |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start` | Serve that build |
| `npm test -- --selectProjects unit --selectProjects ui --runInBand` | Unit and UI tests, without a backend |
| `npm run test:integration` | API tests against the configured Supabase project |

Integration tests skip when `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` is missing. Tests that create or change shifts also require `DB_PASSWORD` and `SHIFT_PATCH_HOSTED_MUTATIONS=1`. A skipped run is not a pass. These tests are local; the quality workflow does not run them.

Use the explicit unit/UI command above for offline checks; bare `npm test` selects all three projects and can contact a configured backend. Hosted reads use a mapped login and user token. Before enabling hosted mutations, resolve and verify the audit-aware disposable-row cleanup tracked in [010/T04](specs/010-project-wide-review/tasks.md); the opt-in flag alone does not make cleanup safe or authorize writes. Current regression guidance is in the [harness spec](specs/003-test-harness/spec.md).

## Application and test ownership

Follow the project's [engineering conventions](specs/013-harness-guidance-sync/plan.md#engineering-conventions) for component structure, typed actions, client/API/server communication, safe validation/errors and the implementation/review routine. [AGENTS.md](AGENTS.md) makes these conventions part of the agent harness; the [constitution](specs/CONSTITUTION.md) defines the governing boundaries.

`ShiftPatchApp` coordinates session, API actions, stale-read protection, pending locks and reconciliation. `renderAppView` selects login/nurse/agency/admin elements from the safe user profile; it has no hooks, requests or URL routing. Role components receive data and callbacks without session tokens. `ShiftBoard` and `RoleTabs` serve their existing consumers. See the [role split](specs/011-role-component-split/spec.md).

`Dialog` owns the shared native modal/portal lifecycle; `PostShiftDialog` and `ConfirmationDialog` compose it. Tests interact with the actual confirmation buttons and verify request gating, form lifetime and nested dismissal. Mocked native dialog methods in jsdom do not prove browser focus restoration, modal stacking or physical Escape. See [012 evidence and remaining checks](specs/012-shift-action-confirmation/tasks.md).

Local implementation, automated tests, build, native browser checks, deployed controls and live CI execution have separate status. The latest app checks are recorded in 012; the current build/browser gaps and [009 deployed-control questions](specs/009-security-hardening/tasks.md) remain open. Documentation updates do not rerun or certify those checks.

## Database

Apply the files in `db/migrations/` in filename order in the SQL editor of a dedicated Supabase project.

1. `001_initial.sql` once, on a fresh database.
2. `002_trial_seed.sql` for the two agencies, five users and three shifts.
3. `003` through `009` for API access, Auth mapping, permissions, private credentials and audit.

Create the five Auth users in the Supabase dashboard before `006_auth_fixture_mapping.sql`. That migration links them by email and stops if the mapping is incomplete. The sequence is described in `specs/004-auth-rbac-api/plan.md`.

Do not replay a migration that has already been applied. Running `002` again restores the fixture rows and does not delete unrelated data. An upload test changed the hosted expiry for nurse-1; the seed file was left unchanged.

There is no local database runner and no `scripts/` directory.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests, pushes to `main` and manual dispatch. On Node 24 it installs dependencies, then runs lint, typecheck, the unit and UI tests, and the production build. The job can read the repository and does not receive backend credentials.

Connecting that workflow to a live backend, browser end-to-end tests and Vercel are outside this project.

## Specifications

Behavior, decisions and recorded checks live in `specs/`. Start with `specs/README.md` and `specs/CONSTITUTION.md`. Those documents are in English. Original transcripts stay private, in their source language.
