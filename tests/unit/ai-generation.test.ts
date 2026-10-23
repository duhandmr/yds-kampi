import { describe, expect, it } from "vitest";
import { SEED_QUESTIONS, toDraft } from "@/content/questions";
import { generateQuestions, type GenerationStore } from "@/lib/ai/question-generation";
import { parseAiJson } from "@/lib/ai/parse";
import { generatedQuestionBatchSchema } from "@/lib/ai/schemas";
import type { AiProvider } from "@/lib/ai/types";

function fakeStore() {
  const created: unknown[] = [];
  const logs: Array<{ status: string }> = [];
  const store: GenerationStore = {
    async existingSignatures() {
      return [];
    },
    async createQuestion(draft) {
      created.push(draft);
    },
    async createLog(entry) {
      logs.push({ status: entry.status });
      return `log${logs.length}`;
    },
    async updateLogCounts(_id, _a, _r, _n, status) {
      logs.push({ status });
    },
  };
  return { store, created, logs };
}

function provider(responses: Array<string | Error>): AiProvider {
  let i = 0;
  return {
    name: "sahte",
    model: "sahte-model",
    async generateJson() {
      const r = responses[Math.min(i, responses.length - 1)]!;
      i += 1;
      if (r instanceof Error) throw r;
      return r;
    },
  };
}

const request = { type: "VOCABULARY" as const, topicSlug: "kelime-bilgisi", topicName: "Kelime Bilgisi", difficulty: "MEDIUM" as const, count: 1 };

function validBatch() {
  const { type: _t, topicSlug: _s, ...item } = toDraft(SEED_QUESTIONS[0]!);
  return JSON.stringify({ questions: [item] });
}

describe("Yapay zekâ soru üretimi", () => {
  it("geçersiz JSON döndüğünde hiçbir soru kaydı oluşturulmaz", async () => {
    const s = fakeStore();
    const res = await generateQuestions({ provider: provider(["bu bir JSON değil {"]), store: s.store, autoPublish: false, verifyWithSolver: false }, request);
    expect(res.status).toBe("INVALID_OUTPUT");
    expect(s.created).toHaveLength(0);
    expect(s.logs[0]?.status).toBe("INVALID_OUTPUT");
  });

  it("şemaya uymayan JSON (ör. 4 seçenek) kaydedilmez", async () => {
    const bad = JSON.parse(validBatch());
    bad.questions[0].options = bad.questions[0].options.slice(0, 4);
    const s = fakeStore();
    const res = await generateQuestions({ provider: provider([JSON.stringify(bad)]), store: s.store, autoPublish: false, verifyWithSolver: false }, request);
    expect(res.status).toBe("INVALID_OUTPUT");
    expect(s.created).toHaveLength(0);
  });

  it("sağlayıcı hatasında uygulama çökmez ve kayıt oluşturulmaz", async () => {
    const s = fakeStore();
    const res = await generateQuestions({ provider: provider([new Error("ağ hatası")]), store: s.store, autoPublish: false, verifyWithSolver: false }, request);
    expect(res.status).toBe("PROVIDER_ERROR");
    expect(s.created).toHaveLength(0);
  });

  it("geçerli ve kalite kontrolünden geçen soru incelemeye alınır", async () => {
    const s = fakeStore();
    const res = await generateQuestions({ provider: provider([validBatch()]), store: s.store, autoPublish: false, verifyWithSolver: false }, request);
    expect(res.accepted).toBe(1);
    expect(s.created).toHaveLength(1);
  });

  it("bağımsız çözüm farklı cevap bulursa soru reddedilir", async () => {
    const s = fakeStore();
    const solver = JSON.stringify({ answer: "D", ambiguous: false });
    const res = await generateQuestions({ provider: provider([validBatch(), solver]), store: s.store, autoPublish: false, verifyWithSolver: true }, request);
    expect(res.accepted).toBe(0);
    expect(res.rejected).toBe(1);
    expect(s.created).toHaveLength(0);
  });

  it("bağımsız çözüm belirsiz bulursa soru reddedilir", async () => {
    const s = fakeStore();
    const correct = toDraft(SEED_QUESTIONS[0]!).correctLabel;
    const solver = JSON.stringify({ answer: correct, ambiguous: true });
    const res = await generateQuestions({ provider: provider([validBatch(), solver]), store: s.store, autoPublish: false, verifyWithSolver: true }, request);
    expect(res.accepted).toBe(0);
  });

  it("kod bloğu içindeki JSON ayıklanır ama yine şemayla doğrulanır", () => {
    expect(parseAiJson("```json\n" + validBatch() + "\n```", generatedQuestionBatchSchema).ok).toBe(true);
    expect(parseAiJson('```json\n{"questions": []}\n```', generatedQuestionBatchSchema).ok).toBe(false);
  });
});

describe("Yapay zekâ üretiminde kayıt hatası", () => {
  it("tek bir sorunun kaydı başarısız olursa üretim çökmez, soru reddedilmiş sayılır", async () => {
    const s = fakeStore();
    s.store.createQuestion = async () => {
      throw new Error("Aynı içerikte bir soru zaten mevcut.");
    };
    const res = await generateQuestions({ provider: provider([validBatch()]), store: s.store, autoPublish: false, verifyWithSolver: false }, request);
    expect(res.status).toBe("PARTIAL");
    expect(res.accepted).toBe(0);
    expect(res.rejected).toBe(1);
  });
});
