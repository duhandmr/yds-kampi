import { describe, expect, it } from "vitest";
import { scoreAttempt, type ScoreItem } from "@/lib/exam/scoring";

const base = { topicName: "Konu", type: "GRAMMAR" as const, timeSpentSeconds: 30 };

describe("Puanlama", () => {
  it("doğru, yanlış ve boş sayılarını doğru hesaplar", () => {
    const items: ScoreItem[] = [
      { ...base, questionId: "1", topicId: "t1", difficulty: "EASY", correctLabel: "A", selectedLabel: "A" },
      { ...base, questionId: "2", topicId: "t1", difficulty: "MEDIUM", correctLabel: "B", selectedLabel: "C" },
      { ...base, questionId: "3", topicId: "t2", difficulty: "HARD", correctLabel: "D", selectedLabel: null },
      { ...base, questionId: "4", topicId: "t2", difficulty: "HARD", correctLabel: "E", selectedLabel: "E" },
      { ...base, questionId: "5", topicId: "t2", difficulty: "EASY", correctLabel: "A", selectedLabel: "" },
    ];
    const s = scoreAttempt(items);
    expect(s.correct).toBe(2);
    expect(s.wrong).toBe(1);
    expect(s.blank).toBe(2);
    expect(s.total).toBe(5);
    expect(s.correct + s.wrong + s.blank).toBe(s.total);
    expect(s.scorePercent).toBe(40);
  });

  it("konu ve zorluk kırılımları toplamla tutarlıdır", () => {
    const items: ScoreItem[] = [
      { ...base, questionId: "1", topicId: "t1", difficulty: "EASY", correctLabel: "A", selectedLabel: "A" },
      { ...base, questionId: "2", topicId: "t1", difficulty: "HARD", correctLabel: "B", selectedLabel: "A" },
      { ...base, questionId: "3", topicId: "t2", difficulty: "HARD", correctLabel: "C", selectedLabel: "C" },
    ];
    const s = scoreAttempt(items);
    expect(s.byTopic.reduce((n, b) => n + b.total, 0)).toBe(3);
    const hard = s.byDifficulty.find((b) => b.key === "HARD");
    expect(hard?.correct).toBe(1);
    expect(hard?.percent).toBe(50);
    expect(s.byDifficulty.map((b) => b.key)).toEqual(["EASY", "HARD"]);
  });

  it("boş deneme sıfıra bölme hatası vermez", () => {
    expect(scoreAttempt([]).scorePercent).toBe(0);
  });
});
