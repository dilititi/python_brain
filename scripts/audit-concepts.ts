import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");
const todoPattern = /TODO|待补|暂无说明/;
const issues: string[] = [];

function isUsefulString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !todoPattern.test(value);
}

const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file));

for (const file of files) {
  const path = join(conceptsRoot, file);
  const raw = await readFile(path, "utf8");
  const data = matter(raw).data;
  const label = relative(root, path);

  if (!isUsefulString(data.summary)) {
    issues.push(`${label}: summary is missing, empty, or TODO-like`);
  }

  if (!isUsefulString(data.whyImportant)) {
    issues.push(`${label}: whyImportant is missing, empty, or TODO-like`);
  }

  if ("expandsTo" in data) {
    issues.push(`${label}: expandsTo is deprecated; use extends`);
  }

  const works = Array.isArray(data.works) ? data.works : [];
  works.forEach((work: Record<string, unknown>, index: number) => {
    if ("note" in work) {
      issues.push(`${label}: works[${index}].note is deprecated; use role`);
    }

    if (!isUsefulString(work.role)) {
      issues.push(`${label}: works[${index}].role is missing, empty, or TODO-like`);
    }
  });

  const worksRef = Array.isArray(data.worksRef) ? data.worksRef : [];
  worksRef.forEach((work: Record<string, unknown>, index: number) => {
    if (!isUsefulString(work.id)) {
      issues.push(`${label}: worksRef[${index}].id is missing, empty, or TODO-like`);
    }

    if (!isUsefulString(work.role)) {
      issues.push(`${label}: worksRef[${index}].role is missing, empty, or TODO-like`);
    }
  });
}

if (issues.length === 0) {
  console.log("Concept audit clean: no summary/whyImportant, worksRef, or transition-field issues.");
} else {
  console.error(`Concept audit issues (${issues.length}):`);
  console.error(issues.join("\n"));
  process.exitCode = 1;
}
