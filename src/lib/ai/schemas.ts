import { z } from "zod";
import { keywordSchema, optionLabelSchema, questionDraftSchema } from "../validation/schemas";

export const generatedQuestionBatchSchema = z.object({
  questions: z.array(questionDraftSchema.omit({ topicSlug: true, type: true })).min(1).max(10),
});
export type GeneratedQuestionBatch = z.infer<typeof generatedQuestionBatchSchema>;

export const solverAnswerSchema = z.object({
  answer: optionLabelSchema,
  ambiguous: z.boolean(),
  reason: z.string().max(1000).optional(),
});

export const performanceReviewSchema = z.object({
  message: z.string().min(40).max(900),
});

export const vocabularyEnrichmentSchema = z.object({
  items: z
    .array(
      keywordSchema.extend({
        exampleEn: z.string().trim().min(5).max(400),
        exampleTr: z.string().trim().min(5).max(400),
      }),
    )
    .min(1)
    .max(20),
});
