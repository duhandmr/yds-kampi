import { describe, expect, it } from "vitest";
import { scheduleReview, relapse } from "@/lib/vocabulary/srs";
import { displayStreak, updateStreak } from "@/lib/streak";
import { updateTopicPerformance, classifyTopic } from "@/lib/performance/topic-performance";
import { estimatePlacement, PLACEMENT_DISCLAIMER } from "@/lib/performance/level";
import { buildRecommendation, personalFeedback } from "@/lib/performance/recommendation";
import { campProgress, diffDays, toDateKey } from "@/lib/dates";
import { csvCell, toCsv } from "@/lib/csv";
import { computeRateLimit } from "@/lib/rate-limit-core";
import { formatClock } from "@/lib/exam/timing";

const NOW = new Date("2026-10-23T09:00:00Z");

describe("Aralıklı kelime tekrarı", () => {
  it("doğru hatırlanan kelimenin aralığı büyür, unutulan kelime tekrar listesine döner", () => {
    let s = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
    const r1 = scheduleReview(s, 2, NOW);
    expect(r1.intervalDays).toBe(1);
    expect(r1.status).toBe("LEARNING");
    s = r1;
    const r2 = scheduleReview(s, 2, NOW);
    expect(r2.intervalDays).toBe(3);
    const r3 = scheduleReview(r2, 3, NOW);
    expect(r3.intervalDays).toBeGreaterThan(r2.intervalDays);
    const again = scheduleReview(r3, 0, NOW);
    expect(again.status).toBe("REVIEW");
    expect(again.repetitions).toBe(0);
  });

  it("yeterince uzun aralık 'Öğrenildi' durumuna geçirir; yanlışta tekrar açılır", () => {
    const learned = scheduleReview({ easeFactor: 2.5, intervalDays: 15, repetitions: 4 }, 2, NOW);
    expect(learned.status).toBe("LEARNED");
    expect(relapse({ ...learned }, NOW).status).toBe("REVIEW");
  });
});

describe("Çalışma serisi", () => {
  it("ardışık günlerde artar, aynı gün tekrar artmaz, gün atlanınca sıfırlanır", () => {
    let s = updateStreak(null, "2026-10-20");
    s = updateStreak(s, "2026-10-21");
    s = updateStreak(s, "2026-10-21");
    expect(s.currentStreak).toBe(2);
    expect(s.totalStudyDays).toBe(2);
    s = updateStreak(s, "2026-10-23");
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
    expect(displayStreak(s, "2026-10-25")).toBe(0);
  });
});

describe("Konu performansı ve seviye", () => {
  it("az veride ustalık skoru temkinli kalır, veri arttıkça gerçek başarıya yaklaşır", () => {
    const one = updateTopicPerformance(null, { correct: 1, wrong: 0, blank: 0 });
    expect(one.masteryScore).toBeLessThan(0.7);
    let p = one;
    for (let i = 0; i < 6; i += 1) p = updateTopicPerformance(p, { correct: 2, wrong: 0, blank: 0 });
    expect(p.masteryScore).toBeGreaterThan(0.85);
    expect(classifyTopic(p)).toBe("strong");
  });

  it("seviye belirleme sonucu uygulama içi gösterge olduğunu belirtir", () => {
    const r = estimatePlacement([
      { type: "GRAMMAR", difficulty: "EASY", outcome: "correct" },
      { type: "GRAMMAR", difficulty: "HARD", outcome: "wrong" },
      { type: "READING", difficulty: "MEDIUM", outcome: "blank" },
      { type: "VOCABULARY", difficulty: "MEDIUM", outcome: "correct" },
    ]);
    expect(r.disclaimer).toBe(PLACEMENT_DISCLAIMER);
    expect(r.disclaimer.includes("ÖSYM")).toBe(true);
    expect(r.weakTypes.includes("READING")).toBe(true);
    expect(r.plan).toHaveLength(7);
    expect(r.recommendedDailyMinutes).toBeGreaterThan(0);
  });
});

describe("Günlük öneri ve geri bildirim", () => {
  it("güçlü ve tekrar isteyen konuları yargılamadan belirtir", () => {
    const rec = buildRecommendation({
      scorePercent: 60,
      previousScorePercent: 50,
      totalQuestions: 10,
      byTopic: [
        { key: "a", label: "Bağlaçlar", total: 4, correct: 4, wrong: 0, blank: 0, percent: 100 },
        { key: "b", label: "Sıfat Cümlecikleri", total: 3, correct: 1, wrong: 2, blank: 0, percent: 33.3 },
      ],
      wrongOrBlank: [{ questionId: "q", topicName: "x", keywords: [{ term: "whose", meaningTr: "kimin", partOfSpeech: "zamir" }] }],
    });
    expect(rec.message.includes("Bağlaçlar")).toBe(true);
    expect(rec.message.includes("Sıfat Cümlecikleri")).toBe(true);
    expect(rec.vocabularyToReview).toHaveLength(1);
    expect(rec.extraQuestionCount).toBeGreaterThan(0);
    expect(/başarısız|kötü|yetersiz/i.test(rec.message)).toBe(false);
  });

  it("yanlış cevap için olası nedeni yardımcı bir dille açıklar", () => {
    const fast = personalFeedback({ outcome: "wrong", type: "GRAMMAR", timeSpentSeconds: 5, averageSecondsPerQuestion: 100 });
    expect(fast.includes("dikkat")).toBe(true);
    const vocab = personalFeedback({ outcome: "wrong", type: "VOCABULARY", timeSpentSeconds: 60, averageSecondsPerQuestion: 100 });
    expect(vocab.includes("kelime")).toBe(true);
    const blank = personalFeedback({ outcome: "blank", type: "READING", timeSpentSeconds: 60, averageSecondsPerQuestion: 100 });
    expect(blank.includes("süre")).toBe(true);
  });
});

describe("Yardımcılar", () => {
  it("tarih anahtarları İstanbul saatine göre hesaplanır", () => {
    expect(toDateKey(new Date("2026-10-22T21:30:00Z"))).toBe("2026-10-23");
    expect(diffDays("2026-10-01", "2026-10-23")).toBe(22);
    expect(campProgress("2026-10-01", "2026-10-31", "2026-10-16")).toEqual({ daysLeft: 15, totalDays: 30, percent: 50 });
  });

  it("CSV formül enjeksiyonunu engeller ve özel karakterleri kaçışlar", () => {
    expect(csvCell("=HYPERLINK()")).toBe("'=HYPERLINK()");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(toCsv([{ a: 1, b: "x" }]).includes("a,b")).toBe(true);
  });

  it("hız sınırlaması pencere içinde limiti aşan isteği reddeder", () => {
    let w = computeRateLimit(null, NOW, 2, 60_000);
    w = computeRateLimit(w.next, NOW, 2, 60_000);
    expect(w.allowed).toBe(true);
    const third = computeRateLimit(w.next, NOW, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(computeRateLimit(w.next, new Date(NOW.getTime() + 61_000), 2, 60_000).allowed).toBe(true);
  });

  it("geri sayım biçimi doğru", () => {
    expect(formatClock(65_000)).toBe("01:05");
    expect(formatClock(3_725_000)).toBe("1:02:05");
    expect(formatClock(-5)).toBe("00:00");
  });
});
