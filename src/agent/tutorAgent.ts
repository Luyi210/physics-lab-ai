import type { ChapterKey } from "../types";
import { buildLocalAssistantReply } from "../physics/localAssistant";
import { classifyTutorIntent, describeTutorIntent } from "./intentClassifier";
import { buildMemoryContext, rememberTutorTurn } from "./memory/studentMemory";
import { answerWithPhysicsTool, buildPhysicsToolContext } from "./tools/physicsTools";
import { runKnowledgeTool } from "./tools/knowledgeTool";
import type { TutorAgentPlan } from "./types";

function buildScopeGuardAnswer() {
  return [
    "结论：这个问题暂时超出了光学助教的范围。",
    "原因：我现在主要帮助理解高中光学概念、实验现象和当前仿真参数。",
    "仿真：你可以改问折射、全反射、干涉、衍射或偏振相关的问题。"
  ].join("\n");
}

function buildAgentContext(args: {
  intentLabel: string;
  memoryContext: string;
  knowledgeContext: string;
  physicsContext: string;
  shouldUseModel: boolean;
}) {
  return [
    "助教决策信号（只用于组织回答，不要显式说给学生）：",
    `问题意图：${args.intentLabel}。`,
    `回答策略：${args.shouldUseModel ? "知识和工具不足时调用模型，但必须保持高中物理助教格式。" : "已由本地工具或教材片段直接回答。"}。`,
    "",
    "学生记忆：",
    args.memoryContext,
    "",
    "物理工具状态：",
    args.physicsContext,
    "",
    "检索到的教材片段：",
    args.knowledgeContext
  ].join("\n");
}

export function planTutorResponse(args: { query: string; chapter: ChapterKey; experimentContext: string }): TutorAgentPlan {
  const intent = classifyTutorIntent(args.query);
  const memory = rememberTutorTurn({ question: args.query, chapter: args.chapter, intent });
  const memoryContext = buildMemoryContext(memory);
  const physicsContext = buildPhysicsToolContext(args.chapter, args.experimentContext);
  const knowledge = runKnowledgeTool(args);

  if (intent === "offTopic") {
    const directAnswer = buildScopeGuardAnswer();
    return {
      intent,
      sources: [],
      directAnswer,
      shouldUseModel: false,
      confidence: "high",
      agentContext: buildAgentContext({
        intentLabel: describeTutorIntent(intent),
        memoryContext,
        knowledgeContext: knowledge.context,
        physicsContext,
        shouldUseModel: false
      })
    };
  }

  const physicsAnswer = answerWithPhysicsTool(args);
  const knowledgeAnswer = knowledge.confidence !== "low" ? knowledge.groundedAnswer : null;
  const fallbackAnswer = knowledge.sources.length === 0 && intent === "unclear" ? buildLocalAssistantReply(args.query, args.chapter).answer : null;
  const directAnswer = physicsAnswer?.answer ?? knowledgeAnswer ?? fallbackAnswer;
  const shouldUseModel = !directAnswer;

  return {
    intent,
    sources: knowledge.sources,
    directAnswer,
    shouldUseModel,
    confidence: physicsAnswer || knowledge.confidence === "high" ? "high" : knowledge.confidence,
    agentContext: buildAgentContext({
      intentLabel: describeTutorIntent(intent),
      memoryContext,
      knowledgeContext: knowledge.context,
      physicsContext,
      shouldUseModel
    })
  };
}
