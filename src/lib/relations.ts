import { getCollection, type CollectionEntry } from "astro:content";

export type ConceptEntry = CollectionEntry<"concepts">;
export type CaseEntry = CollectionEntry<"cases">;
export type ProjectEntry = CollectionEntry<"projects">;
export type PersonEntry = CollectionEntry<"people">;
export type PathEntry = CollectionEntry<"paths">;

type AnyEntry = ConceptEntry | CaseEntry | ProjectEntry | PersonEntry | PathEntry;

export type ConceptRelations = {
  concept: ConceptEntry;
  prerequisites: ConceptEntry[];
  related: ConceptEntry[];
  expandsTo: ConceptEntry[];
  cases: CaseEntry[];
  projects: ProjectEntry[];
  people: PersonEntry[];
  referencedBy: ConceptEntry[];
};

export async function getAllContent() {
  const [concepts, cases, projects, people, paths] = await Promise.all([
    getCollection("concepts"),
    getCollection("cases"),
    getCollection("projects"),
    getCollection("people"),
    getCollection("paths")
  ]);

  return { concepts, cases, projects, people, paths };
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
  const { concepts, cases, projects, people } = await getAllContent();
  const concept = concepts.find((entry) => entry.id === conceptId);

  if (!concept) {
    throw new Error(`Unknown concept: ${conceptId}`);
  }

  const caseIds = new Set(concept.data.appliedIn.cases);
  const projectIds = new Set(concept.data.appliedIn.projects);
  const personIds = new Set(concept.data.people);

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
      ...entry.data.expandsTo
    ].includes(conceptId);
  });

  return {
    concept,
    prerequisites: resolveMany(concepts, concept.data.prerequisites),
    related: resolveMany(concepts, concept.data.related),
    expandsTo: resolveMany(concepts, concept.data.expandsTo),
    cases: resolveMany(cases, [...caseIds]),
    projects: resolveMany(projects, [...projectIds]),
    people: resolveMany(people, [...personIds]),
    referencedBy
  };
}

export async function getPathConcepts(pathId: string) {
  const { concepts, paths } = await getAllContent();
  const path = paths.find((entry) => entry.id === pathId);

  if (!path) {
    throw new Error(`Unknown path: ${pathId}`);
  }

  return {
    path,
    concepts: resolveMany(concepts, path.data.nodes)
  };
}
