import type { VocabStatusKey } from "../constants";

/** 0 = Tekrar (bilmedim), 1 = Zor, 2 = İyi, 3 = Kolay */
export type ReviewGrade = 0 | 1 | 2 | 3;

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
  status: VocabStatusKey;
}

const DAY_MS = 86_400_000;
export const LEARNED_INTERVAL_DAYS = 21;

/** SM-2'den uyarlanmış sade aralıklı tekrar algoritması. */
export function scheduleReview(state: SrsState, grade: ReviewGrade, now: Date): SrsResult {
  if (grade === 0) {
    return {
      easeFactor: Math.max(1.3, Math.round((state.easeFactor - 0.2) * 100) / 100),
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000),
      status: "REVIEW",
    };
  }
  const repetitions = state.repetitions + 1;
  const easeDelta = grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0;
  const easeFactor = Math.max(1.3, Math.round((state.easeFactor + easeDelta) * 100) / 100);
  let intervalDays: number;
  if (repetitions === 1) intervalDays = grade === 3 ? 2 : 1;
  else if (repetitions === 2) intervalDays = grade === 1 ? 2 : grade === 3 ? 4 : 3;
  else {
    const multiplier = grade === 1 ? 1.2 : grade === 3 ? easeFactor * 1.3 : easeFactor;
    intervalDays = Math.max(state.intervalDays + 1, Math.round(state.intervalDays * multiplier));
  }
  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
    status: intervalDays >= LEARNED_INTERVAL_DAYS ? "LEARNED" : "LEARNING",
  };
}

/** Yanlış yapılan bir soruda tekrar karşılaşılan kelime: öğrenildi sayılmışsa yeniden tekrara alınır. */
export function relapse(state: SrsState & { status: VocabStatusKey }, now: Date): SrsResult {
  if (state.status === "NEW") {
    return { easeFactor: state.easeFactor, intervalDays: state.intervalDays, repetitions: state.repetitions, dueAt: now, status: "NEW" };
  }
  return { easeFactor: Math.max(1.3, state.easeFactor - 0.2), intervalDays: 0, repetitions: 0, dueAt: now, status: "REVIEW" };
}
