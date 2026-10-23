import type { DifficultyKey, OptionLabel, QuestionTypeKey } from "../constants";

export interface KeywordEntry {
  term: string;
  meaningTr: string;
  partOfSpeech: string;
  exampleEn?: string;
  exampleTr?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface QuestionOptionDraft {
  label: OptionLabel;
  text: string;
  rationale: string;
}

export interface QuestionDraft {
  type: QuestionTypeKey;
  topicSlug: string;
  subtopic: string;
  difficulty: DifficultyKey;
  passage?: string | null;
  stem: string;
  options: QuestionOptionDraft[];
  correctLabel: OptionLabel;
  explanation: string;
  strategy: string;
  tip: string;
  keywords: KeywordEntry[];
}
