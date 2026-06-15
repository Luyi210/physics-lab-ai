import { useMemo, useState } from "react";

function criticalAngle(nDense: number, nSparse: number) {
  return (Math.asin(Math.min(1, nSparse / nDense)) * 180) / Math.PI;
}

type FiberPoint = {
  x: number;
  y: number;
};

type MirageMode = "inferior" | "superior";

type WaterRayPoint = FiberPoint & {
  nx: number;
  ny: number;
  tx: number;
  ty: number;
  side: number;
  t: number;
};

const fiberGeometry = {
  startX: 28,
  endX: 410,
  topY: 92,
  bottomY: 168,
  midY: 130
};

const mirageGeometry = {
  width: 560,
  height: 300,
  left: 46,
  right: 504,
  top: 34,
  ground: 238,
  eyeY: 142
};

const waterStreamGeometry = {
  startX: 62,
  startY: 88,
  endX: 464,
  baseDrop: 18,
  gravityDrop: 124,
  radius: 18
};

function buildFiberRay(boundaryAngle: number) {
  const angleToAxis = Math.max(4, 90 - boundaryAngle);
  const slope = Math.tan((angleToAxis * Math.PI) / 180);
  const points: FiberPoint[] = [{ x: fiberGeometry.startX, y: fiberGeometry.midY }];
  const bounces: FiberPoint[] = [];
  let x = fiberGeometry.startX;
  let y = fiberGeometry.midY;
  let direction: -1 | 1 = -1;

  while (x < fiberGeometry.endX) {
    const targetY = direction < 0 ? fiberGeometry.topY : fiberGeometry.bottomY;
    const dxToBoundary = Math.abs(y - targetY) / slope;

    if (x + dxToBoundary >= fiberGeometry.endX) {
      const finalDx = fiberGeometry.endX - x;
      points.push({ x: fiberGeometry.endX, y: y + direction * finalDx * slope });
      break;
    }

    x += dxToBoundary;
    y = targetY;
    points.push({ x, y });
    bounces.push({ x, y });
    direction = direction === -1 ? 1 : -1;
  }

  return { points, bounces, angleToAxis };
}

function pointsToSvg(points: FiberPoint[]) {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function fiberSegments(points: FiberPoint[]) {
  return points.slice(0, -1).map((point, index) => ({
    from: point,
    to: points[index + 1]
  }));
}

function leakPath(bounce: FiberPoint | undefined, boundaryAngle: number, core: number, cladding: number) {
  if (!bounce) return "";
  const sinRefracted = Math.min(0.99, (core / cladding) * Math.sin((boundaryAngle * Math.PI) / 180));
  const refractedFromNormal = (Math.asin(sinRefracted) * 180) / Math.PI;
  const angleToAxis = Math.max(4, 90 - refractedFromNormal);
  const leakDx = 96;
  const leakDy = Math.tan((angleToAxis * Math.PI) / 180) * leakDx;
  const outward = bounce.y <= fiberGeometry.topY ? -1 : 1;
  return `M ${bounce.x.toFixed(1)} ${bounce.y.toFixed(1)} L ${(bounce.x + leakDx).toFixed(1)} ${(bounce.y + outward * leakDy).toFixed(1)}`;
}

function nAt(y: number, mode: MirageMode, strength: number) {
  const yn = Math.max(0, Math.min(1, (y - mirageGeometry.top) / (mirageGeometry.ground - mirageGeometry.top)));
  const exaggeratedDelta = 0.072 * strength;
  return mode === "inferior" ? 1 + exaggeratedDelta * (1 - yn) : 1 + exaggeratedDelta * yn;
}

function dnDy(mode: MirageMode, strength: number) {
  const sign = mode === "inferior" ? -1 : 1;
  return (sign * 0.072 * strength) / (mirageGeometry.ground - mirageGeometry.top);
}

function traceGradientRay(start: FiberPoint, angleDeg: number, mode: MirageMode, strength: number) {
  const points: FiberPoint[] = [{ ...start }];
  const ds = 4;
  let x = start.x;
  let y = start.y;
  let vx = Math.cos((angleDeg * Math.PI) / 180);
  let vy = Math.sin((angleDeg * Math.PI) / 180);

  for (let i = 0; i < 170; i += 1) {
    const n = nAt(y, mode, strength);
    const gy = dnDy(mode, strength);
    const dot = vy * gy;
    const ax = (-vx * dot) / n;
    const ay = (gy - vy * dot) / n;

    vx += ax * ds;
    vy += ay * ds;
    const len = Math.hypot(vx, vy) || 1;
    vx /= len;
    vy /= len;
    x += vx * ds;
    y += vy * ds;

    points.push({ x, y });
    if (y >= mirageGeometry.ground - 3 || y <= mirageGeometry.top + 3) break;
    if (x >= mirageGeometry.right) break;
  }

  return points;
}

function chooseRay(start: FiberPoint, targetY: number, mode: MirageMode, strength: number, minAngle: number, maxAngle: number) {
  let best = traceGradientRay(start, minAngle, mode, strength);
  let bestScore = Number.POSITIVE_INFINITY;

  for (let angle = minAngle; angle <= maxAngle; angle += 0.3) {
    const points = traceGradientRay(start, angle, mode, strength);
    const end = points[points.length - 1];
    const score = Math.abs(end.y - targetY) + Math.abs(end.x - mirageGeometry.right) * 0.05;
    if (score < bestScore) {
      bestScore = score;
      best = points;
    }
  }

  return best;
}

function svgPath(points: FiberPoint[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function linePath(from: FiberPoint, to: FiberPoint) {
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function virtualExtension(points: FiberPoint[], length = 430) {
  const end = points[points.length - 1];
  const prev = points[Math.max(0, points.length - 9)];
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    from: end,
    to: {
      x: end.x - (dx / len) * length,
      y: end.y - (dy / len) * length
    }
  };
}

function waterFrameAt(t: number, curvature: number) {
  const x = waterStreamGeometry.startX + (waterStreamGeometry.endX - waterStreamGeometry.startX) * t;
  const y = waterStreamGeometry.startY + waterStreamGeometry.baseDrop * t + waterStreamGeometry.gravityDrop * curvature * t * t;
  const dx = waterStreamGeometry.endX - waterStreamGeometry.startX;
  const dy = waterStreamGeometry.baseDrop + 2 * waterStreamGeometry.gravityDrop * curvature * t;
  const len = Math.hypot(dx, dy) || 1;
  const tx = dx / len;
  const ty = dy / len;

  return {
    x,
    y,
    tx,
    ty,
    nx: -ty,
    ny: tx
  };
}

function waterBoundaryPoints(curvature: number) {
  const upper: FiberPoint[] = [];
  const lower: FiberPoint[] = [];

  for (let i = 0; i <= 34; i += 1) {
    const frame = waterFrameAt(i / 34, curvature);
    upper.push({
      x: frame.x - frame.nx * waterStreamGeometry.radius,
      y: frame.y - frame.ny * waterStreamGeometry.radius
    });
    lower.push({
      x: frame.x + frame.nx * waterStreamGeometry.radius,
      y: frame.y + frame.ny * waterStreamGeometry.radius
    });
  }

  return { upper, lower };
}

function closedWaterStreamPath(curvature: number) {
  const { upper, lower } = waterBoundaryPoints(curvature);
  return `${svgPath(upper)} L ${lower
    .slice()
    .reverse()
    .map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" L ")} Z`;
}

function buildWaterRay(axisAngle: number, curvature: number) {
  const bounceCount = Math.max(4, Math.min(11, Math.round(3 + axisAngle / 4)));
  const amplitude = waterStreamGeometry.radius - 4;
  const points: WaterRayPoint[] = [];

  for (let i = 0; i <= bounceCount; i += 1) {
    const t = i / bounceCount;
    const frame = waterFrameAt(t, curvature);
    const side = i === 0 || i === bounceCount ? 0 : i % 2 === 1 ? -1 : 1;
    points.push({
      x: frame.x + frame.nx * amplitude * side,
      y: frame.y + frame.ny * amplitude * side,
      nx: frame.nx,
      ny: frame.ny,
      tx: frame.tx,
      ty: frame.ty,
      side,
      t
    });
  }

  return points;
}

function waterLeakPath(point: WaterRayPoint, distance = 66) {
  const side = point.side || 1;
  const end = {
    x: point.x + point.nx * side * distance + point.tx * 26,
    y: point.y + point.ny * side * distance + point.ty * 26
  };
  return linePath(point, end);
}

export function ApplicationsPanel() {
  const [fiberAngle, setFiberAngle] = useState(78);
  const [fiberCore, setFiberCore] = useState(1.5);
  const [fiberCladding, setFiberCladding] = useState(1.45);
  const fiberCritical = useMemo(() => (fiberCore > fiberCladding ? criticalAngle(fiberCore, fiberCladding) : null), [fiberCore, fiberCladding]);
  const fiberGuided = fiberCritical !== null && fiberAngle >= fiberCritical;
  const fiberPath = useMemo(() => buildFiberRay(fiberAngle), [fiberAngle]);
  const leaks = useMemo(() => fiberPath.bounces.map((bounce) => leakPath(bounce, fiberAngle, fiberCore, fiberCladding)), [fiberAngle, fiberCladding, fiberCore, fiberPath.bounces]);

  return (
    <section className="applications-panel" aria-label="全反射真实应用">
      <div className="application-title">
        <span>REAL APPLICATIONS</span>
        <h2>全反射的真实应用</h2>
        <p>这里放三个更贴近生活的场景：海市蜃楼、光导纤维和水流导光。它们分别展示连续折射率变化、固体光纤导光和液体边界导光。</p>
      </div>

      <article className="application-card mirage-card">
        <div className="application-copy mirage-copy">
          <span className="application-tag">海市蜃楼</span>
          <h3>同是大气折射，沙漠和海上的光路相反</h3>
          <p>
            海市蜃楼不是简单平面镜反射，而是空气温度分层导致折射率连续变化，光线逐渐弯曲。沙漠/公路常见“下现蜃景”，海面常见“上现蜃景”。
          </p>
          <div className="condition-row">
            <span>关键判断</span>
            <strong>光线向折射率较大的冷空气一侧弯曲</strong>
          </div>
          <p className="application-note">沙漠地面附近空气更热、折射率更小，光线向上弯；海面冷空气层折射率更大，光线向下弯。</p>
          <div className="mirage-theory-grid">
            <div>
              <span>折射率来源</span>
              <strong>n = c / v</strong>
              <p>空气越冷、密度通常越大，光速略慢，折射率 n 略大；热空气密度较小，n 略小。海市蜃楼正是由这种微小但连续的 n 差异造成。</p>
            </div>
            <div>
              <span>分层折射</span>
              <strong>n₁ sin θ₁ = n₂ sin θ₂</strong>
              <p>把大气看成很多薄层，光每穿过一层都会发生极小折射。连续累积后，直线光路就变成平滑弯曲的光路。</p>
            </div>
            <div>
              <span>弯曲方向</span>
              <strong>向折射率较大一侧弯</strong>
              <p>这是判断海市蜃楼光路的核心。哪一侧空气更冷、更密、n 更大，光线就整体向哪一侧弯曲。</p>
            </div>
            <div>
              <span>下现蜃景</span>
              <strong>热地面：下方 n 小</strong>
              <p>沙漠、公路表面把近地空气加热，光线向上弯。人眼沿入眼切线反向延长，会把虚像看成在地面下方，像远处有水面。</p>
            </div>
            <div>
              <span>上现蜃景</span>
              <strong>冷海面：下方 n 大</strong>
              <p>海面上方冷空气层折射率更大，远处船只或海岸的光线向下弯，观察者会看到被抬高、拉伸甚至倒置的虚像。</p>
            </div>
            <div>
              <span>常见误区</span>
              <strong>不是地面镜面反射</strong>
              <p>地面没有真的变成镜子。所谓“水面感”来自虚像位置和亮天空颜色，真实光路是在空气折射率梯度中连续弯曲。</p>
            </div>
          </div>
        </div>
        <div className="application-visual mirage-visual" aria-label="海市蜃楼光路示意图">
          <MirageSimulator />
        </div>
      </article>

      <article className="application-card fiber-card">
        <div className="application-copy">
          <span className="application-tag">光导纤维</span>
          <h3>让光在纤芯里连续全反射</h3>
          <p>
            光纤内芯折射率略大于外套。只要射向边界的入射角大于临界角，光就会沿锯齿形路线被“困”在纤芯中传播。
          </p>
          <div className={`condition-row ${fiberGuided ? "is-ok" : "is-warn"}`}>
            <span>当前入射角 {fiberAngle.toFixed(1)}°</span>
            <strong>{fiberGuided ? "满足全反射" : fiberCritical === null ? "折射率条件不成立" : "会漏出纤芯"}</strong>
          </div>
          <div className="fiber-controls">
            <label>
              边界入射角 φ
              <input type="range" min="68" max="86" step="0.1" value={fiberAngle} onChange={(event) => setFiberAngle(Number(event.target.value))} />
            </label>
            <label>
              纤芯 n
              <input type="range" min="1.46" max="1.58" step="0.01" value={fiberCore} onChange={(event) => setFiberCore(Number(event.target.value))} />
            </label>
            <label>
              外套 n
              <input type="range" min="1.38" max="1.49" step="0.01" value={fiberCladding} onChange={(event) => setFiberCladding(Number(event.target.value))} />
            </label>
          </div>
        </div>
        <div className="application-visual fiber-visual" aria-label="光导纤维示意图">
          <svg viewBox="0 0 440 260" role="img">
            <defs>
              <filter id="fiberGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="coreGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#f8fffb" />
                <stop offset="0.55" stopColor="#e5fffb" />
                <stop offset="1" stopColor="#f8fffb" />
              </linearGradient>
            </defs>
            <rect className="fiber-cladding-shell" x="24" y="62" width="392" height="136" rx="26" />
            <rect className="fiber-core-slab" x="24" y="92" width="392" height="76" rx="16" fill="url(#coreGradient)" />
            <line className="fiber-boundary" x1="32" y1="92" x2="408" y2="92" />
            <line className="fiber-boundary" x1="32" y1="168" x2="408" y2="168" />
            {fiberPath.bounces.slice(0, 3).map((bounce, index) => (
              <g key={`${bounce.x}-${bounce.y}-${index}`}>
                <line className="fiber-normal" x1={bounce.x} y1={bounce.y - 28} x2={bounce.x} y2={bounce.y + 28} />
                <circle className="bounce-dot" cx={bounce.x} cy={bounce.y} r="4" />
              </g>
            ))}
            {fiberGuided ? (
              <polyline className="fiber-ray is-guided" points={pointsToSvg(fiberPath.points)} filter="url(#fiberGlow)" />
            ) : (
              fiberSegments(fiberPath.points).map((segment, index) => (
                <line
                  className="fiber-ray is-leaking"
                  key={`${segment.from.x}-${segment.from.y}-${segment.to.x}-${segment.to.y}`}
                  x1={segment.from.x}
                  y1={segment.from.y}
                  x2={segment.to.x}
                  y2={segment.to.y}
                  style={{ opacity: Math.max(0.2, 1 - index * 0.18) }}
                />
              ))
            )}
            {!fiberGuided &&
              leaks.map((path, index) => (
                <path className="leak-ray" d={path} key={`${path}-${index}`} style={{ opacity: Math.max(0.26, 0.85 - index * 0.14) }} />
              ))}
            <text x="32" y="38">纤芯 n={fiberCore.toFixed(2)}</text>
            <text x="284" y="226">外套 n={fiberCladding.toFixed(2)}</text>
            <text x="32" y="226">{fiberCritical === null ? "n芯 ≤ n外套：不能形成全反射导光" : `C=${fiberCritical.toFixed(1)}°，φ=${fiberAngle.toFixed(1)}°`}</text>
            <text x="232" y="78">φ 为相对法线的入射角</text>
          </svg>
        </div>
      </article>

      <WaterStreamCard />
    </section>
  );
}

function WaterStreamCard() {
  const [axisAngle, setAxisAngle] = useState(18);
  const [curvature, setCurvature] = useState(1.05);
  const [waterIndex, setWaterIndex] = useState(1.33);
  const airIndex = 1;
  const critical = criticalAngle(waterIndex, airIndex);
  const incidence = 90 - axisAngle;
  const guided = waterIndex > airIndex && incidence >= critical;

  return (
    <article className="application-card water-card">
      <div className="application-copy water-copy">
        <span className="application-tag">水流导光</span>
        <h3>弯曲水柱也能像光纤一样“困住”激光</h3>
        <p>
          当激光从瓶口或喷嘴射入连续水流，水柱就是一个临时的透明“纤芯”，外面空气就是低折射率“包层”。光在水-空气边界多次全反射，
          于是看起来像被弯曲的水流带着走。
        </p>
        <div className={`condition-row ${guided ? "is-ok" : "is-warn"}`}>
          <span>当前边界入射角 φ={incidence.toFixed(1)}°</span>
          <strong>{guided ? "水柱可以导光" : "会明显漏光"}</strong>
        </div>
        <div className="water-theory-grid">
          <div>
            <span>形成条件</span>
            <strong>n水 &gt; n空气，且 φ ≥ C</strong>
            <p>临界角 C = arcsin(n空气 / n水)。水约为 1.33，空气约为 1.00，所以 C 约 48.8°。</p>
          </div>
          <div>
            <span>角度关系</span>
            <strong>φ = 90° - α</strong>
            <p>α 是光线与水流轴线的夹角。光越贴着水流方向走，撞到边界时相对法线的入射角越大，越容易全反射。</p>
          </div>
          <div>
            <span>为什么能拐弯</span>
            <strong>边界反复“改道”</strong>
            <p>水柱边界不断变化方向，每一次全反射都让光线方向跟着水流局部切线调整，因此能沿抛物线水流传播。</p>
          </div>
          <div>
            <span>与光纤的关系</span>
            <strong>液体版光导纤维</strong>
            <p>光纤用玻璃纤芯和低折射率外套导光；水流导光用水柱和空气导光，原理一致，但稳定性更差。</p>
          </div>
        </div>
      </div>
      <div className="application-visual water-visual" aria-label="水流导光仿真">
        <WaterStreamSimulator
          axisAngle={axisAngle}
          curvature={curvature}
          critical={critical}
          guided={guided}
          incidence={incidence}
          waterIndex={waterIndex}
          onAxisAngleChange={setAxisAngle}
          onCurvatureChange={setCurvature}
          onWaterIndexChange={setWaterIndex}
        />
      </div>
    </article>
  );
}

type WaterStreamSimulatorProps = {
  axisAngle: number;
  curvature: number;
  critical: number;
  guided: boolean;
  incidence: number;
  waterIndex: number;
  onAxisAngleChange: (value: number) => void;
  onCurvatureChange: (value: number) => void;
  onWaterIndexChange: (value: number) => void;
};

function WaterStreamSimulator({
  axisAngle,
  curvature,
  critical,
  guided,
  incidence,
  waterIndex,
  onAxisAngleChange,
  onCurvatureChange,
  onWaterIndexChange
}: WaterStreamSimulatorProps) {
  const waterShape = useMemo(() => closedWaterStreamPath(curvature), [curvature]);
  const waterEdges = useMemo(() => waterBoundaryPoints(curvature), [curvature]);
  const waterRay = useMemo(() => buildWaterRay(axisAngle, curvature), [axisAngle, curvature]);
  const leakCandidates = waterRay.filter((point) => point.side !== 0).slice(0, 5);
  const firstBounce = leakCandidates[0];

  return (
    <div className="water-simulator">
      <div className="water-controls">
        <label>
          激光与水流轴线夹角 α
          <input type="range" min="6" max="48" step="0.5" value={axisAngle} onChange={(event) => onAxisAngleChange(Number(event.target.value))} />
        </label>
        <label>
          水流弯曲程度
          <input type="range" min="0.55" max="1.55" step="0.05" value={curvature} onChange={(event) => onCurvatureChange(Number(event.target.value))} />
        </label>
        <label>
          水折射率 n
          <input type="range" min="1.25" max="1.42" step="0.01" value={waterIndex} onChange={(event) => onWaterIndexChange(Number(event.target.value))} />
        </label>
      </div>
      <svg viewBox="0 0 520 330" role="img">
        <defs>
          <linearGradient id="waterStreamGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f7ffff" stopOpacity="0.95" />
            <stop offset="0.46" stopColor="#a7edf2" stopOpacity="0.7" />
            <stop offset="1" stopColor="#57b8c9" stopOpacity="0.56" />
          </linearGradient>
          <filter id="waterLightGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect className="water-lab-bg" x="16" y="20" width="488" height="282" rx="12" />
        <path className="water-stream-shadow" d={waterShape} />
        <path className="water-stream-body" d={waterShape} />
        <path className="water-stream-edge" d={svgPath(waterEdges.upper)} />
        <path className="water-stream-edge" d={svgPath(waterEdges.lower)} />
        <rect className="water-nozzle" x="20" y="66" width="45" height="38" rx="8" />
        <path className="laser-pointer" d="M 18 120 L 64 88" />
        <circle className="laser-source" cx="18" cy="120" r="5" />
        {guided ? (
          <polyline className="water-light is-guided" points={pointsToSvg(waterRay)} filter="url(#waterLightGlow)" />
        ) : (
          fiberSegments(waterRay).map((segment, index) => (
            <line
              className="water-light is-leaking"
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              key={`${segment.from.x}-${segment.from.y}-${index}`}
              style={{ opacity: Math.max(0.22, 1 - index * 0.12) }}
            />
          ))
        )}
        {!guided &&
          leakCandidates.map((point, index) => (
            <path className="water-leak-ray" d={waterLeakPath(point)} key={`${point.x}-${point.y}-${index}`} style={{ opacity: Math.max(0.22, 0.84 - index * 0.12) }} />
          ))}
        {firstBounce && (
          <g>
            <line
              className="water-normal"
              x1={firstBounce.x - firstBounce.nx * firstBounce.side * 24}
              y1={firstBounce.y - firstBounce.ny * firstBounce.side * 24}
              x2={firstBounce.x + firstBounce.nx * firstBounce.side * 24}
              y2={firstBounce.y + firstBounce.ny * firstBounce.side * 24}
            />
            <circle className="bounce-dot" cx={firstBounce.x} cy={firstBounce.y} r="4" />
          </g>
        )}
        <ellipse className="water-basin" cx="452" cy="270" rx="68" ry="14" />
        <text className="water-title" x="30" y="44">水柱 = 高折射率纤芯，空气 = 低折射率包层</text>
        <text x="76" y="71">水-空气边界</text>
        <text x="292" y="126">{guided ? "连续全反射：光被水流导向" : "未达到临界条件：边界处有折射漏光"}</text>
        <text x="340" y="244">φ={incidence.toFixed(1)}°，C={critical.toFixed(1)}°</text>
      </svg>
      <div className="water-readouts">
        <span>n水={waterIndex.toFixed(2)}</span>
        <span>n空气=1.00</span>
        <span>C={critical.toFixed(1)}°</span>
        <strong>{guided ? "φ 大于临界角，反射光留在水柱中。" : "φ 小于临界角，能量从水柱侧壁漏出。"}</strong>
      </div>
    </div>
  );
}

function MirageSimulator() {
  const [mode, setMode] = useState<MirageMode>("inferior");
  const [strength, setStrength] = useState(1.45);
  const object = mode === "inferior" ? { x: 58, y: 118 } : { x: 58, y: 170 };
  const rayStart = mode === "inferior" ? { x: 84, y: 210 } : { x: 92, y: 162 };
  const referenceStart = mode === "inferior" ? { x: 92, y: 154 } : { x: 92, y: 214 };
  const eye = { x: mirageGeometry.right, y: mode === "inferior" ? 148 : 128 };
  const mirageRay = useMemo(
    () => chooseRay(rayStart, eye.y, mode, strength, mode === "inferior" ? 0 : -22, mode === "inferior" ? 14 : -3),
    [mode, rayStart.x, rayStart.y, eye.y, strength]
  );
  const virtualLine = useMemo(() => virtualExtension(mirageRay), [mirageRay]);
  const nTop = nAt(mirageGeometry.top, mode, strength);
  const nBottom = nAt(mirageGeometry.ground, mode, strength);
  const modeCopy =
    mode === "inferior"
      ? {
          title: "下现蜃景：热地面上方，n 随高度增大",
          realLabel: "远处物体",
          virtualLabel: "倒立虚像",
          curveLabel: "光线连续向上弯曲"
        }
      : {
          title: "上现蜃景：冷海面上方，n 近海面更大",
          realLabel: "远处船只",
          virtualLabel: "抬高虚像",
          curveLabel: "光线连续向下弯曲"
        };

  return (
    <div className="mirage-simulator">
      <div className="mirage-controls">
        <div className="mode-switch" role="group" aria-label="海市蜃楼类型">
          <button className={mode === "inferior" ? "is-active" : ""} type="button" onClick={() => setMode("inferior")}>
            沙漠 / 公路
          </button>
          <button className={mode === "superior" ? "is-active" : ""} type="button" onClick={() => setMode("superior")}>
            海面
          </button>
        </div>
        <label>
          折射率梯度强度
          <input type="range" min="0.6" max="2.2" step="0.05" value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
        </label>
      </div>
      <svg viewBox="0 0 560 300" role="img">
        <defs>
          <linearGradient id="mirageAir" x1="0" x2="0" y1="0" y2="1">
            {mode === "inferior" ? (
              <>
                <stop offset="0" stopColor="#dff5ff" />
                <stop offset="0.66" stopColor="#fff7dc" />
                <stop offset="1" stopColor="#ffd08a" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#ffe2b6" />
                <stop offset="0.45" stopColor="#eaf8ff" />
                <stop offset="1" stopColor="#a9dde9" />
              </>
            )}
          </linearGradient>
        </defs>
        <rect className="mirage-field" x="22" y="30" width="516" height="232" rx="10" fill="url(#mirageAir)" />
        {[0, 1, 2, 3, 4].map((layer) => (
          <line className="air-layer-line" x1="34" x2="526" y1={64 + layer * 36} y2={64 + layer * 36} key={layer} />
        ))}
        <text className="mirage-headline" x="34" y="52">{modeCopy.title}</text>
        <path className={`ground-line ${mode === "inferior" ? "desert-ground" : "sea-line"}`} d="M34 238 H526" />
        <path className="reference-ray" d={linePath(referenceStart, eye)} />
        {mode === "inferior" ? <DesertObject x={object.x} y={object.y} /> : <ShipObject x={object.x} y={object.y} />}
        <MirageGhost mode={mode} />
        <path className="mirage-ray curved" d={svgPath(mirageRay)} />
        <path className="virtual-ray" d={linePath(virtualLine.from, virtualLine.to)} />
        <circle className="ray-source-dot" cx={rayStart.x} cy={rayStart.y} r="4" />
        <circle className="observer-dot" cx={eye.x} cy={eye.y} r="6" />
        <path className="observer-body" d={`M ${eye.x} ${eye.y + 6} L ${eye.x} ${eye.y + 34} M ${eye.x - 12} ${eye.y + 20} H ${eye.x + 12}`} />
        <text className="real-label" x="38" y={mode === "inferior" ? 222 : 232}>{modeCopy.realLabel}</text>
        <text className="curve-label" x="306" y={mode === "inferior" ? 174 : 112}>{modeCopy.curveLabel}</text>
        <text className="virtual-label" x={mode === "inferior" ? 132 : 126} y={mode === "inferior" ? 262 : 74}>{modeCopy.virtualLabel}</text>
      </svg>
      <div className="mirage-readouts">
        <span>n 顶部 ≈ {nTop.toFixed(3)}</span>
        <span>n 近地/海面 ≈ {nBottom.toFixed(3)}</span>
        <strong>黄色为数值追迹光路，红虚线为入眼切线反向延长。</strong>
      </div>
    </div>
  );
}

function MirageGhost({ mode }: { mode: MirageMode }) {
  if (mode === "inferior") {
    return (
      <g className="mirage-ghost">
        <path d="M 92 246 L 108 274 L 124 246 Z" />
        <path d="M 138 246 L 151 270 L 164 246 Z" />
      </g>
    );
  }

  return (
    <g className="mirage-ghost ship-ghost">
      <path d="M 84 86 L 170 86 L 152 102 L 102 102 Z" />
      <path d="M 120 84 L 120 36 L 158 84 Z" />
    </g>
  );
}

function DesertObject({ x, y }: FiberPoint) {
  return (
    <g>
      <path className="mirage-object" d={`M ${x} ${y + 92} L ${x + 22} ${y + 35} L ${x + 44} ${y + 92} Z`} />
      <path className="mirage-object" d={`M ${x + 58} ${y + 92} L ${x + 76} ${y + 48} L ${x + 94} ${y + 92} Z`} />
    </g>
  );
}

function ShipObject({ x, y }: FiberPoint) {
  return (
    <g>
      <path className="ship-body" d={`M ${x} ${y + 44} L ${x + 84} ${y + 44} L ${x + 68} ${y + 60} L ${x + 18} ${y + 60} Z`} />
      <path className="ship-sail" d={`M ${x + 34} ${y + 42} L ${x + 34} ${y - 8} L ${x + 72} ${y + 42} Z`} />
    </g>
  );
}
