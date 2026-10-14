process.env.NODE_ENV = 'test';
import os from 'os';
import path from 'path';
import fs from 'fs';
import http from 'http';
import autocannon from 'autocannon';
import { app, server } from '../../src/server';
import { createTestDatabase } from '../helpers/testDb';
import { runQuery } from '../../src/db/database';
import { v4 as uuidv4 } from 'uuid';

interface PerfResult {
  endpoint: string;
  method: string;
  connections: number;
  durationSec: number;
  requestsTotal: number;
  reqPerSec: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  non2xx: number;
  errors: number;
}

async function runAutocannon(options: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Amit Astro Performance, Load & Concurrency Benchmark');
  console.log('====================================================\n');

  // 1. Machine specifications
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model || 'Unknown CPU';
  const totalRamGb = (os.totalmem() / (1024 ** 3)).toFixed(1);
  const machineSpecs = {
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: `${cpus.length}x ${cpuModel}`,
    ram: `${totalRamGb} GB RAM`,
    nodeVersion: process.version
  };

  console.log('--- Test Environment Specifications ---');
  console.log(`OS:       ${machineSpecs.os}`);
  console.log(`CPU:      ${machineSpecs.cpu}`);
  console.log(`RAM:      ${machineSpecs.ram}`);
  console.log(`Node:     ${machineSpecs.nodeVersion}\n`);

  // 2. Setup ephemeral DB and listen on random free port
  const dbCtx = await createTestDatabase();
  console.log(`Initialized test database: ${dbCtx.dbPath}`);

  const PORT = 5892;
  const runningServer = await new Promise<http.Server>((resolve) => {
    const s = server.listen(PORT, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`Server listening on ${baseUrl} for benchmarking\n`);

  const results: PerfResult[] = [];

  try {
    // -------------------------------------------------------------
    // Test 1: Baseline HTTP Gateway (/health)
    // -------------------------------------------------------------
    console.log('Testing 1/4: GET /health (Baseline Gateway Overhead)...');
    const healthRes = await runAutocannon({
      url: `${baseUrl}/health`,
      connections: 25,
      duration: 5
    });
    results.push({
      endpoint: '/health',
      method: 'GET',
      connections: 25,
      durationSec: 5,
      requestsTotal: healthRes.requests.total,
      reqPerSec: Math.round(healthRes.requests.average),
      p50LatencyMs: healthRes.latency.p50,
      p95LatencyMs: healthRes.latency.p95 || healthRes.latency.p97_5 || healthRes.latency.p99,
      p99LatencyMs: healthRes.latency.p99,
      non2xx: healthRes.non2xx,
      errors: healthRes.errors
    });

    // -------------------------------------------------------------
    // Test 2: Packages Read Query (/api/packages)
    // -------------------------------------------------------------
    console.log('Testing 2/4: GET /api/packages (DB Read & Serialization)...');
    const pkgRes = await runAutocannon({
      url: `${baseUrl}/api/packages`,
      connections: 25,
      duration: 5
    });
    results.push({
      endpoint: '/api/packages',
      method: 'GET',
      connections: 25,
      durationSec: 5,
      requestsTotal: pkgRes.requests.total,
      reqPerSec: Math.round(pkgRes.requests.average),
      p50LatencyMs: pkgRes.latency.p50,
      p95LatencyMs: pkgRes.latency.p95 || pkgRes.latency.p97_5 || pkgRes.latency.p99,
      p99LatencyMs: pkgRes.latency.p99,
      non2xx: pkgRes.non2xx,
      errors: pkgRes.errors
    });

    // -------------------------------------------------------------
    // Test 3: Public Availability Slots (/api/availability)
    // -------------------------------------------------------------
    console.log('Testing 3/4: GET /api/availability (Slot Math Engine)...');
    const availRes = await runAutocannon({
      url: `${baseUrl}/api/availability?date=2026-11-15`,
      connections: 25,
      duration: 5
    });
    results.push({
      endpoint: '/api/availability',
      method: 'GET',
      connections: 25,
      durationSec: 5,
      requestsTotal: availRes.requests.total,
      reqPerSec: Math.round(availRes.requests.average),
      p50LatencyMs: availRes.latency.p50,
      p95LatencyMs: availRes.latency.p95 || availRes.latency.p97_5 || availRes.latency.p99,
      p99LatencyMs: availRes.latency.p99,
      non2xx: availRes.non2xx,
      errors: availRes.errors
    });

    // -------------------------------------------------------------
    // Test 4: Blog Posts Listing (/api/blog/posts)
    // -------------------------------------------------------------
    console.log('Testing 4/4: GET /api/blog/posts (Content Catalog)...');
    const blogRes = await runAutocannon({
      url: `${baseUrl}/api/blog/posts`,
      connections: 25,
      duration: 5
    });
    results.push({
      endpoint: '/api/blog/posts',
      method: 'GET',
      connections: 25,
      durationSec: 5,
      requestsTotal: blogRes.requests.total,
      reqPerSec: Math.round(blogRes.requests.average),
      p50LatencyMs: blogRes.latency.p50,
      p95LatencyMs: blogRes.latency.p95 || blogRes.latency.p97_5 || blogRes.latency.p99,
      p99LatencyMs: blogRes.latency.p99,
      non2xx: blogRes.non2xx,
      errors: blogRes.errors
    });

    // -------------------------------------------------------------
    // Concurrency & Race Condition Stress Test
    // -------------------------------------------------------------
    console.log('\n--- Concurrency Stress Test: Double Booking Race Condition ---');
    // Pre-insert a user
    const userId = 'perf-user-' + uuidv4().slice(0, 8);
    await runQuery(
      `INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)`,
      [userId, 'Race Test User', 'race@test.com', '9898989898']
    );

    await runQuery(
      `INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, pob) VALUES (?, ?, 'self', 'Race Profile', '1990-01-01', '10:00', 'Delhi')`,
      ['bp-perf-race', userId]
    );

    const raceDate = '2026-12-15';
    const raceWindow = '02:00 PM - 02:30 PM';
    console.log(`Dispatching 10 parallel booking requests targeting exact identical slot: ${raceDate} ${raceWindow}...`);

    let raceSuccessCount = 0;
    let raceConflictCount = 0;

    const bookAttempts = Array.from({ length: 10 }).map(async (_, idx) => {
      const apptId = `race-appt-${idx}-${uuidv4().slice(0, 6)}`;
      try {
        // Attempt insert simulating booking collision
        await runQuery(
          `INSERT INTO appointments (id, customer_id, birth_profile_id, package_id, consultation_type, requested_date, requested_time_window, status) VALUES (?, ?, ?, ?, 'call', ?, ?, 'Requested')`,
          [apptId, userId, 'bp-perf-race', 'pkg-quick', raceDate, raceWindow]
        );
        raceSuccessCount++;
      } catch (err: any) {
        raceConflictCount++;
      }
    });

    await Promise.all(bookAttempts);
    console.log(`Race Results: ${raceSuccessCount} booking(s) created, ${raceConflictCount} conflicts handled.`);

    // -------------------------------------------------------------
    // Verification of Public Key Cache Latency (Warm vs Cold)
    // -------------------------------------------------------------
    console.log('\n--- Cache Latency Verification (Cold vs Warm) ---');
    const t0 = performance.now();
    await fetch(`${baseUrl}/api/auth/public-key`);
    const coldMs = performance.now() - t0;

    const t1 = performance.now();
    await fetch(`${baseUrl}/api/auth/public-key`);
    const warmMs = performance.now() - t1;

    console.log(`Public Key Endpoint: Cold = ${coldMs.toFixed(2)} ms | Warm = ${warmMs.toFixed(2)} ms`);

    // -------------------------------------------------------------
    // Print Formatted Report Table
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log('📊 BENCHMARK RESULTS SUMMARY');
    console.log('====================================================');
    console.log('| Endpoint              | Req/s  | p50 (ms) | p95 (ms) | p99 (ms) | Errors |');
    console.log('|-----------------------|--------|----------|----------|----------|--------|');
    for (const r of results) {
      const ep = r.endpoint.padEnd(21);
      const rps = String(r.reqPerSec).padStart(6);
      const p50 = String(r.p50LatencyMs).padStart(8);
      const p95 = String(r.p95LatencyMs).padStart(8);
      const p99 = String(r.p99LatencyMs).padStart(8);
      const errs = String(r.errors + r.non2xx).padStart(6);
      console.log(`| ${ep} | ${rps} | ${p50} | ${p95} | ${p99} | ${errs} |`);
    }

    // Save summary file
    const outputDir = path.resolve(__dirname, '../../test-results');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const summaryPayload = {
      timestamp: new Date().toISOString(),
      machineSpecs,
      results,
      concurrencyTest: {
        totalParallelAttempts: 10,
        successCount: raceSuccessCount,
        conflictCount: raceConflictCount
      },
      cacheLatency: {
        coldMs: Number(coldMs.toFixed(2)),
        warmMs: Number(warmMs.toFixed(2))
      }
    };

    fs.writeFileSync(path.join(outputDir, 'perf-summary.json'), JSON.stringify(summaryPayload, null, 2), 'utf8');
    console.log(`\nBenchmark summary saved to: ${path.join(outputDir, 'perf-summary.json')}`);

  } finally {
    runningServer.close();
    await dbCtx.cleanup();
  }
}

main().catch((err) => {
  console.error('Performance test failed:', err);
  process.exit(1);
});
