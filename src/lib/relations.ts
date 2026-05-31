import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
import YAML from "yaml";
import { planLearningPath } from "./path-planner";
export {
  buildRelationIndex,
  caseUsedIn,
  conceptNeighbors,
  conceptUsedIn,
  personPortfolio,
  type RelationIndex
} from "./relation-index";

export type ConceptEntry = CollectionEntry<"concepts">;
export type CaseEntry = CollectionEntry<"cases">;
export type ProjectEntry = CollectionEntry<"projects">;
export type PersonEntry = CollectionEntry<"people">;
export type PathEntry = CollectionEntry<"paths">;

export type WorkRegistryEntry = {
  id: string;
  title: string;
  creator?: string;
  type: string;
  url?: string;
};

export type ConceptWork = WorkRegistryEntry & {
  role: string;
};

type AnyEntry = ConceptEntry | CaseEntry | ProjectEntry | PersonEntry | PathEntry;

export type ConceptRelations = {
  concept: ConceptEntry;
  prerequisites: ConceptEntry[];
  related: ConceptEntry[];
  extends: ConceptEntry[];
  cases: CaseEntry[];
  projects: ProjectEntry[];
  people: PersonEntry[];
  works: ConceptWork[];
  referencedBy: ConceptEntry[];
};

let worksRegistryCache: WorkRegistryEntry[] | undefined;

async function getWorksRegistry() {
  if (worksRegistryCache) {
    return worksRegistryCache;
  }

  const raw = await readFile(
    join(process.cwd(), "src", "content", "works-registry.yaml"),
    "utf8"
  );
  const parsed = YAML.parse(raw) as { works?: WorkRegistryEntry[] } | null;
  worksRegistryCache = Array.isArray(parsed?.works) ? parsed.works : [];
  return worksRegistryCache;
}

export async function getAllContent() {
  const [concepts, cases, projects, people, paths, works] = await Promise.all([
    getCollection("concepts"),
    getCollection("cases"),
    getCollection("projects"),
    getCollection("people"),
    getCollection("paths"),
    getWorksRegistry()
  ]);

  return { concepts, cases, projects, people, paths, works };
}

export function byId<T extends AnyEntry>(entries: T[]) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export function resolveMany<T extends AnyEntry>(entries: T[], ids: string[]) {
  const index = byId(entries);
  return ids
    .map((id) => index.get(id))
    .filter((entry): entry is T => Boolean(entry));
}

export async function getConceptRelations(
  conceptId: string
): Promise<ConceptRelations> {
  const { concepts, cases, projects, people, works } = await getAllContent();
  const concept = concepts.find((entry) => entry.id === conceptId);

  if (!concept) {
    throw new Error(`Unknown concept: ${conceptId}`);
  }

  const caseIds = new Set(concept.data.appliedIn.cases);
  const projectIds = new Set(concept.data.appliedIn.projects);
  const personIds = new Set(concept.data.people);
  const worksById = new Map(works.map((work) => [work.id, work]));
  const conceptWorks: ConceptWork[] = [];
  const seenWorks = new Set<string>();

  for (const ref of concept.data.worksRef) {
    const work = worksById.get(ref.id);

    if (!work) {
      continue;
    }

    conceptWorks.push({
      ...work,
      role: ref.role
    });
    seenWorks.add(work.id);
  }

  for (const work of concept.data.works) {
    const fallbackId = [
      "inline",
      work.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    ].filter(Boolean).join("-");

    if (seenWorks.has(fallbackId)) {
      continue;
    }

    conceptWorks.push({
      id: fallbackId,
      title: work.title,
      creator: work.creator,
      type: work.type,
      url: work.url,
      role: work.role
    });
    seenWorks.add(fallbackId);
  }

  for (const entry of cases) {
    if (entry.data.concepts.includes(conceptId)) {
      caseIds.add(entry.id);
    }
  }

  for (const entry of projects) {
    if (entry.data.concepts.includes(conceptId)) {
      projectIds.add(entry.id);
    }
  }

  for (const entry of people) {
    if (entry.data.concepts.includes(conceptId)) {
      personIds.add(entry.id);
    }
  }

  const referencedBy = concepts.filter((entry) => {
    if (entry.id === conceptId) {
      return false;
    }

    return [
      ...entry.data.prerequisites,
      ...entry.data.related,
      ...entry.data.extends
    ].includes(conceptId);
  });

  return {
    concept,
    prerequisites: resolveMany(concepts, concept.data.prerequisites),
    related: resolveMany(concepts, concept.data.related),
    extends: resolveMany(concepts, concept.data.extends),
    cases: resolveMany(cases, [...caseIds]),
    projects: resolveMany(projects, [...projectIds]),
    people: resolveMany(people, [...personIds]),
    works: conceptWorks,
    referencedBy
  };
}

export async function getPathConcepts(pathId: string) {
  const { concepts, paths } = await getAllContent();
  const path = paths.find((entry) => entry.id === pathId);

  if (!path) {
    throw new Error(`Unknown path: ${pathId}`);
  }

  const plan = planLearningPath({
    concepts: concepts.map((entry) => ({
      id: entry.id,
      prerequisites: entry.data.prerequisites
    })),
    targetNodes: path.data.nodes
  });

  return {
    path,
    concepts: resolveMany(concepts, plan.nodes)
  };
}
