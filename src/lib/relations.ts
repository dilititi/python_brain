import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
import YAML from "yaml";
import { planLearningPath } from "./path-planner";
import {
  conceptNeighbors as indexedConceptNeighbors,
  conceptUsedIn as indexedConceptUsedIn,
  type RelationIndex
} from "./relation-index";
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

export type ConceptPathContext = {
  id: string;
  title: string;
  currentIndex: number;
  total: number;
  previous?: {
    id: string;
    title: string;
  };
  next?: {
    id: string;
    title: string;
  };
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
  pathContexts: ConceptPathContext[];
};

let worksRegistryCache: WorkRegistryEntry[] | undefined;
let relationIndexCache: RelationIndex | undefined;

async function getGeneratedRelationIndex() {
  if (relationIndexCache) {
    return relationIndexCache;
  }

  const raw = await readFile(
    join(process.cwd(), "src", "generated", "relations.json"),
    "utf8"
  );
  relationIndexCache = JSON.parse(raw) as RelationIndex;
  return relationIndexCache;
}

export async function getRelationIndex() {
  return getGeneratedRelationIndex();
}

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
  const [{ concepts, cases, projects, people, paths, works }, relationIndex] =
    await Promise.all([getAllContent(), getGeneratedRelationIndex()]);
  const concept = concepts.find((entry) => entry.id === conceptId);

  if (!concept) {
    throw new Error(`Unknown concept: ${conceptId}`);
  }

  const usedIn = indexedConceptUsedIn(relationIndex, conceptId);
  const neighbors = indexedConceptNeighbors(relationIndex, conceptId);
  const caseIds = new Set(usedIn.cases);
  const projectIds = new Set(usedIn.projects);
  const personIds = new Set(usedIn.people);
  const worksById = new Map(works.map((work) => [work.id, work]));
  const conceptById = byId(concepts);
  const conceptWorks: ConceptWork[] = [];
  const pathContexts: ConceptPathContext[] = [];

  for (const ref of concept.data.worksRef) {
    const work = worksById.get(ref.id);

    if (!work) {
      continue;
    }

    conceptWorks.push({
      ...work,
      role: ref.role
    });
  }

  const planNodes = concepts.map((item) => ({
    id: item.id,
    prerequisites: indexedConceptNeighbors(relationIndex, item.id).prerequisites
  }));

  for (const path of paths) {
    const plan = planLearningPath({
      concepts: planNodes,
      targetNodes: path.data.nodes
    });
    const currentIndex = plan.nodes.indexOf(conceptId);

    if (currentIndex < 0) {
      continue;
    }

    const previousId = plan.nodes[currentIndex - 1];
    const nextId = plan.nodes[currentIndex + 1];
    const previous = previousId ? conceptById.get(previousId) : undefined;
    const next = nextId ? conceptById.get(nextId) : undefined;

    pathContexts.push({
      id: path.id,
      title: path.data.title,
      currentIndex: currentIndex + 1,
      total: plan.nodes.length,
      previous: previous ? { id: previous.id, title: previous.data.title } : undefined,
      next: next ? { id: next.id, title: next.data.title } : undefined
    });
  }

  return {
    concept,
    prerequisites: resolveMany(concepts, neighbors.prerequisites),
    related: resolveMany(concepts, neighbors.related),
    extends: resolveMany(concepts, neighbors.extends),
    cases: resolveMany(cases, [...caseIds]),
    projects: resolveMany(projects, [...projectIds]),
    people: resolveMany(people, [...personIds]),
    works: conceptWorks,
    referencedBy: resolveMany(concepts, neighbors.successors),
    pathContexts
  };
}

export async function getPathConcepts(pathId: string) {
  const [{ concepts, paths }, relationIndex] = await Promise.all([
    getAllContent(),
    getGeneratedRelationIndex()
  ]);
  const path = paths.find((entry) => entry.id === pathId);

  if (!path) {
    throw new Error(`Unknown path: ${pathId}`);
  }

  const plan = planLearningPath({
    concepts: concepts.map((entry) => ({
      id: entry.id,
      prerequisites: indexedConceptNeighbors(relationIndex, entry.id).prerequisites
    })),
    targetNodes: path.data.nodes
  });

  return {
    path,
    concepts: resolveMany(concepts, plan.nodes)
  };
}
