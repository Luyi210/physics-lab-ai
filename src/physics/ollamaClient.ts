import type { KnowledgeChunk } from "../data/opticsKnowledge";
import { buildPhysicsTutorSystemPrompt, buildPhysicsTutorUserPrompt } from "../prompts/physicsTutorPrompt";
import type { ChapterKey } from "../types";
import { buildLocalAssistantReply, searchKnowledge } from "./localAssistant";

const OLLAMA_HOST = "http://127.0.0.1:11434";
export const OLLAMA_MODEL = "qwen3:4b";

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

type OllamaTagsResponse = {
  models?: Array<{
    name?: string;
  }>;
};

export type OllamaAssistantReply = {
  answer: string;
  sources: KnowledgeChunk[];
  usedModel: boolean;
  error?: string;
};

function buildSourceText(sources: KnowledgeChunk[]) {
  if (!sources.length) return "";

  return sources.map((source, index) => `${index + 1}. ${source.title}\n${source.content}`).join("\n\n");
}

function buildUserPrompt(query: string, chapter: ChapterKey, sources: KnowledgeChunk[], experimentContext: string) {
  return buildPhysicsTutorUserPrompt({
    query,
    chapter,
    experimentContext,
    sourceText: buildSourceText(sources)
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

function cleanTutorAnswer(answer: string) {
  const cleaned = answer
    .replace(/当前本地光学知识库还没有导入[^\n。]*[。]?/g, "")
    .replace(/知识库(为空|待导入|没有导入|未导入)[^\n。]*[。]?/g, "")
    .replace(/本地模型|Ollama|接口|前端|开发状态/g, "助教")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function checkOllamaModel(signal?: AbortSignal) {
  const response = await fetch(`${OLLAMA_HOST}/api/tags`, { signal });
  if (!response.ok) return false;

  const data = (await response.json()) as OllamaTagsResponse;
  return Boolean(data.models?.some((model) => model.name === OLLAMA_MODEL));
}

export async function buildOllamaAssistantReply(query: string, chapter: ChapterKey, experimentContext: string): Promise<OllamaAssistantReply> {
  const sources = searchKnowledge(query, chapter);
  const fallback = buildLocalAssistantReply(query, chapter);
  const messages: OllamaMessage[] = [
    { role: "system", content: buildPhysicsTutorSystemPrompt(chapter) },
    { role: "user", content: buildUserPrompt(query, chapter, sources, experimentContext) }
  ];

  try {
    const response = await fetchWithTimeout(
      `${OLLAMA_HOST}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          stream: false,
          think: false,
          options: {
            temperature: 0.2,
            top_p: 0.85,
            repeat_penalty: 1.1,
            num_predict: 320
          }
        })
      },
      45000
    );

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

    const data = (await response.json()) as OllamaChatResponse;
    if (data.error) throw new Error(data.error);

    const answer = extractFinalAnswer(data.message?.content ?? "");
    return {
      sources,
      usedModel: true,
      answer: answer || "本地模型已响应，但没有返回可展示的最终答案。请换一种问法再试。"
    };
  } catch (error) {
    return {
      sources: fallback.sources,
      usedModel: false,
      error: formatOllamaError(error),
      answer: `${fallback.answer}\n\n刚才助教响应不稳定，可以把问题缩短一点再问。`
    };
  }
}
