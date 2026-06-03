import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");
const todoPattern = /TODO|待补|暂无说明/;
const requiredCodeExampleTitles = ["naive", "standard", "production"] as const;

type AuditSeverity = "error" | "warning";

type AuditIssue = {
  severity: AuditSeverity;
  message: string;
};

type AuditOptions = {
  strictCodeExamples?: boolean;
};

type ConceptRecord = {
  label: string;
  data: Record<string, unknown>;
};

function isUsefulString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !todoPattern.test(value);
}

function issue(severity: AuditSeverity, message: string): AuditIssue {
  return { severity, message };
}

function auditCodeExamples(record: ConceptRecord, _options: AuditOptions): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const codeExamples = Array.isArray(record.data.codeExamples) ? record.data.codeExamples : [];
  const severity: AuditSeverity = "error";
  const category = record.data.category;

  const usefulExamples = codeExamples.filter((example): example is Record<string, unknown> => (
    typeof example === "object" &&
    example !== null &&
    isUsefulString((example as Record<string, unknown>).title) &&
    isUsefulString((example as Record<string, unknown>).description) &&
    isUsefulString((example as Record<string, unknown>).code)
  ));

  if (category === "language") {
    if (usefulExamples.length === 0) {
      issues.push(issue(
        severity,
        `${record.label}: codeExamples needs at least one useful display example for language concepts`
      ));
    }

    return issues;
  }

  for (const title of requiredCodeExampleTitles) {
    const example = usefulExamples.find((item) => item.title === title);

    if (!example) {
      issues.push(issue(
        severity,
        `${record.label}: codeExamples.${title} is missing, empty, or TODO-like`
      ));
    }
  }

  for (const example of codeExamples) {
    if (typeof example !== "object" || example === null) {
      issues.push(issue(severity, `${record.label}: codeExamples[] must be objects`));
      continue;
    }

    const title = (example as Record<string, unknown>).title;
    if (typeof title === "string" && !requiredCodeExampleTitles.includes(title as (typeof requiredCodeExampleTitles)[number])) {
      issues.push(issue(
        severity,
        `${record.label}: codeExamples[].title "${title}" should become naive, standard, or production`
      ));
    }
  }

  return issues;
}

export function auditConceptRecord(record: ConceptRecord, options: AuditOptions = {}): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const data = record.data;

  if ("description" in data) {
    issues.push(issue("error", `${record.label}: description is removed; use summary for concept card text`));
  }

  if (!isUsefulString(data.summary)) {
    issues.push(issue("error", `${record.label}: summary is missing, empty, or TODO-like`));
  }

  if (!isUsefulString(data.whyImportant)) {
    issues.push(issue("error", `${record.label}: whyImportant is missing, empty, or TODO-like`));
  }

  if ("expandsTo" in data) {
    issues.push(issue("error", `${record.label}: expandsTo is deprecated; use extends`));
  }

  const works = Array.isArray(data.works) ? data.works : [];
  if ("works" in data) {
    issues.push(issue("error", `${record.label}: inline works[] is removed; use worksRef[] + works-registry.yaml`));
  }

  works.forEach((work: Record<string, unknown>, index: number) => {
    if ("note" in work) {
      issues.push(issue("error", `${record.label}: works[${index}].note is deprecated; use role`));
    }

    if (!isUsefulString(work.role)) {
      issues.push(issue("error", `${record.label}: works[${index}].role is missing, empty, or TODO-like`));
    }
  });

  const worksRef = Array.isArray(data.worksRef) ? data.worksRef : [];
  worksRef.forEach((work: Record<string, unknown>, index: number) => {
    if (!isUsefulString(work.id)) {
      issues.push(issue("error", `${record.label}: worksRef[${index}].id is missing, empty, or TODO-like`));
    }

    if (!isUsefulString(work.role)) {
      issues.push(issue("error", `${record.label}: worksRef[${index}].role is missing, empty, or TODO-like`));
    }
  });

  issues.push(...auditCodeExamples(record, options));

  return issues;
}

export function auditConceptRecords(records: ConceptRecord[], options: AuditOptions = {}) {
  const issues = records.flatMap((record) => auditConceptRecord(record, options));

  return {
    errors: issues.filter((item) => item.severity === "error"),
    warnings: issues.filter((item) => item.severity === "warning")
  };
}

async function readConceptRecords(): Promise<ConceptRecord[]> {
  const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file)).sort();
  const records: ConceptRecord[] = [];

  for (const file of files) {
    const path = join(conceptsRoot, file);
    const raw = await readFile(path, "utf8");
    const data = matter(raw).data;

    records.push({
      label: relative(root, path),
      data
    });
  }

  return records;
}

function printIssues(title: string, issues: AuditIssue[]) {
  if (issues.length === 0) {
    return;
  }

  console.error(`${title} (${issues.length}):`);
  console.error(issues.map((item) => item.message).join("\n"));
}

async function main() {
  const strictCodeExamples = process.argv.includes("--strict-code-examples");
  const records = await readConceptRecords();
  const result = auditConceptRecords(records, { strictCodeExamples });

  printIssues("Concept audit errors", result.errors);
  printIssues("Concept audit warnings", result.warnings);

  if (result.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (result.warnings.length > 0) {
    console.log("Concept audit warnings are informational only; current strict content gates use errors.");
    process.exitCode = 0;
    return;
  }

  console.log("Concept audit clean: no description, summary/whyImportant, worksRef, transition-field, or codeExamples issues.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
