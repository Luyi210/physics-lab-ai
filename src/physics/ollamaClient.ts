import type { KnowledgeChunk } from "../data/opticsKnowledge";
import type { ChapterKey } from "../types";
import { buildLocalAssistantReply, chapterNames, searchKnowledge } from "./localAssistant";

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
  if (!sources.length) return "当前本地光学知识库为空，或没有检索到匹配条目。";

  return sources.map((source, index) => `${index + 1}. ${source.title}\n${source.content}`).join("\n\n");
}

function buildSystemPrompt(chapter: ChapterKey) {
  return [
    "你是 PhysicsLab AI 的本地高中物理助教，服务于一个高中光学动态仿真平台。",
    "回答范围限定在高中物理光学、实验观察、公式含义和当前仿真参数解释。",
    "不要编造教材、页码、知识库来源；如果知识库为空，要明确说这是基于通用高中物理知识的解释。",
    "不要输出推理过程，不要输出 <think> 标签或思考草稿。",
    "最终给用户看的内容必须放在 <final_answer> 和 </final_answer> 标签之间。",
    "回答尽量按「直接结论」「物理解释」「和当前仿真对应」组织，语言适合高中生。",
    `当前章节：${chapterNames[chapter]}`
  ].join("\n");
}

function buildUserPrompt(query: string, chapter: ChapterKey, sources: KnowledgeChunk[], experimentContext: string) {
  return [
    `学生问题：${query}`,
    "",
    `当前章节：${chapterNames[chapter]}`,
    "",
    "当前仿真状态：",
    experimentContext || "当前章节暂未提供实时参数。",
    "",
    "本地知识库检索结果：",
    buildSourceText(sources),
    "",
    "请只输出 <final_answer>...</final_answer> 包裹的最终回答。"
  ].join("\n");
}

function extractFinalAnswer(rawContent: string) {
  const normalized = rawContent.replace(/\r\n/g, "\n").trim();
  const explicitFinal = normalized.match(/<final_answer>([\s\S]*?)<\/final_answer>/i);
  if (explicitFinal?.[1]) return explicitFinal[1].trim();

  return normalized
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*<\/think>/i, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?final_answer>/gi, "")
    .replace(/^Thinking\.\.\.\s*/i, "")
    .trim();
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
    { role: "system", content: buildSystemPrompt(chapter) },
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
            num_predict: 900
          }
        })
      },
      70000
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
      answer: `${fallback.answer}\n\n本地 Ollama 模型暂时没有返回可用回答：${formatOllamaError(error)}。`
    };
  }
}
