import { formatDegree, radToDeg } from "../physics/optics";
import type { OpticalResult, OpticsState } from "../types";

type ReadoutStripProps = {
  state: OpticsState;
  result: OpticalResult;
};

export function ReadoutStrip({ state, result }: ReadoutStripProps) {
  const theta2 = result.theta2 === null ? null : radToDeg(result.theta2);
  const critical = result.critical === null ? null : radToDeg(result.critical);

  return (
    <div className="instrument-strip" aria-label="实时数据" data-tir={result.tir ? "true" : "false"}>
      <div className="instrument">
        <span>入射角 θ₁</span>
        <strong>{formatDegree(state.angle)}</strong>
      </div>
      <div className="instrument">
        <span>折射角 θ₂</span>
        <strong>{result.tir ? "消失" : formatDegree(theta2)}</strong>
      </div>
      <div className="instrument">
        <span>临界角 C</span>
        <strong>{result.hasCritical ? formatDegree(critical) : "无"}</strong>
      </div>
      <div className="instrument">
        <span>反射强度</span>
        <strong>{(result.reflectance * 100).toFixed(1)}%</strong>
      </div>
      <div className="instrument">
        <span>介质中光速 v₂/c</span>
        <strong>{result.speed2.toFixed(2)}</strong>
      </div>
    </div>
  );
}
