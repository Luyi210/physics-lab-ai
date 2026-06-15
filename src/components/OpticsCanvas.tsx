import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { materials } from "../data/materials";
import { calculateOptics, clamp, radToDeg } from "../physics/optics";
import type { OpticalResult, OpticsState } from "../types";

type OpticsCanvasProps = {
  state: OpticsState;
  result: OpticalResult;
  onStateChange: (patch: Partial<OpticsState>) => void;
};

type Point = { x: number; y: number };
type Geometry = { origin: Point; interfaceY: number; w: number; h: number };

export function OpticsCanvas({ state, result, onStateChange }: OpticsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const resultRef = useRef(result);
  const geometryRef = useRef<Geometry | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    resultRef.current = result;
  }, [state, result]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const context = canvasElement.getContext("2d");
    if (!context) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loop(now: number) {
      const currentState = stateRef.current;
      const currentResult = calculateOptics(currentState);
      drawScene(ctx, canvas, currentState, currentResult, now / 1000, geometryRef);
      frameRef.current = requestAnimationFrame(loop);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state.autoSweep) return;
    const start = performance.now();
    let frame = 0;

    function sweep(now: number) {
      const min = 2;
      const max = 88;
      const angle = min + ((Math.sin((now - start) / 1450) + 1) / 2) * (max - min);
      onStateChange({ angle });
      frame = requestAnimationFrame(sweep);
    }

    frame = requestAnimationFrame(sweep);
    return () => cancelAnimationFrame(frame);
  }, [state.autoSweep, onStateChange]);

  function setAngleFromPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const geometry = geometryRef.current;
    if (!canvas || !geometry) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = Math.abs(x - geometry.origin.x);
    const dy = Math.max(8, Math.abs(y - geometry.origin.y));
    if (y > geometry.origin.y + 8) return;
    onStateChange({ angle: clamp(radToDeg(Math.atan2(dx, dy)), 0, 89), autoSweep: false });
  }

  return (
    <div className="canvas-frame">
      <canvas
        ref={canvasRef}
        width={1120}
        height={720}
        aria-label="折射与全反射光路图"
        onPointerDown={(event) => {
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setAngleFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) setAngleFromPointer(event);
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerLeave={() => {
          draggingRef.current = false;
        }}
      />
      <div className="canvas-note">拖动画布中的光源方向，或使用右侧滑杆精确调节入射角</div>
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: OpticsState,
  result: OpticalResult,
  time: number,
  geometryRef: React.MutableRefObject<Geometry | null>
) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const interfaceY = h * 0.52;
  const origin = { x: w * 0.46, y: interfaceY };
  const bounds = { w, h, margin: 34 };
  geometryRef.current = { origin, interfaceY, w, h };

  ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, w, h, interfaceY, state);
  drawLabels(ctx, w, h, interfaceY, state);
  drawProtractor(ctx, origin);

  if (state.showNormal) {
    drawNormal(ctx, origin, h);
  }

  const incidentVector = { x: Math.sin(result.theta1), y: Math.cos(result.theta1) };
  const incidentStart = endpointFrom(origin, { x: -incidentVector.x, y: -incidentVector.y }, bounds);
  const reflectedEnd = endpointFrom(origin, { x: incidentVector.x, y: -incidentVector.y }, bounds);
  const reflectedAlpha = result.tir ? 0.95 : clamp(0.18 + result.reflectance * 2.3, 0.22, 0.72);

  drawRay(ctx, incidentStart, origin, "#ffd457", 0.94, 4.2, 1 / state.n1, time, state.showWavefront);
  drawRay(ctx, origin, reflectedEnd, "#f06c35", reflectedAlpha, result.tir ? 5.2 : 3.2, 1 / state.n1, time, state.showWavefront);

  if (result.tir) {
    drawTotalInternalReflection(ctx, origin, interfaceY, w, h);
  } else if (result.theta2 !== null) {
    const refractedVector = { x: Math.sin(result.theta2), y: Math.cos(result.theta2) };
    const refractedEnd = endpointFrom(origin, refractedVector, bounds);
    drawRay(ctx, origin, refractedEnd, "#2f98d6", clamp(0.34 + result.transmittance * 0.58, 0.34, 0.92), 4, 1 / state.n2, time, state.showWavefront);
  }

  drawOrigin(ctx, origin);
  drawLightSource(ctx, incidentStart);
  drawAngleArc(ctx, origin, 58, -Math.PI / 2, -Math.PI / 2 - result.theta1, "θ₁", "#8d6a00", true);
  drawAngleArc(ctx, origin, 76, -Math.PI / 2, -Math.PI / 2 + result.theta1, "θr", "#a23914", false);

  if (!result.tir && result.theta2 !== null) {
    drawAngleArc(ctx, origin, 64, Math.PI / 2, Math.PI / 2 - result.theta2, "θ₂", "#0b5e93", true);
  }

  if (state.showNormal && result.hasCritical && result.critical !== null) {
    drawCriticalLine(ctx, origin, bounds, result);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, interfaceY: number, state: OpticsState) {
  ctx.fillStyle = "#f7fbff";
  ctx.fillRect(0, 0, w, h);

  const top = ctx.createLinearGradient(0, 0, 0, interfaceY);
  top.addColorStop(0, "#ffffff");
  top.addColorStop(1, blendTint(state.medium1, state.n1, 0.42));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, interfaceY);

  const bottom = ctx.createLinearGradient(0, interfaceY, 0, h);
  bottom.addColorStop(0, blendTint(state.medium2, state.n2, 0.58));
  bottom.addColorStop(1, blendTint(state.medium2, state.n2, 0.34));
  ctx.fillStyle = bottom;
  ctx.fillRect(0, interfaceY, w, h - interfaceY);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let y = interfaceY + 34; y < h; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y + 10, w * 0.55, y - 10, w, y + 4);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#68746f";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, interfaceY);
  ctx.lineTo(w, interfaceY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.74)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, interfaceY + 3);
  ctx.lineTo(w, interfaceY + 3);
  ctx.stroke();
  ctx.restore();
}

function drawLabels(ctx: CanvasRenderingContext2D, w: number, h: number, interfaceY: number, state: OpticsState) {
  ctx.save();
  ctx.font = "700 13px Hiragino Sans GB, PingFang SC, sans-serif";
  ctx.fillStyle = "#31404f";
  ctx.fillText(`${state.medium1 === "custom" ? "自定义" : materials[state.medium1].name}  n₁=${state.n1.toFixed(2)}  v≈${(1 / state.n1).toFixed(2)}c`, 22, 34);
  ctx.fillText(`${state.medium2 === "custom" ? "自定义" : materials[state.medium2].name}  n₂=${state.n2.toFixed(2)}  v≈${(1 / state.n2).toFixed(2)}c`, 22, h - 24);
  ctx.fillStyle = "#536475";
  ctx.fillText("介质分界面", w - 104, interfaceY - 12);
  ctx.restore();
}

function drawNormal(ctx: CanvasRenderingContext2D, origin: Point, h: number) {
  ctx.save();
  ctx.strokeStyle = "#52616f";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(origin.x, 24);
  ctx.lineTo(origin.x, h - 24);
  ctx.stroke();
  ctx.fillStyle = "#52616f";
  ctx.font = "700 12px Hiragino Sans GB, PingFang SC, sans-serif";
  ctx.fillText("法线", origin.x + 9, 45);
  ctx.restore();
}

function drawProtractor(ctx: CanvasRenderingContext2D, origin: Point) {
  const radius = 132;
  ctx.save();
  ctx.strokeStyle = "rgba(46, 57, 52, 0.24)";
  ctx.fillStyle = "rgba(46, 57, 52, 0.52)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(origin.x, origin.y, radius, -Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, radius, 0, Math.PI);
  ctx.stroke();

  for (let deg = -90; deg <= 90; deg += 5) {
    const angle = -Math.PI / 2 + (deg * Math.PI) / 180;
    const major = deg % 15 === 0;
    const inner = radius - (major ? 14 : 7);
    const outer = radius;
    ctx.beginPath();
    ctx.moveTo(origin.x + Math.cos(angle) * inner, origin.y + Math.sin(angle) * inner);
    ctx.lineTo(origin.x + Math.cos(angle) * outer, origin.y + Math.sin(angle) * outer);
    ctx.stroke();

    if (major && deg !== 0) {
      const labelRadius = radius - 28;
      ctx.font = "700 10px Hiragino Sans GB, PingFang SC, sans-serif";
      ctx.fillText(String(Math.abs(deg)), origin.x + Math.cos(angle) * labelRadius - 6, origin.y + Math.sin(angle) * labelRadius + 4);
    }
  }

  for (let deg = -90; deg <= 90; deg += 5) {
    const angle = Math.PI / 2 + (deg * Math.PI) / 180;
    const major = deg % 15 === 0;
    const inner = radius - (major ? 14 : 7);
    const outer = radius;
    ctx.beginPath();
    ctx.moveTo(origin.x + Math.cos(angle) * inner, origin.y + Math.sin(angle) * inner);
    ctx.lineTo(origin.x + Math.cos(angle) * outer, origin.y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.restore();
}

function endpointFrom(origin: Point, vector: Point, bounds: { w: number; h: number; margin: number }) {
  const distances: number[] = [];
  if (vector.x > 0) distances.push((bounds.w - bounds.margin - origin.x) / vector.x);
  if (vector.x < 0) distances.push((bounds.margin - origin.x) / vector.x);
  if (vector.y > 0) distances.push((bounds.h - bounds.margin - origin.y) / vector.y);
  if (vector.y < 0) distances.push((bounds.margin - origin.y) / vector.y);
  const length = Math.min(...distances.filter((value) => value > 0)) * 0.96;
  return {
    x: origin.x + vector.x * length,
    y: origin.y + vector.y * length
  };
}

function drawRay(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
  pulseSpeed: number,
  time: number,
  showWavefront: boolean
) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.globalAlpha = Math.max(0.18, alpha * 0.32);
  ctx.lineWidth = width + 12;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.globalAlpha = Math.max(0.32, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();

  drawArrowHead(ctx, from, to, color, Math.max(0.28, alpha));

  if (!showWavefront) return;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const spacing = 58;
  const phase = (time * 86 * pulseSpeed) % spacing;

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = Math.max(0.28, alpha);
  for (let d = phase; d < length - 12; d += spacing) {
    const x = from.x + ux * d;
    const y = from.y + uy * d;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0.18, alpha * 0.55);
    ctx.beginPath();
    ctx.moveTo(x - uy * 14, y + ux * 14);
    ctx.lineTo(x + uy * 14, y - ux * 14);
    ctx.stroke();
    ctx.globalAlpha = Math.max(0.28, alpha);
  }
  ctx.restore();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, alpha: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 12;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - Math.cos(angle - 0.42) * size, to.y - Math.sin(angle - 0.42) * size);
  ctx.lineTo(to.x - Math.cos(angle + 0.42) * size, to.y - Math.sin(angle + 0.42) * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTotalInternalReflection(ctx: CanvasRenderingContext2D, origin: Point, interfaceY: number, w: number, h: number) {
  ctx.save();
  const glow = ctx.createRadialGradient(origin.x, origin.y, 6, origin.x, origin.y, Math.min(w, h) * 0.34);
  glow.addColorStop(0, "rgba(240, 108, 53, 0.34)");
  glow.addColorStop(0.36, "rgba(255, 212, 87, 0.16)");
  glow.addColorStop(1, "rgba(255, 212, 87, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, interfaceY - 140, w, 280);
  ctx.strokeStyle = "rgba(240, 108, 53, 0.72)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(origin.x - 120, interfaceY + 12);
  ctx.lineTo(origin.x + 210, interfaceY + 12);
  ctx.stroke();
  ctx.restore();
}

function drawOrigin(ctx: CanvasRenderingContext2D, origin: Point) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#31404f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLightSource(ctx: CanvasRenderingContext2D, point: Point) {
  ctx.save();
  const gradient = ctx.createRadialGradient(point.x, point.y, 2, point.x, point.y, 28);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.98)");
  gradient.addColorStop(0.28, "rgba(255, 212, 87, 0.86)");
  gradient.addColorStop(1, "rgba(255, 212, 87, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd457";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAngleArc(ctx: CanvasRenderingContext2D, origin: Point, radius: number, start: number, end: number, label: string, color: string, ccw = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, radius, start, end, ccw);
  ctx.stroke();
  const mid = ccw ? start - Math.abs(end - start) / 2 : start + Math.abs(end - start) / 2;
  const labelX = origin.x + Math.cos(mid) * (radius + 18);
  const labelY = origin.y + Math.sin(mid) * (radius + 18);
  ctx.font = "800 13px Hiragino Sans GB, PingFang SC, sans-serif";
  ctx.fillText(label, labelX - 12, labelY + 4);
  ctx.restore();
}

function drawCriticalLine(ctx: CanvasRenderingContext2D, origin: Point, bounds: { w: number; h: number; margin: number }, result: OpticalResult) {
  const critical = result.critical!;
  const criticalEnd = endpointFrom(origin, { x: Math.sin(critical), y: -Math.cos(critical) }, bounds);
  ctx.save();
  ctx.strokeStyle = result.tir ? "rgba(201, 75, 75, 0.86)" : "rgba(82, 97, 111, 0.46)";
  ctx.lineWidth = result.tir ? 3 : 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(criticalEnd.x, criticalEnd.y);
  ctx.stroke();
  ctx.fillStyle = result.tir ? "#9a2f2f" : "#52616f";
  ctx.font = "800 12px Hiragino Sans GB, PingFang SC, sans-serif";
  ctx.fillText(`C=${radToDeg(critical).toFixed(1)}°`, criticalEnd.x - 48, criticalEnd.y + 18);
  ctx.restore();
}

function blendTint(key: OpticsState["medium1"], n: number, alpha: number) {
  const base = materials[key]?.tint || materials.custom.tint;
  const tint = hexToRgb(base);
  const dense = clamp((n - 1) / 1.6, 0, 1);
  const shade = {
    r: Math.round(222 - dense * 40),
    g: Math.round(232 - dense * 28),
    b: Math.round(240 - dense * 18)
  };
  const r = Math.round(tint.r * alpha + shade.r * (1 - alpha));
  const g = Math.round(tint.g * alpha + shade.g * (1 - alpha));
  const b = Math.round(tint.b * alpha + shade.b * (1 - alpha));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}
