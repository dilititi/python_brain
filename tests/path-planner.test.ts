import assert from "node:assert/strict";
import test from "node:test";
import {
  planLearningPath,
  scoreAssessment,
  type AssessmentAnswer,
  type ConceptPlanNode
} from "../src/lib/path-planner";

const concepts: ConceptPlanNode[] = [
  { id: "variable", prerequisites: [] },
  { id: "function", prerequisites: ["variable"] },
  { id: "closure", prerequisites: ["function"] },
  { id: "decorator", prerequisites: ["closure"] },
  { id: "flask-routing", prerequisites: ["decorator"] },
  { id: "json", prerequisites: ["dict"] },
  { id: "dict", prerequisites: ["variable"] }
];

test("planLearningPath topologically orders a path while preserving path rank", () => {
  const plan = planLearningPath({
    concepts,
    targetNodes: ["decorator", "dict", "function"]
  });

  assert.deepEqual(plan.nodes, ["variable", "function", "closure", "decorator", "dict"]);
  assert.deepEqual(plan.skipped, []);
  assert.deepEqual(plan.missing, []);
});

test("planLearningPath treats known concepts as satisfied prerequisites", () => {
  const plan = planLearningPath({
    concepts,
    targetNodes: ["flask-routing", "json"],
    knownConcepts: ["function", "dict"]
  });

  assert.deepEqual(plan.nodes, ["closure", "decorator", "flask-routing", "json"]);
  assert.deepEqual(plan.skipped, []);
});

test("planLearningPath reports missing ids without polluting the sequence", () => {
  const plan = planLearningPath({
    concepts,
    targetNodes: ["json", "missing-concept"]
  });

  assert.deepEqual(plan.nodes, ["variable", "dict", "json"]);
  assert.deepEqual(plan.missing, ["missing-concept"]);
});

test("scoreAssessment keeps low-confidence learners on the beginner path", () => {
  const answers: AssessmentAnswer[] = [
    { questionId: "for-range", confidence: 1, knownConcepts: [] },
    { questionId: "data-goal", confidence: 2, track: "data" },
    { questionId: "function", confidence: 0, knownConcepts: [] }
  ];

  assert.deepEqual(scoreAssessment(answers), {
    track: "beginner",
    startAfter: [],
    reason: "测评显示基础概念还没有形成稳定连接，先走零基础入门方向更稳。"
  });
});

test("scoreAssessment uses the voted track after enough concept confidence", () => {
  const answers: AssessmentAnswer[] = [
    { questionId: "for-range", confidence: 3, knownConcepts: ["for-loop", "range"] },
    { questionId: "data-goal", confidence: 2, track: "data" },
    { questionId: "function", confidence: 2, knownConcepts: ["function", "variable"] }
  ];

  assert.deepEqual(scoreAssessment(answers), {
    track: "data",
    startAfter: ["for-loop", "range", "function", "variable"],
    reason: "你已经能识别若干核心概念，可以从数据分析方向进入。"
  });
});
