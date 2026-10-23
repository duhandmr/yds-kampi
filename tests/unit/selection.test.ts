import { describe, expect, it } from "vitest";
import { QUESTION_TYPES, type DifficultyKey, type QuestionTypeKey } from "@/lib/constants";
import { apportion, planTypeCounts, selectPlacementQuestions, selectQuestions, type Exposure, type PoolQuestion } from "@/lib/exam/selection";
import { DEFAULT_TYPE_WEIGHTS } from "@/lib/constants";
import { SEED_QUESTIONS, toDraft } from "@/content/questions";
import { questionSignatureText } from "@/lib/questions/similarity";

const NOW = new Date("2026-10-23T09:00:00Z");
const DAY = 86_400_000;

function seedPool(): PoolQuestion[] {
  return SEED_QUESTIONS.map((q, i) => {
    const d = toDraft(q);
    return { id: `q${i}`, type: d.type, topicId: d.topicSlug, difficulty: d.difficulty, text: questionSignatureText(d) };
  });
}

describe("Kişiselleştirilmiş soru seçimi", () => {
  it("görülmemiş soru varken daha önce gösterilen soru tekrar seçilmez", () => {
    const pool = seedPool();
    const seen = pool.slice(0, 20).map<Exposure>((q) => ({ questionId: q.id, timesSeen: 1, lastSeenAt: new Date(NOW.getTime() - DAY), lastCorrect: true }));
    const res = selectQuestions({ pool, exposures: seen, masteries: [], typeWeights: DEFAULT_TYPE_WEIGHTS, count: 20, seed: "s", now: NOW });
    const seenIds = new Set(seen.map((s) => s.questionId));
    const unseenAvailable = pool.length - seen.length;
    const reused = res.questionIds.filter((id) => seenIds.has(id)).length;
    expect(res.questionIds).toHaveLength(20);
    expect(reused).toBe(Math.max(0, 20 - unseenAvailable));
  });

  it("aynı denemede bir soru iki kez yer almaz", () => {
    const res = selectQuestions({ pool: seedPool(), exposures: [], masteries: [], typeWeights: DEFAULT_TYPE_WEIGHTS, count: 40, seed: "x", now: NOW });
    expect(new Set(res.questionIds).size).toBe(res.questionIds.length);
  });

  it("havuz tükendiğinde en eski ve yanlış yapılan sorular önce tekrar edilir", () => {
    const pool = seedPool().filter((q) => q.type === "GRAMMAR");
    const exposures: Exposure[] = pool.map((q, i) => ({
      questionId: q.id,
      timesSeen: 1,
      lastSeenAt: new Date(NOW.getTime() - (i === 0 ? 30 : 2) * DAY),
      lastCorrect: i === 0 ? false : true,
    }));
    const res = selectQuestions({ pool, exposures, masteries: [], typeWeights: { GRAMMAR: 1 }, count: 1, seed: "z", now: NOW });
    expect(res.questionIds).toEqual([pool[0]!.id]);
  });

  it("anlamca çok benzeyen sorular aynı denemeye birlikte alınmaz", () => {
    const base: PoolQuestion = { id: "a", type: "READING", topicId: "t", difficulty: "MEDIUM", text: "Honeybees pollinate crops and bee populations are declining because of pesticides" };
    const twin: PoolQuestion = { ...base, id: "b", text: "Honeybees pollinate crops and bee populations are declining because of pesticides today" };
    const other: PoolQuestion = { ...base, id: "c", text: "Urban green spaces reduce heat and flooding in large cities" };
    const res = selectQuestions({ pool: [base, twin, other], exposures: [], masteries: [], typeWeights: { READING: 1 }, count: 2, seed: "k", now: NOW });
    expect(res.questionIds.includes("a") && res.questionIds.includes("b")).toBe(false);
  });

  it("zayıf konular denemede daha fazla ağırlık alır", () => {
    const pool: PoolQuestion[] = [];
    for (const type of ["GRAMMAR", "READING"] as QuestionTypeKey[]) {
      for (let i = 0; i < 20; i += 1) pool.push({ id: `${type}${i}`, type, topicId: type, difficulty: (["EASY", "MEDIUM", "HARD"] as DifficultyKey[])[i % 3]!, text: `${type} benzersiz metin ${i} ${"x".repeat(i)}` });
    }
    const plan = planTypeCounts(pool, [{ topicId: "GRAMMAR", mastery: 0.2, questionsSeen: 20 }, { topicId: "READING", mastery: 0.9, questionsSeen: 20 }], { GRAMMAR: 1, READING: 1 }, 20);
    const g = plan.find((p) => p.type === "GRAMMAR")!.count;
    const r = plan.find((p) => p.type === "READING")!.count;
    expect(g).toBeGreaterThan(r);
    expect(g + r).toBe(20);
  });

  it("aynı tohumla aynı deneme üretilir (tekrarlanabilirlik)", () => {
    const a = selectQuestions({ pool: seedPool(), exposures: [], masteries: [], typeWeights: DEFAULT_TYPE_WEIGHTS, count: 20, seed: "gun-1", now: NOW });
    const b = selectQuestions({ pool: seedPool(), exposures: [], masteries: [], typeWeights: DEFAULT_TYPE_WEIGHTS, count: 20, seed: "gun-1", now: NOW });
    expect(a.questionIds).toEqual(b.questionIds);
  });

  it("dağılım yöntemi tam istenen toplamı verir", () => {
    const m = apportion(new Map([["a", 1], ["b", 1], ["c", 1]]), 10);
    expect([...m.values()].reduce((s, n) => s + n, 0)).toBe(10);
  });

  it("seviye belirleme tüm soru tiplerini kapsar", () => {
    const ids = selectPlacementQuestions(seedPool(), 2, "p");
    const pool = seedPool();
    const types = new Set(ids.map((id) => pool.find((q) => q.id === id)!.type));
    expect(ids).toHaveLength(22);
    expect(types.size).toBe(QUESTION_TYPES.length);
  });
});
