import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRateLimiter } from '../../src/middleware/security';
import { Request, Response } from 'express';

describe('Unit: Auth Route IP Rate Limiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: any;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    nextFn = vi.fn();
    mockRes = {
      status: statusMock
    };
  });

  it('allows requests within the 45 req/min threshold and blocks the 46th request', () => {
    const testIp = `10.0.0.${Math.floor(Math.random() * 200 + 1)}`;
    mockReq = {
      headers: { 'x-forwarded-for': testIp },
      socket: { remoteAddress: testIp } as any
    };

    // First 45 requests pass through to next()
    for (let i = 1; i <= 45; i++) {
      authRateLimiter(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(i);
    }

    // 46th request must be blocked with HTTP 429
    authRateLimiter(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(45); // Not called again
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Too many requests')
      })
    );
  });

  it('correctly tracks distinct IP addresses independently', () => {
    const ipA = '172.16.0.1';
    const ipB = '172.16.0.2';

    const reqA = { headers: { 'x-forwarded-for': ipA }, socket: {} as any } as Request;
    const reqB = { headers: { 'x-forwarded-for': ipB }, socket: {} as any } as Request;

    const nextA = vi.fn();
    const nextB = vi.fn();

    // Max out ipA
    for (let i = 0; i < 45; i++) {
      authRateLimiter(reqA, mockRes as Response, nextA);
    }
    // 46th for ipA is blocked
    authRateLimiter(reqA, mockRes as Response, nextA);
    expect(nextA).toHaveBeenCalledTimes(45);

    // ipB should still be allowed
    authRateLimiter(reqB, mockRes as Response, nextB);
    expect(nextB).toHaveBeenCalledTimes(1);
  });
});
