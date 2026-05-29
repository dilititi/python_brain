import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const contentRoot = join(root, "src", "content");

type Entry = {
  id: string;
  path: string;
  data: Record<string, unknown>;
};

async function readMdxCollection(name: string): Promise<Entry[]> {
  const dir = join(contentRoot, name);
  const files = (await readdir(dir)).filter((file) => /\.mdx?$/.test(file));

  return Promise.all(
    files.map(async (file) => {
      const path = join(dir, file);
      const raw = await readFile(path, "utf8");
      return {
        id: file.replace(/\.mdx?$/, ""),
        path,
        data: matter(raw).data
      };
    })
  );
}

async function readYamlCollection(name: string): Promise<Entry[]> {
  const dir = join(contentRoot, name);
  const files = (await readdir(dir)).filter((file) => /\.ya?ml$/.test(file));

  return Promise.all(
    files.map(async (file) => {
      const path = join(dir, file);
      const raw = await readFile(path, "utf8");
      return {
        id: file.replace(/\.ya?ml$/, ""),
        path,
        data: YAML.parse(raw)
      };
    })
  );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function reportMissing(
  errors: string[],
  source: Entry,
  field: string,
  values: string[],
  targetIds: Set<string>
) {
  for (const value of values) {
    if (!targetIds.has(value)) {
      errors.push(
        `${relative(root, source.path)}: ${field} references missing id "${value}"`
      );
    }
  }
}

const concepts = await readMdxCollection("concepts");
const cases = await readMdxCollection("cases");
const projects = await readMdxCollection("projects");
const people = await readMdxCollection("people");
const paths = await readYamlCollection("paths");

const conceptIds = new Set(concepts.map((entry) => entry.id));
const caseIds = new Set(cases.map((entry) => entry.id));
const projectIds = new Set(projects.map((entry) => entry.id));
const personIds = new Set(people.map((entry) => entry.id));
const errors: string[] = [];

for (const entry of concepts) {
  reportMissing(errors, entry, "prerequisites", asStringArray(entry.data.prerequisites), conceptIds);
  reportMissing(errors, entry, "related", asStringArray(entry.data.related), conceptIds);
  reportMissing(errors, entry, "expandsTo", asStringArray(entry.data.expandsTo), conceptIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);

  const appliedIn = entry.data.appliedIn as Record<string, unknown> | undefined;
  reportMissing(errors, entry, "appliedIn.cases", asStringArray(appliedIn?.cases), caseIds);
  reportMissing(errors, entry, "appliedIn.projects", asStringArray(appliedIn?.projects), projectIds);
}

for (const entry of cases) {
  reportMissing(errors, entry, "concepts", asStringArray(entry.data.concepts), conceptIds);
  reportMissing(errors, entry, "projects", asStringArray(entry.data.projects), projectIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);
}

for (const entry of projects) {
  reportMissing(errors, entry, "concepts", asStringArray(entry.data.concepts), conceptIds);
  reportMissing(errors, entry, "cases", asStringArray(entry.data.cases), caseIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);
}

for (const entry of people) {
  reportMissing(errors, entry, "concepts", asStringArray(entry.data.concepts), conceptIds);
}

for (const entry of paths) {
  reportMissing(errors, entry, "nodes", asStringArray(entry.data.nodes), conceptIds);
  const milestones = Array.isArray(entry.data.milestones)
    ? (entry.data.milestones as Record<string, unknown>[])
    : [];

  for (const milestone of milestones) {
    reportMissing(errors, entry, "milestones.nodes", asStringArray(milestone.nodes), conceptIds);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Relations valid: ${concepts.length} concepts, ${cases.length} cases, ${projects.length} projects, ${people.length} people, ${paths.length} paths.`
  );
}
