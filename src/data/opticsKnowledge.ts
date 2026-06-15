import type { ChapterKey } from "../types";

export type KnowledgeChunk = {
  id: string;
  chapter: ChapterKey | "general";
  title: string;
  tags: string[];
  content: string;
};

export const opticsKnowledge: KnowledgeChunk[] = [];

