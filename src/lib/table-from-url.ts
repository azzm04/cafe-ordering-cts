export function parseTableNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 200) return null; // sesuaikan max meja kamu
  return n;
}
