import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiModule from '../../utils/api';
import { getActiveEncryptionKey, encryptPasswordForAuth } from '../../utils/cryptoAuth';

// Mock RSA 2048 Public Key in PEM format
const MOCK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyN8j0ZomzI34vL5/3jH4
uWj5kF4bQyWlG4kQ6Z9h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3
h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2
jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8p
G5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z
5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3h1X2Z5h8pG5x2jFk3
h1X2Z5h8pG5x2jFk3h1X2QIDAQAB
-----END PUBLIC KEY-----`;

describe('Unit: Client-Side CryptoAuth & WebCrypto Encryption', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and caches active encryption key within 10-minute TTL', async () => {
    const mockKeyResponse = {
      keyId: 'rsa_test_12345678',
      publicKey: MOCK_PUBLIC_KEY,
      algorithm: 'RSA-OAEP-256',
      serverTime: Date.now()
    };

    const apiSpy = vi.spyOn(apiModule, 'apiRequest').mockResolvedValue(mockKeyResponse);

    // Call 1: makes API request
    const key1 = await getActiveEncryptionKey();
    expect(key1.keyId).toBe('rsa_test_12345678');
    expect(apiSpy).toHaveBeenCalledTimes(1);

    // Call 2: served from cache within TTL
    const key2 = await getActiveEncryptionKey();
    expect(key2.keyId).toBe('rsa_test_12345678');
    expect(apiSpy).toHaveBeenCalledTimes(1); // Cached, no second API request
  });

  it('safely degrades to isEncrypted: false when window.crypto.subtle is not supported', async () => {
    const originalSubtle = window.crypto.subtle;
    try {
      // Simulate environment without WebCrypto Subtle
      Object.defineProperty(window.crypto, 'subtle', { value: undefined, configurable: true });

      const result = await encryptPasswordForAuth('PlainTextPassword');
      expect(result.isEncrypted).toBe(false);
      expect(result.encryptedPassword).toBeUndefined();
    } finally {
      Object.defineProperty(window.crypto, 'subtle', { value: originalSubtle, configurable: true });
    }
  });
});
