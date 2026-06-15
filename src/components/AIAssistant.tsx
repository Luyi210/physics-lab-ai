import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { buildLocalAssistantReply } from "../physics/localAssistant";
import type { ChapterKey } from "../types";

type AssistantMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type AIAssistantProps = {
  activeChapter: ChapterKey;
};

const introMessage: AssistantMessage = {
  id: 1,
  role: "assistant",
  content:
    "我是 PhysicsLab AI 本地助教原型。当前版本先搭好了聊天入口和本地知识库检索接口，还没有导入知识库，也没有连接本地小模型。你可以先试着提问，后续导入资料后我会基于本地知识回答。"
};

const quickPrompts: Record<ChapterKey, string[]> = {
  refraction: ["为什么会发生全反射？", "临界角怎么理解？", "折射率和光速有什么关系？"],
  interference: ["双缝干涉为什么有明暗条纹？", "条纹间距和哪些参数有关？", "薄膜干涉为什么有彩色？"],
  diffraction: ["单缝衍射中央亮纹为什么最宽？", "缝宽变小会发生什么？", "望远镜分辨率为什么有限？"],
  polarization: ["什么是偏振光？", "马吕斯定律怎么理解？", "偏振片为什么能减弱反光？"]
};

export function AIAssistant({ activeChapter }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(() => new URLSearchParams(window.location.search).get("ai") === "open");
  const [messages, setMessages] = useState<AssistantMessage[]>([introMessage]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const nextId = useRef(2);
  const prompts = useMemo(() => quickPrompts[activeChapter], [activeChapter]);

  function addMessage(role: AssistantMessage["role"], content: string) {
    setMessages((current) => [...current, { id: nextId.current, role, content }]);
    nextId.current += 1;
  }

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isThinking) return;

    addMessage("user", trimmed);
    setInput("");
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = buildLocalAssistantReply(trimmed, activeChapter);
      addMessage("assistant", reply.answer);
      setIsThinking(false);
    }, 260);
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
            <span>知识库待导入</span>
            <span>本地模型未连接</span>
          </div>

          <div className="ai-message-list" aria-live="polite">
            {messages.map((message) => (
              <article className={`ai-message ${message.role === "user" ? "is-user" : "is-assistant"}`} key={message.id}>
                <span>{message.role === "user" ? "你" : "AI"}</span>
                {message.content.split("\n").map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </article>
            ))}
            {isThinking && (
              <article className="ai-message is-assistant">
                <span>AI</span>
                <p>正在检查本地知识库接口...</p>
              </article>
            )}
          </div>

          <div className="ai-prompt-row" aria-label="快捷问题">
            {prompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => ask(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="ai-input-row" onSubmit={handleSubmit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="问一个光学问题..." aria-label="输入光学问题" />
            <button type="submit" disabled={!input.trim() || isThinking}>
              发送
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
