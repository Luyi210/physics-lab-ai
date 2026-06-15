export type MaterialKey = "air" | "water" | "glass" | "diamond" | "custom";

export type Material = {
  key: MaterialKey;
  name: string;
  n: number;
  tint: string;
  description: string;
};

export type PresetKey = "air-glass" | "water-air" | "glass-air" | "diamond-air";

export type ChapterKey = "refraction" | "interference" | "diffraction" | "polarization";

export type ChapterTab = {
  key: ChapterKey;
  label: string;
  enabled: boolean;
};

export type OpticsState = {
  angle: number;
  n1: number;
  n2: number;
  medium1: MaterialKey;
  medium2: MaterialKey;
  autoSweep: boolean;
  showNormal: boolean;
  showWavefront: boolean;
};

export type OpticalResult = {
  theta1: number;
  theta2: number | null;
  hasCritical: boolean;
  critical: number | null;
  tir: boolean;
  reflectance: number;
  transmittance: number;
  speed2: number;
};
