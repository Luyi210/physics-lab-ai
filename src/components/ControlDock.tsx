import { materials, presets } from "../data/materials";
import type { MaterialKey, OpticsState, PresetKey } from "../types";

type ControlDockProps = {
  state: OpticsState;
  activePreset: PresetKey | null;
  onPresetChange: (preset: PresetKey) => void;
  onStateChange: (patch: Partial<OpticsState>) => void;
};

const materialOptions = Object.values(materials);

export function ControlDock({ state, activePreset, onPresetChange, onStateChange }: ControlDockProps) {
  function handleMaterial(which: 1 | 2, key: MaterialKey) {
    const patch: Partial<OpticsState> = which === 1 ? { medium1: key } : { medium2: key };
    if (key !== "custom") {
      if (which === 1) patch.n1 = materials[key].n;
      if (which === 2) patch.n2 = materials[key].n;
    }
    onStateChange(patch);
  }

  function handleIndex(which: 1 | 2, value: number) {
    const matched = materialOptions.find((material) => material.key !== "custom" && Math.abs(material.n - value) < 0.005);
    if (which === 1) {
      onStateChange({ n1: value, medium1: matched?.key ?? "custom" });
    } else {
      onStateChange({ n2: value, medium2: matched?.key ?? "custom" });
    }
  }

  return (
    <aside className="control-dock" aria-label="实验控制台">
      <section className="control-card">
        <div className="card-title">
          <span>01</span>
          <h2>实验场景</h2>
        </div>
        <div className="scenario-tabs" role="group" aria-label="预设场景">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              className={`scenario-button ${activePreset === key ? "is-active" : ""}`}
              data-preset={key}
              key={key}
              type="button"
              onClick={() => onPresetChange(key as PresetKey)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>02</span>
          <h2>光源</h2>
        </div>
        <div className="angle-meter" aria-label="当前入射角">
          <span>INCIDENT ANGLE</span>
          <strong>{state.angle.toFixed(1)}°</strong>
        </div>
        <label className="field">
          <span>入射角 θ₁</span>
          <input
            type="range"
            min="0"
            max="89"
            step="0.1"
            value={state.angle}
            onChange={(event) => onStateChange({ angle: Number(event.target.value), autoSweep: false })}
          />
        </label>
        <div className="button-row">
          <button className="primary-action" type="button" aria-pressed={state.autoSweep} onClick={() => onStateChange({ autoSweep: !state.autoSweep })}>
            {state.autoSweep ? "停止扫角" : "自动扫角"}
          </button>
          <button className="ghost-action" type="button" onClick={() => onPresetChange("air-glass")}>
            复位
          </button>
        </div>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>03</span>
          <h2>介质折射率</h2>
        </div>
        <label className="field select-field">
          <span>上方介质</span>
          <select value={state.medium1} onChange={(event) => handleMaterial(1, event.target.value as MaterialKey)}>
            {materialOptions.map((material) => (
              <option value={material.key} key={material.key}>
                {material.name}
              </option>
            ))}
          </select>
          <small>{state.medium1 === "custom" ? "手动调节折射率" : materials[state.medium1].description}</small>
        </label>
        <label className="field">
          <span>
            n₁ <output>{state.n1.toFixed(2)}</output>
          </span>
          <input type="range" min="1" max="2.6" step="0.01" value={state.n1} onChange={(event) => handleIndex(1, Number(event.target.value))} />
        </label>
        <label className="field select-field">
          <span>下方介质</span>
          <select value={state.medium2} onChange={(event) => handleMaterial(2, event.target.value as MaterialKey)}>
            {materialOptions.map((material) => (
              <option value={material.key} key={material.key}>
                {material.name}
              </option>
            ))}
          </select>
          <small>{state.medium2 === "custom" ? "手动调节折射率" : materials[state.medium2].description}</small>
        </label>
        <label className="field">
          <span>
            n₂ <output>{state.n2.toFixed(2)}</output>
          </span>
          <input type="range" min="1" max="2.6" step="0.01" value={state.n2} onChange={(event) => handleIndex(2, Number(event.target.value))} />
        </label>
      </section>

      <section className="control-card">
        <div className="card-title">
          <span>04</span>
          <h2>观察工具</h2>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={state.showNormal} onChange={(event) => onStateChange({ showNormal: event.target.checked })} />
          <span>法线与临界角参考线</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={state.showWavefront} onChange={(event) => onStateChange({ showWavefront: event.target.checked })} />
          <span>波前动画</span>
        </label>
      </section>
    </aside>
  );
}
