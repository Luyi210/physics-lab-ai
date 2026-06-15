import { useMemo, useState } from "react";

type PolarizationState = {
  polarizerAngle: number;
  analyzerAngle: number;
  useMiddlePolarizer: boolean;
  middleAngle: number;
  incomingIntensity: number;
  showVectors: boolean;
};

type PolarizationResult = {
  deltaDirect: number;
  deltaFirst: number;
  deltaSecond: number;
  afterFirst: number;
  afterMiddle: number | null;
  finalIntensity: number;
  finalOfIncoming: number;
  finalOfFirst: number;
  status: string;
};

const defaultPolarizationState: PolarizationState = {
  polarizerAngle: 0,
  analyzerAngle: 72,
  useMiddlePolarizer: false,
  middleAngle: 36,
  incomingIntensity: 100,
  showVectors: true
};

const centerY = 206;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smallestAngleDifference(a: number, b: number) {
  const raw = Math.abs(a - b) % 180;
  return raw > 90 ? 180 - raw : raw;
}

function cosSquared(degrees: number) {
  return Math.cos((degrees * Math.PI) / 180) ** 2;
}

function calculatePolarization(state: PolarizationState): PolarizationResult {
  const afterFirst = state.incomingIntensity * 0.5;
  const deltaDirect = smallestAngleDifference(state.analyzerAngle, state.polarizerAngle);

  if (!state.useMiddlePolarizer) {
    const finalIntensity = afterFirst * cosSquared(deltaDirect);
    return {
      deltaDirect,
      deltaFirst: deltaDirect,
      deltaSecond: 0,
      afterFirst,
      afterMiddle: null,
      finalIntensity,
      finalOfIncoming: (finalIntensity / state.incomingIntensity) * 100,
      finalOfFirst: (finalIntensity / afterFirst) * 100,
      status: finalIntensity / state.incomingIntensity < 0.03 ? "接近消光" : "部分透过"
    };
  }

  const deltaFirst = smallestAngleDifference(state.middleAngle, state.polarizerAngle);
  const deltaSecond = smallestAngleDifference(state.analyzerAngle, state.middleAngle);
  const afterMiddle = afterFirst * cosSquared(deltaFirst);
  const finalIntensity = afterMiddle * cosSquared(deltaSecond);

  return {
    deltaDirect,
    deltaFirst,
    deltaSecond,
    afterFirst,
    afterMiddle,
    finalIntensity,
    finalOfIncoming: (finalIntensity / state.incomingIntensity) * 100,
    finalOfFirst: (finalIntensity / afterFirst) * 100,
    status: finalIntensity / state.incomingIntensity < 0.03 ? "接近消光" : "第三片改变透光"
  };
}

function beamOpacity(relativeIntensity: number) {
  return clamp(0.1 + (relativeIntensity / 100) * 0.88, 0.08, 0.96);
}

function vectorEndpoints(cx: number, cy: number, angle: number, length: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = (Math.cos(rad) * length) / 2;
  const dy = (Math.sin(rad) * length) / 2;
  return {
    x1: cx - dx,
    y1: cy - dy,
    x2: cx + dx,
    y2: cy + dy
  };
}

function slatOffsets() {
  return [-34, -22, -10, 2, 14, 26, 38];
}

export function PolarizationChapter() {
  const [state, setState] = useState<PolarizationState>(defaultPolarizationState);
  const result = useMemo(() => calculatePolarization(state), [state]);

  function updateState(patch: Partial<PolarizationState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  return (
    <>
      <main className="simulator polarization-layout">
        <section className="stage-panel polarization-stage" aria-label="光的偏振仿真画布">
          <div className="stage-toolbar">
            <div>
              <p className="micro-label">Experiment 04-04</p>
              <h1>光的偏振：偏振片与马吕斯定律</h1>
            </div>
            <div className="stage-meta">
              <span>Polarizer</span>
              <span>Malus Law</span>
              <div className={`status-pill ${result.finalOfIncoming < 3 ? "is-tir" : ""}`}>{result.status}</div>
            </div>
          </div>

          <PolarizationCanvas state={state} result={result} />
          <PolarizationReadouts state={state} result={result} />
        </section>

        <PolarizationDock state={state} result={result} onStateChange={updateState} />
      </main>

      <PolarizationLearning state={state} result={result} />
      <PolarizationApplications />
    </>
  );
}

function PolarizationCanvas({ state, result }: { state: PolarizationState; result: PolarizationResult }) {
  const hasMiddle = state.useMiddlePolarizer;
  const firstX = hasMiddle ? 150 : 176;
  const middleX = 286;
  const analyzerX = hasMiddle ? 400 : 354;
  const screenX = 466;
  const finalRatioAfterFirst = result.finalOfFirst / 100;
  const screenGlow = clamp(finalRatioAfterFirst, 0.02, 1);
  const analyzerVector = vectorEndpoints((analyzerX + screenX) / 2, centerY - 38, state.analyzerAngle, 54);
  const firstVector = vectorEndpoints((firstX + (hasMiddle ? middleX : analyzerX)) / 2, centerY + 42, state.polarizerAngle, 56);
  const middleVector = vectorEndpoints((middleX + analyzerX) / 2, centerY + 42, state.middleAngle, 56);

  return (
    <div className="polarization-frame">
      <svg viewBox="0 0 560 410" role="img" aria-label="偏振片透光强度动态示意图">
        <defs>
          <filter id="polarizationGlow">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="polarScreenGradient" x1="0" x2="1">
            <stop offset="0" stopColor="#171d19" />
            <stop offset="0.5" stopColor="#303b35" />
            <stop offset="1" stopColor="#121715" />
          </linearGradient>
        </defs>

        <rect className="polarization-room" x="18" y="36" width="524" height="338" rx="12" />
        <line className="polarization-axis" x1="44" y1={centerY} x2="520" y2={centerY} />

        <g className="unpolarized-source">
          <rect x="38" y={centerY - 34} width="64" height="68" rx="12" />
          <circle cx="70" cy={centerY} r="18" />
          <line x1="58" y1={centerY} x2="82" y2={centerY} />
          <line x1="70" y1={centerY - 12} x2="70" y2={centerY + 12} />
          <line x1="61" y1={centerY - 9} x2="79" y2={centerY + 9} />
          <line x1="79" y1={centerY - 9} x2="61" y2={centerY + 9} />
        </g>
        <text x="42" y="62">自然光</text>

        <line className="polarization-beam incoming" x1="102" y1={centerY} x2={firstX - 42} y2={centerY} style={{ opacity: beamOpacity(state.incomingIntensity) }} />
        <line
          className="polarization-beam polarized"
          x1={firstX + 42}
          y1={centerY}
          x2={(hasMiddle ? middleX : analyzerX) - 42}
          y2={centerY}
          style={{ opacity: beamOpacity(50) }}
        />
        {hasMiddle && (
          <line
            className="polarization-beam middle"
            x1={middleX + 42}
            y1={centerY}
            x2={analyzerX - 42}
            y2={centerY}
            style={{ opacity: beamOpacity(((result.afterMiddle ?? result.afterFirst) / state.incomingIntensity) * 100) }}
          />
        )}
        <line
          className="polarization-beam outgoing"
          x1={analyzerX + 42}
          y1={centerY}
          x2={screenX - 24}
          y2={centerY}
          style={{ opacity: beamOpacity(result.finalOfIncoming), strokeWidth: 10 + screenGlow * 12 }}
        />

        <PolarizerDisk x={firstX} y={centerY} angle={state.polarizerAngle} label="偏振片 P₁" />
        {hasMiddle && <PolarizerDisk x={middleX} y={centerY} angle={state.middleAngle} label="中间偏振片 P₂" />}
        <PolarizerDisk x={analyzerX} y={centerY} angle={state.analyzerAngle} label={hasMiddle ? "检偏器 P₃" : "检偏器 P₂"} />

        {state.showVectors && (
          <g className="electric-vector-layer">
            <line {...firstVector} />
            <circle cx={(firstX + (hasMiddle ? middleX : analyzerX)) / 2} cy={centerY + 42} r="4" />
            <text x={(firstX + (hasMiddle ? middleX : analyzerX)) / 2 - 36} y={centerY + 86}>E 方向</text>
            {hasMiddle && (
              <>
                <line {...middleVector} />
                <circle cx={(middleX + analyzerX) / 2} cy={centerY + 42} r="4" />
              </>
            )}
            <line {...analyzerVector} />
            <circle cx={(analyzerX + screenX) / 2} cy={centerY - 38} r="4" />
          </g>
        )}

        <g className="polarization-screen">
          <rect x={screenX} y="92" width="28" height="228" rx="8" />
          <rect x={screenX + 4} y="100" width="20" height="212" rx="7" />
          <ellipse cx={screenX + 14} cy={centerY} rx="10" ry={86} style={{ opacity: 0.12 + screenGlow * 0.88 }} />
        </g>
        <text x={screenX - 24} y="82">观察屏</text>

        <g className="polarization-angle-readout">
          <path d={`M ${analyzerX - 8} ${centerY - 86} A 62 62 0 0 1 ${analyzerX + 54} ${centerY - 24}`} />
          <text x={analyzerX - 12} y={centerY - 104}>夹角 {hasMiddle ? result.deltaSecond.toFixed(0) : result.deltaDirect.toFixed(0)}°</text>
        </g>

        <text className="polarization-caption" x="34" y="394">
          旋转检偏器时，屏幕亮度按 cos²θ 改变；两片正交时几乎不透光，插入第三片可重新透过部分光。
        </text>
      </svg>
    </div>
  );
}

function PolarizerDisk({ x, y, angle, label }: { x: number; y: number; angle: number; label: string }) {
  return (
    <g className="polarizer-disk" transform={`translate(${x} ${y})`}>
      <circle r="42" />
      <circle className="polarizer-inner" r="31" />
      <g transform={`rotate(${angle})`}>
        {slatOffsets().map((offset) => (
          <line className="polarizer-slat" x1={offset} y1="-28" x2={offset} y2="28" key={offset} />
        ))}
        <line className="transmission-axis" x1="0" y1="-34" x2="0" y2="34" />
      </g>
      <text x="-40" y="-54">{label}</text>
      <text className="angle-label" x="-17" y="64">{angle.toFixed(0)}°</text>
    </g>
  );
}

function PolarizationReadouts({ state, result }: { state: PolarizationState; result: PolarizationResult }) {
  return (
    <div className="instrument-strip polarization-strip">
      <div className="instrument">
        <span>P₁ 透振方向</span>
        <strong>{state.polarizerAngle.toFixed(0)}°</strong>
      </div>
      <div className="instrument">
        <span>检偏器方向</span>
        <strong>{state.analyzerAngle.toFixed(0)}°</strong>
      </div>
      <div className="instrument">
        <span>有效夹角 θ</span>
        <strong>{(state.useMiddlePolarizer ? result.deltaSecond : result.deltaDirect).toFixed(0)}°</strong>
      </div>
      <div className="instrument">
        <span>I / I₁</span>
        <strong>{result.finalOfFirst.toFixed(1)}%</strong>
      </div>
      <div className="instrument">
        <span>I / I₀</span>
        <strong>{result.finalOfIncoming.toFixed(1)}%</strong>
      </div>
    </div>
  );
}

function PolarizationDock({
  state,
  result,
  onStateChange
}: {
  state: PolarizationState;
  result: PolarizationResult;
  onStateChange: (patch: Partial<PolarizationState>) => void;
}) {
  return (
    <aside className="control-dock polarization-dock" aria-label="偏振实验控制台">
      <section className="control-card">
        <div className="card-title">
          <span>01</span>
          <h2>偏振片组合</h2>
        </div>
        <div className="polarization-mode-card">
          <strong>{state.useMiddlePolarizer ? "三片偏振片" : "两片偏振片"}</strong>
          <p>{state.useMiddlePolarizer ? "用中间偏振片把偏振方向分两步旋转，可观察正交偏振片中间插片后重新透光。" : "自然光通过第一片后成为线偏振光，再由检偏器角度决定最终亮度。"}</p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.useMiddlePolarizer} onChange={(event) => onStateChange({ useMiddlePolarizer: event.target.checked })} />
          <span>插入第三片偏振片</span>
        </label>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>02</span>
          <h2>角度控制</h2>
        </div>
        <div className="angle-meter polarization-meter">
          <span>MALUS ANGLE</span>
          <strong>{(state.useMiddlePolarizer ? result.deltaSecond : result.deltaDirect).toFixed(0)}°</strong>
        </div>
        <label className="field">
          <span>
            P₁ 透振方向 <output>{state.polarizerAngle.toFixed(0)}°</output>
          </span>
          <input type="range" min="0" max="180" step="1" value={state.polarizerAngle} onChange={(event) => onStateChange({ polarizerAngle: Number(event.target.value) })} />
        </label>
        {state.useMiddlePolarizer && (
          <label className="field">
            <span>
              中间偏振片 <output>{state.middleAngle.toFixed(0)}°</output>
            </span>
            <input type="range" min="0" max="180" step="1" value={state.middleAngle} onChange={(event) => onStateChange({ middleAngle: Number(event.target.value) })} />
          </label>
        )}
        <label className="field">
          <span>
            检偏器方向 <output>{state.analyzerAngle.toFixed(0)}°</output>
          </span>
          <input type="range" min="0" max="180" step="1" value={state.analyzerAngle} onChange={(event) => onStateChange({ analyzerAngle: Number(event.target.value) })} />
        </label>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>03</span>
          <h2>光强读数</h2>
        </div>
        <label className="field">
          <span>
            入射自然光 I₀ <output>{state.incomingIntensity.toFixed(0)}%</output>
          </span>
          <input
            type="range"
            min="40"
            max="100"
            step="1"
            value={state.incomingIntensity}
            onChange={(event) => onStateChange({ incomingIntensity: Number(event.target.value) })}
          />
        </label>
        <div className={`condition-row ${result.finalOfIncoming < 3 ? "is-warn" : "is-ok"}`}>
          <span>屏幕最终光强</span>
          <strong>{result.finalOfIncoming.toFixed(1)}% I₀</strong>
        </div>
        <div className="polarization-intensity-bar" aria-label="最终透过光强">
          <span style={{ width: `${clamp(result.finalOfIncoming * 2, 2, 100)}%` }} />
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>04</span>
          <h2>辅助标注</h2>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.showVectors} onChange={(event) => onStateChange({ showVectors: event.target.checked })} />
          <span>显示电场振动方向</span>
        </label>
        <button className="ghost-action full-width-action" type="button" onClick={() => onStateChange(defaultPolarizationState)}>
          复位偏振实验
        </button>
      </section>
    </aside>
  );
}

function PolarizationLearning({ state, result }: { state: PolarizationState; result: PolarizationResult }) {
  return (
    <section className="learning-panel polarization-learning" aria-label="偏振原理解释">
      <div className="notebook-title">
        <span>LAB NOTES</span>
        <strong>偏振记录</strong>
      </div>
      <article className="explain-card main-explain">
        <div className="explain-heading">
          <span className="summary-tag">横波特征</span>
          <h2>偏振说明光是横波</h2>
        </div>
        <p>
          自然光的电场振动方向很多，偏振片只允许沿透振方向的分量通过。通过第一片后，光变成线偏振光；
          再经过检偏器时，只有投影到检偏器透振方向上的分量能继续传播。
        </p>
      </article>

      <article className="explain-card formula-board">
        <div className="formula-board-heading">
          <span>FORMULA BOARD</span>
          <h2>核心公式</h2>
        </div>
        <div className="formula-grid polarization-formula-grid">
          <FormulaItem label="自然光过第一片" formula="I₁ = I₀ / 2" value={`当前 I₁ = ${result.afterFirst.toFixed(1)}%`} />
          <FormulaItem label="马吕斯定律" formula="I = I₁ cos²θ" value={`当前 I/I₁ = ${result.finalOfFirst.toFixed(1)}%`} />
          <FormulaItem label="正交消光" formula="θ = 90° → I ≈ 0" value="两片偏振片透振方向互相垂直时，理想情况下屏幕变暗。" />
          <FormulaItem label="三片偏振片" formula="I = I₁cos²θ₁cos²θ₂" value={state.useMiddlePolarizer ? `θ₁=${result.deltaFirst.toFixed(0)}°，θ₂=${result.deltaSecond.toFixed(0)}°` : "打开第三片开关可观察正交片中间插片后的透光变化。"} />
        </div>
      </article>

      <article className="explain-card">
        <h2>读图时抓住三件事</h2>
        <ol className="step-list">
          <li>偏振片不是简单“挡住一半光”，它筛选的是电场振动方向。</li>
          <li>两片偏振片的相对夹角越接近 90°，透过光强越小。</li>
          <li>中间插入第三片后，偏振方向可以分步旋转，因此原本正交消光的组合也可能重新透光。</li>
          <li>生活中的防眩光太阳镜、液晶屏显示，都依赖偏振选择和光强调制。</li>
        </ol>
      </article>

      <article className="explain-card polarization-check-card">
        <h2>当前实验数据</h2>
        <div className="polarization-data-grid">
          <span>P₁ = {state.polarizerAngle.toFixed(0)}°</span>
          {state.useMiddlePolarizer && <span>P₂ = {state.middleAngle.toFixed(0)}°</span>}
          <span>检偏器 = {state.analyzerAngle.toFixed(0)}°</span>
          <span>θ = {(state.useMiddlePolarizer ? result.deltaSecond : result.deltaDirect).toFixed(0)}°</span>
          <strong>I = {result.finalOfIncoming.toFixed(1)}% I₀</strong>
        </div>
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

function PolarizationApplications() {
  return (
    <section className="applications-panel polarization-applications" aria-label="光的偏振真实应用">
      <div className="application-title">
        <span>POLARIZATION CASES</span>
        <h2>偏振的真实应用</h2>
        <p>偏振不是只存在于实验室。太阳镜消除反光、液晶屏控制明暗、摄影偏振镜压暗天空和水面反光，背后都是同一套方向选择机制。</p>
      </div>

      <article className="application-card polarization-application-card">
        <div className="application-copy">
          <span className="application-tag">防眩光太阳镜</span>
          <h3>为什么偏振镜能削弱水面反光</h3>
          <p>水面、玻璃和路面的反射光常带有较强的水平偏振成分。偏振太阳镜的透振方向通常设计为竖直方向，因此能显著削弱水平眩光。</p>
          <div className="condition-row">
            <span>过滤目标</span>
            <strong>水平偏振反射光</strong>
          </div>
          <p className="application-note">这也是为什么戴偏振镜转头时，某些屏幕或反光面的亮度会明显变化。</p>
        </div>
        <div className="application-visual sunglasses-visual" aria-label="偏振太阳镜防眩光示意">
          <svg viewBox="0 0 520 270" role="img">
            <defs>
              <linearGradient id="waterGlare" x1="0" x2="1">
                <stop offset="0" stopColor="#dff8ff" />
                <stop offset="0.5" stopColor="#ffffff" />
                <stop offset="1" stopColor="#bceaf4" />
              </linearGradient>
            </defs>
            <rect className="sunglasses-bg" x="22" y="24" width="476" height="222" rx="12" />
            <path className="water-surface" d="M 40 176 C 98 158, 150 192, 210 174 C 276 154, 334 194, 396 176 C 438 164, 466 168, 486 178 L 486 226 L 40 226 Z" />
            <path className="glare-streak" d="M 86 166 H 226 M 268 174 H 430 M 122 198 H 376" />
            <g className="sunglasses-frame">
              <path d="M 132 92 C 170 72, 210 74, 236 96 C 220 148, 144 150, 132 92 Z" />
              <path d="M 284 96 C 314 74, 356 72, 390 92 C 378 150, 304 148, 284 96 Z" />
              <path d="M 236 98 C 252 88, 268 88, 284 98" />
            </g>
            <g className="vertical-filter-lines">
              {Array.from({ length: 6 }, (_, index) => (
                <line x1={156 + index * 12} y1="90" x2={156 + index * 12} y2="136" key={`l-${index}`} />
              ))}
              {Array.from({ length: 6 }, (_, index) => (
                <line x1={310 + index * 12} y1="90" x2={310 + index * 12} y2="136" key={`r-${index}`} />
              ))}
            </g>
            <path className="blocked-glare" d="M 84 118 H 128 M 392 118 H 444" />
            <text x="70" y="58">水面水平眩光</text>
            <text x="296" y="224">竖直透振方向保留景物光、削弱眩光</text>
          </svg>
        </div>
      </article>

      <article className="application-card polarization-application-card">
        <div className="application-copy">
          <span className="application-tag">液晶显示屏</span>
          <h3>LCD 通过改变偏振方向控制亮暗</h3>
          <p>液晶屏通常有两片偏振片。液晶分子在电压作用下改变光的偏振方向，决定光能否通过第二片偏振片，从而形成屏幕上的亮暗像素。</p>
          <div className="condition-row">
            <span>像素控制</span>
            <strong>旋转偏振方向</strong>
          </div>
          <p className="application-note">这和仿真里的“中间偏振片改变透光”思想类似：改变偏振状态，就能改变最终亮度。</p>
        </div>
        <div className="application-visual lcd-visual" aria-label="液晶屏偏振控制亮暗示意">
          <svg viewBox="0 0 520 270" role="img">
            <rect className="lcd-bg" x="22" y="24" width="476" height="222" rx="12" />
            <rect className="lcd-layer back" x="86" y="66" width="56" height="138" rx="8" />
            <rect className="lcd-layer crystal" x="202" y="66" width="92" height="138" rx="8" />
            <rect className="lcd-layer front" x="362" y="66" width="56" height="138" rx="8" />
            <path className="lcd-beam before" d="M 50 135 H 86" />
            <path className="lcd-beam inside" d="M 142 135 H 202" />
            <path className="lcd-beam rotated" d="M 294 135 H 362" />
            <path className="lcd-beam after" d="M 418 135 H 474" />
            <g className="lcd-pixels">
              <rect x="220" y="90" width="18" height="18" rx="4" />
              <rect x="246" y="90" width="18" height="18" rx="4" />
              <rect x="220" y="118" width="18" height="18" rx="4" />
              <rect x="246" y="118" width="18" height="18" rx="4" />
              <rect x="220" y="146" width="18" height="18" rx="4" />
              <rect x="246" y="146" width="18" height="18" rx="4" />
            </g>
            <text x="76" y="55">后偏振片</text>
            <text x="200" y="55">液晶层</text>
            <text x="352" y="55">前偏振片</text>
            <text x="186" y="226">电压改变液晶排列，进而调节每个像素的亮度</text>
          </svg>
        </div>
      </article>
    </section>
  );
}
