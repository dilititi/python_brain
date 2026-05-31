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

async function readWorksRegistry(): Promise<Entry[]> {
  const path = join(contentRoot, "works-registry.yaml");
  const raw = await readFile(path, "utf8");
  const parsed = YAML.parse(raw) as { works?: Record<string, unknown>[] } | null;
  const works = Array.isArray(parsed?.works) ? parsed.works : [];

  return works.map((work, index) => ({
    id: typeof work.id === "string" ? work.id : `missing-work-id-${index}`,
    path,
    data: work
  }));
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
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
const githubFixedLineUrlPattern =
  /^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[0-9a-f]{40}\/.+#L\d+(?:-L\d+)?$/i;

function isUsefulString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !todoPattern.test(value);
}

function isHttpsUrl(value: unknown) {
  return typeof value === "string" && value.startsWith("https://");
}

const concepts = await readMdxCollection("concepts");
const cases = await readMdxCollection("cases");
const projects = await readMdxCollection("projects");
const people = await readMdxCollection("people");
const paths = await readYamlCollection("paths");
const works = await readWorksRegistry();

const conceptIds = new Set(concepts.map((entry) => entry.id));
const caseIds = new Set(cases.map((entry) => entry.id));
const projectIds = new Set(projects.map((entry) => entry.id));
const personIds = new Set(people.map((entry) => entry.id));
const workIds = new Set(works.map((entry) => entry.id));
const errors: string[] = [];
const warnings: string[] = [];
const workTypes = new Set(["library", "framework", "book", "talk", "pep", "project"]);

const mvpTargets = {
  concepts: 20,
  cases: 10,
  projects: 5,
  people: 5
};
const showcaseConceptIds = new Set(["decorator", "python-language", "function-parameters"]);
const requiredCodeExampleTitles = ["naive", "standard", "production"];

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

if (works.length === 0) {
  errors.push("src/content/works-registry.yaml: works must contain at least one work");
}

const seenWorkIds = new Set<string>();
for (const entry of works) {
  const label = `${relative(root, entry.path)}: works.${entry.id}`;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
    errors.push(`${label}: id must be kebab-case`);
  }

  if (seenWorkIds.has(entry.id)) {
    errors.push(`${label}: duplicate work id`);
  }
  seenWorkIds.add(entry.id);

  if (!isUsefulString(entry.data.title)) {
    errors.push(`${label}: title is required and must be useful`);
  }

  if (typeof entry.data.creator === "string" && !isUsefulString(entry.data.creator)) {
    errors.push(`${label}: creator must be useful when present`);
  }

  if (typeof entry.data.type !== "string" || !workTypes.has(entry.data.type)) {
    errors.push(`${label}: type must be one of ${[...workTypes].join(", ")}`);
  }

  if (typeof entry.data.url === "string" && !entry.data.url.startsWith("https://")) {
    errors.push(`${label}: url must be an https URL`);
  }
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

  if (showcaseConceptIds.has(entry.id)) {
    const codeExamples = asRecordArray(entry.data.codeExamples);
    const codeExampleTitles = new Set(codeExamples.map((example) => example.title));

    for (const title of requiredCodeExampleTitles) {
      const example = codeExamples.find((item) => item.title === title);
      if (!example || !isUsefulString(example.description) || !isUsefulString(example.code)) {
        errors.push(
          `${relative(root, entry.path)}: showcase concept codeExamples must include useful ${title} example`
        );
      }
    }

    for (const title of codeExampleTitles) {
      if (typeof title !== "string" || !requiredCodeExampleTitles.includes(title)) {
        errors.push(`${relative(root, entry.path)}: codeExamples title must be naive, standard, or production`);
      }
    }
  }

  const works = Array.isArray(entry.data.works)
    ? (entry.data.works as Record<string, unknown>[])
    : [];
  const worksRef = asRecordArray(entry.data.worksRef);
  const worksRefIds = worksRef
    .map((work) => work.id)
    .filter((id): id is string => typeof id === "string");

  reportMissing(errors, entry, "worksRef.id", worksRefIds, workIds);

  if (works.length + worksRef.length === 0) {
    errors.push(`${relative(root, entry.path)}: concept must have at least one work`);
  }

  if (works.length > 0) {
    warnings.push(`${relative(root, entry.path)}: inline works[] is deprecated; use worksRef[] + works-registry.yaml`);
  }

  worksRef.forEach((work, index) => {
    if (!isUsefulString(work.id)) {
      errors.push(`${relative(root, entry.path)}: worksRef[${index}].id is required`);
    }

    if (!isUsefulString(work.role)) {
      errors.push(`${relative(root, entry.path)}: worksRef[${index}].role is required and must be useful`);
    }
  });

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

let openSourceCaseCount = 0;

for (const entry of cases) {
  const caseConcepts = asStringArray(entry.data.concepts);
  reportMissing(errors, entry, "concepts", caseConcepts, conceptIds);
  reportMissing(errors, entry, "projects", asStringArray(entry.data.projects), projectIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);

  if (typeof entry.data.project === "string") {
    reportMissing(errors, entry, "project", [entry.data.project], projectIds);
  }

  if (caseConcepts.length < 2) {
    errors.push(`${relative(root, entry.path)}: case.concepts must include at least two concepts`);
  }

  if (typeof entry.data.sourceUrl === "string") {
    if (!isHttpsUrl(entry.data.sourceUrl)) {
      errors.push(`${relative(root, entry.path)}: sourceUrl must be an https URL`);
    }

    if (entry.data.sourceUrl.includes("github.com/")) {
      if (!githubFixedLineUrlPattern.test(entry.data.sourceUrl)) {
        errors.push(
          `${relative(root, entry.path)}: GitHub sourceUrl must use a fixed 40-character commit SHA and line anchor`
        );
      } else {
        openSourceCaseCount += 1;
      }
    }
  }

  const codeVersions = asRecordArray(entry.data.codeVersions);
  const hasStandardCode = codeVersions.some(
    (version) => version.label === "standard" && isUsefulString(version.code)
  );

  if (codeVersions.length === 0) {
    errors.push(`${relative(root, entry.path)}: codeVersions must contain at least one version`);
  }

  if (!hasStandardCode) {
    errors.push(`${relative(root, entry.path)}: codeVersions must include a useful standard version`);
  }

  const pitfalls = asStringArray(entry.data.pitfalls);
  if (pitfalls.length === 0 || pitfalls.some((pitfall) => !isUsefulString(pitfall))) {
    errors.push(`${relative(root, entry.path)}: pitfalls must contain at least one useful item`);
  }

  const extensions = asStringArray(entry.data.extensions);
  if (extensions.length === 0 || extensions.some((extension) => !isUsefulString(extension))) {
    errors.push(`${relative(root, entry.path)}: extensions must contain at least one useful item`);
  }
}

if (openSourceCaseCount === 0) {
  errors.push("MVP cases must include at least one GitHub sourceUrl pinned to a commit SHA and line anchor");
}

for (const entry of projects) {
  const projectConcepts = asStringArray(entry.data.concepts);
  reportMissing(errors, entry, "concepts", projectConcepts, conceptIds);
  reportMissing(errors, entry, "cases", asStringArray(entry.data.cases), caseIds);
  reportMissing(errors, entry, "people", asStringArray(entry.data.people), personIds);

  if (!isUsefulString(entry.data.type)) {
    errors.push(`${relative(root, entry.path)}: project.type is required and must be useful`);
  }

  if (!isUsefulString(entry.data.stage)) {
    errors.push(`${relative(root, entry.path)}: project.stage is required and must be useful`);
  }

  if (!isUsefulString(entry.data.finalOutput)) {
    errors.push(`${relative(root, entry.path)}: project.finalOutput is required and must be useful`);
  }

  if (!isUsefulString(entry.data.structure)) {
    errors.push(`${relative(root, entry.path)}: project.structure is required and must be useful`);
  }

  const youWillLearn = asStringArray(entry.data.youWillLearn);
  if (youWillLearn.length === 0 || youWillLearn.some((item) => !isUsefulString(item))) {
    errors.push(`${relative(root, entry.path)}: project.youWillLearn must contain at least one useful item`);
  }

  const coreFlow = asStringArray(entry.data.coreFlow);
  if (coreFlow.length === 0 || coreFlow.some((item) => !isUsefulString(item))) {
    errors.push(`${relative(root, entry.path)}: project.coreFlow must contain at least one useful item`);
  }

  const upgradePath = asStringArray(entry.data.upgradePath);
  if (upgradePath.length === 0 || upgradePath.some((item) => !isUsefulString(item))) {
    errors.push(`${relative(root, entry.path)}: project.upgradePath must contain at least one useful item`);
  }

  if (projectConcepts.length < 3) {
    errors.push(`${relative(root, entry.path)}: project.concepts must include at least three concepts`);
  }
}

for (const entry of people) {
  reportMissing(errors, entry, "concepts", asStringArray(entry.data.concepts), conceptIds);

  if (!isUsefulString(entry.data.role)) {
    errors.push(`${relative(root, entry.path)}: person.role is required and must be useful`);
  }

  if (!isUsefulString(entry.data.field)) {
    errors.push(`${relative(root, entry.path)}: person.field is required and must be useful`);
  }

  const sources = asRecordArray(entry.data.sources);
  if (sources.length === 0) {
    errors.push(`${relative(root, entry.path)}: person.sources must contain at least one source`);
  }

  sources.forEach((source, index) => {
    if (!isUsefulString(source.label)) {
      errors.push(`${relative(root, entry.path)}: sources[${index}].label is required`);
    }

    if (typeof source.url !== "string" || !source.url.startsWith("https://")) {
      errors.push(`${relative(root, entry.path)}: sources[${index}].url must be an https URL`);
    }
  });
}

for (const entry of paths) {
  reportMissing(errors, entry, "nodes", asStringArray(entry.data.nodes), conceptIds);
  const milestones = Array.isArray(entry.data.milestones)
    ? (entry.data.milestones as Record<string, unknown>[])
    : [];

  for (const milestone of milestones) {
    reportMissing(errors, entry, "milestones.nodes", asStringArray(milestone.nodes), conceptIds);
    reportMissing(errors, entry, "milestones.cases", asStringArray(milestone.cases), caseIds);
    reportMissing(errors, entry, "milestones.projects", asStringArray(milestone.projects), projectIds);

    if (asStringArray(milestone.cases).length === 0) {
      errors.push(`${relative(root, entry.path)}: milestones.cases must contain at least one case`);
    }

    if (asStringArray(milestone.projects).length === 0) {
      errors.push(`${relative(root, entry.path)}: milestones.projects must contain at least one project`);
    }
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

const isolatedNodes = graphNodes.filter((node) => (graph.get(node)?.size ?? 0) === 0);
if (isolatedNodes.length > 0) {
  warnings.push(`MVP content graph has isolated nodes: ${isolatedNodes.join(", ")}`);
}

if (visited.size !== graphNodes.length) {
  const missing = graphNodes.filter((node) => !visited.has(node));
  warnings.push(`MVP content graph has disconnected nodes: ${missing.join(", ")}`);
}

if (warnings.length > 0) {
  console.warn(`Warnings:\n${warnings.join("\n")}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Relations valid: ${concepts.length} concepts, ${cases.length} cases, ${projects.length} projects, ${people.length} people, ${paths.length} paths, ${works.length} works.`
  );

  if (warnings.length > 0 && Number.isInteger(warningExitCode) && warningExitCode > 0) {
    process.exitCode = warningExitCode;
  }
}
