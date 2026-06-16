import { planTutorResponse } from "../agent/tutorAgent";
import type { KnowledgeChunk } from "../data/opticsKnowledge";
import { buildPhysicsTutorSystemPrompt, buildPhysicsTutorUserPrompt } from "../prompts/physicsTutorPrompt";
import type { ChapterKey } from "../types";
import { buildLocalAssistantReply } from "./localAssistant";

const OLLAMA_HOST = "http://127.0.0.1:11434";
export const OLLAMA_MODEL = "qwen3:4b";
export const OLLAMA_LOCAL_URL = OLLAMA_HOST;

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  error?: string;
  message?: {
    role?: string;
    content?: string;
    thinking?: string;
  };
};

type OllamaChatStreamChunk = OllamaChatResponse & {
  done?: boolean;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: string;
  }>;
};

export type OllamaAvailability = {
  serviceRunning: boolean;
  modelInstalled: boolean;
  modelName: string;
  endpoint: string;
  error?: string;
};

export type OllamaAssistantReply = {
  answer: string;
  sources: KnowledgeChunk[];
  usedModel: boolean;
  answerMode: "knowledge" | "model" | "fallback";
  error?: string;
};

function buildSourceText(sources: KnowledgeChunk[]) {
  if (!sources.length) return "";

  return sources.map((source, index) => `${index + 1}. ${source.title}\n${source.content}`).join("\n\n");
}

function buildUserPrompt(query: string, chapter: ChapterKey, sources: KnowledgeChunk[], experimentContext: string, agentContext: string) {
  return buildPhysicsTutorUserPrompt({
    query,
    chapter,
    experimentContext,
    sourceText: buildSourceText(sources),
    agentContext
  });
}

function extractFinalAnswer(rawContent: string) {
  const normalized = rawContent.replace(/\r\n/g, "\n").trim();
  const explicitFinal = normalized.match(/<final_answer>([\s\S]*?)<\/final_answer>/i);
  const answer = explicitFinal?.[1]
    ? explicitFinal[1].trim()
    : normalized
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*<\/think>/i, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?final_answer>/gi, "")
    .replace(/^Thinking\.\.\.\s*/i, "")
    .trim();

  return cleanTutorAnswer(answer);
}

function extractStreamingAnswer(rawContent: string) {
  const normalized = rawContent.replace(/\r\n/g, "\n");
  const explicitStart = normalized.match(/<final_answer>([\s\S]*)/i);
  const withoutThinking = (explicitStart?.[1] ?? normalized)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*<\/think>/i, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?final_answer>/gi, "")
    .replace(/^Thinking\.\.\.\s*/i, "")
    .trim();

  const conclusionIndex = withoutThinking.search(/结论[:：]/);
  if (!explicitStart && conclusionIndex < 0) return "";

  return cleanTutorAnswer(conclusionIndex > 0 ? withoutThinking.slice(conclusionIndex) : withoutThinking);
}

function cleanTutorAnswer(answer: string) {
  const sanitized = answer
    .replace(/当前本地光学知识库还没有导入[^\n。]*[。]?/g, "")
    .replace(/知识库(为空|待导入|没有导入|未导入)[^\n。]*[。]?/g, "")
    .replace(/助教内部组织信息[:：]?[\s\S]*?(?=结论[:：]|$)/g, "")
    .replace(/助教决策信号[（(][^）)]*[）)]?[:：]?[\s\S]*?(?=结论[:：]|$)/g, "")
    .replace(/学生记忆[:：]?[\s\S]*?(?=结论[:：]|$)/g, "")
    .replace(/物理工具状态[:：]?[\s\S]*?(?=结论[:：]|$)/g, "")
    .replace(/检索到的教材片段[:：]?[\s\S]*?(?=结论[:：]|$)/g, "")
    .replace(/本地模型|Ollama|接口|前端|开发状态/g, "助教")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const conclusionIndex = sanitized.search(/结论[:：]/);
  const visible = conclusionIndex > 0 ? sanitized.slice(conclusionIndex).trim() : sanitized;
  const finalLines = visible
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(结论|原因|仿真)[:：]/.test(line));
  const cleaned = finalLines.length ? finalLines.slice(0, 3).join("\n") : visible;

  if (cleaned.length <= 360) return cleaned;

  return `${cleaned.slice(0, 340).trim()}……`;
}

function formatOllamaError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "请求超时";
    return error.message;
  }
  return "未知错误";
}

export async function checkOllamaModel(signal?: AbortSignal) {
  const availability = await checkOllamaAvailability(signal);
  return availability.serviceRunning && availability.modelInstalled;
}

export async function checkOllamaAvailability(signal?: AbortSignal): Promise<OllamaAvailability> {
  const base: OllamaAvailability = {
    serviceRunning: false,
    modelInstalled: false,
    modelName: OLLAMA_MODEL,
    endpoint: OLLAMA_HOST
  };

  try {
  const response = await fetch(`${OLLAMA_HOST}/api/tags`, { signal });
    if (!response.ok) {
      return { ...base, error: `Ollama HTTP ${response.status}` };
    }

  const data = (await response.json()) as OllamaTagsResponse;
    return {
      ...base,
      serviceRunning: true,
      modelInstalled: Boolean(data.models?.some((model) => model.name === OLLAMA_MODEL))
    };
  } catch (error) {
    return { ...base, error: formatOllamaError(error) };
  }
}

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => window.clearTimeout(timer) };
}

export async function streamOllamaAssistantReply(
  query: string,
  chapter: ChapterKey,
  experimentContext: string,
  onPartialAnswer: (answer: string) => void
): Promise<OllamaAssistantReply> {
  const plan = planTutorResponse({ query, chapter, experimentContext });
  const sources = plan.sources;
  const fallback = buildLocalAssistantReply(query, chapter);

  if (plan.directAnswer && !plan.shouldUseModel) {
    onPartialAnswer(plan.directAnswer);
    return {
      answer: plan.directAnswer,
      sources,
      usedModel: false,
      answerMode: "knowledge"
    };
  }

  const messages: OllamaMessage[] = [
    { role: "system", content: buildPhysicsTutorSystemPrompt(chapter) },
    { role: "user", content: buildUserPrompt(query, chapter, sources, experimentContext, plan.agentContext) }
  ];
  const timeout = createTimeoutController(45000);

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timeout.controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        think: false,
        options: {
          temperature: 0.1,
          top_p: 0.75,
          repeat_penalty: 1.12,
          num_predict: 240
        }
      })
    });

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    if (!response.body) throw new Error("Ollama stream unavailable");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let rawContent = "";
    let lastVisible = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line) as OllamaChatStreamChunk;
        if (data.error) throw new Error(data.error);

        rawContent += data.message?.content ?? "";
        const visible = extractStreamingAnswer(rawContent);
        if (visible && visible !== lastVisible) {
          lastVisible = visible;
          onPartialAnswer(visible);
        }
      }
    }

    if (buffer.trim()) {
      const data = JSON.parse(buffer) as OllamaChatStreamChunk;
      if (data.error) throw new Error(data.error);
      rawContent += data.message?.content ?? "";
    }

    const answer = extractFinalAnswer(rawContent);
    return {
      sources,
      usedModel: true,
      answerMode: "model",
      answer: answer || "本地模型已响应，但没有返回可展示的最终答案。请换一种问法再试。"
    };
  } catch (error) {
    const answer = plan.directAnswer ?? `${fallback.answer}\n\n刚才助教响应不稳定，可以把问题缩短一点再问。`;
    onPartialAnswer(answer);
    return {
      sources: sources.length ? sources : fallback.sources,
      usedModel: false,
      answerMode: "fallback",
      error: formatOllamaError(error),
      answer
    };
  } finally {
    timeout.clear();
  }
}

export async function buildOllamaAssistantReply(query: string, chapter: ChapterKey, experimentContext: string): Promise<OllamaAssistantReply> {
  return streamOllamaAssistantReply(query, chapter, experimentContext, () => undefined);
}
