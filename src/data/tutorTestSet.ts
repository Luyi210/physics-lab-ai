import type { ChapterKey } from "../types";

export type TutorAnswerFocus = "concept" | "formula" | "simulation" | "experiment" | "application" | "scope";

export type TutorTestQuestion = {
  id: string;
  chapter: ChapterKey;
  answerFocus: TutorAnswerFocus;
  question: string;
  expectedKeywords: string[];
};

export const tutorTestSet: TutorTestQuestion[] = [
  {
    id: "refraction-basic-definition",
    chapter: "refraction",
    answerFocus: "concept",
    question: "什么是光的折射？",
    expectedKeywords: ["两种介质", "传播方向", "法线", "折射角"]
  },
  {
    id: "refraction-law-snell",
    chapter: "refraction",
    answerFocus: "formula",
    question: "折射定律到底说了什么？",
    expectedKeywords: ["同一平面", "法线两侧", "sin", "入射角", "折射角"]
  },
  {
    id: "refraction-index-speed",
    chapter: "refraction",
    answerFocus: "formula",
    question: "折射率和光速有什么关系？",
    expectedKeywords: ["n = c/v", "光速", "传播越慢", "折射率越大"]
  },
  {
    id: "refraction-air-to-glass",
    chapter: "refraction",
    answerFocus: "concept",
    question: "光从空气斜射入玻璃时为什么向法线偏折？",
    expectedKeywords: ["光疏介质", "光密介质", "速度变小", "向法线偏折"]
  },
  {
    id: "refraction-glass-to-air",
    chapter: "refraction",
    answerFocus: "concept",
    question: "光从玻璃斜射到空气时为什么远离法线？",
    expectedKeywords: ["光密介质", "光疏介质", "速度变大", "远离法线"]
  },
  {
    id: "refraction-reversibility",
    chapter: "refraction",
    answerFocus: "concept",
    question: "光路可逆是什么意思？",
    expectedKeywords: ["光路可逆", "反向传播", "原路径", "折射"]
  },
  {
    id: "refraction-measure-index",
    chapter: "refraction",
    answerFocus: "experiment",
    question: "实验里怎么测玻璃的折射率？",
    expectedKeywords: ["入射角", "折射角", "折射定律", "描点", "法线"]
  },
  {
    id: "refraction-tir-condition",
    chapter: "refraction",
    answerFocus: "concept",
    question: "为什么会发生全反射？",
    expectedKeywords: ["光密介质", "光疏介质", "临界角", "折射光消失"]
  },
  {
    id: "refraction-critical-angle",
    chapter: "refraction",
    answerFocus: "formula",
    question: "临界角怎么理解？",
    expectedKeywords: ["折射角", "90", "全反射", "sinC"]
  },
  {
    id: "refraction-critical-angle-index",
    chapter: "refraction",
    answerFocus: "formula",
    question: "为什么折射率越大全反射越容易发生？",
    expectedKeywords: ["sinC = 1/n", "折射率越大", "临界角越小", "全反射"]
  },
  {
    id: "refraction-current-tir",
    chapter: "refraction",
    answerFocus: "simulation",
    question: "当前这个仿真里有没有发生全反射？应该看哪里？",
    expectedKeywords: ["入射角", "临界角", "折射光", "消失"]
  },
  {
    id: "refraction-no-tir-air-glass",
    chapter: "refraction",
    answerFocus: "simulation",
    question: "为什么空气射入玻璃时一般不会全反射？",
    expectedKeywords: ["光疏介质", "光密介质", "条件不满足", "全反射"]
  },
  {
    id: "refraction-reflect-transmit-energy",
    chapter: "refraction",
    answerFocus: "simulation",
    question: "界面上为什么既有反射光又有折射光？",
    expectedKeywords: ["反射", "折射", "能量", "界面"]
  },
  {
    id: "refraction-bubble-bright",
    chapter: "refraction",
    answerFocus: "application",
    question: "水里的气泡为什么看起来很亮？",
    expectedKeywords: ["水", "气泡", "全反射", "反射光"]
  },
  {
    id: "refraction-prism",
    chapter: "refraction",
    answerFocus: "application",
    question: "全反射棱镜为什么能改变光路？",
    expectedKeywords: ["玻璃", "空气", "全反射", "改变方向"]
  },
  {
    id: "refraction-fiber",
    chapter: "refraction",
    answerFocus: "application",
    question: "光纤为什么能让光沿着弯曲路径传播？",
    expectedKeywords: ["内芯", "外套", "折射率", "多次全反射"]
  },
  {
    id: "interference-condition",
    chapter: "interference",
    answerFocus: "concept",
    question: "什么样的两束光才能发生稳定干涉？",
    expectedKeywords: ["频率相同", "相位差稳定", "相干光", "叠加"]
  },
  {
    id: "interference-double-slit-cause",
    chapter: "interference",
    answerFocus: "concept",
    question: "双缝干涉为什么会有明暗条纹？",
    expectedKeywords: ["路程差", "相互加强", "相互削弱", "亮条纹", "暗条纹"]
  },
  {
    id: "interference-bright-dark-condition",
    chapter: "interference",
    answerFocus: "formula",
    question: "亮条纹和暗条纹分别满足什么条件？",
    expectedKeywords: ["路程差", "kλ", "半波长", "加强", "削弱"]
  },
  {
    id: "interference-central-bright",
    chapter: "interference",
    answerFocus: "concept",
    question: "双缝干涉中央为什么通常是亮条纹？",
    expectedKeywords: ["中央", "路程差", "0", "相互加强"]
  },
  {
    id: "interference-spacing",
    chapter: "interference",
    answerFocus: "formula",
    question: "双缝干涉条纹间距和哪些量有关？",
    expectedKeywords: ["Δx", "Lλ/d", "波长", "屏距", "双缝间距"]
  },
  {
    id: "interference-wavelength-spacing",
    chapter: "interference",
    answerFocus: "simulation",
    question: "波长变大时双缝干涉条纹会怎么变？",
    expectedKeywords: ["波长变大", "条纹间距", "变大", "Δx"]
  },
  {
    id: "interference-slit-distance",
    chapter: "interference",
    answerFocus: "simulation",
    question: "双缝间距变大时条纹间距为什么变小？",
    expectedKeywords: ["双缝间距", "变大", "条纹间距", "变小", "反比"]
  },
  {
    id: "interference-screen-distance",
    chapter: "interference",
    answerFocus: "simulation",
    question: "屏幕离双缝越远，条纹间距会怎样？",
    expectedKeywords: ["屏距", "越远", "条纹间距", "变大"]
  },
  {
    id: "interference-red-blue",
    chapter: "interference",
    answerFocus: "application",
    question: "红光和蓝光谁的干涉条纹间距更大？",
    expectedKeywords: ["红光", "波长较长", "条纹间距较大"]
  },
  {
    id: "interference-thin-film-color",
    chapter: "interference",
    answerFocus: "application",
    question: "肥皂膜为什么会出现彩色条纹？",
    expectedKeywords: ["薄膜干涉", "上下表面", "反射光", "波长"]
  },
  {
    id: "interference-measure-wavelength",
    chapter: "interference",
    answerFocus: "experiment",
    question: "怎样用双缝干涉测量光的波长？",
    expectedKeywords: ["条纹间距", "双缝间距", "屏距", "λ"]
  },
  {
    id: "interference-laser-coherence",
    chapter: "interference",
    answerFocus: "application",
    question: "为什么做干涉实验常用激光？",
    expectedKeywords: ["相干性", "频率", "相位差稳定", "干涉"]
  },
  {
    id: "diffraction-basic",
    chapter: "diffraction",
    answerFocus: "concept",
    question: "什么是光的衍射？",
    expectedKeywords: ["绕过障碍物", "孔或缝", "传播方向", "波动性"]
  },
  {
    id: "diffraction-obvious-condition",
    chapter: "diffraction",
    answerFocus: "concept",
    question: "什么时候光的衍射现象比较明显？",
    expectedKeywords: ["障碍物", "孔或缝", "波长", "接近"]
  },
  {
    id: "diffraction-single-slit-central",
    chapter: "diffraction",
    answerFocus: "concept",
    question: "单缝衍射中央亮纹为什么最宽？",
    expectedKeywords: ["中央亮纹", "最宽", "两侧", "衍射"]
  },
  {
    id: "diffraction-slit-width",
    chapter: "diffraction",
    answerFocus: "simulation",
    question: "缝宽变小，单缝衍射图样会怎么变？",
    expectedKeywords: ["中央亮纹", "变宽", "亮度", "降低"]
  },
  {
    id: "diffraction-straight-line",
    chapter: "diffraction",
    answerFocus: "concept",
    question: "为什么平时又说光沿直线传播？",
    expectedKeywords: ["尺寸远大于波长", "衍射不明显", "近似"]
  },
  {
    id: "diffraction-white-light-color",
    chapter: "diffraction",
    answerFocus: "application",
    question: "白光衍射为什么会出现彩色？",
    expectedKeywords: ["白光", "不同波长", "衍射角", "彩色"]
  },
  {
    id: "diffraction-grating",
    chapter: "diffraction",
    answerFocus: "application",
    question: "衍射光栅为什么能把光分得更清楚？",
    expectedKeywords: ["多缝", "衍射", "干涉", "亮纹", "波长"]
  },
  {
    id: "diffraction-resolution",
    chapter: "diffraction",
    answerFocus: "application",
    question: "望远镜分辨率为什么会受到衍射限制？",
    expectedKeywords: ["衍射", "分辨率", "口径", "中央亮斑"]
  },
  {
    id: "diffraction-xray-crystal",
    chapter: "diffraction",
    answerFocus: "application",
    question: "X 射线为什么可以用来研究晶体结构？",
    expectedKeywords: ["X 射线", "波长", "晶体", "衍射"]
  },
  {
    id: "diffraction-vs-interference",
    chapter: "diffraction",
    answerFocus: "concept",
    question: "衍射和干涉有什么区别？",
    expectedKeywords: ["衍射", "绕过障碍", "干涉", "叠加"]
  },
  {
    id: "polarization-basic",
    chapter: "polarization",
    answerFocus: "concept",
    question: "什么是偏振光？",
    expectedKeywords: ["振动方向", "特定方向", "横波", "偏振"]
  },
  {
    id: "polarization-transverse-wave",
    chapter: "polarization",
    answerFocus: "concept",
    question: "为什么偏振现象能说明光是横波？",
    expectedKeywords: ["偏振", "横波", "振动方向", "传播方向"]
  },
  {
    id: "polarization-polarizer",
    chapter: "polarization",
    answerFocus: "concept",
    question: "偏振片的透振方向是什么意思？",
    expectedKeywords: ["透振方向", "允许通过", "振动方向", "偏振光"]
  },
  {
    id: "polarization-parallel-sheets",
    chapter: "polarization",
    answerFocus: "simulation",
    question: "两片偏振片方向平行时为什么比较亮？",
    expectedKeywords: ["透振方向", "平行", "通过", "光强"]
  },
  {
    id: "polarization-two-sheets",
    chapter: "polarization",
    answerFocus: "simulation",
    question: "两片偏振片垂直时为什么会变暗？",
    expectedKeywords: ["透振方向", "垂直", "偏振光", "不能透过"]
  },
  {
    id: "polarization-malus",
    chapter: "polarization",
    answerFocus: "formula",
    question: "马吕斯定律怎么理解？",
    expectedKeywords: ["I = I0 cos²θ", "夹角", "光强", "偏振片"]
  },
  {
    id: "polarization-rotate-analyzer",
    chapter: "polarization",
    answerFocus: "simulation",
    question: "旋转第二片偏振片时，透过光强为什么会变化？",
    expectedKeywords: ["夹角", "cos²", "透振方向", "光强"]
  },
  {
    id: "polarization-reflection",
    chapter: "polarization",
    answerFocus: "application",
    question: "偏振片为什么能减弱水面反光？",
    expectedKeywords: ["反射光", "偏振", "透振方向", "减弱"]
  },
  {
    id: "polarization-natural-vs-polarized",
    chapter: "polarization",
    answerFocus: "concept",
    question: "自然光和偏振光有什么区别？",
    expectedKeywords: ["自然光", "各个方向", "偏振光", "特定方向"]
  },
  {
    id: "polarization-sunglasses",
    chapter: "polarization",
    answerFocus: "application",
    question: "偏振太阳镜为什么能减少眩光？",
    expectedKeywords: ["反射光", "偏振", "透振方向", "眩光"]
  },
  {
    id: "general-laser-direction",
    chapter: "diffraction",
    answerFocus: "application",
    question: "激光为什么方向性好、能量比较集中？",
    expectedKeywords: ["激光", "方向性", "发散角小", "能量集中"]
  },
  {
    id: "scope-off-topic",
    chapter: "refraction",
    answerFocus: "scope",
    question: "你能不能帮我写一篇英语作文？",
    expectedKeywords: ["光学助教", "折射", "干涉", "衍射", "偏振"]
  }
];
