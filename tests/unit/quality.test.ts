import { describe, expect, it } from "vitest";
import { SEED_QUESTIONS, toDraft } from "@/content/questions";
import { TOPICS } from "@/content/topics";
import { QUESTION_TYPES } from "@/lib/constants";
import { claimedCorrectLabels, runQualityChecks, type ExistingSignature } from "@/lib/questions/quality";
import { questionSignatureText } from "@/lib/questions/similarity";

describe("Soru kalite kontrolü", () => {
  it("başlangıç bankasındaki tüm sorular kalite kontrolünden geçer ve açıklamaları cevap anahtarıyla tutarlıdır", () => {
    const seen: ExistingSignature[] = [];
    for (const [i, q] of SEED_QUESTIONS.entries()) {
      const draft = toDraft(q);
      const report = runQualityChecks(draft, seen);
      expect({ i, issues: report.issues }).toEqual({ i, issues: [] });
      expect(claimedCorrectLabels(draft.explanation)).toEqual([draft.correctLabel]);
      const correctOptions = draft.options.filter((o) => /^Doğru/.test(o.rationale));
      expect(correctOptions.map((o) => o.label)).toEqual([draft.correctLabel]);
      seen.push({ id: String(i), text: questionSignatureText(draft) });
    }
  });

  it("her soru tipi bankada temsil edilir ve her soru geçerli bir konuya bağlıdır", () => {
    const slugs = new Set(TOPICS.map((t) => t.slug));
    for (const t of QUESTION_TYPES) expect(SEED_QUESTIONS.filter((q) => q.type === t).length >= 4).toBe(true);
    for (const q of SEED_QUESTIONS) {
      expect(slugs.has(q.topic)).toBe(true);
      expect(TOPICS.find((t) => t.slug === q.topic)?.questionType).toBe(q.type);
    }
  });

  it("açıklama ile cevap anahtarı uyuşmazsa soru reddedilir", () => {
    const d = toDraft(SEED_QUESTIONS[0]!);
    const r = runQualityChecks({ ...d, correctLabel: "C" });
    expect(r.passed).toBe(false);
    expect(r.issues.some((i) => i.code === "EXPLANATION_KEY_MISMATCH")).toBe(true);
  });

  it("birden fazla doğru cevap izlenimi veren soru reddedilir", () => {
    const d = toDraft(SEED_QUESTIONS[1]!);
    const wrong = d.options.find((o) => o.label !== d.correctLabel)!;
    const r = runQualityChecks({ ...d, options: d.options.map((o) => (o.label === wrong.label ? { ...o, rationale: "Doğru: bu seçenek de uygundur." } : o)) });
    expect(r.passed).toBe(false);
    expect(r.issues.some((i) => i.code === "RATIONALE_KEY_MISMATCH")).toBe(true);
  });

  it("aynı seçenek metni, eksik seçenek ve yer tutucu içerik reddedilir", () => {
    const d = toDraft(SEED_QUESTIONS[2]!);
    expect(runQualityChecks({ ...d, options: d.options.map((o) => ({ ...o, text: "same" })) }).issues.some((i) => i.code === "OPTIONS_DUPLICATE")).toBe(true);
    expect(runQualityChecks({ ...d, options: d.options.slice(0, 4) }).issues.some((i) => i.code === "OPTIONS_SHAPE")).toBe(true);
    expect(runQualityChecks({ ...d, explanation: `${d.explanation} TODO` }).issues.some((i) => i.code === "PLACEHOLDER")).toBe(true);
  });

  it("havuzdaki bir soruya çok benzeyen soru reddedilir", () => {
    const d = toDraft(SEED_QUESTIONS[3]!);
    const r = runQualityChecks(d, [{ id: "x", text: questionSignatureText(d) }]);
    expect(r.issues.some((i) => i.code === "NEAR_DUPLICATE")).toBe(true);
    // Kendisiyle karşılaştırılmaz (düzenleme senaryosu)
    expect(runQualityChecks(d, [{ id: "x", text: questionSignatureText(d) }], { selfId: "x" }).passed).toBe(true);
  });
});
