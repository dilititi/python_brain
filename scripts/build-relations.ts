import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { buildRelationIndex, type ContentEntry } from "../src/lib/relation-index";

const root = process.cwd();
const contentRoot = join(root, "src", "content");

type LoadedCollection = {
  entries: ContentEntry[];
  sources: { path: string; raw: string }[];
};

async function readMdxCollection(name: string): Promise<LoadedCollection> {
  const dir = join(contentRoot, name);
  const files = (await readdir(dir)).filter((file) => /\.mdx?$/.test(file)).sort();
  const entries: ContentEntry[] = [];
  const sources: { path: string; raw: string }[] = [];

  for (const file of files) {
    const path = join(dir, file);
    const raw = await readFile(path, "utf8");
    entries.push({
      id: file.replace(/\.mdx?$/, ""),
      data: matter(raw).data
    });
    sources.push({ path, raw });
  }

  return { entries, sources };
}

async function readYamlCollection(name: string): Promise<LoadedCollection> {
  const dir = join(contentRoot, name);
  const files = (await readdir(dir)).filter((file) => /\.ya?ml$/.test(file)).sort();
  const entries: ContentEntry[] = [];
  const sources: { path: string; raw: string }[] = [];

  for (const file of files) {
    const path = join(dir, file);
    const raw = await readFile(path, "utf8");
    entries.push({
      id: file.replace(/\.ya?ml$/, ""),
      data: YAML.parse(raw)
    });
    sources.push({ path, raw });
  }

  return { entries, sources };
}

function contentHash(sources: { path: string; raw: string }[]) {
  const hash = createHash("md5");

  for (const source of sources.sort((left, right) => left.path.localeCompare(right.path))) {
    hash.update(relative(root, source.path));
    hash.update("\0");
    hash.update(source.raw);
    hash.update("\0");
  }

  return hash.digest("hex");
}

const [concepts, cases, projects, people, paths] = await Promise.all([
  readMdxCollection("concepts"),
  readMdxCollection("cases"),
  readMdxCollection("projects"),
  readMdxCollection("people"),
  readYamlCollection("paths")
]);

const allSources = [
  ...concepts.sources,
  ...cases.sources,
  ...projects.sources,
  ...people.sources,
  ...paths.sources
];

const index = buildRelationIndex(
  {
    concepts: concepts.entries,
    cases: cases.entries,
    projects: projects.entries,
    people: people.entries,
    paths: paths.entries
  },
  contentHash(allSources)
);

const distDir = join(root, "dist");
const target = join(distDir, "relations.json");

await mkdir(distDir, { recursive: true });
await writeFile(target, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(
  `Built ${relative(root, target)} with ${Object.keys(index.concepts).length} concepts, ${Object.keys(index.cases).length} cases, ${Object.keys(index.people).length} people.`
);
