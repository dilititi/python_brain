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

const mvpTargets = {
  concepts: 20,
  cases: 10,
  projects: 5,
  people: 5
};

if (concepts.length < mvpTargets.concepts) {
  errors.push(`MVP requires at least ${mvpTargets.concepts} concepts, found ${concepts.length}`);
}

if (cases.length < mvpTargets.cases) {
  errors.push(`MVP requires at least ${mvpTargets.cases} cases, found ${cases.length}`);
}

if (projects.length < mvpTargets.projects) {
  errors.push(`MVP requires at least ${mvpTargets.projects} projects, found ${projects.length}`);
}

if (people.length < mvpTargets.people) {
  errors.push(`MVP requires at least ${mvpTargets.people} people, found ${people.length}`);
}

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

const casesByConcept = new Map<string, string[]>();
const projectsByCase = new Map<string, string[]>();
const conceptsByPerson = new Map<string, string[]>();
const graph = new Map<string, Set<string>>();

function connect(left: string, right: string) {
  if (!graph.has(left)) {
    graph.set(left, new Set());
  }

  if (!graph.has(right)) {
    graph.set(right, new Set());
  }

  graph.get(left)?.add(right);
  graph.get(right)?.add(left);
}

for (const entry of concepts) {
  graph.set(`concept:${entry.id}`, graph.get(`concept:${entry.id}`) ?? new Set());
}

for (const entry of cases) {
  graph.set(`case:${entry.id}`, graph.get(`case:${entry.id}`) ?? new Set());

  for (const concept of asStringArray(entry.data.concepts)) {
    casesByConcept.set(concept, [...(casesByConcept.get(concept) ?? []), entry.id]);
    connect(`concept:${concept}`, `case:${entry.id}`);
  }
}

for (const entry of projects) {
  graph.set(`project:${entry.id}`, graph.get(`project:${entry.id}`) ?? new Set());

  for (const concept of asStringArray(entry.data.concepts)) {
    connect(`concept:${concept}`, `project:${entry.id}`);
  }

  for (const caseId of asStringArray(entry.data.cases)) {
    projectsByCase.set(caseId, [...(projectsByCase.get(caseId) ?? []), entry.id]);
    connect(`case:${caseId}`, `project:${entry.id}`);
  }
}

for (const entry of people) {
  const personNode = `person:${entry.id}`;
  const personConcepts = asStringArray(entry.data.concepts);
  graph.set(personNode, graph.get(personNode) ?? new Set());
  conceptsByPerson.set(entry.id, personConcepts);

  for (const concept of personConcepts) {
    connect(personNode, `concept:${concept}`);
  }
}

for (const entry of concepts) {
  if ((casesByConcept.get(entry.id) ?? []).length === 0) {
    errors.push(`${relative(root, entry.path)}: MVP concepts must be covered by at least one case`);
  }
}

for (const entry of cases) {
  if ((projectsByCase.get(entry.id) ?? []).length === 0) {
    errors.push(`${relative(root, entry.path)}: MVP cases must support at least one project`);
  }
}

for (const entry of people) {
  if ((conceptsByPerson.get(entry.id) ?? []).length < 3) {
    errors.push(`${relative(root, entry.path)}: MVP people must connect to at least three concepts`);
  }
}

const graphNodes = [...graph.keys()];
const visited = new Set<string>();
const queue = graphNodes.length > 0 ? [graphNodes[0]] : [];

while (queue.length > 0) {
  const node = queue.shift();

  if (!node || visited.has(node)) {
    continue;
  }

  visited.add(node);

  for (const next of graph.get(node) ?? []) {
    if (!visited.has(next)) {
      queue.push(next);
    }
  }
}

if (visited.size !== graphNodes.length) {
  const missing = graphNodes.filter((node) => !visited.has(node));
  errors.push(`MVP content graph must be connected; disconnected nodes: ${missing.join(", ")}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Relations valid: ${concepts.length} concepts, ${cases.length} cases, ${projects.length} projects, ${people.length} people, ${paths.length} paths.`
  );
}
