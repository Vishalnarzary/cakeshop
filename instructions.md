# Project Instructions

Follow these checks before pushing any code. The goal is simple: no feature should reach production unless the app, database, tests, and deployment flow all agree with each other.

## Before Making Changes

- Read the relevant files first. Do not guess how a page, API route, Supabase table, or test currently works.
- Check the current Git status and avoid mixing unrelated changes into the same commit.
- Keep changes focused. If a request needs frontend, backend, database, and tests, update each layer deliberately.
- Never commit generated Playwright reports, screenshots, videos, local logs, `.env`, `.vercel`, or other machine-specific files.

## Supabase Rules

- If a feature needs a new table, column, policy, RPC, storage bucket, seed row, or role permission, update `supabase-schema.sql`.
- Keep the test Supabase database and production Supabase database in sync for all required schema changes.
- Update `tests/fixtures/seed.sql` whenever CI needs seed data for a new feature.
- Make new frontend reads backward-compatible when possible. For example, avoid selecting a brand-new column in a way that breaks older databases before the migration is applied.
- Check Row Level Security policies whenever changing data access. User-facing pages should not need service-role access.
- Do not use production data for tests. CI must use the test Supabase project and test credentials.
- If a feature depends on a Supabase migration, clearly mention that the migration must be applied to both test and production before the feature is considered complete.

## Playwright Rules

- Every user-visible feature should have Playwright coverage before it is pushed.
- If a new admin control is added, add an admin-flow test that verifies the control is visible and usable.
- If a new homepage/customer-facing feature is added, add or update smoke/page/user-flow tests for it.
- If a new API route or backend behavior is added, add a test that catches crashes and bad status codes.
- Avoid broad selectors that can match hidden or unrelated elements. Prefer stable IDs, exact panels, and visible state checks.
- Avoid waiting for `load` or `networkidle` on pages with external APIs, images, realtime subscriptions, or payment scripts. Prefer `domcontentloaded` plus specific UI readiness checks.
- Tests should not depend on production inventory, production settings, or manually edited live data.
- If a test must be skipped locally because secrets are missing, it should still run in CI when the CI secrets are present.
- Do not weaken tests just to make CI green. Fix the app, seed data, selectors, or setup.

## Payment And Checkout Rules

- Do not assume Razorpay is tested just because the payment button is visible.
- If payment behavior changes, add tests for the expected checkout path or document exactly what is not covered.
- Razorpay test payments must use test-mode keys only. Never run real payments in CI.
- Keep order creation, payment verification, discount use, stock reservation, and order status behavior covered by tests when those areas change.

## CI/CD And Vercel Rules

- GitHub Actions must pass before a change is considered safe.
- Vercel production deployment must remain gated by Playwright success. Do not remove `ignoreCommand` from `vercel.json` unless another equivalent gate is added.
- If CI fails, do not push fixes blindly to production. Read the failure annotations or Playwright artifacts and fix the root cause.
- After pushing, check the latest GitHub Actions run and confirm it finished with `success`.
- If Vercel deploys independently of CI, fix the deployment gate before making more feature changes.
- Keep CI scripts deterministic. Avoid commands that rely on prompts, local-only tools, or untracked files.

## Environment And Secrets

- Never commit `.env`, API keys, Supabase service-role keys, Razorpay secrets, or Vercel tokens.
- When adding a required environment variable, document where it is needed: local, GitHub Actions, Vercel, Supabase, or all of them.
- CI secrets and Vercel environment variables must be kept aligned when both environments need the same capability.
- Prefer failing safely when a required secret is missing. Do not let missing secrets create confusing production behavior.

## Frontend Safety

- Keep existing design patterns unless the request explicitly asks for a redesign.
- Make sure new UI works on mobile and desktop.
- Do not hide important controls behind broken tabs, invisible panels, or hover-only interactions.
- Any text entered by admins and rendered to users must be inserted safely as text, not unsafe HTML.
- Check console errors after frontend changes. A visible page with console errors is still a failing change.

## Backend And API Safety

- Validate request method, required fields, authentication, and authorization before doing expensive or sensitive work.
- Bad user input should return `400` or `401/403`, not `500`.
- Server misconfiguration should fail clearly and avoid leaking secrets.
- Keep API behavior compatible with frontend expectations and Playwright tests.

## Git And Push Checklist

Before pushing:

1. Run the relevant tests locally when possible.
2. Confirm generated files are not staged.
3. Confirm Supabase schema and seed updates are included when needed.
4. Confirm Playwright tests cover the new or changed behavior.
5. Commit only related files with a clear message.
6. Push to GitHub.
7. Check GitHub Actions until the run completes.
8. Confirm Vercel deployment is allowed only after Playwright passes.

## Definition Of Done

A change is done only when:

- The app behavior works for the requested user flow.
- Supabase test and production requirements are known and in sync.
- Playwright covers the important behavior.
- Local verification has passed where possible.
- GitHub Actions passes after push.
- Production deployment is gated behind the passing test run.
