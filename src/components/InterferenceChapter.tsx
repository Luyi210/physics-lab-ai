import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type InterferenceViewMode = "2d" | "3d";

type InterferenceState = {
  wavelength: number;
  slitSpacing: number;
  screenDistance: number;
  phase: number;
  viewMode: InterferenceViewMode;
  showWavefront: boolean;
  showGuides: boolean;
};

type InterferenceResult = {
  fringeSpacingMm: number;
  centralShiftMm: number;
  maxOrder: number;
  color: string;
  softColor: string;
};

const defaultInterferenceState: InterferenceState = {
  wavelength: 560,
  slitSpacing: 0.42,
  screenDistance: 1.35,
  phase: 0,
  viewMode: "2d",
  showWavefront: true,
  showGuides: false
};

function initialInterferenceState(): InterferenceState {
  const view = new URLSearchParams(window.location.search).get("view");
  return {
    ...defaultInterferenceState,
    viewMode: view === "3d" ? "3d" : "2d"
  };
}

const screen = {
  y: 74,
  width: 42,
  height: 260,
  physicalHalfMm: 18
};

const screenTrack = {
  minX: 430,
  maxX: 482,
  minDistance: 0.6,
  maxDistance: 2.2
};

const slitX = 168;
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

function lightHex(wavelength: number) {
  const { r, g, b } = wavelengthToRgb(wavelength);
  return (r << 16) + (g << 8) + b;
}

function calculateInterference(state: InterferenceState): InterferenceResult {
  const fringeSpacingMm = (state.screenDistance * state.wavelength) / state.slitSpacing / 1000;
  const centralShiftMm = -(state.phase / 360) * fringeSpacingMm;
  return {
    fringeSpacingMm,
    centralShiftMm,
    maxOrder: Math.max(1, Math.floor(screen.physicalHalfMm / fringeSpacingMm)),
    color: lightColor(state.wavelength),
    softColor: lightColor(state.wavelength, 0.2)
  };
}

function intensityAt(yMm: number, state: InterferenceState) {
  const phaseRad = (state.phase * Math.PI) / 180;
  const lambdaMm = state.wavelength * 1e-6;
  const argument = (Math.PI * state.slitSpacing * yMm) / (lambdaMm * state.screenDistance * 1000) + phaseRad / 2;
  const interference = Math.cos(argument) ** 2;
  const envelope = Math.exp(-Math.abs(yMm) / 30);
  return clamp(interference * envelope, 0, 1);
}

function yMmToPx(yMm: number) {
  return centerY + (yMm / screen.physicalHalfMm) * (screen.height / 2);
}

function pxToYMm(y: number) {
  return ((y - centerY) / (screen.height / 2)) * screen.physicalHalfMm;
}

function slitSeparationPx(slitSpacing: number) {
  return 44 + ((slitSpacing - 0.2) / 0.7) * 74;
}

function slitSpacingFromSeparationPx(gap: number) {
  const spacing = 0.2 + ((clamp(gap, 44, 118) - 44) / 74) * 0.7;
  return Math.round(spacing * 100) / 100;
}

function brightFringePositions(result: InterferenceResult) {
  const positions: { order: number; yMm: number; y: number }[] = [];
  for (let order = -5; order <= 5; order += 1) {
    const yMm = order * result.fringeSpacingMm + result.centralShiftMm;
    if (Math.abs(yMm) <= screen.physicalHalfMm) {
      positions.push({ order, yMm, y: yMmToPx(yMm) });
    }
  }
  return positions;
}

function fringeRows(state: InterferenceState) {
  return Array.from({ length: 112 }, (_, index) => {
    const y = screen.y + (index / 111) * screen.height;
    const yMm = pxToYMm(y);
    return {
      y,
      intensity: intensityAt(yMm, state)
    };
  });
}

function fieldRows(state: InterferenceState) {
  return Array.from({ length: 74 }, (_, index) => {
    const y = 66 + (index / 73) * 282;
    const yMm = pxToYMm(y);
    return {
      y,
      intensity: intensityAt(yMm, state)
    };
  });
}

function intensityProfilePath(state: InterferenceState) {
  return fringeRows(state)
    .map((row, index) => {
      const screenX = screenXFromDistance(state.screenDistance);
      const x = screenX + screen.width + 10 + row.intensity * 22;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${row.y.toFixed(1)}`;
    })
    .join(" ");
}

function screenXFromDistance(distance: number) {
  const ratio = (clamp(distance, screenTrack.minDistance, screenTrack.maxDistance) - screenTrack.minDistance) / (screenTrack.maxDistance - screenTrack.minDistance);
  return screenTrack.minX + ratio * (screenTrack.maxX - screenTrack.minX);
}

function screenDistanceFromX(x: number) {
  const ratio = (clamp(x, screenTrack.minX, screenTrack.maxX) - screenTrack.minX) / (screenTrack.maxX - screenTrack.minX);
  const distance = screenTrack.minDistance + ratio * (screenTrack.maxDistance - screenTrack.minDistance);
  return Math.round(distance * 100) / 100;
}

function surfaceRows(state: InterferenceState) {
  return Array.from({ length: 56 }, (_, index) => {
    const yMm = -screen.physicalHalfMm + (index / 55) * screen.physicalHalfMm * 2;
    return {
      x: 92 + index * 6,
      yMm,
      intensity: intensityAt(yMm, state)
    };
  });
}

export function InterferenceChapter() {
  const [state, setState] = useState<InterferenceState>(initialInterferenceState);
  const result = useMemo(() => calculateInterference(state), [state]);

  function updateState(patch: Partial<InterferenceState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  return (
    <>
      <main className="simulator interference-layout">
        <section className="stage-panel interference-stage" aria-label="双缝干涉仿真画布">
          <div className="stage-toolbar">
            <div>
              <p className="micro-label">Experiment 04-02</p>
              <h1>光的干涉：双缝明暗条纹</h1>
            </div>
            <div className="stage-meta">
              <span>Young Double-Slit</span>
              <span>Wave Superposition</span>
              <div className="status-pill">条纹间距 {result.fringeSpacingMm.toFixed(2)} mm</div>
            </div>
          </div>

          <InterferenceCanvas state={state} result={result} onStateChange={updateState} />
          <InterferenceReadouts state={state} result={result} />
        </section>

        <InterferenceDock state={state} result={result} onStateChange={updateState} />
      </main>

      <InterferenceLearning state={state} result={result} />
      <InterferenceApplications />
    </>
  );
}

function InterferenceCanvas({
  state,
  result,
  onStateChange
}: {
  state: InterferenceState;
  result: InterferenceResult;
  onStateChange: (patch: Partial<InterferenceState>) => void;
}) {
  const [draggingScreen, setDraggingScreen] = useState(false);
  const [draggingSlit, setDraggingSlit] = useState<"upper" | "lower" | null>(null);

  if (state.viewMode === "3d") {
    return (
      <div className="interference-frame interference-frame-3d">
        <InterferenceSurface3D state={state} result={result} />
      </div>
    );
  }

  const slitGap = slitSeparationPx(state.slitSpacing);
  const upperSlit = centerY - slitGap / 2;
  const lowerSlit = centerY + slitGap / 2;
  const screenX = screenXFromDistance(state.screenDistance);
  const fringes = brightFringePositions(result);
  const rows = fringeRows(state);
  const field = fieldRows(state);
  const waveRadii = [54, 94, 134, 174, 214, 254];
  const visibleGuides = fringes.filter((fringe) => Math.abs(fringe.order) <= 3);
  const profilePath = intensityProfilePath(state);

  function updateScreenDistanceFromPointer(event: ReactPointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 560;
    onStateChange({ screenDistance: screenDistanceFromX(x - screen.width / 2) });
  }

  function updateSlitSpacingFromPointer(event: ReactPointerEvent<SVGElement>) {
    const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as unknown as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * 410;
    const gap = Math.abs(y - centerY) * 2;
    onStateChange({ slitSpacing: slitSpacingFromSeparationPx(gap) });
  }

  return (
    <div className="interference-frame">
      <svg
        viewBox="0 0 560 410"
        role="img"
        aria-label="双缝干涉动态示意图"
        onPointerMove={(event) => {
          if (draggingScreen) updateScreenDistanceFromPointer(event);
          if (draggingSlit) updateSlitSpacingFromPointer(event);
        }}
        onPointerUp={() => {
          setDraggingScreen(false);
          setDraggingSlit(null);
        }}
        onPointerLeave={() => {
          setDraggingScreen(false);
          setDraggingSlit(null);
        }}
      >
        <defs>
          <clipPath id="waveClip">
            <rect x="190" y="56" width={Math.max(190, screenX - 198)} height="304" rx="12" />
          </clipPath>
          <clipPath id="fieldClip">
            <rect x="188" y="62" width={Math.max(198, screenX - 204)} height="288" rx="12" />
          </clipPath>
          <filter id="interferenceGlow">
            <feGaussianBlur stdDeviation="3.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="benchSurface" x1="0" x2="1">
            <stop offset="0" stopColor="#edf4f0" />
            <stop offset="0.55" stopColor="#f8fbf8" />
            <stop offset="1" stopColor="#edf4f0" />
          </linearGradient>
        </defs>

        <rect className="interference-room" x="18" y="34" width="524" height="340" rx="14" />
        <rect className="interference-bench" x="38" y="64" width="486" height="284" rx="12" />
        <line className="interference-axis" x1="50" y1={centerY} x2="526" y2={centerY} />

        <g className="interference-source">
          <rect className="laser-head" x="42" y={centerY - 34} width="74" height="68" rx="12" />
          <circle cx="78" cy={centerY} r="16" style={{ fill: result.color }} />
          <text x="54" y={centerY - 46}>单色激光</text>
        </g>
        <path className="source-beam" d={`M 116 ${centerY} L ${slitX - 18} ${centerY}`} style={{ stroke: result.color }} />

        <g className="interference-field" clipPath="url(#fieldClip)">
          {field.map((row, index) => (
            <rect
              x="190"
              y={row.y}
              width={Math.max(198, screenX - 204)}
              height="4.2"
              fill={lightColor(state.wavelength, 0.05 + row.intensity * 0.34)}
              key={index}
            />
          ))}
          <path
            className="central-field-band"
            d={`M ${slitX + 15} ${centerY} C 248 ${centerY - 8}, 338 ${centerY - 8}, ${screenX - 10} ${yMmToPx(result.centralShiftMm)}`}
            style={{ stroke: result.color }}
          />
        </g>

        <g className="slit-assembly">
          <rect className="slit-barrier" x={slitX - 10} y="78" width="20" height="256" rx="8" />
          <rect
            className={`slit-hole is-draggable ${draggingSlit === "upper" ? "is-dragging" : ""}`}
            x={slitX - 13}
            y={upperSlit - 13}
            width="26"
            height="26"
            rx="6"
            onPointerDown={(event) => {
              setDraggingSlit("upper");
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSlitSpacingFromPointer(event);
            }}
          />
          <rect
            className={`slit-hole is-draggable ${draggingSlit === "lower" ? "is-dragging" : ""}`}
            x={slitX - 13}
            y={lowerSlit - 13}
            width="26"
            height="26"
            rx="6"
            onPointerDown={(event) => {
              setDraggingSlit("lower");
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSlitSpacingFromPointer(event);
            }}
          />
          <text x="126" y="76">双缝</text>
          <text x="128" y={upperSlit + 4}>S₁</text>
          <text x="128" y={lowerSlit + 4}>S₂</text>
        </g>

        {state.showWavefront && (
          <g clipPath="url(#waveClip)">
            {waveRadii.map((radius, index) => (
              <g key={radius}>
                <circle
                  className="wave-ring"
                  cx={slitX}
                  cy={upperSlit}
                  r={radius}
                  style={{ stroke: result.color, animationDelay: `${index * -0.12}s` }}
                />
                <circle
                  className="wave-ring"
                  cx={slitX}
                  cy={lowerSlit}
                  r={radius}
                  style={{ stroke: result.color, animationDelay: `${index * -0.12}s` }}
                />
              </g>
            ))}
          </g>
        )}

        {state.showGuides &&
          visibleGuides.map((fringe) => (
            <g className="fringe-guide" key={fringe.order}>
              <line x1={slitX + 14} y1={upperSlit} x2={screenX - 2} y2={fringe.y} />
              <line x1={slitX + 14} y1={lowerSlit} x2={screenX - 2} y2={fringe.y} />
              <text x={screenX - 58} y={fringe.y - 4}>
                m={fringe.order}
              </text>
            </g>
          ))}

        <g
          className={`screen-drag-group ${draggingScreen ? "is-dragging" : ""}`}
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
          <rect className="screen-body" x={screenX} y={screen.y} width={screen.width} height={screen.height} rx="8" />
          {rows.map((row, index) => (
            <rect
              x={screenX + 4}
              y={row.y}
              width={screen.width - 8}
              height={screen.height / rows.length + 1.2}
              fill={lightColor(state.wavelength, 0.1 + row.intensity * 0.9)}
              key={index}
            />
          ))}
          <rect className="screen-glass" x={screenX + 4} y={screen.y + 4} width={screen.width - 8} height={screen.height - 8} rx="6" />
          <rect className="screen-hit-area" x={screenX - 8} y={screen.y - 8} width={screen.width + 16} height={screen.height + 16} rx="12" />
          <path className="screen-drag-handle" d={`M ${screenX + 13} 86 H ${screenX + 29} M ${screenX + 13} 206 H ${screenX + 29} M ${screenX + 13} 326 H ${screenX + 29}`} />
          <text className="screen-label" x={screenX + 5} y="60">光屏</text>
        </g>

        <path className="screen-profile" d={profilePath} />
        <text className="profile-label" x={screenX + screen.width + 12} y="60">I(y)</text>

        <g className="central-label" transform={`translate(${screenX - 54} ${yMmToPx(result.centralShiftMm) - 17})`}>
          <rect width="40" height="16" rx="8" />
          <text x="8" y="11">m = 0</text>
        </g>

        <g className="screen-distance-track">
          <line x1={screenTrack.minX + screen.width / 2} y1="358" x2={screenTrack.maxX + screen.width / 2} y2="358" />
          <circle cx={screenX + screen.width / 2} cy="358" r="5" />
          <text x="426" y="371">拖动调 L</text>
        </g>

        <g className="slit-distance-track">
          <line x1={slitX - 26} y1={upperSlit} x2={slitX - 26} y2={lowerSlit} />
          <path d={`M ${slitX - 33} ${upperSlit} H ${slitX - 19} M ${slitX - 33} ${lowerSlit} H ${slitX - 19}`} />
          <text x="82" y="360">拖 S₁/S₂ 调 d</text>
        </g>

        <g className="interference-readout-card">
          <rect x="270" y="42" width="166" height="25" rx="8" />
          <text x="284" y="59">δ=mλ · Δx=Lλ/d</text>
        </g>

        <text className="interference-caption" x="34" y="394">
          观察重点：双缝只负责产生两束相干波；真正的明暗条纹出现在右侧观察屏。
        </text>
      </svg>
    </div>
  );
}

function InterferenceSurface3D({ state, result }: { state: InterferenceState; result: InterferenceResult }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const profile = useMemo(() => surfaceRows(state), [state]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void import("three").then((THREE) => {
      if (disposed) return;

      const width = Math.max(360, container.clientWidth);
      const height = Math.max(420, container.clientHeight);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf3f8f5);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(5.8, 4.6, 7.4);
      camera.lookAt(0, 0.55, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.78);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(3, 6, 4);
      scene.add(key);

      const xSegments = 72;
      const zSegments = 28;
      const vertices: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];
      const baseColor = new THREE.Color(lightHex(state.wavelength));

      for (let zIndex = 0; zIndex <= zSegments; zIndex += 1) {
        const depth = zIndex / zSegments;
        for (let xIndex = 0; xIndex <= xSegments; xIndex += 1) {
          const xNorm = xIndex / xSegments;
          const yMm = -screen.physicalHalfMm + xNorm * screen.physicalHalfMm * 2;
          const intensity = intensityAt(yMm, state);
          const x = (xNorm - 0.5) * 7.2;
          const z = (depth - 0.5) * 4.7;
          const y = intensity * (1.2 + depth * 1.25);
          vertices.push(x, y, z);

          const color = baseColor.clone().lerp(new THREE.Color(0x202522), 0.58 - intensity * 0.42);
          colors.push(color.r, color.g, color.b);
        }
      }

      for (let zIndex = 0; zIndex < zSegments; zIndex += 1) {
        for (let xIndex = 0; xIndex < xSegments; xIndex += 1) {
          const a = zIndex * (xSegments + 1) + xIndex;
          const b = a + 1;
          const c = a + xSegments + 1;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.42,
        metalness: 0.04,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const grid = new THREE.GridHelper(8, 16, 0x9aa69f, 0xd1dbd5);
      grid.position.y = -0.04;
      scene.add(grid);

      const axisMaterial = new THREE.LineBasicMaterial({ color: 0x0a6664 });
      const axisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.6, 0.02, 2.65), new THREE.Vector3(3.6, 0.02, 2.65)]);
      scene.add(new THREE.Line(axisGeometry, axisMaterial));

      let raf = 0;
      const render = () => {
        mesh.rotation.y = Math.sin(Date.now() * 0.00025) * 0.03;
        renderer.render(scene, camera);
        raf = window.requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        window.cancelAnimationFrame(raf);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        container.innerHTML = "";
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [state]);

  return (
    <div className="interference-3d-shell">
      <div className="interference-3d-canvas" ref={mountRef} />
      <div className="interference-3d-overlay">
        <span>3D 强度曲面</span>
        <strong>亮纹 = 高峰，暗纹 = 低谷</strong>
        <p>这不是光线轨迹，而是观察屏上光强 I(y) 的三维可视化。</p>
      </div>
      <div className="interference-3d-profile" aria-label="屏幕强度剖面">
        {profile.map((point, index) => (
          <span
            key={index}
            style={{
              left: `${(index / (profile.length - 1)) * 100}%`,
              height: `${12 + point.intensity * 86}%`,
              background: lightColor(state.wavelength, 0.24 + point.intensity * 0.72)
            }}
          />
        ))}
      </div>
      <div className="interference-3d-readout">
        <span>Δx = {result.fringeSpacingMm.toFixed(2)} mm</span>
        <span>中央峰位移 = {result.centralShiftMm.toFixed(2)} mm</span>
      </div>
    </div>
  );
}

function InterferenceReadouts({ state, result }: { state: InterferenceState; result: InterferenceResult }) {
  return (
    <div className="instrument-strip interference-strip">
      <div className="instrument">
        <span>波长 λ</span>
        <strong>{state.wavelength.toFixed(0)} nm</strong>
      </div>
      <div className="instrument">
        <span>缝距 d</span>
        <strong>{state.slitSpacing.toFixed(2)} mm</strong>
      </div>
      <div className="instrument">
        <span>屏距 L</span>
        <strong>{state.screenDistance.toFixed(2)} m</strong>
      </div>
      <div className="instrument">
        <span>条纹间距 Δx</span>
        <strong>{result.fringeSpacingMm.toFixed(2)} mm</strong>
      </div>
      <div className="instrument">
        <span>可见亮纹级数</span>
        <strong>±{result.maxOrder}</strong>
      </div>
    </div>
  );
}

function InterferenceDock({
  state,
  result,
  onStateChange
}: {
  state: InterferenceState;
  result: InterferenceResult;
  onStateChange: (patch: Partial<InterferenceState>) => void;
}) {
  return (
    <aside className="control-dock interference-dock" aria-label="干涉实验控制台">
      <section className="control-card">
        <div className="card-title">
          <span>01</span>
          <h2>实验场景</h2>
        </div>
        <div className="view-switch" role="group" aria-label="干涉观察模式">
          <button className={state.viewMode === "2d" ? "is-active" : ""} type="button" onClick={() => onStateChange({ viewMode: "2d" })}>
            2D 波场
          </button>
          <button className={state.viewMode === "3d" ? "is-active" : ""} type="button" onClick={() => onStateChange({ viewMode: "3d" })}>
            3D 强度
          </button>
        </div>
        <div className="interference-mode-card">
          <strong>杨氏双缝干涉</strong>
          <p>2D 视图看波前叠加和屏幕条纹，3D 视图看屏幕上光强分布的峰谷。默认不显示所有光路，避免干扰观察。</p>
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
        <label className="field">
          <span>
            初相位差 Δφ <output>{state.phase.toFixed(0)}°</output>
          </span>
          <input type="range" min="-180" max="180" step="5" value={state.phase} onChange={(event) => onStateChange({ phase: Number(event.target.value) })} />
        </label>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>03</span>
          <h2>几何参数</h2>
        </div>
        <label className="field">
          <span>
            双缝间距 d <output>{state.slitSpacing.toFixed(2)} mm</output>
          </span>
          <input type="range" min="0.2" max="0.9" step="0.01" value={state.slitSpacing} onChange={(event) => onStateChange({ slitSpacing: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>
            缝到屏距离 L <output>{state.screenDistance.toFixed(2)} m</output>
          </span>
          <input
            type="range"
            min="0.6"
            max="2.2"
            step="0.01"
            value={state.screenDistance}
            onChange={(event) => onStateChange({ screenDistance: Number(event.target.value) })}
          />
        </label>
        <div className="condition-row is-ok">
          <span>当前条纹间距</span>
          <strong>{result.fringeSpacingMm.toFixed(2)} mm</strong>
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>04</span>
          <h2>观察工具</h2>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.showWavefront} onChange={(event) => onStateChange({ showWavefront: event.target.checked })} />
          <span>显示两列圆波前</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={state.showGuides} onChange={(event) => onStateChange({ showGuides: event.target.checked })} />
          <span>显示少量亮纹参考线</span>
        </label>
        <button className="ghost-action full-width-action" type="button" onClick={() => onStateChange(defaultInterferenceState)}>
          复位双缝实验
        </button>
      </section>
    </aside>
  );
}

function InterferenceLearning({ state, result }: { state: InterferenceState; result: InterferenceResult }) {
  return (
    <section className="learning-panel interference-learning" aria-label="干涉原理解释">
      <div className="notebook-title">
        <span>LAB NOTES</span>
        <strong>干涉记录</strong>
      </div>
      <article className="explain-card main-explain">
        <div className="explain-heading">
          <span className="summary-tag">相干叠加</span>
          <h2>为什么会出现明暗条纹</h2>
        </div>
        <p>
          干涉不是两束光简单交叉，而是两束相干光在同一点重新叠加。普通独立光源的相位关系会快速变化，很难形成稳定条纹；
          双缝实验把同一束单色光分成 S₁、S₂ 两束，相当于获得频率相同、相位差恒定、振动方向相同的相干光源。
          屏上每一点同时收到两束光：同相到达时加强成亮纹，反相到达时削弱成暗纹。
        </p>
      </article>

      <article className="explain-card formula-board">
        <div className="formula-board-heading">
          <span>FORMULA BOARD</span>
          <h2>核心公式</h2>
        </div>
        <div className="formula-grid interference-formula-grid">
          <FormulaItem label="相干条件" formula="f 相同，Δφ 恒定" value="双缝把同一束光分成两束，所以能产生稳定明暗条纹。" />
          <FormulaItem label="光程差" formula="δ = d sinθ" value="屏幕上不同位置对应不同 θ，两束光到达该点的路程差不同。" />
          <FormulaItem label="亮纹条件" formula="δ = mλ" value={`当前可见亮纹约为 m = 0, ±1 ... ±${result.maxOrder}`} />
          <FormulaItem label="暗纹条件" formula="δ = (m+1/2)λ" value="两束光近似反相叠加，屏幕亮度最低。" />
          <FormulaItem label="条纹间距" formula="Δx = Lλ / d" value={`当前 Δx = ${result.fringeSpacingMm.toFixed(2)} mm`} />
          <FormulaItem label="相位平移" formula="x₀ = -(Δφ/2π)Δx" value="改变初相位差不会改变条纹间距，只会让整组条纹上下平移。" />
        </div>
      </article>

      <article className="explain-card">
        <h2>读图时按教材逻辑看</h2>
        <ol className="step-list">
          <li>先确认 S₁、S₂ 是相干光源，否则屏幕上只能看到不稳定的亮度变化，不能形成清晰条纹。</li>
          <li>中央位置 P₀ 到 S₁、S₂ 的路程相等，光程差 δ = 0，所以中央是 m = 0 级亮纹。</li>
          <li>离开中央后，两束光到屏上同一点的路程不再相等；光程差 δ 决定这里是亮纹还是暗纹。</li>
          <li>当 δ = mλ 时出现亮纹；当 δ = (m+1/2)λ 时出现暗纹，明暗条纹交替排列。</li>
          <li>在 d 远小于屏距 L 的条件下，相邻亮纹近似等间距，满足 Δx = Lλ / d。</li>
        </ol>
      </article>

      <article className="explain-card interference-check-card">
        <h2>参数变化会发生什么</h2>
        <div className="interference-data-grid">
          <span>λ = {state.wavelength.toFixed(0)} nm</span>
          <span>d = {state.slitSpacing.toFixed(2)} mm</span>
          <span>L = {state.screenDistance.toFixed(2)} m</span>
          <span>Δφ = {state.phase.toFixed(0)}°</span>
          <strong>Δx = {result.fringeSpacingMm.toFixed(2)} mm</strong>
        </div>
        <ol className="step-list compact-list">
          <li>拖远光屏，L 变大，条纹被拉开。</li>
          <li>拖大双缝间距，d 变大，条纹会变密。</li>
          <li>换成长波长光，λ 变大，条纹间距增大；红光通常比蓝紫光更疏。</li>
          <li>改变初相位差 Δφ，整组条纹会上下平移，但相邻条纹间距不变。</li>
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

function InterferenceApplications() {
  return (
    <section className="applications-panel interference-applications" aria-label="光的干涉真实应用">
      <div className="application-title">
        <span>INTERFERENCE CASES</span>
        <h2>干涉的真实现象</h2>
        <p>双缝干涉强调“两束相干光的光程差”。在生活中，肥皂膜、油膜和镜头镀膜也会把同一束光分成两束反射光，再用光程差决定加强或削弱。</p>
      </div>

      <article className="application-card interference-application-card">
        <div className="application-copy">
          <span className="application-tag">薄膜干涉</span>
          <h3>肥皂泡和油膜为什么有彩色条纹</h3>
          <p>
            白光照到很薄的液膜时，一束光在前表面反射，另一束光进入薄膜，在后表面反射后再射出。
            两束反射光来自同一束入射光，重新相遇时仍有稳定相位关系，因此可以发生干涉。
          </p>
          <div className="condition-row">
            <span>等厚干涉要点</span>
            <strong>膜厚 t 改变 → 光程差改变</strong>
          </div>
          <p className="application-note">
            膜内往返会带来约 2nt 的光程差。某种颜色在某处被加强，这里就偏向该颜色；另一种颜色可能在同一位置被削弱。
            肥皂膜厚度连续变化，所以不同颜色的亮纹位置错开，形成彩色条纹。
          </p>
        </div>
        <div className="application-visual thin-film-visual" aria-label="薄膜干涉示意">
          <svg viewBox="0 0 520 280" role="img">
            <defs>
              <linearGradient id="filmRainbow" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#6d64ff" />
                <stop offset="0.2" stopColor="#44c7ff" />
                <stop offset="0.42" stopColor="#52d86d" />
                <stop offset="0.65" stopColor="#ffe45d" />
                <stop offset="0.82" stopColor="#ff8b3d" />
                <stop offset="1" stopColor="#e85aa3" />
              </linearGradient>
            </defs>
            <rect className="film-bg" x="22" y="24" width="476" height="232" rx="12" />
            <text className="film-zone-label" x="46" y="58">空气</text>
            <text className="film-zone-label" x="46" y="138">液膜 n</text>
            <text className="film-zone-label" x="46" y="222">基底/水面</text>
            <path className="film-layer" d="M 118 106 H 420 L 420 182 L 118 142 Z" />
            <path className="film-substrate" d="M 118 182 H 420 V 224 H 118 Z" />
            <line className="film-surface" x1="118" y1="106" x2="420" y2="106" />
            <line className="film-surface" x1="118" y1="142" x2="420" y2="182" />
            <path className="film-ray in" d="M 150 52 L 224 106" />
            <path className="film-ray reflected" d="M 224 106 L 164 62" />
            <path className="film-ray inside" d="M 224 106 L 272 162" />
            <path className="film-ray reflected second" d="M 272 162 L 326 106 L 394 58" />
            <path className="film-rainbow-band" d="M 286 232 C 328 208, 380 204, 452 218" />
            <path className="film-brace left" d="M 104 106 V 142 M 98 106 H 110 M 98 142 H 110" />
            <path className="film-brace right" d="M 438 106 V 182 M 432 106 H 444 M 432 182 H 444" />
            <text x="120" y="48">入射白光</text>
            <text x="126" y="84">前表面反射光</text>
            <text x="322" y="84">后表面反射光</text>
            <text x="84" y="132">薄</text>
            <text x="446" y="148">厚</text>
            <text x="280" y="250">不同膜厚处，相长的颜色不同</text>
          </svg>
        </div>
      </article>

      <article className="application-card interference-application-card">
        <div className="application-copy">
          <span className="application-tag">增透膜</span>
          <h3>相消干涉也能减少反光</h3>
          <p>
            镜头表面镀一层厚度合适的透明薄膜后，薄膜前后两个表面反射出来的光可以近似反相。
            这时反射光发生相消干涉，镜头表面反光变弱，更多光进入镜片。
          </p>
          <div className="condition-row">
            <span>四分之一波厚度</span>
            <strong>t ≈ λ / 4n</strong>
          </div>
          <p className="application-note">
            增透膜不是为了制造彩色条纹，而是反向利用干涉：让指定波长附近的两束反射光尽量抵消。
            真实镜头常用多层镀膜，让更宽波段的反射都被削弱。
          </p>
        </div>
        <div className="application-visual coating-visual" aria-label="增透膜相消干涉示意">
          <svg viewBox="0 0 520 280" role="img">
            <rect className="coating-bg" x="22" y="24" width="476" height="232" rx="12" />
            <text className="film-zone-label" x="50" y="58">空气</text>
            <text className="film-zone-label" x="50" y="128">增透膜</text>
            <text className="film-zone-label" x="50" y="218">玻璃镜片</text>
            <rect className="coating-layer" x="124" y="108" width="280" height="42" rx="8" />
            <rect className="glass-block" x="124" y="150" width="280" height="72" rx="9" />
            <path className="coating-ray incoming" d="M 138 54 L 216 108" />
            <path className="coating-ray reflected-a" d="M 216 108 L 154 62" />
            <path className="coating-ray inside" d="M 216 108 L 258 150" />
            <path className="coating-ray reflected-b" d="M 258 150 L 306 108 L 360 62" />
            <path className="coating-ray transmitted" d="M 258 150 L 356 216" />
            <g className="cancel-mark">
              <line x1="388" y1="60" x2="414" y2="86" />
              <line x1="414" y1="60" x2="388" y2="86" />
            </g>
            <path className="phase-wave wave-a" d="M 146 86 C 154 78, 162 78, 170 86 C 178 94, 186 94, 194 86" />
            <path className="phase-wave wave-b" d="M 334 86 C 342 94, 350 94, 358 86 C 366 78, 374 78, 382 86" />
            <text x="134" y="48">入射光</text>
            <text x="128" y="88">反射 1</text>
            <text x="316" y="88">反射 2</text>
            <text x="374" y="104">反相抵消</text>
            <text x="330" y="236">更多光进入镜片</text>
          </svg>
        </div>
      </article>
    </section>
  );
}
