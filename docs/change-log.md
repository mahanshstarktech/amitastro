# AmitAstro Quality Engineering Change Log

This document lists every file added or modified during the SDET and AI-evaluation hardening of the AmitAstro platform, accompanied by a concise rationale.

---

## 1. Documentation & Governance
- `docs/test-plan.md`: Created master test plan outlining scope, risk-ranked testing targets, pyramid tiers, and entry/exit criteria.
- `docs/TESTING.md`: Created testing guide covering installation, suite taxonomy, Docker Compose PostgreSQL setup, and troubleshooting.
- `docs/test-report.md`: Created comprehensive results dashboard recording exact verified metrics, coverage, and latency from actual executions.
- `docs/traceability-matrix.md`: Created requirement-to-test mapping linking platform features to automated test files and pyramid tiers.
- `docs/bugs-found.md`: Created defect log detailing 7 resolved bugs and 4 architectural security warnings.
- `docs/llm-evaluation.md`: Created AI quality evaluation report detailing benchmark datasets, rubric criteria, calibration, and consistency scores.
- `docs/ci-cd.md`: Created CI/CD pipeline architecture documentation featuring dual-engine matrix and Mermaid flowchart.
- `docs/change-log.md`: Created comprehensive index of all code additions and modifications.
- `docs/interview-prep.md`: Created 15 advanced interview Q&As with model answers reflecting real engineering decisions.
- `docs/resume-evidence.md`: Created Google XYZ formatted resume bullets, verified metrics table, and technical skills keywords.

---

## 2. Platform Core Fixes & Enhancements
- `server/src/db/database.ts`:
  - Extended `formatSqlForEngine` transpiler to translate `INSERT OR IGNORE INTO` to `INSERT INTO ... ON CONFLICT DO NOTHING` for PostgreSQL parity.
  - Converted demo data seed queries to `INSERT OR IGNORE INTO` ensuring 100% boot-time idempotency across repeated runs.
- `server/src/services/securityService.ts`:
  - Resolved `BUG-01` by rejecting RSA decryption requests when the submitted `keyId` does not match active or historical cached keys.
  - Resolved `BUG-02` by enforcing strict length checks in `timingSafeCompare` to prevent empty-string bypasses.
- `server/src/middleware/auth.ts`:
  - Resolved `BUG-04` by evaluating `JWT_SECRET` via dynamic getter `getJwtSecret()` rather than at module load time.
- `server/src/controllers/appointmentController.ts`:
  - Resolved `BUG-03` by adding strict whitelist validation in `updateAppointmentStatus` to reject illegal state machine transitions.

---

## 3. Test Infrastructure & Configuration
- `package.json`: Added root scripts (`test:all`, `test:unit`, `test:api`, `test:realtime`, `test:security`, `test:database`, `test:frontend`, `test:e2e`, `test:llm`, `test:perf`, `test:coverage`, `precommit`).
- `server/package.json`: Added test runner dependencies (`vitest`, `supertest`, `socket.io-client`, `autocannon`, `@vitest/coverage-v8`, `@stryker-mutator/core`) and backend scripts.
- `server/vitest.config.ts`: Configured Vitest test runner with environment isolation and V8 coverage reporting.
- `client/package.json`: Configured client test script (`vitest run`).
- `client/vitest.config.ts`: Configured Vitest with JSDOM environment and testing-library setup for React 19 components.
- `client/playwright.config.ts`: Configured Playwright E2E browser automation with dual webServer orchestration on ephemeral ports.
- `server/stryker.config.json`: Configured Stryker mutation testing in-place for `src/services/securityService.ts`.
- `.github/workflows/ci.yml`: Created dual-engine GitHub Actions CI workflow with SQLite and PostgreSQL matrix, JUnit XML reporting, and quality gates.
- `.github/workflows/nightly.yml`: Created nightly scheduled workflow for live Gemini AI evaluation, load tests, and mutation tests.

---

## 4. Test Helpers & Fixtures
- `server/tests/helpers/testDb.ts`: Implemented isolated ephemeral database lifecycle helper supporting temporary SQLite files and PostgreSQL schemas.
- `server/tests/helpers/factories.ts`: Implemented test fixture factories for users, admins, birth profiles, packages, appointments, payments, and subscriptions.
- `server/tests/helpers/authHelper.ts`: Implemented JWT token and CSRF double-submit cookie generation helper for tests.

---

## 5. Automated Test Suites

### Unit Tests
- `server/tests/unit/sqlTranspiler.test.ts`: Transpiler unit tests (`?` -> `$1..$n`, datetime formatting, ignore conflicts).
- `server/tests/unit/securityService.test.ts`: RSA encryption round-trip, lockout delay, anti-replay nonces, constant-time compare, cookie flags.
- `server/tests/unit/rateLimiter.test.ts`: 45 req/min rate limiter boundary and window reset logic.
- `server/tests/unit/bookingLogic.test.ts`: Timezone conversion across 9 regions, blackout dates, 10-minute buffers, 6-week horizon.
- `server/tests/unit/trialGate.test.ts`: 5-minute call countdown math and cross-account phone deduplication.
- `server/tests/unit/subscriptionService.test.ts`: Family 360 tier gating and 4-profile seat limit.
- `server/tests/unit/upiAndUtr.test.ts`: 12-digit UTR regex validation and UPI deep-link intent URL generator.
- `server/tests/unit/otpLogic.test.ts`: OTP 6-digit generation, 5-minute TTL, and attempt limits.
- `server/tests/unit/youtubeCache.test.ts`: YouTube video response caching and TTL expiration logic.
- `server/tests/unit/translations.test.ts`: 1:1 English-Hindi translation dictionary completeness.
- `client/src/tests/unit/cryptoAuth.test.ts`: Client WebCrypto RSA-OAEP encryption round trip.

### Database & Integration Tests
- `server/tests/database/migrationsAndParity.test.ts`: Dual-engine 18-table DDL, migration idempotency, constraints, rollbacks, and Postgres parity.
- `server/tests/api/auth.test.ts`: Registration, OTP, RSA login, lockout, token handling.
- `server/tests/api/booking.test.ts`: Slot selection, taken slots, buffer collisions, status state machine.
- `server/tests/api/payments.test.ts`: UTR submit, duplicate rejection, screenshot upload, admin verification, audit logs, Telegram alert.
- `server/tests/api/trial.test.ts`: Free trial countdown endpoint and auto-lock upon exhaustion.
- `server/tests/api/familySubscription.test.ts`: Family 360 purchase, adding up to 4 members, rejecting 5th member.
- `server/tests/api/chat.test.ts`: Chat pagination, unread counters, read receipts, locked conversation behavior.
- `server/tests/api/blogAndAdmin.test.ts`: Blog CMS CRUD, bilingual fields, admin endpoints.
- `server/tests/api/tenantIsolation.test.ts`: Multi-tenant isolation (IDOR) preventing User A from accessing User B's data.
- `server/tests/api/resilience.test.ts`: Graceful degradation on simulated cloud boundary timeouts (SMS, Telegram, Gemini).

### Real-Time & Security Suites
- `server/tests/realtime/socketGateway.test.ts`: Socket.io connection auth, room routing, typing indicators, delivery receipts, disconnect cleanup.
- `server/tests/security/securityPenetration.test.ts`: SQL injection, stored XSS, JWT tampering, mass assignment, IDOR sweep, audit logs.

### Frontend & End-to-End Suites
- `client/src/tests/components/context.test.tsx`: LanguageContext document lang updates and CountryContext pricing.
- `client/src/tests/components/modals.test.tsx`: TrialCutoffModal countdown and FamilyUpgradeModal seat limit behavior.
- `client/src/tests/unit/translations.test.ts`: Frontend localization dictionary parity.
- `client/e2e/homeAndLocalization.spec.ts`: Playwright E2E home page rendering, responsive viewports, and English/Hindi toggle.
- `client/e2e/authAndAdmin.spec.ts`: Playwright E2E admin portal authentication and operational tabs.
- `client/e2e/bookingFlow.spec.ts`: Playwright E2E booking modal and timezone-aware slot selection.

---

## 6. AI Quality Evaluation Framework
- `eval/datasets/article_generation_seeds.json`: 30 diverse seed prompts covering standard Vedic, prompt injections, and fatalistic traps.
- `eval/datasets/translation_seeds.json`: 30 English-to-Hindi translation benchmark seeds.
- `eval/datasets/calibration_set.json`: 10 human-labeled ground truth calibration benchmarks.
- `eval/deterministicValidators.ts`: Algorithmic checks (Devanagari ratio, schema conformance, prompt leakage, XSS, safety guardrails).
- `eval/llmJudge.ts`: 7-criteria LLM-as-a-judge rubric scoring 1–5 on accuracy, faithfulness, translation, fluency, brand fit, safety, and usefulness.
- `eval/evalRunner.ts`: Full evaluation harness measuring pass rates, consistency variance, and enforcing the 85% quality gate.
- `server/tests/llm/aiEvaluationHarness.test.ts`: Vitest suite executing and validating the AI evaluation framework.

---

## 7. Performance & Benchmarks
- `server/tests/perf/loadTest.ts`: Autocannon benchmark testing `/health`, `/api/packages`, `/api/availability`, `/api/blog/posts`, double-booking race condition, and RSA key cache latency.
