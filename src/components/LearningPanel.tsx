import { formatDegree, radToDeg } from "../physics/optics";
import type { OpticalResult, OpticsState } from "../types";

type LearningPanelProps = {
  state: OpticsState;
  result: OpticalResult;
  explanation: {
    tag: string;
    title: string;
    summary: string;
    formula: string;
  };
};

export function LearningPanel({ state, result, explanation }: LearningPanelProps) {
  const critical = result.critical === null ? null : radToDeg(result.critical);
  const theta2 = result.theta2 === null ? null : radToDeg(result.theta2);

  return (
    <section className="learning-panel" aria-label="原理解释">
      <div className="notebook-title">
        <span>LAB NOTES</span>
        <strong>观察记录</strong>
      </div>
      <article className="explain-card main-explain">
        <div className="explain-heading">
          <span className="summary-tag">{explanation.tag}</span>
          <h2>{explanation.title}</h2>
        </div>
        <p>{explanation.summary}</p>
      </article>

      <article className="explain-card formula-board">
        <div className="formula-board-heading">
          <span>FORMULA BOARD</span>
          <h2>核心公式</h2>
        </div>
        <div className="formula-grid">
          <FormulaItem label="折射定律" formula="n₁ sinθ₁ = n₂ sinθ₂" value={explanation.formula} />
          <FormulaItem label="折射率定义" formula="n = c / v" value={`当前下方介质：n₂ = ${state.n2.toFixed(2)}`} />
          <FormulaItem label="介质中光速" formula="v = c / n" value={`v₂ = ${(1 / state.n2).toFixed(2)}c`} />
          <FormulaItem
            label="全反射临界角"
            formula={state.n1 > state.n2 ? "sinC = n₂ / n₁" : "n₁ ≤ n₂ 时无临界角"}
            value={state.n1 > state.n2 ? `C = ${formatDegree(critical)}` : "当前方向不会发生全反射"}
          />
        </div>
      </article>

      <article className="explain-card">
        <h2>建模步骤</h2>
        <ol className="step-list">
          <li>先判断光从哪种介质进入哪种介质。</li>
          <li>比较 n₁ 与 n₂，预判折射光靠近或远离法线。</li>
          <li>先算折射角 θ₂{theta2 === null ? "；当前已无折射光。" : `，当前 θ₂ = ${theta2.toFixed(1)}°。`}</li>
          <li>若 n₁ &gt; n₂，再用 sinC = n₂ / n₁ 判断是否全反射。</li>
        </ol>
      </article>
    </section>
  );
}

function FormulaItem({ label, formula, value }: { label: string; formula: string; value: string }) {
  return (
    <div className="formula-item">
      <span>{label}</span>
      <strong>{formula}</strong>
      <p>{value}</p>
    </div>
  );
}
