import { DIFFICULTIES, QUESTION_TYPES, type DifficultyKey, type QuestionTypeKey } from "../constants";
import { createRng, shuffle } from "../random";
import { NEAR_DUPLICATE_THRESHOLD, jaccard, shingles } from "../questions/similarity";

export interface PoolQuestion {
  id: string;
  type: QuestionTypeKey;
  topicId: string;
  difficulty: DifficultyKey;
  text: string;
}

export interface Exposure {
  questionId: string;
  timesSeen: number;
  lastSeenAt: Date;
  lastCorrect: boolean | null;
}

export interface TopicMastery {
  topicId: string;
  mastery: number;
  questionsSeen: number;
}

export interface SelectionInput {
  pool: PoolQuestion[];
  exposures: Exposure[];
  masteries: TopicMastery[];
  typeWeights: Partial<Record<QuestionTypeKey, number>>;
  count: number;
  seed: string;
  now: Date;
  /** Bu süre içinde görülen sorular ve onlara çok benzeyenler mümkün olduğunca kullanılmaz. */
  recentWindowDays?: number;
}

export interface PlanEntry {
  type: QuestionTypeKey;
  count: number;
  weakness: number;
  reason: "weak" | "balanced" | "strong";
}

export interface SelectionResult {
  questionIds: string[];
  plan: PlanEntry[];
  reusedCount: number;
  difficultyTargets: Record<DifficultyKey, number>;
}

const DAY_MS = 86_400_000;
const DEFAULT_MASTERY = 0.5;

export function difficultyMixFor(avgMastery: number): Record<DifficultyKey, number> {
  if (avgMastery < 0.45) return { EASY: 0.4, MEDIUM: 0.45, HARD: 0.15 };
  if (avgMastery < 0.7) return { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 };
  return { EASY: 0.2, MEDIUM: 0.45, HARD: 0.35 };
}

/** En büyük kalan yöntemiyle toplamı `total` olan tam sayı dağılımı. */
export function apportion(weights: Map<string, number>, total: number): Map<string, number> {
  const entries = [...weights.entries()].filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  const result = new Map<string, number>();
  if (sum === 0 || total <= 0) return result;
  const raw = entries.map(([k, w]) => ({ k, exact: (w / sum) * total }));
  let assigned = 0;
  for (const r of raw) {
    const base = Math.floor(r.exact);
    result.set(r.k, base);
    assigned += base;
  }
  const byRemainder = [...raw].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.k.localeCompare(b.k));
  let i = 0;
  while (assigned < total && byRemainder.length > 0) {
    const r = byRemainder[i % byRemainder.length]!;
    result.set(r.k, (result.get(r.k) ?? 0) + 1);
    assigned += 1;
    i += 1;
  }
  return result;
}

/** Konu ağırlıkları: temel ağırlık × (1 + zayıflık). Zayıf konular daha çok soru alır. */
export function planTypeCounts(
  pool: PoolQuestion[],
  masteries: TopicMastery[],
  typeWeights: Partial<Record<QuestionTypeKey, number>>,
  count: number,
): PlanEntry[] {
  const masteryByTopic = new Map(masteries.map((m) => [m.topicId, m.mastery]));
  const available = new Map<QuestionTypeKey, number>();
  const typeTopics = new Map<QuestionTypeKey, Set<string>>();
  for (const q of pool) {
    available.set(q.type, (available.get(q.type) ?? 0) + 1);
    if (!typeTopics.has(q.type)) typeTopics.set(q.type, new Set());
    typeTopics.get(q.type)!.add(q.topicId);
  }
  const weakness = new Map<QuestionTypeKey, number>();
  const weights = new Map<string, number>();
  for (const type of QUESTION_TYPES) {
    if (!available.get(type)) continue;
    const topics = [...(typeTopics.get(type) ?? [])];
    const avg = topics.length ? topics.reduce((s, t) => s + (masteryByTopic.get(t) ?? DEFAULT_MASTERY), 0) / topics.length : DEFAULT_MASTERY;
    const w = 1 - avg;
    weakness.set(type, w);
    weights.set(type, (typeWeights[type] ?? 1) * (1 + w));
  }

  const target = Math.min(count, pool.length);
  const counts = apportion(weights, target);
  // Kapasite aşımlarını diğer tiplere aktar
  let overflow = 0;
  for (const [type, c] of counts) {
    const cap = available.get(type as QuestionTypeKey) ?? 0;
    if (c > cap) {
      overflow += c - cap;
      counts.set(type, cap);
    }
  }
  const order = [...weights.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  while (overflow > 0) {
    let moved = false;
    for (const t of order) {
      if (overflow === 0) break;
      const cap = available.get(t as QuestionTypeKey) ?? 0;
      if ((counts.get(t) ?? 0) < cap) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
        overflow -= 1;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return QUESTION_TYPES.filter((t) => (counts.get(t) ?? 0) > 0).map((type) => {
    const w = weakness.get(type) ?? 0.5;
    return { type, count: counts.get(type) ?? 0, weakness: Math.round(w * 100) / 100, reason: w >= 0.45 ? "weak" : w <= 0.25 ? "strong" : "balanced" };
  });
}

function mergePlans(a: PlanEntry[], b: PlanEntry[]): PlanEntry[] {
  const byType = new Map<QuestionTypeKey, PlanEntry>();
  for (const e of [...a, ...b]) {
    const prev = byType.get(e.type);
    byType.set(e.type, prev ? { ...prev, count: prev.count + e.count } : { ...e });
  }
  return QUESTION_TYPES.filter((t) => byType.has(t)).map((t) => byType.get(t)!);
}

function difficultySequence(n: number, mix: Record<DifficultyKey, number>): DifficultyKey[] {
  const counts = apportion(new Map(DIFFICULTIES.map((d) => [d, mix[d]])), n);
  const seq: DifficultyKey[] = [];
  for (const d of DIFFICULTIES) for (let i = 0; i < (counts.get(d) ?? 0); i += 1) seq.push(d);
  return seq;
}

/**
 * Kişiselleştirilmiş soru seçimi.
 * Öncelik sırası (tier): 0 = hiç görülmemiş ve son görülenlere benzemeyen,
 * 1 = görülmemiş ama son görülenlere benzeyen, 2 = daha önce yanlış yapılmış ve 7 günden eski,
 * 3 = görülmüş ve eski, 4 = son pencere içinde görülmüş (son çare).
 */
export function selectQuestions(input: SelectionInput): SelectionResult {
  const { pool, exposures, masteries, typeWeights, count, seed, now } = input;
  const recentWindowMs = (input.recentWindowDays ?? 14) * DAY_MS;
  const rng = createRng(seed);
  const exposureById = new Map(exposures.map((e) => [e.questionId, e]));
  const masteryByTopic = new Map(masteries.map((m) => [m.topicId, m.mastery]));
  const signature = new Map(pool.map((q) => [q.id, shingles(q.text)]));

  const recentSeen = pool.filter((q) => {
    const e = exposureById.get(q.id);
    return e && now.getTime() - e.lastSeenAt.getTime() < recentWindowMs;
  });

  const tierOf = (q: PoolQuestion): number => {
    const e = exposureById.get(q.id);
    if (!e || e.timesSeen === 0) {
      const sig = signature.get(q.id)!;
      const similarToRecent = recentSeen.some((r) => jaccard(sig, signature.get(r.id)!) >= NEAR_DUPLICATE_THRESHOLD);
      return similarToRecent ? 1 : 0;
    }
    const age = now.getTime() - e.lastSeenAt.getTime();
    if (age < recentWindowMs) return 4;
    if (e.lastCorrect === false && age >= 7 * DAY_MS) return 2;
    return 3;
  };

  const avgMastery = masteries.length ? masteries.reduce((s, m) => s + m.mastery, 0) / masteries.length : DEFAULT_MASTERY;
  const difficultyTargets = difficultyMixFor(avgMastery);
  // Önce hiç görülmemiş sorular üzerinden dağılım planlanır; yetmezse kalan kontenjan
  // daha önce görülmüş sorulardan (en eski / yanlış yapılan önce) tamamlanır.
  const fresh = pool.filter((q) => !exposureById.get(q.id)?.timesSeen);
  const seenPool = pool.filter((q) => exposureById.get(q.id)?.timesSeen);
  const freshPlan = planTypeCounts(fresh, masteries, typeWeights, Math.min(count, fresh.length));
  const freshTotal = freshPlan.reduce((s, p) => s + p.count, 0);
  const reusePlan = freshTotal < count ? planTypeCounts(seenPool, masteries, typeWeights, count - freshTotal) : [];
  const plan = mergePlans(freshPlan, reusePlan);

  const chosen: PoolQuestion[] = [];
  const chosenIds = new Set<string>();
  let reusedCount = 0;

  const isNearDuplicateOfChosen = (q: PoolQuestion) =>
    chosen.some((c) => jaccard(signature.get(c.id)!, signature.get(q.id)!) >= NEAR_DUPLICATE_THRESHOLD);

  for (const entry of plan) {
    const candidates = shuffle(pool.filter((q) => q.type === entry.type), rng)
      .map((q) => ({ q, tier: tierOf(q), mastery: masteryByTopic.get(q.topicId) ?? DEFAULT_MASTERY }))
      // aynı tier içinde zayıf konular önce
      .sort((a, b) => a.tier - b.tier || a.mastery - b.mastery);

    const seq = shuffle(difficultySequence(entry.count, difficultyTargets), rng);
    for (const wanted of seq) {
      const remaining = candidates.filter((c) => !chosenIds.has(c.q.id));
      if (remaining.length === 0) break;
      const bestTier = Math.min(...remaining.map((c) => c.tier));
      const sameTier = remaining.filter((c) => c.tier === bestTier);
      const pickFrom = (list: typeof remaining) =>
        list.find((c) => c.q.difficulty === wanted && !isNearDuplicateOfChosen(c.q)) ??
        list.find((c) => !isNearDuplicateOfChosen(c.q));
      const pick = pickFrom(sameTier) ?? pickFrom(remaining) ?? remaining[0]!;
      chosen.push(pick.q);
      chosenIds.add(pick.q.id);
      if (pick.tier >= 2) reusedCount += 1;
    }
  }

  const typeOrder = new Map(QUESTION_TYPES.map((t, i) => [t, i]));
  const diffOrder = new Map(DIFFICULTIES.map((d, i) => [d, i]));
  chosen.sort(
    (a, b) => (typeOrder.get(a.type) ?? 0) - (typeOrder.get(b.type) ?? 0) || (diffOrder.get(a.difficulty) ?? 0) - (diffOrder.get(b.difficulty) ?? 0),
  );

  return { questionIds: chosen.map((q) => q.id), plan, reusedCount, difficultyTargets };
}

/** Seviye belirleme: her soru tipinden dengeli zorlukta `perType` soru. */
export function selectPlacementQuestions(pool: PoolQuestion[], perType: number, seed: string): string[] {
  const rng = createRng(seed);
  const result: string[] = [];
  const preference: DifficultyKey[][] = [
    ["EASY", "MEDIUM", "HARD"],
    ["HARD", "MEDIUM", "EASY"],
    ["MEDIUM", "EASY", "HARD"],
  ];
  for (const type of QUESTION_TYPES) {
    const candidates = shuffle(pool.filter((q) => q.type === type), rng);
    const taken = new Set<string>();
    for (let i = 0; i < perType; i += 1) {
      const pref = preference[i % preference.length]!;
      const pick = pref.map((d) => candidates.find((c) => c.difficulty === d && !taken.has(c.id))).find(Boolean);
      if (!pick) break;
      taken.add(pick.id);
      result.push(pick.id);
    }
  }
  return result;
}
