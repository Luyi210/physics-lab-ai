import type { KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";

export type TutorIntent = "concept" | "simulation" | "formula" | "experiment" | "application" | "offTopic" | "unclear";

export type StudentMemoryEntry = {
  id: string;
  question: string;
  chapter: ChapterKey;
  intent: TutorIntent;
  createdAt: string;
};

export type StudentMemory = {
  version: 1;
  updatedAt: string;
  recentQuestions: StudentMemoryEntry[];
  weakConcepts: string[];
  preferredStyle: "concise";
};

export type TutorKnowledgeMatch = {
  chunk: KnowledgeChunk;
  score: number;
};

export type TutorToolAnswer = {
  answer: string;
  toolName: "refraction-state" | "formula-rule" | "scope-guard";
};

export type TutorAgentPlan = {
  intent: TutorIntent;
  sources: KnowledgeChunk[];
  directAnswer: string | null;
  shouldUseModel: boolean;
  agentContext: string;
  confidence: "high" | "medium" | "low";
};
