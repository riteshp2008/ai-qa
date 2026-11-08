# Sentinel

Sentinel is a production-minded starting point for an AI quality engineer. It turns a testing instruction into an observable browser run, stores evidence, and sends uncertain findings to a human instead of pretending confidence.

## Current vertical slice

- Next.js dashboard for project health, findings, and test runs
- HTTPS target validation at `POST /api/test-runs`
- Shared request validation, SSRF-safe hostname checks, and request hashing
- Test-run lifecycle transition rules and idempotency foundation
- Inngest endpoint at `/api/inngest`
- LangGraph test-planning graph
- Gemini model factory for user-owned API keys
- Browserbase session adapter
- Supabase server client and initial RLS schema
- Supabase password sign-up/sign-in and Google OAuth callback
- `skills/web-testing.skill.md` operating rules for the agent

The external service adapters are intentionally credential-gated. The dashboard can be explored without credentials, while a real run should only be enabled after Supabase, Inngest, Browserbase, and Gemini are configured.

## Product flow

1. **Sign in** — email/password or Google (`/sign-in`, `/sign-up`). `?next=` is preserved through sign-in and OAuth.
2. **Organization** — `/onboarding`: create an organization (you become owner) or request to join one by its
   organization ID. Owners and admins are emailed and approve/decline on `/o/<id>/members`; the requester is
   emailed the decision. Admins can also invite by email (`/invite/<token>`).
3. **Projects** — `/o/<id>/projects`: authorized target applications; runs are restricted to the project origin.
4. **GitHub repositories** — linked per project after verifying them against the GitHub API.
5. **Test runs** — started from a project page or `POST /api/test-runs`; active runs auto-refresh.

`/dashboard` redirects to the last-used organization, or to onboarding if the user has none.

## Architecture

```
src/
  domain/          Pure rules: types, zod schemas, permission matrix, errors. No I/O.
  lib/             Infrastructure clients: db (Drizzle), supabase, email transport, github, inngest.
  server/
    repositories/  Data access only — one per aggregate, no business rules.
    services/      Use cases: validation + authorization + orchestration. Throw AppError.
    auth/          Session user and organization context (membership + role).
    notifications/ Email templates and the notifier (delivered after the response via `after()`).
    actions/       Adapter turning service outcomes into form ActionState.
    http/          Adapter turning service outcomes into JSON responses.
  app/             Routes. Pages read via services; `actions.ts` files are thin server actions.
  components/      ui/ primitives (design tokens in globals.css), shell/, and feature components.
```

Who-can-do-what lives in one place: `src/domain/organizations/roles.ts`.
Database tables keep the `teams` name; the product calls them organizations.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public product
overview. Sign in or create an account to continue to the protected
dashboard at `/dashboard`.

For Vercel, add every variable from `.env.example` in Project Settings →
Environment Variables for the environments you deploy. `.env.local` is
local-only and is not uploaded to Vercel. At minimum, authentication requires
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; server APIs
also require `SUPABASE_SERVICE_ROLE_KEY`.
For the typed ORM and vector index, also configure a server-only
`DATABASE_URL` using the Supabase Postgres connection string. Never expose
this value to the browser or commit it.

Apply `supabase/migrations/0001_initial_schema.sql`, then
`supabase/migrations/0002_run_execution_foundation.sql`, and finally
`supabase/migrations/0003_durable_run_intake.sql` in the Supabase SQL editor
before persisting real projects or runs. Never expose
`SUPABASE_SERVICE_ROLE_KEY` or a user's Gemini key to client-side code.

Apply `supabase/migrations/0004_execution_review_transition.sql` and
`supabase/migrations/0005_team_hierarchy_and_invites.sql` after the intake
migration. Migration 0005 creates the workspace team, team membership,
project hierarchy, role checks, and durable collaborator invitations. Team
owners and admins can create seven-day invite links from the Team screen.
The invited user must sign in with the invited email before accepting the
link.

Migration 0006 enables the Supabase `vector` extension and creates the
team-scoped `repository_documents` table. It stores repository snapshots and
1536-dimensional embeddings with a filtered HNSW cosine index. The Drizzle
schema is in `src/lib/db/schema.ts`; its connection pool is capped at five
connections and pagination helpers cap API pages at 100 records. Raw
repository content remains protected by team RLS. Direct Drizzle queries must
perform equivalent team authorization because a Postgres connection does not
automatically inherit the browser Supabase session.

Configure Supabase Authentication before using `/sign-up` or Google sign-in:

1. Enable the Email provider and choose whether email confirmation is required.
2. Enable Google under Authentication providers and add the Google client ID
   and secret in Supabase, not in this repository.
3. Add `http://localhost:3000/auth/callback` and the deployed equivalent to
   Supabase Authentication URL Configuration.

The Google provider must be enabled in Supabase before the Google button can
start OAuth. Successful authentication redirects to `/dashboard`.

The durable run intake requires `INNGEST_EVENT_KEY` and
`INNGEST_SIGNING_KEY` in addition to the Supabase variables. Migration 0003
adds the transactional `create_test_run` RPC, canonical status constraint,
initial attempt creation, and an outbox event. `POST /api/test-runs` now
returns a queued run only after the run is durably stored and Inngest accepts
the event. Duplicate requests with the same idempotency key return the
original run.

Migration 0004 enables the registered Inngest consumer. Until browser
execution is implemented, accepted events transition to `needs_review` with
an explicit `execution_not_available` reason. This is not a test pass.

Check service configuration with `GET /api/health`. Durable intake requires
the Supabase and Inngest variables; browser execution additionally requires
Browserbase and Gemini. Until the execution workflow is implemented, queued
runs remain explicit queued records rather than being reported as passed.

Run `npm run db:check` or `npm run db:generate` after setting `DATABASE_URL`.

`DATABASE_URL` is required for all organization pages. Apply
`supabase/migrations/0007_organization_onboarding.sql` (profiles, join requests,
project repositories). Set `RESEND_API_KEY`/`EMAIL_FROM` to deliver emails —
without them, emails are printed to the server console. `GITHUB_TOKEN` is
optional (higher rate limits, private repositories).

## Verification

```bash
npm run lint
npm run build
```
