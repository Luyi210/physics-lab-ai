import type { ChapterKey } from "../../types";
import { buildKnowledgeGroundedAnswer } from "../../physics/knowledgeAnswer";
import { searchKnowledgeWithScores } from "../../physics/localAssistant";
import type { TutorKnowledgeMatch } from "../types";

export function runKnowledgeTool(args: { query: string; chapter: ChapterKey; experimentContext: string }) {
  const matches: TutorKnowledgeMatch[] = searchKnowledgeWithScores(args.query, args.chapter, 4);
  const sources = matches.map((item) => item.chunk);
  const topScore = matches[0]?.score ?? 0;
  const confidence: "high" | "medium" | "low" = topScore >= 10 ? "high" : topScore >= 7 ? "medium" : "low";
  const groundedAnswer = buildKnowledgeGroundedAnswer({
    query: args.query,
    chapter: args.chapter,
    sources,
    experimentContext: args.experimentContext
  });
  const context = sources.length
    ? sources.map((source, index) => `${index + 1}. ${source.title}：${source.content}`).join("\n")
    : "没有命中足够可靠的教材片段。";

  return {
    matches,
    sources,
    topScore,
    confidence,
    groundedAnswer,
    context
  };
}
