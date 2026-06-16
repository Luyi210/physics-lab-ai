import type { TutorIntent } from "./types";

const opticsWords = ["光", "折射", "反射", "全反射", "干涉", "衍射", "偏振", "条纹", "折射率", "临界角", "波长", "频率", "光强", "光速", "透镜", "棱镜"];
const formulaWords = ["公式", "计算", "怎么算", "推导", "sin", "角度", "数值", "临界角", "折射角", "条纹间距", "定律"];
const simulationWords = ["当前", "这个", "页面", "仿真", "滑块", "为什么现在", "图里", "这里", "观察", "变化"];
const experimentWords = ["实验", "测量", "误差", "操作", "现象", "观察", "记录", "玻璃砖", "双缝", "单缝", "偏振片"];
const applicationWords = ["应用", "生活", "为什么会", "光纤", "内窥镜", "望远镜", "彩色", "反光", "水面", "气泡"];
const offTopicWords = ["天气", "股票", "游戏", "代码", "写论文", "历史", "英语作文", "做饭", "旅游"];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function classifyTutorIntent(query: string): TutorIntent {
  const text = query.trim().toLowerCase();
  if (!text) return "unclear";

  if (includesAny(text, offTopicWords) && !includesAny(text, opticsWords)) return "offTopic";
  if (includesAny(text, formulaWords)) return "formula";
  if (includesAny(text, simulationWords)) return "simulation";
  if (includesAny(text, experimentWords)) return "experiment";
  if (includesAny(text, applicationWords)) return "application";
  if (includesAny(text, opticsWords)) return "concept";

  return "unclear";
}

export function describeTutorIntent(intent: TutorIntent) {
  const labels: Record<TutorIntent, string> = {
    concept: "概念解释",
    simulation: "联系当前仿真",
    formula: "公式/数值理解",
    experiment: "实验观察",
    application: "生活或仪器应用",
    offTopic: "超出光学助教范围",
    unclear: "问题条件不完整"
  };

  return labels[intent];
}
