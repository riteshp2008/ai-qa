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
- `skills/web-testing.skill.md` operating rules for the agent

The external service adapters are intentionally credential-gated. The dashboard can be explored without credentials, while a real run should only be enabled after Supabase, Inngest, Browserbase, and Gemini are configured.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Apply `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor before persisting real projects or runs. Never expose `SUPABASE_SERVICE_ROLE_KEY` or a user's Gemini key to client-side code.

For the durable run foundation, apply `supabase/migrations/0002_run_execution_foundation.sql` after the initial migration. It adds request idempotency, attempt history, and an outbox table. The API still refuses to claim a run was accepted until authentication, persistence, and durable dispatch are connected.

Check service configuration with `GET /api/health`. A real run requires all variables in `.env.example`; an API key alone is not enough. The current UI intentionally returns `503` until those services are configured and `501` while the execution workflow is being connected, rather than reporting a fake queued run.

## Verification

```bash
npm run lint
npm run build
```
