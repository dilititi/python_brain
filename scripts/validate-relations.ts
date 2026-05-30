import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const contentRoot = join(root, "src", "content");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: npm run validate:relations -- [options]

Options:
  --warning-exit-code=<code>  Exit with this code when validation has warnings but no errors.
                              Omit this flag for local development; warnings then keep exit 0.
  -h, --help                  Show this help message.

Exit codes:
  0  No blocking errors. Warnings also return 0 unless --warning-exit-code is set.
  1  Blocking validation errors.
  N  Warning-only result when --warning-exit-code=N is set, for example 2 in CI.
`);
  process.exit(0);
}

const warningExitCodeArg = process.argv.find((arg) =>
  arg.startsWith("--warning-exit-code=")
);
const warningExitCode = warningExitCodeArg
  ? Number(warningExitCodeArg.split("=", 2)[1])
  : 0;

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

const todoPattern = /TODO|待补|暂无说明/;

function isUsefulString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !todoPattern.test(value);
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
const warnings: string[] = [];

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
  reportMissing(errors, entry, "extends", asStringArray(entry.data.extends), conceptIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);

  const appliedIn = entry.data.appliedIn as Record<string, unknown> | undefined;
  reportMissing(errors, entry, "appliedIn.cases", asStringArray(appliedIn?.cases), caseIds);
  reportMissing(errors, entry, "appliedIn.projects", asStringArray(appliedIn?.projects), projectIds);

  if (!isUsefulString(entry.data.summary)) {
    errors.push(`${relative(root, entry.path)}: summary is required and must be useful`);
  }

  if (!isUsefulString(entry.data.whyImportant)) {
    errors.push(`${relative(root, entry.path)}: whyImportant is required and must be useful`);
  }

  if ("expandsTo" in entry.data) {
    errors.push(`${relative(root, entry.path)}: expandsTo is removed; use extends`);
  }

  const works = Array.isArray(entry.data.works)
    ? (entry.data.works as Record<string, unknown>[])
    : [];

  if (works.length === 0) {
    errors.push(`${relative(root, entry.path)}: concept must have at least one work`);
  }

  works.forEach((work, index) => {
    if (!isUsefulString(work.role)) {
      errors.push(`${relative(root, entry.path)}: works[${index}].role is required and must be useful`);
    }

    if ("note" in work) {
      errors.push(`${relative(root, entry.path)}: works[${index}].note is removed; use role`);
    }
  });

  const history = Array.isArray(entry.data.history)
    ? (entry.data.history as Record<string, unknown>[])
    : [];

  if (history.length === 0) {
    errors.push(`${relative(root, entry.path)}: history must contain at least one event`);
  }

  history.forEach((event, index) => {
    if (!isUsefulString(event.event)) {
      errors.push(`${relative(root, entry.path)}: history[${index}].event is required`);
    }

    if (typeof event.pep === "string" && !/^PEP \d+$/.test(event.pep)) {
      errors.push(`${relative(root, entry.path)}: history[${index}].pep must match "PEP \\d+"`);
    }

    if (!event.year && !event.pep) {
      errors.push(`${relative(root, entry.path)}: history[${index}] must include year or pep`);
    }

    if (typeof event.source === "string" && !event.source.startsWith("https://")) {
      errors.push(`${relative(root, entry.path)}: history[${index}].source must be an https URL`);
    }
  });
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

const prerequisiteIndex = new Map<string, string[]>(
  concepts.map((entry) => [entry.id, asStringArray(entry.data.prerequisites)])
);
const visitingPrerequisites = new Set<string>();
const visitedPrerequisites = new Set<string>();

function visitPrerequisiteNode(id: string, stack: string[]) {
  if (visitedPrerequisites.has(id)) {
    return;
  }

  if (visitingPrerequisites.has(id)) {
    const cycleStart = stack.indexOf(id);
    const cycle = [...stack.slice(Math.max(cycleStart, 0)), id].join(" -> ");
    errors.push(`concept prerequisites graph must be a DAG; cycle detected: ${cycle}`);
    return;
  }

  visitingPrerequisites.add(id);

  for (const prerequisite of prerequisiteIndex.get(id) ?? []) {
    visitPrerequisiteNode(prerequisite, [...stack, prerequisite]);
  }

  visitingPrerequisites.delete(id);
  visitedPrerequisites.add(id);
}

for (const id of conceptIds) {
  visitPrerequisiteNode(id, [id]);
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

if (warnings.length > 0) {
  console.warn(`Warnings:\n${warnings.join("\n")}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Relations valid: ${concepts.length} concepts, ${cases.length} cases, ${projects.length} projects, ${people.length} people, ${paths.length} paths.`
  );

  if (warnings.length > 0 && Number.isInteger(warningExitCode) && warningExitCode > 0) {
    process.exitCode = warningExitCode;
  }
}
