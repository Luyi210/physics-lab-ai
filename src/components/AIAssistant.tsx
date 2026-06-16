import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { loadStudentMemory } from "../agent/memory/studentMemory";
import { opticsKnowledge } from "../data/opticsKnowledge";
import { checkOllamaAvailability, OLLAMA_LOCAL_URL, OLLAMA_MODEL, streamOllamaAssistantReply } from "../physics/ollamaClient";
import type { OllamaAvailability } from "../physics/ollamaClient";
import type { ChapterKey } from "../types";

type AssistantMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type AIAssistantProps = {
  activeChapter: ChapterKey;
  experimentContext: string;
};

type ModelStatus = "checking" | "connected" | "service-missing" | "model-missing";

const introMessage: AssistantMessage = {
  id: 1,
  role: "assistant",
  content:
    "我是 PhysicsLab AI 本地助教。基础模式会用内置知识库、公式工具和当前仿真状态回答；如果当前设备安装了 Ollama 和指定模型，会自动启用本地模型增强。"
};

const quickPrompts: Record<ChapterKey, string[]> = {
  refraction: ["为什么会发生全反射？", "临界角怎么理解？", "折射率和光速有什么关系？"],
  interference: ["双缝干涉为什么有明暗条纹？", "条纹间距和哪些参数有关？", "薄膜干涉为什么有彩色？"],
  diffraction: ["单缝衍射中央亮纹为什么最宽？", "缝宽变小会发生什么？", "望远镜分辨率为什么有限？"],
  polarization: ["什么是偏振光？", "马吕斯定律怎么理解？", "偏振片为什么能减弱反光？"]
};

export function AIAssistant({ activeChapter, experimentContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(() => new URLSearchParams(window.location.search).get("ai") === "open");
  const [messages, setMessages] = useState<AssistantMessage[]>([introMessage]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("checking");
  const [ollamaAvailability, setOllamaAvailability] = useState<OllamaAvailability | null>(null);
  const [showModelSetup, setShowModelSetup] = useState(false);
  const [memoryCount, setMemoryCount] = useState(() => loadStudentMemory().recentQuestions.length);
  const nextId = useRef(2);
  const prompts = useMemo(() => quickPrompts[activeChapter], [activeChapter]);
  const knowledgeLabel = opticsKnowledge.length > 0 ? `知识库 ${opticsKnowledge.length} 条` : "知识库待导入";
  const memoryLabel = memoryCount > 0 ? `学习记忆 ${memoryCount} 条` : "学习记忆已开启";
  const modelLabel = (() => {
    if (modelStatus === "checking") return "模型增强检测中";
    if (modelStatus === "connected") return `${OLLAMA_MODEL} 已启用`;
    if (modelStatus === "model-missing") return "模型待下载";
    return "Ollama 未运行";
  })();

  useEffect(() => {
    const controller = new AbortController();

    refreshOllamaStatus(controller.signal);

    return () => controller.abort();
  }, []);

  async function refreshOllamaStatus(signal?: AbortSignal) {
    setModelStatus("checking");
    const availability = await checkOllamaAvailability(signal);
    setOllamaAvailability(availability);

    if (availability.serviceRunning && availability.modelInstalled) {
      setModelStatus("connected");
    } else if (availability.serviceRunning) {
      setModelStatus("model-missing");
    } else {
      setModelStatus("service-missing");
    }
  }

  function addMessage(role: AssistantMessage["role"], content: string) {
    const id = nextId.current;
    setMessages((current) => [...current, { id, role, content }]);
    nextId.current += 1;
    return id;
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isThinking) return;

    addMessage("user", trimmed);
    setInput("");
    setIsThinking(true);

    try {
      const reply = await streamOllamaAssistantReply(trimmed, activeChapter, experimentContext, () => undefined);

      if (reply.answerMode === "model") setModelStatus("connected");
      if (reply.answerMode === "fallback") {
        refreshOllamaStatus();
      }
      addMessage("assistant", reply.answer);
      setMemoryCount(loadStudentMemory().recentQuestions.length);
    } catch {
      refreshOllamaStatus();
      addMessage("assistant", "结论：这次回答没有生成成功。\n原因：本地助教响应中断，可能是模型还在加载或服务暂时不可用。\n仿真：你可以稍等几秒后重新提问，或先问一个更短的问题。");
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
  }

  return (
    <section className={`ai-assistant ${isOpen ? "is-open" : ""}`} aria-label="PhysicsLab AI 本地助教">
      {isOpen && (
        <div className="ai-panel">
          <header className="ai-panel-header">
            <div>
              <span>LOCAL TUTOR</span>
              <strong>PhysicsLab AI 助教</strong>
            </div>
            <button type="button" aria-label="关闭 AI 助教" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </header>

          <div className="ai-status-row">
            <span className={opticsKnowledge.length > 0 ? "is-ready" : ""}>{knowledgeLabel}</span>
            <span className="is-ready">{memoryLabel}</span>
            <span className="is-ready">基础助教可用</span>
            <button className={modelStatus === "connected" ? "is-ready" : ""} type="button" onClick={() => setShowModelSetup((current) => !current)}>
              {modelLabel}
            </button>
          </div>

          {showModelSetup && (
            <div className="ai-model-setup">
              <strong>本地模型增强</strong>
              <p>当前网页默认只会连接这台设备上的 Ollama：{OLLAMA_LOCAL_URL}。分享给别人后，会检测对方电脑上的 Ollama，不会自动调用你的电脑。</p>
              <code>ollama pull {OLLAMA_MODEL}</code>
              <div>
                <button type="button" onClick={() => refreshOllamaStatus()}>
                  重新检测
                </button>
                <span>{ollamaAvailability?.serviceRunning ? "Ollama 服务已响应" : "Ollama 服务未响应"}</span>
                <span>{ollamaAvailability?.modelInstalled ? "模型已安装" : "模型未安装"}</span>
              </div>
            </div>
          )}

          <div className="ai-message-list" aria-live="polite">
            {messages.map((message) => (
              <article className={`ai-message ${message.role === "user" ? "is-user" : "is-assistant"}`} key={message.id}>
                <span>{message.role === "user" ? "你" : "AI"}</span>
                {message.content.split("\n").map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </article>
            ))}
          </div>

          <div className="ai-prompt-row" aria-label="快捷问题">
            {prompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => void ask(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="ai-input-row" onSubmit={handleSubmit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="问一个光学问题..." aria-label="输入光学问题" />
            <button type="submit" disabled={!input.trim() || isThinking}>
              {isThinking ? "生成中" : "发送"}
            </button>
          </form>
        </div>
      )}

      <button className="ai-fab" type="button" aria-label="打开 PhysicsLab AI 助教" onClick={() => setIsOpen((current) => !current)}>
        <span>AI</span>
      </button>
    </section>
  );
}
