import { tutorTestSet } from "../src/data/tutorTestSet";
import { planTutorResponse } from "../src/agent/tutorAgent";

const sampleExperimentContext = [
  "当前页面是「折射 / 全反射」。",
  "入射介质：玻璃，折射率 n1=1.50。",
  "折射介质：空气，折射率 n2=1.00。",
  "入射角：48.0°。",
  "折射角：无。",
  "临界角：41.8°。",
  "当前状态：发生全反射。",
  "反射能量占比约 100.0%，透射能量占比约 0.0%。",
  "界面结论：入射角已经超过临界角，折射光消失。"
].join("\n");

const rows = tutorTestSet.map((question) => {
  const plan = planTutorResponse({
    query: question.question,
    chapter: question.chapter,
    experimentContext: sampleExperimentContext
  });
  const answer = plan.directAnswer ?? "";
  const matchedKeywords = question.expectedKeywords.filter((keyword) => answer.toLowerCase().includes(keyword.toLowerCase()));
  const threshold = Math.ceil(question.expectedKeywords.length * 0.6);

  return {
    id: question.id,
    chapter: question.chapter,
    answerFocus: question.answerFocus,
    mode: plan.directAnswer ? "direct" : "model",
    confidence: plan.confidence,
    matchedCount: matchedKeywords.length,
    keywordCount: question.expectedKeywords.length,
    passed: Boolean(plan.directAnswer) && matchedKeywords.length >= threshold,
    missingKeywords: question.expectedKeywords.filter((keyword) => !matchedKeywords.includes(keyword))
  };
});

const passed = rows.filter((row) => row.passed).length;
const direct = rows.filter((row) => row.mode === "direct").length;
const fullHit = rows.filter((row) => row.matchedCount === row.keywordCount).length;
const failedRows = rows.filter((row) => !row.passed);

console.log(`Tutor eval: ${passed}/${rows.length} passed, ${direct}/${rows.length} direct, ${fullHit}/${rows.length} full keyword hit.`);

if (failedRows.length) {
  console.log("\nFailed cases:");
  for (const row of failedRows) {
    console.log(`- ${row.id} [${row.chapter}/${row.answerFocus}] ${row.matchedCount}/${row.keywordCount}, missing: ${row.missingKeywords.join(", ")}`);
  }
  process.exitCode = 1;
}
