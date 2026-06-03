import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, parse } from "node:path";
import test from "node:test";
import YAML from "yaml";
import {
  auditAssessmentRecord,
  auditAssessmentRecords,
  type AssessmentRecord
} from "../scripts/audit-assessments";

const conceptIds = new Set(
  readdirSync(join(process.cwd(), "src", "content", "concepts"))
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => parse(file).name)
);

function loadAssessmentRecords(): AssessmentRecord[] {
  const root = join(process.cwd(), "src", "content", "assessments");
  return readdirSync(root)
    .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
    .sort()
    .map((file) => {
      const path = join(root, file);
      return {
        id: parse(file).name,
        label: `src/content/assessments/${file}`,
        data: YAML.parse(readFileSync(path, "utf8"))
      };
    });
}

test("v1.2 seed assessments pass audit", () => {
  const result = auditAssessmentRecords(loadAssessmentRecords(), conceptIds);
  assert.deepEqual(result.errors, []);
});

test("assessment audit catches missing concept references", () => {
  const issues = auditAssessmentRecord({
    id: "syntax-recognition-tier1-broken",
    label: "src/content/assessments/syntax-recognition-tier1-broken.yaml",
    data: {
      title: "Broken",
      category: "syntax",
      kind: "recognition",
      targetTier: "tier1",
      concepts: ["missing-concept"],
      prompt: "Pick one.",
      choices: [
        { label: "A", value: "a", correct: true },
        { label: "B", value: "b", correct: false }
      ],
      rubric: ["Recognize the output."]
    }
  }, conceptIds);

  assert.ok(issues.some((item) => item.message.includes("missing-concept")));
});

test("recognition assessments require exactly one correct choice", () => {
  const issues = auditAssessmentRecord({
    id: "syntax-recognition-tier1-two-correct",
    label: "src/content/assessments/syntax-recognition-tier1-two-correct.yaml",
    data: {
      title: "Two correct choices",
      category: "syntax",
      kind: "recognition",
      targetTier: "tier1",
      concepts: ["f-string"],
      prompt: "Pick one.",
      choices: [
        { label: "A", value: "a", correct: true },
        { label: "B", value: "b", correct: true }
      ],
      rubric: ["Recognize the output."]
    }
  }, conceptIds);

  assert.ok(issues.some((item) => item.message.includes("exactly one correct choice")));
});

test("timed-coding assessments require timeLimit and tests", () => {
  const issues = auditAssessmentRecord({
    id: "function-timed-coding-tier2-missing-tests",
    label: "src/content/assessments/function-timed-coding-tier2-missing-tests.yaml",
    data: {
      title: "Missing tests",
      category: "function",
      kind: "timed-coding",
      targetTier: "tier2",
      concepts: ["function"],
      prompt: "Implement the function.",
      starterCode: "def run():\n    pass",
      referenceSolution: "def run():\n    return None",
      rubric: ["Pass the tests."]
    }
  }, conceptIds);

  assert.ok(issues.some((item) => item.message.includes("time limit")));
  assert.ok(issues.some((item) => item.message.includes("at least one test case")));
});
