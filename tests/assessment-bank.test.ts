import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";
import test from "node:test";
import {
  ASSESSMENT_BANK_VERSION,
  assessmentQuestions,
  shuffleAssessmentOptions
} from "../src/lib/assessment-bank";

const conceptIds = new Set(
  readdirSync(join(process.cwd(), "src", "content", "concepts"))
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => parse(file).name)
);

test("assessment bank is versioned and large enough for v1.0 entry diagnosis", () => {
  assert.match(ASSESSMENT_BANK_VERSION, /^\d{4}-\d{2}-\d{2}-v\d+$/);
  assert.equal(assessmentQuestions.length, 30);
});

test("assessment question ids and option labels are unique", () => {
  const ids = new Set<string>();

  for (const question of assessmentQuestions) {
    assert.equal(ids.has(question.id), false, `${question.id} is duplicated`);
    ids.add(question.id);

    const labels = new Set(question.options.map((option) => option.label));
    assert.equal(labels.size, question.options.length, `${question.id} has duplicate option labels`);
  }
});

test("assessment options only reference existing concept ids", () => {
  for (const question of assessmentQuestions) {
    assert.ok(question.options.length >= 2, `${question.id} needs at least two options`);

    for (const option of question.options) {
      assert.ok(option.confidence >= 0 && option.confidence <= 3, `${question.id} has invalid confidence`);

      for (const conceptId of option.knownConcepts ?? []) {
        assert.equal(
          conceptIds.has(conceptId),
          true,
          `${question.id} references unknown concept ${conceptId}`
        );
      }
    }
  }
});

test("assessment options can be shuffled without mutating the bank", () => {
  const firstQuestion = assessmentQuestions[0];
  const originalLabels = firstQuestion.options.map((option) => option.label);
  const shuffled = shuffleAssessmentOptions([firstQuestion], () => 0);
  const shuffledLabels = shuffled[0].options.map((option) => option.label);

  assert.deepEqual(firstQuestion.options.map((option) => option.label), originalLabels);
  assert.deepEqual([...shuffledLabels].sort(), [...originalLabels].sort());
  assert.notDeepEqual(shuffledLabels, originalLabels);
});
