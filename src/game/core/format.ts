// Number formatting for the UI.

export function fmtNum(n: number): string {
  if (n < 1000) return n % 1 === 0 ? String(n) : n.toFixed(1);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + u[i];
}
