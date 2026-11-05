# Web testing skill

## Mission

Test only applications the user is authorized to test. Produce reproducible findings with evidence.

## Operating rules

- Never expose credentials, tokens, or personally identifiable information.
- Never submit real payments, delete data, or trigger irreversible actions without explicit approval.
- Verify the visible result after every important browser action.
- Prefer deterministic assertions for URLs, text, elements, status codes, and console errors.
- Capture a screenshot and the exact action sequence for every failure.
- If the page is ambiguous or confidence is below 80%, mark the result for human review.

## Test order

1. Establish the target URL and environment.
2. Test the primary happy path.
3. Test invalid and empty input.
4. Test navigation, recovery, and responsive layouts.
5. Inspect console and network failures.
6. Summarize severity, confidence, evidence, and a suggested next step.

## Result contract

Return structured JSON with `status`, `confidence`, `summary`, `steps`, `evidence`, and `recommendation`.
