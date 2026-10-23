import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type DifficultyKey, type QuestionTypeKey } from "../constants";

export interface PlacementItem {
  type: QuestionTypeKey;
  difficulty: DifficultyKey;
  outcome: "correct" | "wrong" | "blank";
}

export interface PlacementResult {
  ratio: number;
  levelLabel: string;
  levelDescription: string;
  strongTypes: QuestionTypeKey[];
  weakTypes: QuestionTypeKey[];
  recommendedDailyMinutes: number;
  plan: Array<{ day: number; focus: string[]; note: string }>;
  disclaimer: string;
}

const WEIGHT: Record<DifficultyKey, number> = { EASY: 1, MEDIUM: 1.5, HARD: 2 };

export const PLACEMENT_DISCLAIMER =
  "Bu sonuç uygulama içi bir performans göstergesidir; gerçek bir ÖSYM puanı veya kesin bir sınav tahmini değildir.";

/** Seviye belirleme sınavından başlangıç seviyesi, güçlü/zayıf alanlar ve ilk haftalık plan üretir. */
export function estimatePlacement(items: PlacementItem[]): PlacementResult {
  let earned = 0;
  let possible = 0;
  const perType = new Map<QuestionTypeKey, { earned: number; possible: number }>();
  for (const it of items) {
    const w = WEIGHT[it.difficulty];
    possible += w;
    if (it.outcome === "correct") earned += w;
    const t = perType.get(it.type) ?? { earned: 0, possible: 0 };
    t.possible += w;
    if (it.outcome === "correct") t.earned += w;
    perType.set(it.type, t);
  }
  const ratio = possible === 0 ? 0 : Math.round((earned / possible) * 100) / 100;

  let levelLabel: string;
  let levelDescription: string;
  let recommendedDailyMinutes: number;
  if (ratio < 0.35) {
    levelLabel = "Temel";
    levelDescription = "Temel yapılar ve sık kullanılan akademik kelimelerle sağlam bir zemin kurmak öncelikli.";
    recommendedDailyMinutes = 75;
  } else if (ratio < 0.55) {
    levelLabel = "Gelişen";
    levelDescription = "Temel yapılar oturmaya başlamış; düzenli tekrar ve soru tipine özgü stratejiler hızlı ilerleme sağlar.";
    recommendedDailyMinutes = 60;
  } else if (ratio < 0.75) {
    levelLabel = "Orta-İleri";
    levelDescription = "Pek çok soru tipinde iyi bir temel var; zor sorular ve süre yönetimi üzerine yoğunlaşmak faydalı olacak.";
    recommendedDailyMinutes = 50;
  } else {
    levelLabel = "İleri";
    levelDescription = "Güçlü bir başlangıç. Hedef, istikrarı korumak ve zor paragraf sorularında hızı artırmak.";
    recommendedDailyMinutes = 40;
  }

  const typeRatios = QUESTION_TYPES.filter((t) => perType.has(t)).map((t) => {
    const v = perType.get(t)!;
    return { type: t, r: v.possible === 0 ? 0 : v.earned / v.possible };
  });
  const strongTypes = typeRatios.filter((x) => x.r >= 0.75).map((x) => x.type);
  const weakTypes = typeRatios
    .filter((x) => x.r < 0.5)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.type);

  const focusPool = weakTypes.length > 0 ? weakTypes : typeRatios.sort((a, b) => a.r - b.r).map((x) => x.type);
  const plan = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    if (day === 7) {
      return { day, focus: ["Haftalık genel tekrar"], note: "Hafta boyunca yanlış yapılan sorular ve kelime tekrarı." };
    }
    const a = focusPool[i % Math.max(1, focusPool.length)];
    const b = focusPool[(i + 1) % Math.max(1, focusPool.length)];
    const focus = [...new Set([a, b].filter(Boolean) as QuestionTypeKey[])].map((t) => QUESTION_TYPE_LABELS[t]);
    return { day, focus, note: "Günlük deneme bu alanlara biraz daha fazla ağırlık verecek." };
  });

  return { ratio, levelLabel, levelDescription, strongTypes, weakTypes, recommendedDailyMinutes, plan, disclaimer: PLACEMENT_DISCLAIMER };
}
