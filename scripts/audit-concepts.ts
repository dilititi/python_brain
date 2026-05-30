import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");
const todoPattern = /TODO|待补|暂无说明/;
const warnings: string[] = [];

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
    warnings.push(`${label}: summary is missing, empty, or TODO-like`);
  }

  if (!isUsefulString(data.whyImportant)) {
    warnings.push(`${label}: whyImportant is missing, empty, or TODO-like`);
  }

  if ("expandsTo" in data) {
    warnings.push(`${label}: expandsTo is deprecated; use extends`);
  }

  const works = Array.isArray(data.works) ? data.works : [];
  works.forEach((work: Record<string, unknown>, index: number) => {
    if ("note" in work) {
      warnings.push(`${label}: works[${index}].note is deprecated; use role`);
    }
  });
}

if (warnings.length === 0) {
  console.log("Concept audit clean: no summary/whyImportant or transition-field warnings.");
} else {
  console.warn(`Concept audit warnings (${warnings.length}):`);
  console.warn(warnings.join("\n"));
}
