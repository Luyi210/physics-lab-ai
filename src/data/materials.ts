import type { ChapterTab, Material, PresetKey } from "../types";

export const materials = {
  air: {
    key: "air",
    name: "空气",
    n: 1,
    tint: "#d9f2ff",
    description: "近似真空，折射率约为 1"
  },
  water: {
    key: "water",
    name: "水",
    n: 1.33,
    tint: "#78d8da",
    description: "常见透明液体，临界角约 48.8°"
  },
  glass: {
    key: "glass",
    name: "玻璃",
    n: 1.5,
    tint: "#b6e4c8",
    description: "常见光学材料，临界角约 41.8°"
  },
  diamond: {
    key: "diamond",
    name: "金刚石",
    n: 2.42,
    tint: "#f1d77a",
    description: "高折射率材料，临界角约 24.4°"
  },
  custom: {
    key: "custom",
    name: "自定义",
    n: 1,
    tint: "#cfcac0",
    description: "用于探索不同折射率组合"
  }
} satisfies Record<string, Material>;

export const presets: Record<PresetKey, { label: string; angle: number; medium1: keyof typeof materials; medium2: keyof typeof materials }> = {
  "air-glass": { label: "空气 → 玻璃", angle: 42, medium1: "air", medium2: "glass" },
  "water-air": { label: "水 → 空气", angle: 55, medium1: "water", medium2: "air" },
  "glass-air": { label: "玻璃 → 空气", angle: 45, medium1: "glass", medium2: "air" },
  "diamond-air": { label: "金刚石 → 空气", angle: 26, medium1: "diamond", medium2: "air" }
};

export const moduleTabs: ChapterTab[] = [
  { key: "refraction", label: "折射 / 全反射", enabled: true },
  { key: "interference", label: "干涉", enabled: true },
  { key: "diffraction", label: "衍射", enabled: true },
  { key: "polarization", label: "偏振", enabled: true }
];
