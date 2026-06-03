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

type IndexedString = {
  value: string;
  index: number;
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

function asIndexedStringArray(value: unknown): IndexedString[] {
  return Array.isArray(value)
    ? value
        .map((item, index) => ({ value: item, index }))
        .filter((item): item is IndexedString => typeof item.value === "string")
    : [];
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

const errors: string[] = [];
const warnings: string[] = [];

function pushIssue(
  target: string[],
  source: Entry | string,
  field: string,
  problem: string,
  fix: string
) {
  const file = typeof source === "string" ? source : relative(root, source.path);
  target.push(`${file} | field: ${field} | problem: ${problem} | fix: ${fix}`);
}

function pushError(source: Entry | string, field: string, problem: string, fix: string) {
  pushIssue(errors, source, field, problem, fix);
}

function pushWarning(source: Entry | string, field: string, problem: string, fix: string) {
  pushIssue(warnings, source, field, problem, fix);
}

function reportMissing(
  source: Entry,
  field: string,
  rawValue: unknown,
  targetIds: Set<string>,
  targetName: string
) {
  for (const item of asIndexedStringArray(rawValue)) {
    if (!targetIds.has(item.value)) {
      pushError(
        source,
        `${field}[${item.index}]`,
        `references missing id "${item.value}"`,
        `Use an existing ${targetName} id or create that ${targetName}; compare src/content/concepts/decorator.mdx.`
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
const workTypes = new Set(["library", "framework", "book", "talk", "pep", "project"]);

const mvpTargets = {
  concepts: 20,
  cases: 10,
  projects: 5,
  people: 5
};
const requiredCodeExampleTitles = ["naive", "standard", "production"];

if (concepts.length < mvpTargets.concepts) {
  pushError(
    "src/content/concepts/*.mdx",
    "collection.count",
    `MVP requires at least ${mvpTargets.concepts} concepts, found ${concepts.length}`,
    "Add connected concept files or lower the MVP target only with an explicit positioning update."
  );
}

if (cases.length < mvpTargets.cases) {
  pushError(
    "src/content/cases/*.mdx",
    "collection.count",
    `MVP requires at least ${mvpTargets.cases} cases, found ${cases.length}`,
    "Add case files that reference at least two concepts; compare src/content/cases/flask-routing.mdx."
  );
}

if (projects.length < mvpTargets.projects) {
  pushError(
    "src/content/projects/*.mdx",
    "collection.count",
    `MVP requires at least ${mvpTargets.projects} projects, found ${projects.length}`,
    "Add project files with v1 fields and at least three concepts; compare src/content/projects/mini-web-api.mdx."
  );
}

if (people.length < mvpTargets.people) {
  pushError(
    "src/content/people/*.mdx",
    "collection.count",
    `MVP requires at least ${mvpTargets.people} people, found ${people.length}`,
    "Add people files with role, field, sources, and at least three concepts; compare src/content/people/guido-van-rossum.mdx."
  );
}

if (works.length === 0) {
  pushError(
    "src/content/works-registry.yaml",
    "works",
    "works registry is empty",
    "Register at least one work with id, title, creator, type, and https url; compare the flask registry entry."
  );
}

const seenWorkIds = new Set<string>();
for (const entry of works) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
    pushError(entry, `works.${entry.id}.id`, "id must be kebab-case", "Rename the work id to kebab-case, for example flask.");
  }

  if (seenWorkIds.has(entry.id)) {
    pushError(entry, `works.${entry.id}.id`, "duplicate work id", "Keep one registry entry per id and update duplicate worksRef references.");
  }
  seenWorkIds.add(entry.id);

  if (!isUsefulString(entry.data.title)) {
    pushError(entry, `works.${entry.id}.title`, "title is missing or TODO-like", "Add the public work name; compare the Flask registry entry.");
  }

  if (typeof entry.data.creator === "string" && !isUsefulString(entry.data.creator)) {
    pushError(entry, `works.${entry.id}.creator`, "creator is present but not useful", "Use a real creator name or remove the optional creator field.");
  }

  if (typeof entry.data.type !== "string" || !workTypes.has(entry.data.type)) {
    pushError(entry, `works.${entry.id}.type`, `type must be one of ${[...workTypes].join(", ")}`, "Choose the closest registry type; compare framework entries such as flask.");
  }

  if (typeof entry.data.url === "string" && !entry.data.url.startsWith("https://")) {
    pushError(entry, `works.${entry.id}.url`, "url must be an https URL", "Use the canonical https URL for the work or omit url if none is stable.");
  }
}

for (const entry of concepts) {
  reportMissing(entry, "prerequisites", entry.data.prerequisites, conceptIds, "concept");
  reportMissing(entry, "related", entry.data.related, conceptIds, "concept");
  reportMissing(entry, "extends", entry.data.extends, conceptIds, "concept");
  reportMissing(entry, "people", entry.data.people, personIds, "person");

  const appliedIn = entry.data.appliedIn as Record<string, unknown> | undefined;
  reportMissing(entry, "appliedIn.cases", appliedIn?.cases, caseIds, "case");
  reportMissing(entry, "appliedIn.projects", appliedIn?.projects, projectIds, "project");

  if ("description" in entry.data) {
    pushError(
      entry,
      "description",
      "concept description is removed",
      "Delete description and use summary for the one-line concept card text; compare src/content/concepts/decorator.mdx."
    );
  }

  if (!isUsefulString(entry.data.summary)) {
    pushError(entry, "summary", "summary is missing, empty, or TODO-like", "Add an <=80 character definition or mental model; compare src/content/concepts/decorator.mdx.");
  }

  if (!isUsefulString(entry.data.whyImportant)) {
    pushError(entry, "whyImportant", "whyImportant is missing, empty, or TODO-like", "Explain the concrete real-world value in <=200 characters; compare src/content/concepts/function-parameters.mdx.");
  }

  if ("requiresMindset" in entry.data) {
    const mindsetShifts = asRecordArray(entry.data.requiresMindset);

    mindsetShifts.forEach((mindset, index) => {
      if (!isUsefulString(mindset.shift)) {
        pushError(entry, `requiresMindset[${index}].shift`, "mindset shift is missing or TODO-like", "Name the mental shift in one short sentence; compare src/content/concepts/decorator.mdx.");
      }

      if (!isUsefulString(mindset.why)) {
        pushError(entry, `requiresMindset[${index}].why`, "mindset why is missing or TODO-like", "Explain why this shift unlocks the concept; compare src/content/concepts/decorator.mdx.");
      }

      if ("blockedBy" in mindset) {
        const blockedBy = Array.isArray(mindset.blockedBy)
          ? mindset.blockedBy
          : [];

        if (!Array.isArray(mindset.blockedBy) || blockedBy.some((item) => !isUsefulString(item))) {
          pushError(entry, `requiresMindset[${index}].blockedBy`, "blockedBy must contain useful strings when present", "List the prior intuition that blocks this shift, or remove blockedBy.");
        }
      }
    });
  }

  if ("expandsTo" in entry.data) {
    pushError(entry, "expandsTo", "expandsTo is removed", "Rename the field to extends and keep concept ids unchanged.");
  }

  const rawCodeExamples = Array.isArray(entry.data.codeExamples)
    ? entry.data.codeExamples
    : [];
  const codeExamples = rawCodeExamples.filter((example): example is Record<string, unknown> => (
    Boolean(example) && typeof example === "object"
  ));
  const usefulCodeExamples = codeExamples.filter((example) => (
    isUsefulString(example.title) &&
    isUsefulString(example.description) &&
    isUsefulString(example.code)
  ));

  if (!Array.isArray(entry.data.codeExamples)) {
    pushError(entry, "codeExamples", "codeExamples must be an array", "Add concept code examples; compare src/content/concepts/decorator.mdx.");
  }

  rawCodeExamples.forEach((example, index) => {
    if (!example || typeof example !== "object") {
      pushError(entry, `codeExamples[${index}]`, "codeExamples item must be an object", "Use title, description, code, and optional runnable fields.");
    }
  });

  if (entry.data.category === "language") {
    if (usefulCodeExamples.length === 0) {
      pushError(
        entry,
        "codeExamples",
        "language concept is missing useful display code",
        "Add at least one runnable example with visible output; compare src/content/concepts/python-language.mdx."
      );
    }
  } else {
    for (const title of requiredCodeExampleTitles) {
      const example = usefulCodeExamples.find((item) => item.title === title);
      if (!example) {
        pushError(
          entry,
          `codeExamples.${title}`,
          `concept is missing a useful ${title} example`,
          "Provide description and code for naive, standard, and production examples; compare src/content/concepts/decorator.mdx."
        );
      }
    }

    codeExamples.forEach((example, index) => {
      if (typeof example.title !== "string" || !requiredCodeExampleTitles.includes(example.title)) {
        pushError(entry, `codeExamples[${index}].title`, "codeExamples title must be naive, standard, or production", "Rename the example title to one of the three required labels.");
      }
    });
  }

  const worksRef = asRecordArray(entry.data.worksRef);

  if ("works" in entry.data) {
    pushError(entry, "works", "inline works[] is removed", "Move stable work metadata to src/content/works-registry.yaml and keep only worksRef[].id/role here.");
  }

  if (worksRef.length === 0) {
    pushError(entry, "worksRef", "concept must have at least one work", "Add a worksRef id from src/content/works-registry.yaml with a role explaining how it uses the concept.");
  }

  worksRef.forEach((work, index) => {
    if (!isUsefulString(work.id)) {
      pushError(entry, `worksRef[${index}].id`, "worksRef id is missing or TODO-like", "Reference an existing work id from src/content/works-registry.yaml.");
    } else if (typeof work.id === "string" && !workIds.has(work.id)) {
      pushError(entry, `worksRef[${index}].id`, `references missing work id "${work.id}"`, "Use an existing id from src/content/works-registry.yaml or register the work there.");
    }

    if (!isUsefulString(work.role)) {
      pushError(entry, `worksRef[${index}].role`, "worksRef role is missing or TODO-like", "Explain how this work uses the concept; compare decorator's Flask/FastAPI roles.");
    }
  });

  const history = Array.isArray(entry.data.history)
    ? (entry.data.history as Record<string, unknown>[])
    : [];

  if (history.length === 0) {
    pushError(entry, "history", "history must contain at least one event", "Add a year or PEP event with impact text; compare src/content/concepts/decorator.mdx.");
  }

  history.forEach((event, index) => {
    if (!isUsefulString(event.event)) {
      pushError(entry, `history[${index}].event`, "history event is missing or TODO-like", "Describe what changed and why it matters today.");
    }

    if (typeof event.pep === "string" && !/^PEP \d+$/.test(event.pep)) {
      pushError(entry, `history[${index}].pep`, 'pep must match "PEP \\d+"', "Use the canonical PEP label, for example PEP 318.");
    }

    if (!event.year && !event.pep) {
      pushError(entry, `history[${index}]`, "history event must include year or pep", "Add year or pep so the event can be placed on the timeline.");
    }

    if (typeof event.source === "string" && !event.source.startsWith("https://")) {
      pushError(entry, `history[${index}].source`, "source must be an https URL", "Use an official https source such as a PEP or docs.python.org page.");
    }
  });
}

let openSourceCaseCount = 0;

for (const entry of cases) {
  const caseConcepts = asStringArray(entry.data.concepts);
  reportMissing(entry, "concepts", entry.data.concepts, conceptIds, "concept");
  reportMissing(entry, "projects", entry.data.projects, projectIds, "project");
  reportMissing(entry, "people", entry.data.people, personIds, "person");

  if (typeof entry.data.project === "string") {
    reportMissing(entry, "project", [entry.data.project], projectIds, "project");
  }

  if (caseConcepts.length < 2) {
    pushError(entry, "concepts", "case.concepts must include at least two concepts", "Add another concept id so the case demonstrates a real connection; compare src/content/cases/flask-routing.mdx.");
  }

  if (typeof entry.data.sourceUrl === "string") {
    if (!isHttpsUrl(entry.data.sourceUrl)) {
      pushError(entry, "sourceUrl", "sourceUrl must be an https URL", "Use an https URL or remove sourceUrl if this is not an external-source case.");
    }

    if (entry.data.sourceUrl.includes("github.com/")) {
      if (!githubFixedLineUrlPattern.test(entry.data.sourceUrl)) {
        pushError(
          entry,
          "sourceUrl",
          "GitHub sourceUrl must use a fixed 40-character commit SHA and line anchor",
          "Pin to /blob/<40-char-sha>/...#Lx-Ly instead of main; compare src/content/cases/flask-routing.mdx."
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
    pushError(entry, "codeVersions", "codeVersions must contain at least one version", "Add at least a standard code version; compare src/content/cases/flask-routing.mdx.");
  }

  if (!hasStandardCode) {
    pushError(entry, "codeVersions[].label", "codeVersions must include a useful standard version", "Add a codeVersions item with label: standard and non-empty code.");
  }

  const pitfalls = asStringArray(entry.data.pitfalls);
  if (pitfalls.length === 0 || pitfalls.some((pitfall) => !isUsefulString(pitfall))) {
    pushError(entry, "pitfalls", "pitfalls must contain at least one useful item", "Add a concrete beginner mistake this case helps avoid.");
  }

  const extensions = asStringArray(entry.data.extensions);
  if (extensions.length === 0 || extensions.some((extension) => !isUsefulString(extension))) {
    pushError(entry, "extensions", "extensions must contain at least one useful item", "Add a concrete next step or variation for this case.");
  }
}

if (openSourceCaseCount === 0) {
  pushError(
    "src/content/cases/*.mdx",
    "sourceUrl",
    "MVP cases must include at least one GitHub sourceUrl pinned to a commit SHA and line anchor",
    "Add one open-source reference case using a fixed GitHub commit and line anchor; compare src/content/cases/flask-routing.mdx."
  );
}

for (const entry of projects) {
  const projectConcepts = asStringArray(entry.data.concepts);
  reportMissing(entry, "concepts", entry.data.concepts, conceptIds, "concept");
  reportMissing(entry, "cases", entry.data.cases, caseIds, "case");
  reportMissing(entry, "people", entry.data.people, personIds, "person");

  if (!isUsefulString(entry.data.type)) {
    pushError(entry, "type", "project.type is missing or TODO-like", "Add the project type, for example cli-tool, web-api, or data-tool.");
  }

  if (!isUsefulString(entry.data.stage)) {
    pushError(entry, "stage", "project.stage is missing or TODO-like", "Use intro, core, or advanced to place the project in the learning path.");
  }

  if (!isUsefulString(entry.data.finalOutput)) {
    pushError(entry, "finalOutput", "project.finalOutput is missing or TODO-like", "Describe the tangible thing the learner will finish.");
  }

  if (!isUsefulString(entry.data.structure)) {
    pushError(entry, "structure", "project.structure is missing or TODO-like", "Describe the expected file/module structure for the project.");
  }

  const youWillLearn = asStringArray(entry.data.youWillLearn);
  if (youWillLearn.length === 0 || youWillLearn.some((item) => !isUsefulString(item))) {
    pushError(entry, "youWillLearn", "project.youWillLearn must contain at least one useful item", "Add concrete learning outcomes; compare src/content/projects/mini-web-api.mdx.");
  }

  const coreFlow = asStringArray(entry.data.coreFlow);
  if (coreFlow.length === 0 || coreFlow.some((item) => !isUsefulString(item))) {
    pushError(entry, "coreFlow", "project.coreFlow must contain at least one useful item", "Add the main implementation steps in learner-facing order.");
  }

  const upgradePath = asStringArray(entry.data.upgradePath);
  if (upgradePath.length === 0 || upgradePath.some((item) => !isUsefulString(item))) {
    pushError(entry, "upgradePath", "project.upgradePath must contain at least one useful item", "Add at least one follow-up improvement after the base project.");
  }

  if (projectConcepts.length < 3) {
    pushError(entry, "concepts", "project.concepts must include at least three concepts", "Add enough concept ids to make this project part of the graph; compare src/content/projects/mini-web-api.mdx.");
  }
}

for (const entry of people) {
  reportMissing(entry, "concepts", entry.data.concepts, conceptIds, "concept");

  if (!isUsefulString(entry.data.role)) {
    pushError(entry, "role", "person.role is missing or TODO-like", "State this person's core relationship to Python or its ecosystem.");
  }

  if (!isUsefulString(entry.data.field)) {
    pushError(entry, "field", "person.field is missing or TODO-like", "Name the person's main domain, such as language design, web frameworks, or data analysis.");
  }

  if ("quote" in entry.data && !isUsefulString(entry.data.quote)) {
    pushError(entry, "quote", "person.quote is present but not useful", "Use a memorable short quote or remove the optional quote field.");
  }

  const sources = asRecordArray(entry.data.sources);
  if (sources.length === 0) {
    pushError(entry, "sources", "person.sources must contain at least one source", "Add a verifiable official, PEP, repository, docs, or talk source.");
  }

  sources.forEach((source, index) => {
    if (!isUsefulString(source.label)) {
      pushError(entry, `sources[${index}].label`, "source label is missing or TODO-like", "Add a concise label naming the source.");
    }

    if (typeof source.url !== "string" || !source.url.startsWith("https://")) {
      pushError(entry, `sources[${index}].url`, "source url must be an https URL", "Use an https URL from an official, PEP, repository, docs, or talk source.");
    }
  });

  if ("earlyCareer" in entry.data) {
    const earlyCareer = entry.data.earlyCareer as Record<string, unknown> | undefined;

    if (!earlyCareer || typeof earlyCareer !== "object") {
      pushError(entry, "earlyCareer", "earlyCareer must be an object when present", "Use ageOrYear, whatTheyDid, itLedTo, and source; compare src/content/people/guido-van-rossum.mdx.");
    } else {
      if (!isUsefulString(earlyCareer.ageOrYear)) {
        pushError(entry, "earlyCareer.ageOrYear", "earlyCareer ageOrYear is missing or TODO-like", "Name the age or year that anchors the early-career moment.");
      }

      if (!isUsefulString(earlyCareer.whatTheyDid)) {
        pushError(entry, "earlyCareer.whatTheyDid", "earlyCareer whatTheyDid is missing or TODO-like", "Describe the concrete early work, not the later famous achievement.");
      }

      if (!isUsefulString(earlyCareer.itLedTo)) {
        pushError(entry, "earlyCareer.itLedTo", "earlyCareer itLedTo is missing or TODO-like", "Explain how that early work grew into a later influence.");
      }

      if (!isHttpsUrl(earlyCareer.source)) {
        pushError(entry, "earlyCareer.source", "earlyCareer source must be an https URL", "Use a first-party interview, official page, talk, or contemporaneous source.");
      }
    }
  }
}

for (const entry of paths) {
  if (asStringArray(entry.data.forWhom).length === 0) {
    pushError(entry, "forWhom", "path.forWhom must contain at least one useful audience trait", "Add concrete traits this path is designed for.");
  }

  if (asStringArray(entry.data.notForWhom).length === 0) {
    pushError(entry, "notForWhom", "path.notForWhom must contain at least one useful exclusion trait", "Add concrete traits that should choose another path first.");
  }

  if (!isUsefulString(entry.data.opportunityCost)) {
    pushError(entry, "opportunityCost", "path.opportunityCost is missing or TODO-like", "Explain what the learner gives up by choosing this path now.");
  }

  reportMissing(entry, "nodes", entry.data.nodes, conceptIds, "concept");
  const milestones = Array.isArray(entry.data.milestones)
    ? (entry.data.milestones as Record<string, unknown>[])
    : [];

  for (const milestone of milestones) {
    reportMissing(entry, "milestones.nodes", milestone.nodes, conceptIds, "concept");
    reportMissing(entry, "milestones.cases", milestone.cases, caseIds, "case");
    reportMissing(entry, "milestones.projects", milestone.projects, projectIds, "project");

    if (asStringArray(milestone.cases).length === 0) {
      pushError(entry, "milestones[].cases", "each milestone must contain at least one case", "Attach a case that applies the milestone nodes.");
    }

    if (asStringArray(milestone.projects).length === 0) {
      pushError(entry, "milestones[].projects", "each milestone must contain at least one project", "Attach a project that concludes the milestone.");
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
    const source = concepts.find((entry) => entry.id === id) ?? `src/content/concepts/${id}.mdx`;
    pushError(source, "prerequisites", `concept prerequisites graph must be a DAG; cycle detected: ${cycle}`, "Remove or reverse one prerequisite edge in the cycle.");
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
    pushError(entry, "appliedIn.cases", "MVP concepts must be covered by at least one case", "Add this id to a case.concepts[] or author a new case; compare src/content/cases/flask-routing.mdx.");
  }
}

for (const entry of cases) {
  if ((projectsByCase.get(entry.id) ?? []).length === 0) {
    pushError(entry, "projects", "MVP cases must support at least one project", "Add this case id to a project.cases[] field or create a project that uses it.");
  }
}

for (const entry of people) {
  if ((conceptsByPerson.get(entry.id) ?? []).length < 3) {
    pushError(entry, "concepts", "MVP people must connect to at least three concepts", "Add at least three concept ids that this person anchors; compare src/content/people/guido-van-rossum.mdx.");
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
  pushWarning("src/content", "graph.connectivity", `MVP content graph has isolated nodes: ${isolatedNodes.join(", ")}`, "Connect each isolated node through concepts, cases, projects, people, or paths.");
}

if (visited.size !== graphNodes.length) {
  const missing = graphNodes.filter((node) => !visited.has(node));
  pushWarning("src/content", "graph.connectivity", `MVP content graph has disconnected nodes: ${missing.join(", ")}`, "Connect disconnected nodes to the main graph through shared concept ids.");
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
