// Einfache Begrenzung der Absendungen pro IP (im Speicher der jeweiligen Instanz).
export function createRateLimiter({ limit = 10, windowMs = 10 * 60 * 1000, now = () => Date.now() } = {}) {
  const hits = new Map();
  return function allow(key) {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 10000) for (const [k, v] of hits) if (v.every((ts) => t - ts >= windowMs)) hits.delete(k);
    return true;
  };
}
