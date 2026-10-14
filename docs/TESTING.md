# AmitAstro Test Automation & Quality Engineering Guide

This document provides complete instructions for running, debugging, extending, and maintaining the automated test suites, benchmarks, and evaluation harnesses for the **AmitAstro** platform.

---

## 1. Quick Start

Run the entire unified automated test suite with a single command from the repository root:

```bash
npm run test:all
```

This single command executes 174 deterministic tests across unit logic, database migrations, REST API integration, Socket.io real-time gateways, security/IDOR sweeps, React Testing Library component tests, and the Gemini AI evaluation framework.

To run end-to-end browser journeys in headless Chromium:

```bash
npm run test:e2e
```

---

## 2. Test Suite Taxonomy & Commands

| Command | Suite | Runner | Scope / Target Modules |
| :--- | :--- | :--- | :--- |
| `npm run test:unit` | Unit Tests | Vitest | Pure logic: SQL Transpiler, SecurityEngine (RSA/Lockout/CSRF), Booking Engine, Trial Gate, Subscriptions, UPI/UTR, OTP, Translations |
| `npm run test:database` | Database Tests | Vitest | Dual-engine migrations idempotency, 18 tables DDL, foreign keys, constraints, rollbacks, and PostgreSQL parity |
| `npm run test:api` | REST API Integration | Vitest + Supertest | 9 feature controllers, JWT auth, RBAC, tenant isolation (IDOR), slot booking, payments queue, Family 360, resilience |
| `npm run test:realtime` | Real-Time Messaging | Vitest + Socket.io | Ephemeral server, room routing (`admin_room`, `user_${id}`), message receipts, typing indicators, conversation isolation |
| `npm run test:security` | Security & Penetration | Vitest + Supertest | SQL injection, stored XSS, JWT signature tampering, None-alg bypass, mass assignment, automated IDOR sweep, audit logging |
| `npm run test:frontend` | Frontend RTL Tests | Vitest + JSDOM | React Testing Library component render, LanguageContext, CountryContext, Modal state machines, WebCrypto round trip |
| `npm run test:e2e` | End-to-End Journeys | Playwright | Real browser automation (Chromium, Mobile viewports): Onboarding, 5-min Trial Gate, Timezone-aware booking, Admin Payment Queue |
| `npm run test:llm` | AI Quality Eval | Vitest + Custom Eval | 30 diverse seeds, deterministic Devanagari/schema checks, LLM-as-judge rubric (7 criteria, 1-5 scale), consistency variance |
| `npm run test:perf` | Load & Concurrency | Autocannon | Gateway baseline (/health), packages DB reads, availability math, double-booking race condition stress test, RSA cache latency |
| `npm run test:coverage` | Code Coverage | Vitest + V8 | Line and branch coverage reporting across all backend modules with HTML reports in `server/coverage/` |
| `npm run test:mutation` | Mutation Testing | Stryker | Mutant generation across critical security, transpiler, and booking engines |

---

## 3. Running Against PostgreSQL

AmitAstro features a dual-engine database layer: SQLite for zero-setup local dev and PostgreSQL for production.

### Using Docker Compose:
A local PostgreSQL instance can be started with:
```bash
docker run --name amitastro-postgres -e POSTGRES_USER=amitastro_user -e POSTGRES_PASSWORD=amitastro_test_password -e POSTGRES_DB=amitastro_test -p 5432:5432 -d postgres:16-alpine
```

### Running Tests on PostgreSQL:
Set the environment variables before running:
```bash
export TEST_USE_POSTGRES=true
export DATABASE_URL=postgres://amitastro_user:amitastro_test_password@localhost:5432/amitastro_test
cd server && npm run test:database
```

The database harness automatically creates, verifies, and truncates isolated schemas between runs.

---

## 4. Running the AI Evaluation Harness

The AI evaluation harness in `eval/` benchmarks Gemini-generated astrological articles, translations, and ethical guardrails.

### Offline / CI Mode (Deterministic & Free)
Runs against recorded ground-truth seeds and benchmarks without consuming API quotas:
```bash
cd server
npm run test:llm
```

### Live Evaluation Mode (Real Gemini API)
To benchmark live responses directly against Google Gemini 1.5 / 2.0 Flash:
```bash
export GEMINI_API_KEY="your-actual-api-key"
cd server
NODE_PATH=./node_modules ./node_modules/.bin/tsx ../eval/evalRunner.ts
```

Output reports are saved to:
- Machine-readable JSON: `eval/eval-report.json`
- Human-readable Markdown: `docs/llm-evaluation.md`

---

## 5. Adding New Tests

### Test Factories & Fixtures
Always use the shared fixtures in `server/tests/helpers/factories.ts` to create isolated entities:
```typescript
import { createUserFixture, createAdminFixture, createAppointmentFixture } from '../helpers/factories';

const user = await createUserFixture({ phone: '+919876543210' });
const admin = await createAdminFixture();
```

### Authentication Context Helper
Generate valid JWT tokens and CSRF double-submit cookies for any user:
```typescript
import { generateAuthContextForUser } from '../helpers/authHelper';

const auth = generateAuthContextForUser(user);
const res = await request(app)
  .get('/api/appointments')
  .set('Authorization', auth.authHeader.Authorization)
  .set('Cookie', auth.cookieHeader);
```

### Database Isolation
Every test suite must instantiate an isolated ephemeral SQLite file via `createTestDatabase()`:
```typescript
import { createTestDatabase, TestDbContext } from '../helpers/testDb';

let dbCtx: TestDbContext;
beforeAll(async () => {
  dbCtx = await createTestDatabase();
});
afterAll(async () => {
  await dbCtx.cleanup();
});
```

---

## 6. Troubleshooting & Common Pitfalls

1. **Port Conflicts**: All test helpers dynamically bind Express and Socket.io to random ephemeral ports (`port: 0` or unique per-run ports), preventing `EADDRINUSE` errors.
2. **Database Locks**: If a test hangs or throws `SQLITE_BUSY`, ensure previous database connections are cleanly closed in `afterAll()` using `await dbCtx.cleanup()`.
3. **Playwright Missing Browsers**: Run `npx playwright install chromium` inside the `client/` directory.
4. **Timezone Discrepancies**: The booking engine normalizes all slot generation to `Asia/Kolkata` (IST, UTC+5:30). When asserting against user timezones, always use ISO strings or explicit timezone offsets.
