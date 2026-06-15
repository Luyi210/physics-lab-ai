import { opticsKnowledge, type KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";

export type AssistantReply = {
  answer: string;
  sources: KnowledgeChunk[];
};

export const chapterNames: Record<ChapterKey, string> = {
  refraction: "折射 / 全反射",
  interference: "光的干涉",
  diffraction: "光的衍射",
  polarization: "光的偏振"
};

const stopTokens = new Set(["为什么", "什么", "怎么", "如何", "一下", "这个", "那个", "发生", "解释", "请问"]);

function tokenize(text: string) {
  const normalized = text.toLowerCase();
  const wordTokens = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const cjkTokens = (normalized.match(/\p{Script=Han}+/gu) ?? []).flatMap((segment) => {
    const chars = Array.from(segment);
    const tokens: string[] = [];
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= chars.length - size; index += 1) {
        tokens.push(chars.slice(index, index + size).join(""));
      }
    }
    return tokens;
  });

  return Array.from(new Set([...wordTokens, ...cjkTokens])).filter((token) => token.length > 1 && !stopTokens.has(token));
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
      answer: `结论：这个问题可以先放回「${chapterName}」实验里看。\n\n原因：先抓住现象和变量关系，再对应到公式或光路变化，会比直接背结论更清楚。\n\n仿真：你可以换一个更具体的问题，例如“角度变大时发生了什么”或“这条亮纹为什么移动”。`
    };
  }

  if (!sources.length) {
    return {
      sources,
      answer: `结论：我需要更具体的现象或变量，才能把它讲准。\n\n原因：物理解释通常要先确定对象、条件和变化量。\n\n仿真：当前页面是「${chapterName}」，你可以补充角度、折射率、缝宽、波长或偏振片角度。`
    };
  }

  const sourceSummary = sources.map((source, index) => `${index + 1}. ${source.title}：${source.content}`).join("\n\n");

  return {
    sources,
    answer: `我从本地知识库中找到了 ${sources.length} 条相关内容。\n\n${sourceSummary}\n\n后续接入本地小模型后，这里会把检索结果交给模型生成更自然的讲解。`
  };
}
