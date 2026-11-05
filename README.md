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

Apply `supabase/migrations/0001_initial_schema.sql`, then
`supabase/migrations/0002_run_execution_foundation.sql`, and finally
`supabase/migrations/0003_durable_run_intake.sql` in the Supabase SQL editor
before persisting real projects or runs. Never expose
`SUPABASE_SERVICE_ROLE_KEY` or a user's Gemini key to client-side code.

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

Apply `supabase/migrations/0004_execution_review_transition.sql` after the
intake migration to enable the registered Inngest consumer. Until browser
execution is implemented, accepted events transition to `needs_review` with
an explicit `execution_not_available` reason. This is not a test pass.

Check service configuration with `GET /api/health`. Durable intake requires
the Supabase and Inngest variables; browser execution additionally requires
Browserbase and Gemini. Until the execution workflow is implemented, queued
runs remain explicit queued records rather than being reported as passed.

## Verification

```bash
npm run lint
npm run build
```
