import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type DiffractionViewMode = "pattern" | "profile";

type DiffractionState = {
  wavelength: number;
  slitWidth: number;
  screenDistance: number;
  viewMode: DiffractionViewMode;
  showWavefront: boolean;
  showMinima: boolean;
};

type DiffractionResult = {
  firstDarkMm: number;
  centralWidthMm: number;
  firstDarkAngle: number;
  visibleMinima: number;
  color: string;
};

const defaultDiffractionState: DiffractionState = {
  wavelength: 560,
  slitWidth: 0.18,
  screenDistance: 1.4,
  viewMode: "pattern",
  showWavefront: true,
  showMinima: false
};

const diffractionScreen = {
  y: 70,
  width: 30,
  height: 272,
  physicalHalfMm: 26
};

const diffractionScreenTrack = {
  minX: 410,
  maxX: 482,
  minDistance: 0.6,
  maxDistance: 2.4
};

const slitX = 164;
const centerY = 206;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function wavelengthToRgb(wavelength: number) {
  const wl = clamp(wavelength, 380, 700);
  let r = 0;
  let g = 0;
  let b = 0;

  if (wl < 440) {
    r = -(wl - 440) / (440 - 380);
    b = 1;
  } else if (wl < 490) {
    g = (wl - 440) / (490 - 440);
    b = 1;
  } else if (wl < 510) {
    g = 1;
    b = -(wl - 510) / (510 - 490);
  } else if (wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1;
  } else if (wl < 645) {
    r = 1;
    g = -(wl - 645) / (645 - 580);
  } else {
    r = 1;
  }

  const factor = wl < 420 ? 0.3 + (0.7 * (wl - 380)) / 40 : wl > 645 ? 0.3 + (0.7 * (700 - wl)) / 55 : 1;
  return {
    r: Math.round(255 * Math.pow(r * factor, 0.8)),
    g: Math.round(255 * Math.pow(g * factor, 0.8)),
    b: Math.round(255 * Math.pow(b * factor, 0.8))
  };
}

function lightColor(wavelength: number, alpha = 1) {
  const rgb = wavelengthToRgb(wavelength);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function calculateDiffraction(state: DiffractionState): DiffractionResult {
  const lambdaMm = state.wavelength * 1e-6;
  const screenDistanceMm = state.screenDistance * 1000;
  const firstDarkMm = (screenDistanceMm * lambdaMm) / state.slitWidth;
  const angleRatio = clamp(lambdaMm / state.slitWidth, -1, 1);

  return {
    firstDarkMm,
    centralWidthMm: firstDarkMm * 2,
    firstDarkAngle: (Math.asin(angleRatio) * 180) / Math.PI,
    visibleMinima: Math.max(1, Math.floor(diffractionScreen.physicalHalfMm / Math.max(firstDarkMm, 0.001))),
    color: lightColor(state.wavelength)
  };
}

function intensityAt(yMm: number, state: DiffractionState) {
  const lambdaMm = state.wavelength * 1e-6;
  const screenDistanceMm = state.screenDistance * 1000;
  const beta = (Math.PI * state.slitWidth * yMm) / (lambdaMm * screenDistanceMm);
  if (Math.abs(beta) < 0.0001) return 1;
  const sinc = Math.sin(beta) / beta;
  return clamp(sinc * sinc, 0, 1);
}

function yMmToPx(yMm: number) {
  return centerY + (yMm / diffractionScreen.physicalHalfMm) * (diffractionScreen.height / 2);
}

function pxToYMm(y: number) {
  return ((y - centerY) / (diffractionScreen.height / 2)) * diffractionScreen.physicalHalfMm;
}

function diffractionRows(state: DiffractionState) {
  return Array.from({ length: 126 }, (_, index) => {
    const y = diffractionScreen.y + (index / 125) * diffractionScreen.height;
    return {
      y,
      intensity: intensityAt(pxToYMm(y), state)
    };
  });
}

function diffractionFieldRows(state: DiffractionState) {
  return Array.from({ length: 86 }, (_, index) => {
    const y = 62 + (index / 85) * 288;
    return {
      y,
      intensity: intensityAt(pxToYMm(y), state)
    };
  });
}

function minimaPositions(result: DiffractionResult) {
  const positions: { order: number; yMm: number; y: number }[] = [];
  const maxOrder = Math.min(result.visibleMinima, 3);
  for (let order = -maxOrder; order <= maxOrder; order += 1) {
    if (order === 0) continue;
    const yMm = order * result.firstDarkMm;
    if (Math.abs(yMm) <= diffractionScreen.physicalHalfMm) {
      positions.push({ order, yMm, y: yMmToPx(yMm) });
    }
  }
  return positions;
}

function slitHeightPx(slitWidth: number) {
  return 24 + ((slitWidth - 0.08) / 0.34) * 58;
}

function slitWidthFromHeightPx(height: number) {
  const width = 0.08 + ((clamp(height, 24, 82) - 24) / 58) * 0.34;
  return Math.round(width * 100) / 100;
}

function diffractionScreenXFromDistance(distance: number) {
  const ratio =
    (clamp(distance, diffractionScreenTrack.minDistance, diffractionScreenTrack.maxDistance) - diffractionScreenTrack.minDistance) /
    (diffractionScreenTrack.maxDistance - diffractionScreenTrack.minDistance);
  return diffractionScreenTrack.minX + ratio * (diffractionScreenTrack.maxX - diffractionScreenTrack.minX);
}

function diffractionScreenDistanceFromX(x: number) {
  const ratio = (clamp(x, diffractionScreenTrack.minX, diffractionScreenTrack.maxX) - diffractionScreenTrack.minX) / (diffractionScreenTrack.maxX - diffractionScreenTrack.minX);
  const distance = diffractionScreenTrack.minDistance + ratio * (diffractionScreenTrack.maxDistance - diffractionScreenTrack.minDistance);
  return Math.round(distance * 100) / 100;
}

export function DiffractionChapter() {
  const [state, setState] = useState<DiffractionState>(defaultDiffractionState);
  const result = useMemo(() => calculateDiffraction(state), [state]);

  function updateState(patch: Partial<DiffractionState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  return (
    <>
      <main className="simulator diffraction-layout">
        <section className="stage-panel diffraction-stage" aria-label="单缝衍射仿真画布">
          <div className="stage-toolbar">
            <div>
              <p className="micro-label">Experiment 04-03</p>
              <h1>光的衍射：单缝条纹与中央亮纹</h1>
            </div>
            <div className="stage-meta">
              <span>Single Slit</span>
              <span>Wave Diffraction</span>
              <div className="status-pill">中央宽度 {result.centralWidthMm.toFixed(1)} mm</div>
            </div>
          </div>

          <DiffractionCanvas state={state} result={result} onStateChange={updateState} />
          <DiffractionReadouts state={state} result={result} />
        </section>

        <DiffractionDock state={state} result={result} onStateChange={updateState} />
      </main>

      <DiffractionLearning state={state} result={result} />
      <DiffractionApplications />
    </>
  );
}

function DiffractionCanvas({
  state,
  result,
  onStateChange
}: {
  state: DiffractionState;
  result: DiffractionResult;
  onStateChange: (patch: Partial<DiffractionState>) => void;
}) {
  const [draggingScreen, setDraggingScreen] = useState(false);
  const [draggingSlit, setDraggingSlit] = useState(false);
  const rows = diffractionRows(state);
  const fieldRows = diffractionFieldRows(state);
  const minima = minimaPositions(result);
  const waveRadii = [42, 72, 102, 132, 162, 192, 222, 252, 282];
  const apertureHeight = slitHeightPx(state.slitWidth);
  const screenX = diffractionScreenXFromDistance(state.screenDistance);
  const profilePoints = rows
    .map((row, index) => {
      const x = 232 + (index / (rows.length - 1)) * 250;
      const y = 332 - row.intensity * 94;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const firstTop = yMmToPx(-result.firstDarkMm);
  const firstBottom = yMmToPx(result.firstDarkMm);

  function updateScreenDistanceFromPointer(event: ReactPointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 560;
    onStateChange({ screenDistance: diffractionScreenDistanceFromX(x - diffractionScreen.width / 2) });
  }

  function updateSlitWidthFromPointer(event: ReactPointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * 410;
    const height = Math.abs(y - centerY) * 2;
    onStateChange({ slitWidth: slitWidthFromHeightPx(height) });
  }

  return (
    <div className="diffraction-frame">
      <svg
        viewBox="0 0 560 410"
        role="img"
        aria-label="单缝衍射动态示意图"
        onPointerMove={(event) => {
          if (draggingScreen) updateScreenDistanceFromPointer(event);
          if (draggingSlit) updateSlitWidthFromPointer(event);
        }}
        onPointerUp={() => {
          setDraggingScreen(false);
          setDraggingSlit(false);
        }}
        onPointerLeave={() => {
          setDraggingScreen(false);
          setDraggingSlit(false);
        }}
      >
        <defs>
          <clipPath id="diffractionWaveClip">
            <rect x="160" y="42" width={Math.max(260, screenX - 150)} height="330" rx="8" />
          </clipPath>
          <clipPath id="diffractionFieldClip">
            <rect x="190" y="64" width={Math.max(208, screenX - 204)} height="284" rx="12" />
          </clipPath>
          <filter id="diffractionGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="diffractionScreenShine" x1="0" x2="1">
            <stop offset="0" stopColor="#141916" />
            <stop offset="0.52" stopColor="#2b342f" />
            <stop offset="1" stopColor="#111614" />
          </linearGradient>
          <linearGradient id="diffractionBenchSurface" x1="0" x2="1">
            <stop offset="0" stopColor="#edf4f0" />
            <stop offset="0.55" stopColor="#f8fbf8" />
            <stop offset="1" stopColor="#edf4f0" />
          </linearGradient>
        </defs>

        <rect className="diffraction-room" x="18" y="36" width="524" height="338" rx="12" />
        <rect className="diffraction-bench" x="42" y="66" width="478" height="284" rx="12" />
        <line className="diffraction-axis" x1="48" y1={centerY} x2="526" y2={centerY} />

        <rect className="laser-head" x="38" y={centerY - 30} width="66" height="60" rx="10" />
        <circle className="diffraction-laser-core" cx="72" cy={centerY} r="13" style={{ fill: result.color }} />
        <path className="source-beam" d={`M 104 ${centerY} L ${slitX - 14} ${centerY}`} style={{ stroke: result.color }} />

        <g className="diffraction-field" clipPath="url(#diffractionFieldClip)">
          {fieldRows.map((row, index) => (
            <rect
              x="190"
              y={row.y}
              width={Math.max(208, screenX - 204)}
              height="4.2"
              fill={lightColor(state.wavelength, 0.035 + row.intensity * 0.36)}
              key={index}
            />
          ))}
        </g>

        <g className="single-slit-assembly">
          <rect className="single-slit-barrier" x={slitX - 10} y="68" width="20" height="276" rx="7" />
          <rect
            className={`single-slit-hole is-draggable ${draggingSlit ? "is-dragging" : ""}`}
            x={slitX - 12}
            y={centerY - apertureHeight / 2}
            width="24"
            height={apertureHeight}
            rx="6"
            onPointerDown={(event) => {
              setDraggingSlit(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSlitWidthFromPointer(event);
            }}
          />
          <path className="single-slit-handle" d={`M ${slitX - 7} ${centerY - 8} H ${slitX + 7} M ${slitX - 7} ${centerY} H ${slitX + 7} M ${slitX - 7} ${centerY + 8} H ${slitX + 7}`} />
          <text x="120" y="58">单缝</text>
        </g>

        {state.showWavefront && (
          <g clipPath="url(#diffractionWaveClip)">
            {waveRadii.map((radius, index) => (
              <circle
                className="diffraction-wave-ring"
                cx={slitX}
                cy={centerY}
                r={radius}
                key={radius}
                style={{ stroke: result.color, animationDelay: `${index * -0.13}s` }}
              />
            ))}
          </g>
        )}

        <path
          className="central-diffraction-cone"
          d={`M ${slitX} ${centerY} L ${screenX} ${firstTop} M ${slitX} ${centerY} L ${screenX} ${firstBottom}`}
        />
        <g className="diffraction-formula-chip">
          <rect x="268" y="48" width="176" height="25" rx="8" />
          <text x="282" y="65">a sinθ=mλ · Δy₀≈2Lλ/a</text>
        </g>

        {state.showMinima &&
          minima.map((minimum) => (
            <g className="diffraction-minimum" key={minimum.order}>
              <line x1={screenX - 18} y1={minimum.y} x2={screenX + diffractionScreen.width + 15} y2={minimum.y} />
              <text x={screenX - 46} y={minimum.y + 4}>
                m={minimum.order}
              </text>
            </g>
          ))}

        <g
          className={`diffraction-screen-group ${draggingScreen ? "is-dragging" : ""}`}
          onPointerDown={(event) => {
            setDraggingScreen(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            updateScreenDistanceFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (draggingScreen) updateScreenDistanceFromPointer(event);
          }}
          onPointerUp={() => setDraggingScreen(false)}
        >
          <rect className="diffraction-screen-body" x={screenX} y={diffractionScreen.y} width={diffractionScreen.width} height={diffractionScreen.height} rx="8" />
          {rows.map((row, index) => (
            <rect
              x={screenX + 3}
              y={row.y}
              width={diffractionScreen.width - 6}
              height={diffractionScreen.height / rows.length + 1.2}
              fill={lightColor(state.wavelength, 0.08 + row.intensity * 0.9)}
              key={index}
            />
          ))}
          <rect className="screen-glass" x={screenX + 3} y={diffractionScreen.y + 3} width={diffractionScreen.width - 6} height={diffractionScreen.height - 6} rx="6" />
          <rect className="screen-hit-area" x={screenX - 8} y={diffractionScreen.y - 8} width={diffractionScreen.width + 16} height={diffractionScreen.height + 16} rx="12" />
          <path className="screen-drag-handle" d={`M ${screenX + 9} 86 H ${screenX + 21} M ${screenX + 9} 206 H ${screenX + 21} M ${screenX + 9} 326 H ${screenX + 21}`} />
          <text className="screen-label" x={screenX - 1} y="58">光屏</text>
        </g>

        <g className="diffraction-width-mark">
          <line x1={screenX - 36} y1={firstTop} x2={screenX - 36} y2={firstBottom} />
          <path d={`M ${screenX - 44} ${firstTop} H ${screenX - 28} M ${screenX - 44} ${firstBottom} H ${screenX - 28}`} />
          <text x={screenX - 65} y={(firstTop + firstBottom) / 2 + 4}>Δy₀</text>
        </g>

        <g className="diffraction-direct-controls">
          <text x="94" y="360">拖缝口调 a</text>
          <line x1={diffractionScreenTrack.minX + diffractionScreen.width / 2} y1="360" x2={diffractionScreenTrack.maxX + diffractionScreen.width / 2} y2="360" />
          <circle cx={screenX + diffractionScreen.width / 2} cy="360" r="5" />
          <text x="414" y="374">拖光屏调 L</text>
        </g>

        {state.viewMode === "profile" && (
          <g className="diffraction-profile-chart">
            <rect x="218" y="226" width="280" height="124" rx="10" />
            <line x1="232" y1="332" x2="482" y2="332" />
            <line x1="357" y1="332" x2="357" y2="236" />
            <polyline points={profilePoints} />
            <text x="232" y="248">I(y)</text>
            <text x="392" y="348">屏幕位置 y</text>
          </g>
        )}

        <text className="diffraction-caption" x="34" y="394">
          缝越窄，光越容易绕过障碍展开，中央亮纹越宽；这和“光总沿直线传播”的直觉不同。
        </text>
      </svg>
    </div>
  );
}

function DiffractionReadouts({ state, result }: { state: DiffractionState; result: DiffractionResult }) {
  return (
    <div className="instrument-strip diffraction-strip">
      <div className="instrument">
        <span>波长 λ</span>
        <strong>{state.wavelength.toFixed(0)} nm</strong>
      </div>
      <div className="instrument">
        <span>缝宽 a</span>
        <strong>{state.slitWidth.toFixed(2)} mm</strong>
      </div>
      <div className="instrument">
        <span>屏距 L</span>
        <strong>{state.screenDistance.toFixed(2)} m</strong>
      </div>
      <div className="instrument">
        <span>第一暗纹 y₁</span>
        <strong>{result.firstDarkMm.toFixed(2)} mm</strong>
      </div>
      <div className="instrument">
        <span>中央亮纹宽度</span>
        <strong>{result.centralWidthMm.toFixed(1)} mm</strong>
      </div>
    </div>
  );
}

function DiffractionDock({
  state,
  result,
  onStateChange
}: {
  state: DiffractionState;
  result: DiffractionResult;
  onStateChange: (patch: Partial<DiffractionState>) => void;
}) {
  return (
    <aside className="control-dock diffraction-dock" aria-label="衍射实验控制台">
      <section className="control-card">
        <div className="card-title">
          <span>01</span>
          <h2>观察模式</h2>
        </div>
        <div className="view-switch" role="group" aria-label="衍射观察模式">
          <button className={state.viewMode === "pattern" ? "is-active" : ""} type="button" onClick={() => onStateChange({ viewMode: "pattern" })}>
            屏幕条纹
          </button>
          <button className={state.viewMode === "profile" ? "is-active" : ""} type="button" onClick={() => onStateChange({ viewMode: "profile" })}>
            强度曲线
          </button>
        </div>
        <div className="diffraction-mode-card">
          <strong>单缝衍射</strong>
          <p>主屏看中央亮纹和两侧暗纹；曲线模式把屏幕亮度翻译成 I-y 强度分布，更适合解释为什么中央亮纹最宽最亮。</p>
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>02</span>
          <h2>单色光</h2>
        </div>
        <div className="wavelength-meter" style={{ background: `linear-gradient(90deg, #202522, ${result.color})` }}>
          <span>WAVELENGTH</span>
          <strong>{state.wavelength.toFixed(0)} nm</strong>
        </div>
        <label className="field">
          <span>
            波长 λ <output>{state.wavelength.toFixed(0)} nm</output>
          </span>
          <input type="range" min="400" max="700" step="1" value={state.wavelength} onChange={(event) => onStateChange({ wavelength: Number(event.target.value) })} />
        </label>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>03</span>
          <h2>几何参数</h2>
        </div>
        <label className="field">
          <span>
            缝宽 a <output>{state.slitWidth.toFixed(2)} mm</output>
          </span>
          <input type="range" min="0.08" max="0.42" step="0.01" value={state.slitWidth} onChange={(event) => onStateChange({ slitWidth: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>
            缝到屏距离 L <output>{state.screenDistance.toFixed(2)} m</output>
          </span>
          <input
            type="range"
            min="0.6"
            max="2.4"
            step="0.01"
            value={state.screenDistance}
            onChange={(event) => onStateChange({ screenDistance: Number(event.target.value) })}
          />
        </label>
        <div className="condition-row is-ok">
          <span>第一暗纹角</span>
          <strong>{result.firstDarkAngle.toFixed(3)}°</strong>
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>04</span>
          <h2>辅助标注</h2>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.showWavefront} onChange={(event) => onStateChange({ showWavefront: event.target.checked })} />
          <span>显示从缝口展开的波前</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={state.showMinima} onChange={(event) => onStateChange({ showMinima: event.target.checked })} />
          <span>标出暗纹级次</span>
        </label>
        <button className="ghost-action full-width-action" type="button" onClick={() => onStateChange(defaultDiffractionState)}>
          复位单缝实验
        </button>
      </section>
    </aside>
  );
}

function DiffractionLearning({ state, result }: { state: DiffractionState; result: DiffractionResult }) {
  return (
    <section className="learning-panel diffraction-learning" aria-label="衍射原理解释">
      <div className="notebook-title">
        <span>LAB NOTES</span>
        <strong>衍射记录</strong>
      </div>
      <article className="explain-card main-explain">
        <div className="explain-heading">
          <span className="summary-tag">波动性证据</span>
          <h2>为什么光会绕过缝口展开</h2>
        </div>
        <p>
          当缝、孔或障碍物的尺寸不再远大于光的波长时，光会明显偏离几何直线传播的图景。单缝内不同位置都可以看作新的次波源，
          屏幕上同一点收到来自整个缝宽的光后相互叠加：大多数方向部分抵消，少数方向保留下来，于是形成宽中央亮纹和两侧逐渐变弱的亮纹。
        </p>
      </article>

      <article className="explain-card formula-board">
        <div className="formula-board-heading">
          <span>FORMULA BOARD</span>
          <h2>核心公式</h2>
        </div>
        <div className="formula-grid diffraction-formula-grid">
          <FormulaItem label="暗纹条件" formula="a sinθ = mλ" value="m = ±1, ±2 ...，这些方向上单缝内各部分相消。" />
          <FormulaItem label="第一暗纹位置" formula="y₁ ≈ Lλ / a" value={`当前 y₁ = ${result.firstDarkMm.toFixed(2)} mm`} />
          <FormulaItem label="中央亮纹宽度" formula="Δy₀ ≈ 2Lλ / a" value={`当前中央亮纹约 ${result.centralWidthMm.toFixed(1)} mm`} />
          <FormulaItem label="单缝强度" formula="I = I₀(sinβ / β)²" value="β 越接近 0，中央亮纹越强；远离中心会出现明暗交替。" />
        </div>
      </article>

      <article className="explain-card">
        <h2>读图时按教材逻辑看</h2>
        <ol className="step-list">
          <li>中央方向上，来自缝内各点的光程差最小，叠加后最强，所以中央亮纹最亮也最宽。</li>
          <li>到达第一暗纹方向时，缝内上半部分和下半部分可以近似一一配对抵消，因此出现第一条暗纹。</li>
          <li>第一暗纹满足 a sinθ = λ，小角度时 y₁ ≈ Lλ / a，中央亮纹宽度约为 2y₁。</li>
          <li>拖小缝宽 a 或换成长波长 λ，衍射角变大，屏幕上的中央亮纹会明显变宽。</li>
        </ol>
      </article>

      <article className="explain-card diffraction-check-card">
        <h2>参数变化会发生什么</h2>
        <div className="diffraction-data-grid">
          <span>λ = {state.wavelength.toFixed(0)} nm</span>
          <span>a = {state.slitWidth.toFixed(2)} mm</span>
          <span>L = {state.screenDistance.toFixed(2)} m</span>
          <span>θ₁ = {result.firstDarkAngle.toFixed(3)}°</span>
          <strong>Δy₀ = {result.centralWidthMm.toFixed(1)} mm</strong>
        </div>
        <ol className="step-list compact-list">
          <li>缝宽 a 越小，中央亮纹越宽，说明绕射越明显。</li>
          <li>屏距 L 越大，同一衍射角在屏幕上对应的距离越大，条纹被拉开。</li>
          <li>红光波长较长，通常比蓝紫光更容易展开，中央亮纹也更宽。</li>
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

function DiffractionApplications() {
  return (
    <section className="applications-panel diffraction-applications" aria-label="光的衍射真实应用">
      <div className="application-title">
        <span>DIFFRACTION CASES</span>
        <h2>衍射的真实现象</h2>
        <p>衍射不只是“缝口附近的现象”。规则刻痕会把白光分到不同方向，有限口径也会把点光源扩展成光斑，这些都能用波前叠加解释。</p>
      </div>

      <article className="application-card diffraction-application-card">
        <div className="application-copy">
          <span className="application-tag">光盘彩虹</span>
          <h3>CD / DVD 表面的彩色光带</h3>
          <p>光盘表面有密集而规则的刻痕，相当于反射式光栅。相邻刻痕反射出的光相遇后发生干涉和衍射，不同波长在不同方向上满足加强条件，所以白光会被分成彩色光带。</p>
          <div className="condition-row">
            <span>光栅加强方向</span>
            <strong>d sinθ = mλ</strong>
          </div>
          <p className="application-note">看到的不是颜料颜色，而是结构把不同波长重新分配到不同观察方向；转动光盘时，入射角和观察角改变，彩色光带也会移动。</p>
        </div>
        <div className="application-visual disc-visual" aria-label="光盘衍射彩虹示意">
          <svg viewBox="0 0 520 270" role="img">
            <defs>
              <radialGradient id="discGradient" cx="50%" cy="50%" r="54%">
                <stop offset="0" stopColor="#f8fbf8" />
                <stop offset="0.38" stopColor="#d9e4df" />
                <stop offset="0.62" stopColor="#a9b9b2" />
                <stop offset="1" stopColor="#596b63" />
              </radialGradient>
              <linearGradient id="discRainbow" x1="0" x2="1">
                <stop offset="0" stopColor="#6d64ff" />
                <stop offset="0.2" stopColor="#38bdf8" />
                <stop offset="0.42" stopColor="#4ade80" />
                <stop offset="0.64" stopColor="#fde047" />
                <stop offset="0.82" stopColor="#fb923c" />
                <stop offset="1" stopColor="#ef5da8" />
              </linearGradient>
            </defs>
            <rect className="disc-bg" x="22" y="24" width="476" height="222" rx="12" />
            <circle className="disc-body" cx="212" cy="135" r="88" />
            <circle className="disc-hole" cx="212" cy="135" r="22" />
            {Array.from({ length: 9 }, (_, index) => (
              <circle className="disc-track" cx="212" cy="135" r={34 + index * 6} key={index} />
            ))}
            <path className="disc-incoming" d="M 62 74 L 174 118" />
            <path className="disc-rainbow" d="M 238 112 C 314 70, 380 62, 458 70" />
            <path className="disc-rainbow alt" d="M 246 142 C 324 160, 386 184, 460 210" />
            <text x="54" y="62">白光入射</text>
            <text x="320" y="56">不同波长沿不同方向加强</text>
            <text x="316" y="224">规则刻痕 = 反射光栅</text>
          </svg>
        </div>
      </article>

      <article className="application-card diffraction-application-card">
        <div className="application-copy">
          <span className="application-tag">分辨率极限</span>
          <h3>望远镜口径越大，细节越清楚</h3>
          <p>圆孔也会衍射，远处点光源通过镜头后不是完美点，而是带同心环的艾里斑。两个很近的点光源如果艾里斑重叠太多，就会看成一个模糊亮斑。</p>
          <div className="condition-row">
            <span>瑞利判据近似</span>
            <strong>θ ≈ 1.22λ / D</strong>
          </div>
          <p className="application-note">增大口径 D 会减小衍射角 θ，让主亮斑更窄；这就是大口径望远镜能看清更细节的物理原因之一。</p>
        </div>
        <div className="application-visual airy-visual" aria-label="圆孔衍射艾里斑示意">
          <svg viewBox="0 0 520 270" role="img">
            <defs>
              <radialGradient id="airySpot" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#fff7b8" />
                <stop offset="0.18" stopColor="#ffd957" />
                <stop offset="0.34" stopColor="#f59e0b" stopOpacity="0.46" />
                <stop offset="0.54" stopColor="#0f8f8b" stopOpacity="0.1" />
                <stop offset="1" stopColor="#0f8f8b" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect className="airy-bg" x="22" y="24" width="476" height="222" rx="12" />
            <rect className="telescope-aperture" x="76" y="70" width="46" height="130" rx="20" />
            <path className="aperture-ray top" d="M 50 92 L 76 92 L 248 135" />
            <path className="aperture-ray bottom" d="M 50 178 L 76 178 L 248 135" />
            <circle className="airy-core" cx="332" cy="135" r="48" />
            <circle className="airy-ring" cx="332" cy="135" r="70" />
            <circle className="airy-ring faint" cx="332" cy="135" r="92" />
            <text x="64" y="58">有限口径 D</text>
            <text x="266" y="58">点光源成像不是数学点</text>
            <text x="292" y="224">主亮斑越窄，分辨率越高</text>
          </svg>
        </div>
      </article>
    </section>
  );
}
