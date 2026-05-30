import { readFile, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const contentRoot = join(root, "src", "content");
const collections = ["concepts", "people"] as const;

type WorkLink = {
  note?: unknown;
  role?: unknown;
  [key: string]: unknown;
};

function stripRolePrefix(value: string) {
  return value.replace(/^role:\s*/i, "").trim();
}

async function migrateFile(path: string) {
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);
  const works = Array.isArray(parsed.data.works)
    ? (parsed.data.works as WorkLink[])
    : [];

  let changed = false;

  parsed.data.works = works.map((work) => {
    if (typeof work.note === "string" && typeof work.role !== "string") {
      work.role = stripRolePrefix(work.note);
      changed = true;
    }

    if ("note" in work) {
      delete work.note;
      changed = true;
    }

    return work;
  });

  if (!changed) {
    return false;
  }

  const frontmatter = YAML.stringify(parsed.data, { lineWidth: 0 })
    .replace(/^updatedAt: (\d{4}-\d{2}-\d{2})$/m, 'updatedAt: "$1"')
    .trimEnd();
  await writeFile(path, `---\n${frontmatter}\n---\n${parsed.content.trimStart()}`, "utf8");
  return true;
}

let changedCount = 0;

for (const collection of collections) {
  const dir = join(contentRoot, collection);
  const files = (await readdir(dir)).filter((file) => /\.mdx?$/.test(file));

  for (const file of files) {
    const path = join(dir, file);

    if (await migrateFile(path)) {
      changedCount += 1;
      console.log(`migrated ${relative(root, path)}`);
    }
  }
}

console.log(`works.note -> works.role migration complete: ${changedCount} file(s) changed.`);
