# AmitAstro Defect Log & Security Vulnerability Report

This document records all defects, logic flaws, race vulnerabilities, and security weaknesses uncovered during the comprehensive Quality Engineering audit of the AmitAstro platform.

---

## 1. Resolved Defects & Regressions

### BUG-01: RSA Decryption Fallback to Active Key on Missing Key ID
- **Severity**: **Medium** (CWE-327: Use of Broken or Risky Cryptographic Algorithm)
- **Discovered In**: `server/tests/unit/securityService.test.ts`
- **Location**: `server/src/services/securityService.ts` (line 109)
- **Root Cause**: When a client submitted an encrypted payload with an unknown or omitted `keyId`, the engine fell back to decrypting with the currently active private key rather than rejecting the payload. This violated strict historical key rotation isolation.
- **Fix Applied**: Added an explicit key lookup validation that returns `null` if the requested historical `keyId` does not exist in the active or 24-hour historical key cache.
- **Regression Guard**: `server/tests/unit/securityService.test.ts` (`rejects decryption with invalid or unknown keyId`).

---

### BUG-02: Constant-Time String Comparison Empty String Bypass
- **Severity**: **High** (CWE-208: Observable Timing Discrepancy)
- **Discovered In**: `server/tests/unit/securityService.test.ts`
- **Location**: `server/src/services/securityService.ts` (line 251)
- **Root Cause**: `securityService.timingSafeCompare(a, b)` returned `true` when both strings were empty (`"" === ""`), allowing an empty CSRF header to bypass validation if the CSRF cookie was somehow omitted or set to empty.
- **Fix Applied**: Enforced strict length checks requiring both inputs to be defined and non-empty (`a.length > 0 && b.length > 0`) before performing `crypto.timingSafeEqual`.
- **Regression Guard**: `server/tests/unit/securityService.test.ts` (`timingSafeCompare correctly compares equal and unequal strings`).

---

### BUG-03: Missing Appointment Status Transition Whitelist
- **Severity**: **High** (CWE-840: Business Logic Error)
- **Discovered In**: `server/tests/api/booking.test.ts`
- **Location**: `server/src/controllers/appointmentController.ts` (line 327)
- **Root Cause**: The status update endpoint accepted arbitrary string inputs for appointment status without validating against the legitimate state machine (`Requested`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`).
- **Fix Applied**: Added strict whitelist validation in `appointmentController.updateAppointmentStatus` returning `400 Bad Request` with an explanatory error for any unrecognized status.
- **Regression Guard**: `server/tests/api/booking.test.ts` (`rejects invalid appointment status transitions with 400 Bad Request`).

---

### BUG-04: JWT Secret Cached at Module Evaluation Time
- **Severity**: **Medium** (Configuration & Test Isolation Defect)
- **Discovered In**: `server/tests/api/auth.test.ts`
- **Location**: `server/src/middleware/auth.ts` (line 5)
- **Root Cause**: `const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'` was evaluated once when the module was loaded. When tests dynamically set `process.env.JWT_SECRET` during ephemeral bootstrap, the middleware still referenced the stale initial value.
- **Fix Applied**: Refactored to a dynamic getter function `getJwtSecret()` called on every token verification request.
- **Regression Guard**: `server/tests/api/auth.test.ts` (`verifies JWT tokens across dynamic test environments`).

---

### BUG-05: SQL Transpiler Missing PostgreSQL Compatibility for `INSERT OR IGNORE`
- **Severity**: **High** (CWE-437: Incomplete Database Compatibility)
- **Discovered In**: `server/tests/database/migrationsAndParity.test.ts`
- **Location**: `server/src/db/database.ts` (`formatSqlForEngine`)
- **Root Cause**: PostgreSQL rejected SQLite's `INSERT OR IGNORE INTO` syntax with `syntax error at or near "OR"`. The transpiler converted `?` placeholders and `datetime('now')`, but did not translate ignore-conflicts syntax.
- **Fix Applied**: Extended `formatSqlForEngine` regex transpiler to automatically convert `INSERT OR IGNORE INTO` into `INSERT INTO ... ON CONFLICT DO NOTHING` when `isPostgres === true`.
- **Regression Guard**: `server/tests/database/migrationsAndParity.test.ts` (`executes migrations and queries with transpiled placeholders and ON CONFLICT DO NOTHING on Postgres`).

---

### BUG-06: Non-Idempotent Demo Data Seeding Crashed On Subsequent Boots
- **Severity**: **Medium** (Operational & Flakiness Defect)
- **Discovered In**: `server/tests/perf/loadTest.ts`
- **Location**: `server/src/db/database.ts` (`seedDemoData`)
- **Root Cause**: `birth_profiles`, `customer_crm_meta`, `packages`, `categories`, `appointments`, and `payments` seeded with raw `INSERT INTO` statements failed with `SQLITE_CONSTRAINT: UNIQUE constraint failed` whenever `initDatabase()` ran more than once.
- **Fix Applied**: Replaced all demo data seed queries with `INSERT OR IGNORE INTO`, rendering database initialization 100% idempotent across repeated runs.
- **Regression Guard**: `server/tests/database/migrationsAndParity.test.ts` (`executes boot-time migrations idempotently without errors or data corruption`).

---

### BUG-07: Classical Vedic Literature Citation Flagged as Prompt Leakage
- **Severity**: **Low** (Evaluation Precision Defect)
- **Discovered In**: `eval/evalRunner.ts`
- **Location**: `eval/deterministicValidators.ts` (line 47)
- **Root Cause**: The prompt leakage detector included the classical text title "Brihat Parashara Hora Shastra" in its forbidden leakage regex. Because authentic astrological articles frequently cite this classical authority, 24 legitimate candidate outputs were incorrectly flagged as system prompt leaks.
- **Fix Applied**: Removed the classical literature citation from the pattern, restricting leakage checks strictly to internal developer instructions (`system instruction`, `return only a raw json object`, `avoid fatalistic fearmongering`).
- **Regression Guard**: `server/tests/llm/aiEvaluationHarness.test.ts` (`flags prompt leakage patterns when internal system instructions are exposed`).

---

## 2. Unfixed Security Weaknesses & Architectural Recommendations

### SEC-WARN-01: Production PostgreSQL SSL Verification Disabled
- **Severity**: **HIGH** (CWE-295: Improper Certificate Validation)
- **Location**: `server/src/db/database.ts` (line 48)
```typescript
ssl: { rejectUnauthorized: false }
```
- **Risk**: Disabling certificate verification exposes database traffic between the Render application server and the hosted PostgreSQL database to Man-in-the-Middle (MITM) eavesdropping and credential interception.
- **Recommended Remediation**: Download the cloud database CA certificate (e.g., Supabase/Render RDS CA bundle), store it securely, and configure `ssl: { ca: fs.readFileSync(caCertPath), rejectUnauthorized: true }`.

---

### SEC-WARN-02: Permissive CORS Configuration with Credentials Enabled
- **Severity**: **HIGH** (CWE-942: Overly Permissive CORS Policy)
- **Location**: `server/src/server.ts` (lines 35–38)
```typescript
app.use(cors({
  origin: true,
  credentials: true
}));
```
- **Risk**: Setting `origin: true` reflects whatever `Origin` header is received in the HTTP request back to the browser while simultaneously allowing credentials (`credentials: true`). Any malicious website can initiate authenticated cross-origin XMLHttpRequests on behalf of an authenticated victim.
- **Recommended Remediation**: Restrict `origin` to an explicit whitelist of trusted production domains:
```typescript
const ALLOWED_ORIGINS = ['https://amitastro.com', 'https://www.amitastro.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));
```

---

### SEC-WARN-03: Missing Database-Level Unique Constraint on Appointment Slot Collisions
- **Severity**: **MEDIUM** (CWE-362: Concurrent Execution using Shared Resource)
- **Location**: `server/src/db/database.ts` (`CREATE TABLE appointments`)
- **Risk**: The appointments table currently enforces slot collision checks at the application level in `appointmentController.ts`. Under high concurrency or network partition, two concurrent requests for the exact same slot (`requested_date`, `requested_time_window`) can both pass the application check before either writes to the database.
- **Recommended Remediation**: Add a database-level composite unique index:
```sql
CREATE UNIQUE INDEX idx_appointments_slot ON appointments(requested_date, requested_time_window) WHERE status != 'Cancelled';
```

---

### SEC-WARN-04: Transitive Dependencies with Known CVEs
- **Severity**: **MODERATE**
- **Command Output**: `npm audit` reported 17 vulnerabilities (2 low, 7 moderate, 6 high, 2 critical) residing in transitive dependencies of legacy packages (`sqlite3` -> `tar`, `express` -> `proxy-addr`, `qs`).
- **Recommended Remediation**: Plan a phased dependency upgrade schedule to update Express to v5 and migrate from `sqlite3` to modern `@libsql/client` or `better-sqlite3`.
