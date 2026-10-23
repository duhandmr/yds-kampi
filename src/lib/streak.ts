import { diffDays } from "./dates";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyDays: number;
}

/** Günlük çalışma serisini günceller. Aynı gün ikinci çalışma seriyi artırmaz; bir gün atlanırsa seri 1'den başlar. */
export function updateStreak(prev: StreakState | null, todayKey: string): StreakState {
  const base = prev ?? { currentStreak: 0, longestStreak: 0, lastStudyDate: null, totalStudyDays: 0 };
  if (base.lastStudyDate === todayKey) return { ...base };
  const gap = base.lastStudyDate ? diffDays(base.lastStudyDate, todayKey) : null;
  if (gap !== null && gap < 0) return { ...base };
  const currentStreak = gap === 1 ? base.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(base.longestStreak, currentStreak),
    lastStudyDate: todayKey,
    totalStudyDays: base.totalStudyDays + 1,
  };
}

/** Görüntüleme için: son çalışma dünden eskiyse seri sona ermiş sayılır. */
export function displayStreak(state: StreakState | null, todayKey: string): number {
  if (!state?.lastStudyDate) return 0;
  const gap = diffDays(state.lastStudyDate, todayKey);
  return gap <= 1 ? state.currentStreak : 0;
}
