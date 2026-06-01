import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");
const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file)).sort();

let changed = 0;

for (const file of files) {
  const path = join(conceptsRoot, file);
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);

  if (!("description" in parsed.data)) {
    continue;
  }

  if (typeof parsed.data.summary !== "string" || parsed.data.summary.trim().length === 0) {
    throw new Error(`${relative(root, path)}: cannot remove description before summary is filled`);
  }

  const lines = raw.split(/\r?\n/);
  let inFrontmatter = false;
  let removed = false;

  const nextLines = lines.filter((line, index) => {
    if (index === 0 && line === "---") {
      inFrontmatter = true;
      return true;
    }

    if (inFrontmatter && index > 0 && line === "---") {
      inFrontmatter = false;
      return true;
    }

    if (inFrontmatter && !removed && /^description:\s/.test(line)) {
      removed = true;
      return false;
    }

    return true;
  });

  if (!removed) {
    throw new Error(`${relative(root, path)}: description exists but no single-line frontmatter field was found`);
  }

  await writeFile(path, nextLines.join("\n"), "utf8");
  changed += 1;
}

console.log(`Removed concept description from ${changed} files.`);
