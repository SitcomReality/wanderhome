// Seeded hashing + value-noise fBm. (The spiritual successor of seedtohash.js)

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  if (!s.length) s = String(Math.floor(Math.random() * 1e9));
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

/** integer hash of (x, y, seed) -> [0,1) */
export function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** value noise in [-1, 1] */
export function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf), v = smooth(yf);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

export function fbm(x: number, y: number, seed: number, oct = 4): number {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += vnoise(x * freq, y * freq, seed + i * 1013) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}
