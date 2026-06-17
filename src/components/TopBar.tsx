import { moduleTabs } from "../data/materials";
import type { ChapterKey } from "../types";

type TopBarProps = {
  activeChapter: ChapterKey;
  onChapterChange: (chapter: ChapterKey) => void;
};

const lawBadges: Record<ChapterKey, { tag: string; formula: string }> = {
  refraction: { tag: "SNELL", formula: "n₁ sinθ₁ = n₂ sinθ₂" },
  interference: { tag: "DOUBLE SLIT", formula: "Δx = Lλ / d" },
  diffraction: { tag: "DIFFRACTION", formula: "a sinθ = mλ" },
  polarization: { tag: "POLARIZATION", formula: "I = I₀ cos²θ" }
};

export function TopBar({ activeChapter, onChapterChange }: TopBarProps) {
  const activeLaw = lawBadges[activeChapter];

  return (
    <header className="top-bar">
      <div className="brand-block">
        <span className="app-mark">PL</span>
        <div>
          <strong>PhysicsLab AI</strong>
          <span>面向高中生的 AI 光学实验助教</span>
        </div>
      </div>
      <nav className="chapter-nav" aria-label="光学章节">
        {moduleTabs.map((tab) => (
          <button
            className={`nav-tab ${activeChapter === tab.key ? "is-active" : ""}`}
            type="button"
            disabled={!tab.enabled}
            key={tab.key}
            onClick={() => onChapterChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="law-badge">
        <span>{activeLaw.tag}</span>
        {activeLaw.formula}
      </div>
    </header>
  );
}
