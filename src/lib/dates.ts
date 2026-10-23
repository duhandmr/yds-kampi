import { APP_TIMEZONE } from "./constants";

/** Verilen anı İstanbul saatine göre YYYY-MM-DD anahtarına çevirir. */
export function toDateKey(date: Date, timeZone: string = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** b - a (gün) */
export function diffDays(a: string, b: string): number {
  return Math.round((keyToUtcMs(b) - keyToUtcMs(a)) / 86_400_000);
}

export function addDaysToKey(key: string, days: number): string {
  const date = new Date(keyToUtcMs(key) + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function formatDateKeyTr(key: string): string {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function formatDateTimeTr(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

/** Kamp ilerlemesi ve sınava kalan gün. */
export function campProgress(
  campStartKey: string,
  examDateKey: string | null,
  todayKey: string,
): { daysLeft: number | null; percent: number | null; totalDays: number | null } {
  if (!examDateKey) return { daysLeft: null, percent: null, totalDays: null };
  const totalDays = Math.max(1, diffDays(campStartKey, examDateKey));
  const elapsed = Math.min(totalDays, Math.max(0, diffDays(campStartKey, todayKey)));
  const daysLeft = Math.max(0, diffDays(todayKey, examDateKey));
  return { daysLeft, totalDays, percent: Math.round((elapsed / totalDays) * 100) };
}
