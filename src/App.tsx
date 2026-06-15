import { useCallback, useMemo, useState } from "react";
import { ApplicationsPanel } from "./components/ApplicationsPanel";
import { ControlDock } from "./components/ControlDock";
import { DiffractionChapter } from "./components/DiffractionChapter";
import { InterferenceChapter } from "./components/InterferenceChapter";
import { LearningPanel } from "./components/LearningPanel";
import { OpticsCanvas } from "./components/OpticsCanvas";
import { PolarizationChapter } from "./components/PolarizationChapter";
import { ReadoutStrip } from "./components/ReadoutStrip";
import { TopBar } from "./components/TopBar";
import { materials, presets } from "./data/materials";
import { calculateOptics, explainOptics } from "./physics/optics";
import type { ChapterKey, OpticsState, PresetKey } from "./types";

const initialState: OpticsState = {
  angle: presets["air-glass"].angle,
  medium1: presets["air-glass"].medium1,
  medium2: presets["air-glass"].medium2,
  n1: materials[presets["air-glass"].medium1].n,
  n2: materials[presets["air-glass"].medium2].n,
  autoSweep: false,
  showNormal: true,
  showWavefront: true
};

function initialChapter(): ChapterKey {
  const chapter = new URLSearchParams(window.location.search).get("chapter");
  const supportedChapters: ChapterKey[] = ["refraction", "interference", "diffraction", "polarization"];
  return supportedChapters.includes(chapter as ChapterKey) ? (chapter as ChapterKey) : "refraction";
}

export default function App() {
  const [activeChapter, setActiveChapter] = useState<ChapterKey>(initialChapter);
  const [state, setState] = useState<OpticsState>(initialState);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("air-glass");

  const result = useMemo(() => calculateOptics(state), [state]);
  const explanation = useMemo(() => explainOptics(state, result), [state, result]);

  const updateState = useCallback((patch: Partial<OpticsState>) => {
    setState((current) => ({ ...current, ...patch }));
    if ("angle" in patch || "n1" in patch || "n2" in patch || "medium1" in patch || "medium2" in patch) {
      setActivePreset(null);
    }
  }, []);

  const applyPreset = useCallback((presetKey: PresetKey) => {
    const preset = presets[presetKey];
    setActivePreset(presetKey);
    setState((current) => ({
      ...current,
      angle: preset.angle,
      medium1: preset.medium1,
      medium2: preset.medium2,
      n1: materials[preset.medium1].n,
      n2: materials[preset.medium2].n,
      autoSweep: false
    }));
  }, []);

  const changeChapter = useCallback((chapter: ChapterKey) => {
    setActiveChapter(chapter);
    const url = new URL(window.location.href);
    if (chapter === "refraction") {
      url.searchParams.delete("chapter");
    } else {
      url.searchParams.set("chapter", chapter);
    }
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <div className="app-shell">
      <TopBar activeChapter={activeChapter} onChapterChange={changeChapter} />

      {activeChapter === "interference" && <InterferenceChapter />}
      {activeChapter === "diffraction" && <DiffractionChapter />}
      {activeChapter === "polarization" && <PolarizationChapter />}
      {activeChapter === "refraction" && (
        <>
          <main className="simulator">
            <section className="stage-panel" aria-label="光路仿真画布">
              <div className="stage-toolbar">
                <div>
                  <p className="micro-label">Experiment 04-01</p>
                  <h1>光的折射与全反射</h1>
                </div>
                <div className="stage-meta">
                  <span>Ray Optics</span>
                  <span>Interactive Canvas</span>
                  <div className={`status-pill ${result.tir ? "is-tir" : ""}`}>{explanation.status}</div>
                </div>
              </div>

              <OpticsCanvas state={state} result={result} onStateChange={updateState} />
              <ReadoutStrip state={state} result={result} />
            </section>

            <ControlDock state={state} activePreset={activePreset} onPresetChange={applyPreset} onStateChange={updateState} />
          </main>

          <LearningPanel state={state} result={result} explanation={explanation} />
          <ApplicationsPanel />
        </>
      )}
    </div>
  );
}
