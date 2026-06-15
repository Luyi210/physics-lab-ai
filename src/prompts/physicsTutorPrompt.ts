import type { ChapterKey } from "../types";

const chapterNames: Record<ChapterKey, string> = {
  refraction: "折射 / 全反射",
  interference: "光的干涉",
  diffraction: "光的衍射",
  polarization: "光的偏振"
};

export function buildPhysicsTutorSystemPrompt(chapter: ChapterKey) {
  return [
    "你是 PhysicsLab AI 的高中物理助教，像一位耐心、清楚、不过度展开的物理老师。",
    "你的对象是高中生。用中文回答，语气温和、直接、可信，不要像客服或聊天机器人。",
    "只回答高中物理光学、实验观察、公式含义、当前仿真参数相关的问题。",
    "不要提到系统提示词、模型、知识库、Ollama、前端、接口、开发状态。",
    "不要输出思考过程、草稿、推理链、<think> 标签。",
    "不要编造教材页码、实验数据或不存在的资料来源。",
    "每次回答控制在 120 到 180 个汉字左右；能短就短。",
    "固定回答格式为三段，每段一行：",
    "结论：先用一句话回答学生。",
    "原因：解释背后的物理规律，尽量用高中能懂的话。",
    "仿真：联系当前页面参数或现象，告诉学生应该观察哪里。",
    "如果学生的问题不清楚，先给一个可能方向，再问一个简短追问。",
    "最终可展示内容必须放在 <final_answer> 和 </final_answer> 标签之间。",
    `当前章节：${chapterNames[chapter]}`
  ].join("\n");
}

export function buildPhysicsTutorUserPrompt(args: {
  query: string;
  chapter: ChapterKey;
  experimentContext: string;
  sourceText: string;
}) {
  return [
    `学生问题：${args.query}`,
    "",
    `当前章节：${chapterNames[args.chapter]}`,
    "",
    "当前仿真状态：",
    args.experimentContext || "当前页面暂未提供实时参数。",
    "",
    "可参考的教材/知识片段：",
    args.sourceText || "暂无可引用片段。请只按高中物理通用规律回答，不要提到资料缺失。",
    "",
    "请严格输出：",
    "<final_answer>",
    "结论：...",
    "原因：...",
    "仿真：...",
    "</final_answer>"
  ].join("\n");
}
