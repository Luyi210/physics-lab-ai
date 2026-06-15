import { opticsKnowledge, type KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";

export type AssistantReply = {
  answer: string;
  sources: KnowledgeChunk[];
};

const chapterNames: Record<ChapterKey, string> = {
  refraction: "折射 / 全反射",
  interference: "光的干涉",
  diffraction: "光的衍射",
  polarization: "光的偏振"
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk, chapter: ChapterKey) {
  const haystack = `${chunk.title} ${chunk.tags.join(" ")} ${chunk.content}`.toLowerCase();
  const chapterBoost = chunk.chapter === chapter ? 3 : chunk.chapter === "general" ? 1 : 0;
  const tokenScore = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
  return tokenScore + chapterBoost;
}

export function searchKnowledge(query: string, chapter: ChapterKey, limit = 3) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length || !opticsKnowledge.length) return [];

  return opticsKnowledge
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk, chapter) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}

export function buildLocalAssistantReply(query: string, chapter: ChapterKey): AssistantReply {
  const sources = searchKnowledge(query, chapter);
  const chapterName = chapterNames[chapter];

  if (!opticsKnowledge.length) {
    return {
      sources,
      answer: `我已经收到你的问题：“${query}”。\n\n当前本地光学知识库还没有导入，所以我不会假装已经完成知识检索。等你把高中光学知识点文件给我后，我会按「相关知识点 → 物理解释 → 与当前仿真怎么对应」的结构回答。\n\n当前页面是「${chapterName}」，后续会优先从这个章节的知识库中检索，再补充其他光学章节。`
    };
  }

  if (!sources.length) {
    return {
      sources,
      answer: `我没有在本地知识库中检索到足够匹配的内容。\n\n你可以换一种问法，或补充更明确的关键词，例如现象、公式、实验名称、参数变化。当前页面是「${chapterName}」。`
    };
  }

  const sourceSummary = sources.map((source, index) => `${index + 1}. ${source.title}：${source.content}`).join("\n\n");

  return {
    sources,
    answer: `我从本地知识库中找到了 ${sources.length} 条相关内容。\n\n${sourceSummary}\n\n后续接入本地小模型后，这里会把检索结果交给模型生成更自然的讲解。`
  };
}

