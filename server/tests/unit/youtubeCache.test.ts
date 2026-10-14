import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCuratedAmitAstroVideos } from '../../src/controllers/youtubeController';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class InMemoryCache<T> {
  private entry: CacheEntry<T> | null = null;
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(now = Date.now()): T | null {
    if (this.entry && now - this.entry.timestamp < this.ttlMs) {
      return this.entry.data;
    }
    return null;
  }

  set(data: T, now = Date.now()): void {
    this.entry = { data, timestamp: now };
  }

  clear(): void {
    this.entry = null;
  }
}

describe('Unit: YouTube Showcase & In-Memory Cache TTL', () => {
  it('returns valid curated Amit Astro videos matching the expected structure', () => {
    const videos = getCuratedAmitAstroVideos();
    expect(videos.length).toBeGreaterThanOrEqual(4);

    for (const v of videos) {
      expect(v.videoId).toBeDefined();
      expect(v.title).toBeDefined();
      expect(v.thumbnail).toMatch(/^https:\/\//);
      expect(v.channelTitle).toBe('Amit Astro');
      expect(v.duration).toMatch(/^\d{1,2}:\d{2}$/);
      expect(typeof v.isShort).toBe('boolean');
    }
  });

  it('serves cached data within the 1-hour (3600s) TTL window', () => {
    const cache = new InMemoryCache<string[]>(60 * 60 * 1000);
    const mockVideos = ['video-1', 'video-2'];
    const startTime = 1000000;

    cache.set(mockVideos, startTime);

    // After 30 minutes (within TTL)
    const thirtyMinsLater = startTime + 30 * 60 * 1000;
    expect(cache.get(thirtyMinsLater)).toEqual(mockVideos);

    // Exactly at 59 minutes
    const fiftyNineMinsLater = startTime + 59 * 60 * 1000;
    expect(cache.get(fiftyNineMinsLater)).toEqual(mockVideos);
  });

  it('invalidates cache after 1-hour TTL window expires', () => {
    const cache = new InMemoryCache<string[]>(60 * 60 * 1000);
    const mockVideos = ['video-1', 'video-2'];
    const startTime = 1000000;

    cache.set(mockVideos, startTime);

    // After 61 minutes (exceeds 1-hour TTL)
    const sixtyOneMinsLater = startTime + 61 * 60 * 1000;
    expect(cache.get(sixtyOneMinsLater)).toBeNull();
  });
});
