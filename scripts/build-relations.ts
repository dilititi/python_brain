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

async function readContentFile(path: string): Promise<LoadedCollection> {
  const raw = await readFile(path, "utf8");
  return {
    entries: [],
    sources: [{ path, raw }]
  };
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
const worksRegistry = await readContentFile(join(contentRoot, "works-registry.yaml"));
const worksRegistryData = YAML.parse(worksRegistry.sources[0]?.raw ?? "") as
  | { works?: unknown[] }
  | null;
const worksCount = Array.isArray(worksRegistryData?.works)
  ? worksRegistryData.works.length
  : 0;

const allSources = [
  ...concepts.sources,
  ...cases.sources,
  ...projects.sources,
  ...people.sources,
  ...paths.sources,
  ...worksRegistry.sources
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

const generatedDir = join(root, "src", "generated");
const distDir = join(root, "dist");
const generatedTarget = join(generatedDir, "relations.json");
const distTarget = join(distDir, "relations.json");
const json = `${JSON.stringify(index, null, 2)}\n`;

await mkdir(generatedDir, { recursive: true });
await mkdir(distDir, { recursive: true });
await Promise.all([
  writeFile(generatedTarget, json, "utf8"),
  writeFile(distTarget, json, "utf8")
]);

console.log(
  `Built ${relative(root, generatedTarget)} and ${relative(root, distTarget)} with ${Object.keys(index.concepts).length} concepts, ${Object.keys(index.cases).length} cases, ${Object.keys(index.people).length} people, ${worksCount} works.`
);
