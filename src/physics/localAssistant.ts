import { opticsKnowledge, type KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";

export type AssistantReply = {
  answer: string;
  sources: KnowledgeChunk[];
};

export type KnowledgeSearchResult = {
  chunk: KnowledgeChunk;
  score: number;
};

export const chapterNames: Record<ChapterKey, string> = {
  refraction: "折射 / 全反射",
  interference: "光的干涉",
  diffraction: "光的衍射",
  polarization: "光的偏振"
};

const stopTokens = new Set(["为什么", "什么", "怎么", "如何", "一下", "这个", "那个", "发生", "解释", "请问", "理解"]);

const queryAliases: Array<{ when: string[]; tokens: string[] }> = [
  { when: ["马吕斯"], tokens: ["偏振", "偏振片", "透振方向", "夹角", "光强", "cos", "cos²"] },
  { when: ["malus"], tokens: ["偏振", "偏振片", "透振方向", "夹角", "光强", "cos", "cos²"] },
  { when: ["双缝", "条纹间距"], tokens: ["双缝干涉", "条纹间距", "波长", "屏距", "双缝间距", "δx"] },
  { when: ["薄膜"], tokens: ["薄膜干涉", "反射光", "波长", "彩色"] },
  { when: ["气泡"], tokens: ["全反射", "水", "气泡", "反射光"] },
  { when: ["光纤"], tokens: ["全反射", "内芯", "外套", "折射率"] },
  { when: ["中央亮纹"], tokens: ["单缝衍射", "中央亮纹", "缝宽", "衍射"] },
  { when: ["透振方向"], tokens: ["偏振片", "偏振光", "振动方向", "通过"] },
  { when: ["眩光"], tokens: ["反射光", "偏振", "偏振片", "透振方向"] }
];

function expandQueryTokens(text: string) {
  const normalized = text.toLowerCase();
  return queryAliases
    .filter((alias) => alias.when.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .flatMap((alias) => alias.tokens);
}

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

  return Array.from(new Set([...wordTokens, ...cjkTokens, ...expandQueryTokens(text)])).filter((token) => token.length > 1 && !stopTokens.has(token));
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk, chapter: ChapterKey) {
  const haystack = `${chunk.title} ${chunk.tags.join(" ")} ${chunk.content}`.toLowerCase();
  const title = chunk.title.toLowerCase();
  const tags = chunk.tags.map((tag) => tag.toLowerCase());
  const chapterBoost = chunk.chapter === chapter ? 6 : chunk.chapter === "general" ? 1 : -2;
  const tokenScore = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
  const titleScore = queryTokens.reduce((score, token) => score + (title.includes(token) ? 2 : 0), 0);
  const tagScore = queryTokens.reduce((score, token) => score + (tags.some((tag) => tag.includes(token) || token.includes(tag)) ? 3 : 0), 0);
  return tokenScore + titleScore + tagScore + chapterBoost;
}

export function searchKnowledgeWithScores(query: string, chapter: ChapterKey, limit = 3): KnowledgeSearchResult[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.length || !opticsKnowledge.length) return [];

  return opticsKnowledge
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk, chapter) }))
    .filter((item) => item.score >= 3)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function searchKnowledge(query: string, chapter: ChapterKey, limit = 3) {
  return searchKnowledgeWithScores(query, chapter, limit).map((item) => item.chunk);
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
    answer: `结论：这个问题可以先看 ${sources[0].title}。\n\n原因：${sourceSummary}\n\n仿真：回到「${chapterName}」页面，改变相关变量后观察现象是否符合上面的规律。`
  };
}
