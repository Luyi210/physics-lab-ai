import type { ChapterKey } from "../../types";
import type { StudentMemory, StudentMemoryEntry, TutorIntent } from "../types";

const STORAGE_KEY = "physicslab.studentMemory.v1";
const MAX_RECENT_QUESTIONS = 12;
const MAX_WEAK_CONCEPTS = 8;

const conceptSignals = [
  "全反射",
  "临界角",
  "折射率",
  "折射定律",
  "干涉",
  "条纹间距",
  "薄膜干涉",
  "衍射",
  "中央亮纹",
  "偏振",
  "马吕斯定律"
];

function createEmptyMemory(): StudentMemory {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    recentQuestions: [],
    weakConcepts: [],
    preferredStyle: "concise"
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeMemory(value: unknown): StudentMemory {
  if (!value || typeof value !== "object") return createEmptyMemory();
  const memory = value as Partial<StudentMemory>;

  return {
    version: 1,
    updatedAt: typeof memory.updatedAt === "string" ? memory.updatedAt : new Date().toISOString(),
    recentQuestions: Array.isArray(memory.recentQuestions) ? memory.recentQuestions.slice(0, MAX_RECENT_QUESTIONS) : [],
    weakConcepts: Array.isArray(memory.weakConcepts) ? memory.weakConcepts.filter((item): item is string => typeof item === "string").slice(0, MAX_WEAK_CONCEPTS) : [],
    preferredStyle: "concise"
  };
}

function extractConcepts(query: string) {
  return conceptSignals.filter((concept) => query.includes(concept));
}

export function loadStudentMemory(): StudentMemory {
  if (!canUseStorage()) return createEmptyMemory();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeMemory(raw ? JSON.parse(raw) : null);
  } catch {
    return createEmptyMemory();
  }
}

export function saveStudentMemory(memory: StudentMemory) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function rememberTutorTurn(args: { question: string; chapter: ChapterKey; intent: TutorIntent }) {
  const now = new Date().toISOString();
  const current = loadStudentMemory();
  const entry: StudentMemoryEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question: args.question,
    chapter: args.chapter,
    intent: args.intent,
    createdAt: now
  };
  const nextWeakConcepts = Array.from(new Set([...extractConcepts(args.question), ...current.weakConcepts])).slice(0, MAX_WEAK_CONCEPTS);
  const nextMemory: StudentMemory = {
    ...current,
    updatedAt: now,
    recentQuestions: [entry, ...current.recentQuestions].slice(0, MAX_RECENT_QUESTIONS),
    weakConcepts: nextWeakConcepts
  };

  saveStudentMemory(nextMemory);
  return nextMemory;
}

export function buildMemoryContext(memory: StudentMemory) {
  const recent = memory.recentQuestions.slice(0, 3).map((entry) => `- ${entry.question}`).join("\n");
  const weakConcepts = memory.weakConcepts.slice(0, 5).join("、");

  return [
    weakConcepts ? `学生最近反复涉及：${weakConcepts}。回答时优先澄清这些概念。` : "暂未形成稳定薄弱概念。",
    recent ? `最近提问：\n${recent}` : "暂无最近提问。"
  ].join("\n");
}
