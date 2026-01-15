import { DbNumeric } from "./types";

export function toNumber(v: DbNumeric): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value: ${String(v)}`);
  return n;
}

export function toNumberSafe(v: DbNumeric): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function assertPositive(n: number, msg: string) {
  if (!Number.isFinite(n) || n <= 0) throw new Error(msg);
}