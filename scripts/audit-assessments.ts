import { readdir, readFile } from "node:fs/promises";
import { join, parse, relative } from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";

const root = process.cwd();
const assessmentsRoot = join(root, "src", "content", "assessments");
const conceptsRoot = join(root, "src", "content", "concepts");
const todoPattern = /TODO|待补|暂无说明/;

const assessmentKinds = [
  "recognition",
  "debugging",
  "completion",
  "timed-coding",
  "refactor"
] as const;

const targetTiers = ["tier1", "tier2", "tier3", "tier4"] as const;

const activeAssessmentCategories = [
  "language",
  "syntax",
  "control-flow",
  "data-structure",
  "function",
  "oop",
  "module-eng",
  "stdlib"
] as const;

type AssessmentKind = (typeof assessmentKinds)[number];
type TargetTier = (typeof targetTiers)[number];
type ActiveAssessmentCategory = (typeof activeAssessmentCategories)[number];

const expectedTierByKind: Record<AssessmentKind, TargetTier> = {
  recognition: "tier1",
  completion: "tier1",
  debugging: "tier2",
  "timed-coding": "tier2",
  refactor: "tier3"
};

export type AssessmentRecord = {
  id: string;
  label: string;
  data: Record<string, unknown>;
};

export type AssessmentAuditIssue = {
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isUsefulString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !todoPattern.test(value);
}

function issue(record: AssessmentRecord | string, field: string, problem: string, fix: string): AssessmentAuditIssue {
  const file = typeof record === "string" ? record : record.label;
  return {
    message: `${file} | field: ${field} | problem: ${problem} | fix: ${fix}`
  };
}

function isAssessmentKind(value: unknown): value is AssessmentKind {
  return typeof value === "string" && assessmentKinds.includes(value as AssessmentKind);
}

function isTargetTier(value: unknown): value is TargetTier {
  return typeof value === "string" && targetTiers.includes(value as TargetTier);
}

function isActiveAssessmentCategory(value: unknown): value is ActiveAssessmentCategory {
  return typeof value === "string" && activeAssessmentCategories.includes(value as ActiveAssessmentCategory);
}

function expectedIdPrefix(data: Record<string, unknown>) {
  if (
    isActiveAssessmentCategory(data.category) &&
    isAssessmentKind(data.kind) &&
    isTargetTier(data.targetTier)
  ) {
    return `${data.category}-${data.kind}-${data.targetTier}-`;
  }

  return null;
}

export function auditAssessmentRecord(
  record: AssessmentRecord,
  conceptIds: Set<string>
): AssessmentAuditIssue[] {
  const issues: AssessmentAuditIssue[] = [];
  const data = record.data;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    issues.push(issue(
      record,
      "id",
      "assessment file name must be kebab-case",
      "Rename the file to {category}-{kind}-{tier}-{short-slug}.yaml."
    ));
  }

  const prefix = expectedIdPrefix(data);
  if (prefix && !record.id.startsWith(prefix)) {
    issues.push(issue(
      record,
      "id",
      `id should start with "${prefix}"`,
      "Rename the file so category, kind, and targetTier are visible in the id."
    ));
  }

  if (!isUsefulString(data.title)) {
    issues.push(issue(record, "title", "missing, empty, or TODO-like title", "Write the learner-facing assessment title."));
  }

  if (!isActiveAssessmentCategory(data.category)) {
    issues.push(issue(
      record,
      "category",
      "category is not in the v1.2 active matrix categories",
      `Use one of: ${activeAssessmentCategories.join(", ")}.`
    ));
  }

  if (!isAssessmentKind(data.kind)) {
    issues.push(issue(
      record,
      "kind",
      "kind is not a supported assessment type",
      `Use one of: ${assessmentKinds.join(", ")}.`
    ));
  }

  if (!isTargetTier(data.targetTier)) {
    issues.push(issue(record, "targetTier", "targetTier must be tier1-tier4", "Use tier1, tier2, tier3, or tier4."));
  }

  if (isAssessmentKind(data.kind) && isTargetTier(data.targetTier)) {
    const expectedTier = expectedTierByKind[data.kind];
    if (data.targetTier !== expectedTier) {
      issues.push(issue(
        record,
        "targetTier",
        `${data.kind} assessments currently map to ${expectedTier}, not ${data.targetTier}`,
        `Set targetTier: ${expectedTier}, or change progress-calculator.ts and this audit rule in the same PR.`
      ));
    }
  }

  if (!isUsefulString(data.prompt)) {
    issues.push(issue(record, "prompt", "missing, empty, or TODO-like prompt", "Write the concrete task the learner sees."));
  }

  const concepts = asStringArray(data.concepts);
  if (concepts.length === 0) {
    issues.push(issue(record, "concepts", "assessment needs at least one concept id", "Reference one or more existing concept ids."));
  }

  concepts.forEach((conceptId, index) => {
    if (!conceptIds.has(conceptId)) {
      issues.push(issue(
        record,
        `concepts[${index}]`,
        `references missing concept "${conceptId}"`,
        "Use an existing src/content/concepts/*.mdx id."
      ));
    }
  });

  const rubric = asStringArray(data.rubric);
  if (rubric.length === 0) {
    issues.push(issue(record, "rubric", "assessment needs at least one rubric item", "Add concrete pass criteria for this assessment."));
  }

  const kind = data.kind;
  if (kind === "recognition") {
    const choices = asRecordArray(data.choices);
    const correctCount = choices.filter((choice) => choice.correct === true).length;

    if (choices.length < 2) {
      issues.push(issue(record, "choices", "recognition assessments need at least two choices", "Add choices with exactly one correct answer."));
    }

    if (correctCount !== 1) {
      issues.push(issue(record, "choices", "recognition assessments need exactly one correct choice", "Set correct: true on one choice only."));
    }

    choices.forEach((choice, index) => {
      if (!isUsefulString(choice.label)) {
        issues.push(issue(record, `choices[${index}].label`, "choice label is empty or TODO-like", "Write the visible answer option."));
      }
    });

    return issues;
  }

  if (kind === "timed-coding" && typeof data.timeLimit !== "number") {
    issues.push(issue(record, "timeLimit", "timed-coding assessments need a numeric time limit", "Add timeLimit in seconds, for example 600."));
  }

  if (["debugging", "completion", "timed-coding", "refactor"].includes(String(kind))) {
    if (!isUsefulString(data.starterCode)) {
      issues.push(issue(record, "starterCode", "coding assessments need starterCode", "Provide the initial code shown to the learner."));
    }

    if (!isUsefulString(data.referenceSolution)) {
      issues.push(issue(record, "referenceSolution", "coding assessments need a reference solution", "Provide a maintainable solution for review and future tests."));
    }

    const testCases = asRecordArray(data.testCases);
    if (testCases.length === 0) {
      issues.push(issue(record, "testCases", "coding assessments need at least one test case", "Add executable assertions or structured input/expected cases."));
    }

    testCases.forEach((testCase, index) => {
      if (!isUsefulString(testCase.name)) {
        issues.push(issue(record, `testCases[${index}].name`, "test case name is empty or TODO-like", "Name the behavior being checked."));
      }
    });
  }

  return issues;
}

export function auditAssessmentRecords(
  records: AssessmentRecord[],
  conceptIds: Set<string>
) {
  const errors: AssessmentAuditIssue[] = [];
  const seenIds = new Set<string>();
  const seenKinds = new Set<string>();

  for (const record of records) {
    if (seenIds.has(record.id)) {
      errors.push(issue(record, "id", "duplicate assessment id", "Keep one assessment file per id."));
    }
    seenIds.add(record.id);

    if (typeof record.data.kind === "string") {
      seenKinds.add(record.data.kind);
    }

    errors.push(...auditAssessmentRecord(record, conceptIds));
  }

  for (const kind of assessmentKinds) {
    if (!seenKinds.has(kind)) {
      errors.push(issue(
        "src/content/assessments/*.yaml",
        "kind",
        `missing seed assessment kind "${kind}"`,
        "Add at least one seed assessment for every v1.2 kind before building UI."
      ));
    }
  }

  return { errors };
}

async function readConceptIds() {
  const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file));
  return new Set(files.map((file) => parse(file).name));
}

async function readAssessmentRecords(): Promise<AssessmentRecord[]> {
  const files = (await readdir(assessmentsRoot)).filter((file) => /\.ya?ml$/.test(file)).sort();
  const records: AssessmentRecord[] = [];

  for (const file of files) {
    const path = join(assessmentsRoot, file);
    const raw = await readFile(path, "utf8");
    const parsed = YAML.parse(raw);

    records.push({
      id: parse(file).name,
      label: relative(root, path),
      data: isRecord(parsed) ? parsed : {}
    });
  }

  return records;
}

function printIssues(title: string, issues: AssessmentAuditIssue[]) {
  if (issues.length === 0) {
    return;
  }

  console.error(`${title} (${issues.length}):`);
  console.error(issues.map((item) => item.message).join("\n"));
}

async function main() {
  const conceptIds = await readConceptIds();
  const records = await readAssessmentRecords();
  const result = auditAssessmentRecords(records, conceptIds);

  printIssues("Assessment audit errors", result.errors);

  if (result.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`Assessment audit clean: ${records.length} assessments cover ${assessmentKinds.length} kinds.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
