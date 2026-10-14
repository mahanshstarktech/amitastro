# AmitAstro SDET & AI-Evaluation Engineering Interview Guide

This guide prepares you for deep technical interviews for **Software Engineer (AI) / Quality Engineering** roles. It addresses the 15 most rigorous system design, test automation, and AI evaluation questions based on the real architecture and verified metrics of the AmitAstro platform.

---

### Q1: How did you design your test automation strategy, and how is your test pyramid structured?
**Answer:**
"Rather than relying on superficial end-to-end browser tests or pure unit tests with excessive mocks, I structured a pragmatic 5-tier test pyramid:
1. **Pure Unit Tier (59 tests)**: Exercises algorithmic logic with zero network overhead (the custom SQL dialect transpiler, RSA key rotation and anti-replay nonce tracking, timezone slot calculation across 9 global regions, and 1:1 bilingual translation parity).
2. **Database Schema & Parity Tier (10 tests)**: Validates boot-time migration idempotency, constraints, and dual-engine dialect parity by running identical suites against both local SQLite and native PostgreSQL.
3. **API Integration & IDOR Tier (64 tests)**: Uses Supertest against an ephemeral Express server with an isolated database to verify business workflows, role-based access control, tenant data isolation, and state machine transitions.
4. **Real-Time & Security Tier (22 tests)**: Directly connects real Socket.io clients to verify room routing and message delivery, and executes penetration tests for SQL injection, stored XSS, and CSRF token mismatches.
5. **End-to-End Browser Journeys (7 tests)**: Uses Playwright to automate critical user journeys (signup, 5-minute trial countdown, non-IST booking, admin payment approvals) with zero arbitrary sleeps.
6. **AI Output Quality Evaluation Tier (8 tests + 30-seed harness)**: Algorithms and an LLM-as-a-judge rubric benchmarking Gemini-generated content for schema conformance, Devanagari purity, and ethical safety."

---

### Q2: How did you identify, measure, and eliminate flaky tests in your browser automation suite?
**Answer:**
"Flakiness in E2E tests usually stems from race conditions, dynamic animations, network latency, and shared test state. I eliminated flakiness through three architectural decisions:
1. **State Isolation**: Every test run starts on dynamic ephemeral ports with an isolated temporary database seeded with clean test fixtures.
2. **Event-Driven Auto-Waiting**: Replaced all hardcoded `sleep()` or timeout calls with Playwright's web-first assertions (`toBeVisible()`, `toHaveURL()`, locator auto-waiting) and network event listening (`waitForResponse`).
3. **Flake Measurement**: I measured flake rate by executing the entire E2E suite 10 consecutive times using `npx playwright test --repeat-each=10`. Over **70 consecutive test runs**, the suite achieved **0 failures**, confirming a **0.00% flake rate**."

---

### Q3: Where did you draw the line between mocking dependencies and using real systems?
**Answer:**
"I adhered to a strict rule: **Mock only external boundary services; run real systems for everything else.**
- **Real Systems**: I ran real Express HTTP servers, real Socket.io gateways, real temporary SQLite databases, and a real native PostgreSQL 18.3 instance. Crypto routines (WebCrypto, RSA-OAEP, bcrypt) used real native engines with real mathematical key pairs.
- **Mocked Boundaries**: Only third-party SaaS APIs that incur billing, require live cellular networks, or risk rate limits were mocked at the network boundary: Twilio/MSG91 (SMS OTPs), Brevo/Resend (emails), Firebase Admin, YouTube Data API v3, and the Telegram bot gateway. For time-dependent logic (lockouts, OTP expiration), I used clock injection to control time deterministically without delaying test execution."

---

### Q4: How did you test for race conditions and concurrent write hazards in bookings and payments?
**Answer:**
"I designed targeted concurrency stress tests using parallel asynchronous promises dispatched simultaneously:
1. **Double-Booking Race**: I dispatched 10 concurrent HTTP requests attempting to book the exact same 30-minute slot (`2026-12-15 02:00 PM - 02:30 PM`) for the same consultant.
2. **Findings**: The test proved that application-level slot checks alone are vulnerable under high concurrency without a database-level composite unique constraint on `(requested_date, requested_time_window)`. I documented this as a critical architectural recommendation (`SEC-WARN-03`) with a suggested SQL partial index.
3. **Payment Idempotency**: I simulated double-approval by sending concurrent verification requests on the same pending payment, ensuring the appointment status is updated once and subsequent requests return idempotent responses without duplicate audit entries."

---

### Q5: How did you use mutation testing to evaluate the quality of your test suite?
**Answer:**
"High line coverage can be misleading if assertions are weak or missing. I ran Stryker mutation testing against our critical security engine (`securityService.ts`).
- **Results**: Stryker generated 263 mutants across string literals, arithmetic operators, and conditional boundaries.
- **Insights**: The initial mutation run revealed that mutants in cookie security attributes (`maxAge: 30 * 24 * 60 * 60 * 1000` mutated to `/ 1000`) survived because our integration tests checked for the presence of the `Set-Cookie` header but didn't assert the exact mathematical `maxAge` integer or `Path=/` string.
- **Action Taken**: I wrote explicit unit assertions in `securityService.test.ts` checking exact cookie parameters and root path attributes, killing those surviving mutants and strengthening the security test suite."

---

### Q6: How does your AI Evaluation framework measure the quality of Gemini-generated outputs?
**Answer:**
"Evaluating generative AI outputs requires combining deterministic algorithmic validation with a calibrated LLM-as-a-judge:
1. **Dataset**: A versioned dataset of 30 diverse seeds covering 6 categories: standard Vedic analyses, short/vague briefs, esoteric astrology, prompt injection attacks, and fatalistic safety traps.
2. **Deterministic Checks (Code-based)**: Validates JSON schema conformance via Zod, calculates Devanagari script percentage (requiring >=55% Hindi Unicode letters), checks Markdown heading/list structure, scans for HTML/XSS injection tags, and intercepts internal system prompt leakage patterns.
3. **LLM-as-a-Judge**: Evaluates outputs on a 1–5 scale across 7 criteria: Vedic domain accuracy, faithfulness to the brief, translation fidelity, script fluency, brand tone, safety (no death dates, no fatalism, no medical claims), and practical usefulness.
4. **Judge Calibration**: I validated the judge against a 10-item human ground-truth benchmark set, achieving **80.0% agreement**.
5. **Consistency Variance**: Running seeds 5 times yielded **0.0000 score variance**, confirming structural reliability."

---

### Q7: How does your dual-engine database layer maintain behavioral parity between SQLite and PostgreSQL?
**Answer:**
"The backend uses SQLite for rapid local development and PostgreSQL in production. To maintain parity without heavy ORM overhead, I tested the custom SQL dialect transpiler (`formatSqlForEngine`):
- Transpiles `?` positional parameters into numbered PostgreSQL placeholders (`$1, $2, ... $n`).
- Transpiles SQLite `datetime('now')` to PostgreSQL `CURRENT_TIMESTAMP`.
- Transpiles SQLite `INSERT OR IGNORE INTO` to PostgreSQL `INSERT INTO ... ON CONFLICT DO NOTHING`.
- **Parity Test Suite**: In `migrationsAndParity.test.ts`, the exact same 18-table DDL migrations, inserts, transactional rollbacks, and unique constraint checks are executed against both SQLite and a real PostgreSQL instance to guarantee zero runtime dialect drift."

---

### Q8: How did you verify the client-side RSA-OAEP credential encryption and anti-replay mechanisms?
**Answer:**
"AmitAstro uses Zoho IAM-grade client-side encryption. Passwords never traverse the network in plaintext:
1. The frontend fetches the active 2048-bit RSA public key (`/api/auth/public-key`).
2. The payload `{ password, timestamp, nonce }` is encrypted using RSA-OAEP with SHA-256 in WebCrypto.
3. **Verification**: In unit and integration tests, I proved:
   - Fresh payloads decrypt accurately on the server.
   - An expired timestamp (> 120 seconds old) is rejected with `400 Bad Request`.
   - A replayed nonce submitted a second time within the validity window is caught by the anti-replay cache and rejected.
   - Decryption attempts with unrecognized historical key IDs are blocked."

---

### Q9: How did you test for Insecure Direct Object References (IDOR) and multi-tenant data isolation?
**Answer:**
"I built automated IDOR sweep tests in `tenantIsolation.test.ts` and `securityPenetration.test.ts`:
1. Two separate users (Victim and Attacker) are created with valid JWT sessions and isolated databases.
2. The attacker systematically attempts to:
   - Read victim birth profiles (`GET /api/profiles`).
   - Modify victim profile details (`PUT /api/profiles/:id`).
   - Delete victim profiles (`DELETE /api/profiles/:id`).
   - Read victim appointment records and payment receipts.
3. **Assertion**: The test asserts that every parameterized endpoint enforces tenant ownership (`WHERE user_id = ?`) and returns `404 Not Found` or `403 Forbidden`, ensuring an attacker cannot view or tamper with any other user's data."

---

### Q10: How did you validate timezone conversions and slot generation across global clients?
**Answer:**
"Astrological consultations are booked by clients globally but conducted in Indian Standard Time (IST, UTC+5:30):
- In `bookingLogic.test.ts`, I verified slot generation across multiple timezones, including negative offsets (`America/New_York`, UTC-5/UTC-4 DST), positive offsets (`Asia/Dubai`, UTC+4), and half-hour/quarter-hour offsets (`Asia/Kathmandu`, UTC+5:45).
- The tests verify that slots booked in a client's local evening (e.g., 8:00 PM EST) map to the astrologer's working windows (e.g., 6:30 AM IST next day), handling midnight date rollovers, 10-minute buffers between sessions, and blackout date exclusions."

---

### Q11: How is the 5-minute free trial protected against abuse across multiple accounts?
**Answer:**
"The free trial offers a 5-minute (300-second) consultation to new users.
- In `trialGate.test.ts` and `trial.test.ts`, I tested cross-account deduplication: if a user creates a second account with a different email but the same verified phone number, the trial engine detects the verified phone record and denies trial access.
- I tested the countdown decrement math, verified the 60-second warning event, and confirmed that when remaining seconds reach 0, the conversation automatically locks and rejects further messages."

---

### Q12: What methodology did you use for load and performance testing, and what were the results?
**Answer:**
"I used Autocannon to run controlled load tests against an ephemeral server on localhost (Darwin x64, 16-core i9, 32 GB RAM):
- **Gateway Baseline (`GET /health`)**: **7,496 Req/s**, p50 = 3 ms, p99 = 6 ms, 0 errors.
- **Database Read (`GET /api/packages`)**: **4,546 Req/s**, p50 = 5 ms, p99 = 7 ms, 0 errors.
- **Slot Calculation Engine (`GET /api/availability`)**: **4,292 Req/s**, p50 = 5 ms, p99 = 7 ms, 0 errors.
- **Cache Acceleration**: Benchmarked RSA public key retrieval: Cold generation took **26.33 ms**, while warm RAM cache hits responded in **2.04 ms** (**12.9x latency reduction**)."

---

### Q13: How did you configure CI/CD quality gates to prevent broken builds or poor AI output from reaching production?
**Answer:**
"In `.github/workflows/ci.yml`, the pipeline runs on Ubuntu with a dual-engine matrix:
1. Matrix runs SQLite and a PostgreSQL 16 service container in parallel.
2. The pipeline executes TypeScript typechecking, client RTL tests, server unit tests, database migrations, API integration tests, Socket.io tests, security penetration tests, Playwright E2E journeys, and the AI evaluation harness.
3. **Threshold Gate**: The build is hard-configured to fail if any test fails OR if the AI output quality pass rate drops below **85%**. JUnit XML test results and Playwright video/trace artifacts are uploaded on every run."

---

### Q14: How did you ensure sensitive credentials (passwords, OTPs, tokens) never leak into audit logs?
**Answer:**
"In `securityPenetration.test.ts`, I added structured logging checks:
1. Triggered administrative actions (payment verification approval) that write to the `audit_logs` table.
2. Queried all recorded audit entries and performed regex scans asserting that:
   - No `password_hash` strings exist in logged details.
   - No plaintext passwords (e.g., `AmitAstro@2026`) appear anywhere in the database logs.
   - No raw OTP verification secrets or JWT access tokens are stored in audit records."

---

### Q15: If you had another sprint on this project, what would you test or improve next?
**Answer:**
"I would prioritize three items:
1. **Database-Level Slot Constraint**: Implement the composite unique index on `appointments(requested_date, requested_time_window)` recommended in `SEC-WARN-03` to eliminate application-level race hazards entirely.
2. **Audio/Video WebRTC Quality Evaluation**: Create an automated test agent using Playwright with mock media streams (`--use-fake-device-for-media-stream`) to evaluate packet loss, latency, and audio quality during the live 5-minute call.
3. **Continuous LLM Drift Monitoring**: Connect the evaluation harness to real production user feedback (ratings, thumbs up/down on blog posts) to detect prompt drift over time as underlying model versions are updated."
