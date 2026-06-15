import { materials } from "../data/materials";
import type { MaterialKey, OpticalResult, OpticsState } from "../types";

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

export function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatDegree(value: number | null) {
  if (typeof value === "number" && Number.isFinite(value)) return `${value.toFixed(1)}°`;
  return "无";
}

export function mediumName(key: MaterialKey, n: number) {
  if (key !== "custom") return materials[key].name;
  return `自定义 n=${n.toFixed(2)}`;
}

export function calculateOptics(state: OpticsState): OpticalResult {
  const theta1 = degToRad(state.angle);
  const sinTheta2 = (state.n1 / state.n2) * Math.sin(theta1);
  const hasCritical = state.n1 > state.n2;
  const critical = hasCritical ? Math.asin(state.n2 / state.n1) : null;
  const tir = hasCritical && critical !== null && state.angle >= radToDeg(critical) - 0.0001;

  let theta2: number | null = null;
  let reflectance = 1;
  let transmittance = 0;

  if (!tir) {
    theta2 = Math.asin(clamp(sinTheta2, -1, 1));
    const cosI = Math.cos(theta1);
    const cosT = Math.cos(theta2);
    const rs = ((state.n1 * cosI - state.n2 * cosT) / (state.n1 * cosI + state.n2 * cosT)) ** 2;
    const rp = ((state.n1 * cosT - state.n2 * cosI) / (state.n1 * cosT + state.n2 * cosI)) ** 2;
    reflectance = clamp((rs + rp) / 2, 0, 1);
    transmittance = 1 - reflectance;
  }

  return {
    theta1,
    theta2,
    hasCritical,
    critical,
    tir,
    reflectance,
    transmittance,
    speed2: 1 / state.n2
  };
}

export function explainOptics(state: OpticsState, result: OpticalResult) {
  const theta2Degree = result.theta2 === null ? null : radToDeg(result.theta2);
  const criticalDegree = result.critical === null ? null : radToDeg(result.critical);
  const fromName = mediumName(state.medium1, state.n1);
  const toName = mediumName(state.medium2, state.n2);
  const left = `${state.n1.toFixed(2)} × sin${state.angle.toFixed(1)}°`;
  const right = result.tir ? "折射角不存在" : `${state.n2.toFixed(2)} × sin${theta2Degree!.toFixed(1)}°`;

  if (result.tir) {
    return {
      tag: "全反射",
      status: "全反射",
      title: "已经进入全反射区",
      summary: `光从${fromName}进入${toName}时，入射角 ${state.angle.toFixed(1)}° 已达到临界角 ${criticalDegree!.toFixed(1)}°，折射光消失，能量沿反射光返回原介质。`,
      formula: `${left} = ${right}`
    };
  }

  if (Math.abs(state.n1 - state.n2) < 0.005) {
    return {
      tag: "直线传播",
      status: "不偏折",
      title: "观察结论",
      summary: "两侧折射率几乎相同，光速变化很小，光线基本沿原方向传播。",
      formula: `${left} = ${right}`
    };
  }

  if (state.n1 < state.n2) {
    return {
      tag: "向法线偏折",
      status: "光疏入光密",
      title: "观察结论",
      summary: `光从${fromName}进入${toName}，折射率变大，速度变小，折射角 ${theta2Degree!.toFixed(1)}° 小于入射角，光线向法线偏折。`,
      formula: `${left} = ${right}`
    };
  }

  return {
    tag: "远离法线",
    status: "光密入光疏",
    title: "观察结论",
    summary: `光从${fromName}进入${toName}，折射率变小，速度变大，折射角 ${theta2Degree!.toFixed(1)}° 大于入射角，继续增大入射角会进入全反射。`,
    formula: `${left} = ${right}`
  };
}
