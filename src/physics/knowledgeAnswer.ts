import type { KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";

function firstSentence(text: string) {
  const match = text.match(/^.*?[。！？]/);
  return (match?.[0] ?? text).trim();
}

function trimText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}……`;
}

function experimentHint(chapter: ChapterKey, source: KnowledgeChunk, experimentContext: string) {
  if (chapter === "refraction") {
    if (source.id.startsWith("tir")) {
      return "在折射页里把光从高折射率介质射向低折射率介质，再逐渐增大入射角，观察折射光什么时候消失。";
    }
    return "在折射页里改变入射角或两侧折射率，观察折射角、临界角和光线偏折方向如何变化。";
  }

  if (chapter === "interference") {
    return "在干涉页里改变波长、双缝间距或屏距，重点看明暗条纹间距和位置如何变化。";
  }

  if (chapter === "diffraction") {
    return "在衍射页里调小缝宽，重点看中央亮纹是否变宽、旁侧条纹是否更明显。";
  }

  if (chapter === "polarization") {
    return "在偏振页里转动偏振片角度，观察透射光强怎样随两片偏振片夹角改变。";
  }

  return experimentContext || "回到当前实验页，先找变化的变量，再观察对应现象。";
}

export function buildKnowledgeGroundedAnswer(args: {
  query: string;
  chapter: ChapterKey;
  sources: KnowledgeChunk[];
  experimentContext: string;
}) {
  const [primary, secondary] = args.sources;
  if (!primary) return null;

  const conclusion = firstSentence(primary.content);
  const reasonParts = [primary.content, secondary?.content].filter(Boolean).join(" ");

  return [
    `结论：${trimText(conclusion, 86)}`,
    `原因：${trimText(reasonParts, 150)}`,
    `仿真：${experimentHint(args.chapter, primary, args.experimentContext)}`
  ].join("\n");
}
