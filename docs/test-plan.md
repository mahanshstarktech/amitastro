# AmitAstro Test Strategy and Plan

**Document Version:** 1.0.0  
**Role:** Staff Software Engineer in Test (SDET) / AI-Evaluation Engineer  
**System Under Test:** AmitAstro Web Platform (Vedic Astrology & Consultation Platform)  
**Date:** October 2026  

---

## 1. System Overview & Architecture Summary

AmitAstro is an end-to-end consultation platform featuring:
- **Frontend:** React 19 (`react: ^19.2.8`), TypeScript (`~6.0.2`), Vite 8 (`^8.3.0`), Service Worker PWA with offline caching (`sw.js`), Apple-grade design system in Vanilla CSS (`design-system.css`, 2,182 LOC).
- **Backend:** Node.js + Express + TypeScript, HTTP REST API (55 endpoints) + Socket.io bidirectional gateway for real-time messaging.
- **Data Layer:** Dual-Engine SQL database abstraction (`server/src/db/database.ts`) supporting local SQLite (WAL mode) and Cloud PostgreSQL (production), using a dynamic SQL dialect transpiler (`formatSqlForEngine`).
- **Security Infrastructure:** Client-side 2048-bit RSA-OAEP encryption with ephemeral key rotation (6h) and nonce replay protection, double-submit cookie anti-CSRF (`_zcsr_tmp`), BCrypt (salt factor 12), IP rate limiting (45 req/min), progressive account lockout, multi-channel OTP (SMS + Email).
- **Domain Logic:**
  - 5-Minute Free Trial discovery call with server-enforced countdown and phone-number deduplication across accounts.
  - Timezone-aware booking engine translating client browser timezones into Indian Standard Time (IST) availability windows.
  - Manual UPI QR code generator (`upi://pay`) and 12-digit bank UTR verification queue with Telegram administrative alerts.
  - Family 360 annual membership tier with Netflix-style autopay controls and multi-member birth profile gating (max 4 members).
  - Bilingual AI Blog Studio leveraging Google Gemini 2.5 Flash for English/Hindi generation, image prompt synthesis, and translation.

---

## 2. Risk-Ranked Test Scope

Testing priorities are ordered strictly by business criticality, financial liability, and security risk:

| Priority | Risk Category | Component / Module | Failure Impact | Mitigation / Test Coverage |
|:---|:---|:---|:---|:---|
| **P0** | **Financial Integrity** | `paymentController.ts`, `subscriptionService.ts` | Free consultations without payment, invalid UTR approvals, double-approval races, pricing mismatch across currencies | Unit, API, idempotency, race conditions, schema validation |
| **P0** | **Authentication & Cryptography** | `securityService.ts`, `cryptoAuth.ts`, `authController.ts`, `security.ts` | Credential interception, replay attacks, brute-force credential stuffing, CSRF compromise, privilege escalation to admin | RSA roundtrip, nonce replay tests, lockout state tests, timing-safe compare, IDOR sweep |
| **P1** | **Abuse & Trial Gating** | `trialController.ts`, `TrialCutoffModal.tsx` | Unbounded free consultations via account cycling or client-side timer manipulation | Multi-account phone deduplication, server-side countdown decrement, auto-lock tests |
| **P1** | **Scheduling & Timezone Math** | `appointmentController.ts`, `BookingModal.tsx` | Double bookings, off-by-hours time slot confusion for overseas clients, scheduling on blackout dates | Timezone offset fixtures (EST, PST, BST, AEST, IST, Nepal +5:45), concurrency booking tests |
| **P1** | **Data Isolation & Tenant Security** | All parameterized routes, `chatController.ts`, `birthProfileController.ts` | Customer A viewing or tampering with Customer B’s family birth charts, private chats, or payment proofs | IDOR automated matrix tests across all customer endpoints |
| **P2** | **Dual-Engine Database Parity** | `database.ts` (`formatSqlForEngine`, query runners) | Queries breaking on PostgreSQL deployment that pass on SQLite locally; SQL injection | Dual-suite matrix: SQLite vs PostgreSQL running identical assertions |
| **P2** | **Real-Time Communication** | `server.ts` (Socket.io), `chatController.ts`, `socket.ts` | Dropped messages, unauthorized room snooping, desynchronized unread counters | Multi-client socket connection tests, room isolation tests, audio synthesis tests |
| **P2** | **AI Content Quality & Safety** | `geminiService.ts`, `blogController.ts` | Inaccurate Vedic interpretations, fatalistic predictions, hallucinated medical/financial advice, Devanagari script corruption, prompt injection | Automated 30-seed eval dataset, deterministic schema & script validators, LLM-as-judge rubric |
| **P3** | **Frontend UI & Accessibility** | React Components, Contexts, Service Worker | Broken checkout/booking modals on mobile devices, accessibility barriers for assistive tech, PWA offline failure | React Testing Library unit tests, axe accessibility audits, Playwright offline tests |

---

## 3. Test Pyramid Breakdown

```
        /  E2E Tests (Playwright)  \           ~8 Journeys (Desktop + Mobile)
       /----------------------------\
      /   Real-Time / Socket Tests   \         Socket.io room isolation & events
     /--------------------------------\
    /     API & Integration Tests      \       55 Endpoints (Supertest + Real DB)
   /------------------------------------\
  /         Database Parity Tests        \     SQLite & PostgreSQL side-by-side
 /----------------------------------------\
/        Unit Tests (Pure Domain Logic)    \   Security, Booking, UPI, Transpiler, Eval
--------------------------------------------
```

- **Unit Tests:** Pure algorithmic logic, boundary conditions, edge cases, zero network overhead. Fast feedback (< 2 seconds).
- **Database Tests:** Schema integrity, idempotent migrations, constraint enforcement, SQL transpiler accuracy across SQLite and PostgreSQL.
- **API / Contract Tests:** Real HTTP calls via Supertest against an ephemeral Express server with isolated databases; schema validation on responses.
- **Real-Time Tests:** Real Socket.IO client-server interactions testing event distribution, rooms, and receipts.
- **Security Tests:** Automated IDOR sweep, injection vectors, mass assignment, token tampering, and security headers.
- **Frontend & A11y Tests:** Component behavior, state transitions, ARIA compliance, and Service Worker caching.
- **End-to-End (E2E) Tests:** Full browser user journeys with Playwright against a live staging server.
- **AI Evaluation Harness:** Deterministic heuristics + LLM-as-judge scoring for generative AI outputs.
- **Performance & Mutation Tests:** Autocannon load profiles and Stryker mutation verification.

---

## 4. Tooling Selection & Rationale

| Layer | Selected Tool | Rationale |
|:---|:---|:---|
| **Test Runner (Server & Client)** | **Vitest** | Native TypeScript support with ES modules, high execution speed, compatible with Vite config, out-of-the-box coverage via v8. |
| **HTTP Testing** | **Supertest** | Standard in-process HTTP assertion library for Express; tests real middleware and controllers without opening public sockets. |
| **Realtime Gateway Testing** | **socket.io-client** | Connects real WebSocket clients to Express HTTP server on ephemeral ports. |
| **Frontend Component Testing** | **React Testing Library + jsdom** | Behavior-driven component testing simulating user events without implementation coupling. |
| **End-to-End Testing** | **Playwright** | Native multi-browser support (Chromium, Firefox, WebKit), network emulation, mobile viewports, automated trace/video recording. |
| **Accessibility Testing** | **@axe-core/playwright / axe-core** | WCAG 2.1 AA automated compliance scanning for forms, navigation, and modals. |
| **Load & Stress Testing** | **Autocannon** | Node-native high-throughput benchmarking tool generating p50, p95, p99 latency distributions. |
| **Mutation Testing** | **Stryker Mutator** | Injects faults into critical AST nodes (boolean inversions, boundary conditions) to calculate mutation survival score. |
| **Schema Contract Validation** | **Zod** | TypeScript-first schema declaration and runtime validation for API response envelopes and AI outputs. |

---

## 5. Test Environments & Execution Matrix

1. **Local Development (macOS / Linux):**
   - Node.js v24.10.0+
   - SQLite3 database files created in isolated temporary directories (`/tmp/amitastro-test-...db`).
   - Local native PostgreSQL 18.3 instance (`postgres://localhost:5432/amitastro_test`) for dual-engine parity testing.
2. **Continuous Integration (GitHub Actions on Ubuntu Linux):**
   - Containerized PostgreSQL 16 service container (`postgres:16-alpine`) with automated healthchecks.
   - Dual-engine test matrix running full integration suites against both SQLite and PostgreSQL.
   - Headless Playwright browser binaries with Linux dependencies pre-cached.

---

## 6. Entry & Exit Criteria

### Entry Criteria
- Source code compiles with zero TypeScript errors (`tsc --noEmit`).
- Ephemeral test databases can be provisioned and destroyed without filesystem residue.
- Test runner boots with clean isolation and zero inter-test state leakage.

### Exit Criteria (Quality Gates)
- **100% Pass Rate** across all unit, integration, and security suites.
- **Critical Module Coverage:** > 85% line coverage and > 75% branch coverage on core security, payment, and scheduling modules (`securityService.ts`, `database.ts`, `trialController.ts`, `appointmentController.ts`, `paymentController.ts`).
- **Flake Rate:** 0% over 10 consecutive E2E runs.
- **AI Evaluation Gate:** > 80% pass rate on deterministic validation; mean LLM-as-judge score >= 3.8/5.0 across safety, Vedic accuracy, and utility criteria.
- **Mutation Testing:** Mutation score > 60% on critical security and calculation routines.

---

## 7. Explicitly Out of Scope (With Justifications)

1. **External Third-Party Production Gateways (Live Twilio, Resend, Brevo, Telegram, YouTube APIs):**
   - *Reason:* Automated suites must not incur billing, spam real phone numbers, or fail due to external vendor uptime. Handlers are verified using strict mock boundaries or simulated fallback modes.
2. **Performance Testing Beyond 1,000 Concurrent Connections on Free Cloud Tiers:**
   - *Reason:* AmitAstro is architected for single-astrologer consultation capacity (1–10 concurrent seekers); stress tests focus on real-world burst capacity (50–200 req/sec) rather than hyper-scale load.
3. **Automated End-to-End Real Bank UPI Transfers:**
   - *Reason:* Indian NPCI banking rails do not provide a sandbox bank simulator for manual UTR verification; workflow is simulated up to dynamic intent generation and admin settlement approval.
