import type { DifficultyKey, QuestionTypeKey } from "../constants";

export interface ScoreItem {
  questionId: string;
  topicId: string;
  topicName: string;
  type: QuestionTypeKey;
  difficulty: DifficultyKey;
  correctLabel: string;
  selectedLabel: string | null;
  timeSpentSeconds: number;
}

export interface Bucket {
  key: string;
  label: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
}

export interface AttemptScore {
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  scorePercent: number;
  byTopic: Bucket[];
  byDifficulty: Bucket[];
  byType: Bucket[];
  results: Array<{ questionId: string; outcome: "correct" | "wrong" | "blank" }>;
}

export type Outcome = "correct" | "wrong" | "blank";

export function outcomeOf(selectedLabel: string | null, correctLabel: string): Outcome {
  if (selectedLabel === null || selectedLabel === "") return "blank";
  return selectedLabel === correctLabel ? "correct" : "wrong";
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function addTo(map: Map<string, Bucket>, key: string, label: string, outcome: Outcome) {
  const b = map.get(key) ?? { key, label, total: 0, correct: 0, wrong: 0, blank: 0, percent: 0 };
  b.total += 1;
  b[outcome] += 1;
  b.percent = percent(b.correct, b.total);
  map.set(key, b);
}

const DIFF_LABEL: Record<DifficultyKey, string> = { EASY: "Kolay", MEDIUM: "Orta", HARD: "Zor" };

/** Doğru, yanlış ve boş sayılarını; konu, zorluk ve soru tipi kırılımlarını hesaplar. YDS'de yanlış doğruyu götürmez. */
export function scoreAttempt(items: ScoreItem[], typeLabels?: Partial<Record<QuestionTypeKey, string>>): AttemptScore {
  const byTopic = new Map<string, Bucket>();
  const byDifficulty = new Map<string, Bucket>();
  const byType = new Map<string, Bucket>();
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  const results: AttemptScore["results"] = [];

  for (const item of items) {
    const outcome = outcomeOf(item.selectedLabel, item.correctLabel);
    if (outcome === "correct") correct += 1;
    else if (outcome === "wrong") wrong += 1;
    else blank += 1;
    results.push({ questionId: item.questionId, outcome });
    addTo(byTopic, item.topicId, item.topicName, outcome);
    addTo(byDifficulty, item.difficulty, DIFF_LABEL[item.difficulty], outcome);
    addTo(byType, item.type, typeLabels?.[item.type] ?? item.type, outcome);
  }

  const order: DifficultyKey[] = ["EASY", "MEDIUM", "HARD"];
  return {
    total: items.length,
    correct,
    wrong,
    blank,
    scorePercent: percent(correct, items.length),
    byTopic: [...byTopic.values()].sort((a, b) => a.percent - b.percent),
    byDifficulty: [...byDifficulty.values()].sort(
      (a, b) => order.indexOf(a.key as DifficultyKey) - order.indexOf(b.key as DifficultyKey),
    ),
    byType: [...byType.values()],
    results,
  };
}
