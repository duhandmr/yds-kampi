export interface TopicPerfState {
  questionsSeen: number;
  correct: number;
  wrong: number;
  blank: number;
  recentAccuracy: number;
  masteryScore: number;
}

export const EMPTY_PERF: TopicPerfState = { questionsSeen: 0, correct: 0, wrong: 0, blank: 0, recentAccuracy: 0, masteryScore: 0.5 };

const EMA_ALPHA = 0.4;
const PRIOR = 0.5;

/** Bir denemedeki konu sonucunu mevcut performansa ekler. Ustalık skoru az veride 0.5'e doğru temkinli kalır. */
export function updateTopicPerformance(prev: TopicPerfState | null, session: { correct: number; wrong: number; blank: number }): TopicPerfState {
  const base = prev ?? EMPTY_PERF;
  const total = session.correct + session.wrong + session.blank;
  if (total === 0) return { ...base };
  const sessionAcc = session.correct / total;
  const questionsSeen = base.questionsSeen + total;
  const correct = base.correct + session.correct;
  const recentAccuracy = base.questionsSeen === 0 ? sessionAcc : EMA_ALPHA * sessionAcc + (1 - EMA_ALPHA) * base.recentAccuracy;
  const overall = correct / questionsSeen;
  const confidence = Math.min(1, questionsSeen / 10);
  const masteryScore = PRIOR * (1 - confidence) + (0.6 * recentAccuracy + 0.4 * overall) * confidence;
  return {
    questionsSeen,
    correct,
    wrong: base.wrong + session.wrong,
    blank: base.blank + session.blank,
    recentAccuracy: round(recentAccuracy),
    masteryScore: round(masteryScore),
  };
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

export type TopicStrength = "strong" | "weak" | "neutral";

export function classifyTopic(perf: Pick<TopicPerfState, "masteryScore" | "questionsSeen">): TopicStrength {
  if (perf.questionsSeen >= 3 && perf.masteryScore >= 0.72) return "strong";
  if (perf.questionsSeen >= 2 && perf.masteryScore <= 0.55) return "weak";
  return "neutral";
}
