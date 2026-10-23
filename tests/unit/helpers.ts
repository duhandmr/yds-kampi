import type { AnswerInput, AttemptRecord, AttemptStore, AttemptTx, FinalizeContext } from "@/lib/exam/attempt-core";

/** Bellek içi deneme deposu: Prisma uygulamasıyla aynı sözleşmeyi (compare-and-set) uygular. */
export function createMemoryStore(attempt: AttemptRecord, questionIds: string[]) {
  const answers = new Map<string, AnswerInput>();
  let completions = 0;
  let completedContext: FinalizeContext | null = null;
  const store: AttemptStore = {
    async getAttempt(id) {
      return id === attempt.id ? { ...attempt } : null;
    },
    async examHasQuestion(_attemptId, questionId) {
      return questionIds.includes(questionId);
    },
    async upsertAnswer(_attemptId, input) {
      answers.set(input.questionId, { ...input });
    },
    async transaction(fn) {
      const tx: AttemptTx = {
        async markCompleted() {
          if (attempt.status !== "IN_PROGRESS") return false;
          attempt.status = "COMPLETED";
          return true;
        },
        async onCompleted(ctx) {
          completions += 1;
          completedContext = ctx;
        },
      };
      return fn(tx);
    },
  };
  return {
    store,
    answers,
    attempt,
    get completions() {
      return completions;
    },
    get context() {
      return completedContext;
    },
  };
}
