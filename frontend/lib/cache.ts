'use client';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

// Safe cache duration (15 seconds) - keeps navigation snappy while staying fresh
const DEFAULT_TTL_MS = 15_000;

export async function fetchWithCache<T>(
  url: string,
  fetcher: () => Promise<Response>,
  options: { ttlMs?: number; force?: boolean } = {}
): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, force = false } = options;
  const now = Date.now();

  if (!force && memoryCache.has(url)) {
    const entry = memoryCache.get(url)! as CacheEntry<T>;
    if (now - entry.timestamp < ttlMs) {
      return entry.data;
    }
  }

  // Deduplicate concurrent requests for the same URL
  if (inFlight.has(url)) {
    return inFlight.get(url) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const res = await fetcher();
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as T;
      memoryCache.set(url, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  memoryCache.forEach((_, key) => {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  });
}
