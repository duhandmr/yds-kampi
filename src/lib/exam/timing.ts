/** Sunucunun cevap kaydında tanıdığı küçük ağ gecikmesi payı. */
export const SAVE_GRACE_MS = 5_000;

export function computeDeadline(startedAt: Date, durationSeconds: number): Date {
  return new Date(startedAt.getTime() + durationSeconds * 1000);
}

export function remainingMs(now: Date, deadline: Date): number {
  return Math.max(0, deadline.getTime() - now.getTime());
}

export function isExpired(now: Date, deadline: Date, graceMs = 0): boolean {
  return now.getTime() > deadline.getTime() + graceMs;
}

export function elapsedSeconds(startedAt: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - startedAt.getTime()) / 1000));
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDurationTr(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return rest > 0 ? `${m} dk ${rest} sn` : `${m} dk`;
  return `${rest} sn`;
}
