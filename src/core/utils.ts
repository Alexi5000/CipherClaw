/**
 * CipherClaw — Shared Utilities
 * Pure helper functions used across all modules.
 */

let _idCounter = 0;

/** Generate a unique prefixed ID. */
export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}

/** Arithmetic mean of a number array. Returns 0 for empty arrays. */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Sample standard deviation (n-1). Returns 0 for arrays with < 2 elements. */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Clamp a value between min and max. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Shannon entropy of a frequency distribution. */
export function entropy(frequencies: number[]): number {
  const total = frequencies.reduce((s, f) => s + f, 0);
  if (total === 0) return 0;
  return -frequencies
    .filter(f => f > 0)
    .map(f => f / total)
    .reduce((s, p) => s + p * Math.log2(p), 0);
}
