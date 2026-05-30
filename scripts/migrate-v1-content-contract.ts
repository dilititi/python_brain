import { readFile, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");

type HistoryEvent = {
  year?: unknown;
  title?: unknown;
  note?: unknown;
  event?: unknown;
  pep?: unknown;
  source?: unknown;
  [key: string]: unknown;
};

type ConceptData = {
  category?: string;
  extends?: unknown;
  expandsTo?: unknown;
  history?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
};

const categoryMap: Record<string, string> = {
  foundation: "language",
  engineering: "module-eng",
  typing: "syntax"
};

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === "string"))];
}

function parsePep(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const match = value.match(/\bPEP\s*0*(\d+)\b/i);
    if (match) {
      return `PEP ${Number(match[1])}`;
    }
  }

  return undefined;
}

function normalizeHistory(items: unknown): HistoryEvent[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const event = item as HistoryEvent;
    const normalized: HistoryEvent = {};
    const year = event.year;
    const pep = typeof event.pep === "string" ? event.pep : parsePep(event.title, event.note);
    const title = typeof event.title === "string" ? event.title.trim() : "";
    const note = typeof event.note === "string" ? event.note.trim() : "";
    const existingEvent = typeof event.event === "string" ? event.event.trim() : "";

    if (typeof year === "string" || typeof year === "number") {
      normalized.year = year;
    }

    if (pep) {
      normalized.pep = pep;
    }

    if (existingEvent) {
      normalized.event = existingEvent;
    } else if (title && note) {
      normalized.event = `${title}：${note}`;
    } else {
      normalized.event = title || note || "TODO: 补充历史事件";
    }

    if (typeof event.source === "string") {
      normalized.source = event.source;
    }

    return normalized;
  });
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : value;
  }

  return value;
}

async function migrateFile(path: string) {
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as ConceptData;
  let changed = false;

  if (typeof data.category === "string" && data.category in categoryMap) {
    data.category = categoryMap[data.category];
    changed = true;
  }

  const mergedExtends = uniqueStrings([
    ...(Array.isArray(data.extends) ? data.extends : []),
    ...(Array.isArray(data.expandsTo) ? data.expandsTo : [])
  ]);

  if (
    JSON.stringify(mergedExtends) !==
    JSON.stringify(Array.isArray(data.extends) ? data.extends : [])
  ) {
    data.extends = mergedExtends;
    changed = true;
  }

  if ("expandsTo" in data) {
    delete data.expandsTo;
    changed = true;
  }

  const normalizedHistory = normalizeHistory(data.history);
  if (JSON.stringify(normalizedHistory) !== JSON.stringify(data.history)) {
    data.history = normalizedHistory;
    changed = true;
  }

  const normalizedUpdatedAt = normalizeDate(data.updatedAt);
  if (normalizedUpdatedAt !== data.updatedAt) {
    data.updatedAt = normalizedUpdatedAt;
    changed = true;
  }

  if (!changed) {
    return false;
  }

  const frontmatter = YAML.stringify(data, { lineWidth: 0 })
    .replace(/^updatedAt: (\d{4}-\d{2}-\d{2})$/m, 'updatedAt: "$1"')
    .trimEnd();
  await writeFile(path, `---\n${frontmatter}\n---\n${parsed.content.trimStart()}`, "utf8");
  return true;
}

let changedCount = 0;
const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file));

for (const file of files) {
  const path = join(conceptsRoot, file);

  if (await migrateFile(path)) {
    changedCount += 1;
    console.log(`migrated ${relative(root, path)}`);
  }
}

console.log(`v1 content contract migration complete: ${changedCount} concept file(s) changed.`);
