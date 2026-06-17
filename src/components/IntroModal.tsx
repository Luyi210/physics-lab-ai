import { useEffect } from "react";

type IntroModalProps = {
  onClose: () => void;
};

const featureItems = [
  {
    label: "面向对象",
    title: "高中生与物理课堂",
    text: "用于光学概念学习、课堂演示、自学复习和实验预习。"
  },
  {
    label: "核心体验",
    title: "先看现象，再问助教",
    text: "拖动角度、介质、波长、缝宽或偏振片，实时观察光路、条纹和光强。"
  },
  {
    label: "AI 助教",
    title: "像物理老师一样解释",
    text: "回答按“结论、原因、仿真”组织，并尽量联系当前页面的实验状态。"
  }
];

const steps = ["选择上方光学章节", "调节右侧实验参数", "观察画面和实时读数", "点击右下角 AI 提问"];

export function IntroModal({ onClose }: IntroModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="intro-modal-backdrop" role="presentation">
      <section className="intro-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title">
        <button className="intro-close" type="button" aria-label="关闭产品介绍" onClick={onClose}>
          ×
        </button>

        <header className="intro-hero">
          <span>PHYSICSLAB AI DEMO</span>
          <h2 id="intro-title">面向高中生的 AI 光学实验助教</h2>
          <p>把抽象光学公式变成可调参数的实验画面，再用 AI 助教把现象解释成高中生能理解的物理规律。</p>
        </header>

        <div className="intro-feature-grid" aria-label="产品介绍">
          {featureItems.map((item) => (
            <article className="intro-feature" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="intro-usage">
          <div>
            <span>HOW TO USE</span>
            <strong>建议体验路径</strong>
          </div>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <footer className="intro-actions">
          <button className="primary-action" type="button" onClick={onClose}>
            开始体验
          </button>
          <p>基础助教可直接使用；本地模型增强只会检测访问者自己电脑上的 Ollama。</p>
        </footer>
      </section>
    </div>
  );
}
