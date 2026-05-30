export type ContentEntry<TData extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  data: TData;
};

export type WorkLink = {
  title: string;
  creator?: string;
  type: string;
  url?: string;
  role: string;
};

export type RelationIndexInput = {
  concepts: ContentEntry[];
  cases: ContentEntry[];
  projects: ContentEntry[];
  people: ContentEntry[];
  paths: ContentEntry[];
};

export type ConceptUsedIn = {
  cases: string[];
  projects: string[];
  people: string[];
  paths: string[];
};

export type ConceptNeighbors = {
  prerequisites: string[];
  successors: string[];
  related: string[];
  extends: string[];
};

export type RelationIndex = {
  meta: {
    version: 1;
    contentHash: string;
  };
  concepts: Record<
    string,
    {
      usedIn: ConceptUsedIn;
      neighbors: ConceptNeighbors;
    }
  >;
  cases: Record<
    string,
    {
      project: string | null;
      projects: string[];
    }
  >;
  people: Record<
    string,
    {
      concepts: string[];
      works: WorkLink[];
    }
  >;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function workArray(value: unknown): WorkLink[] {
  return Array.isArray(value)
    ? value.filter((item): item is WorkLink => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const work = item as Record<string, unknown>;
        return typeof work.title === "string" && typeof work.role === "string";
      })
    : [];
}

function sorted(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function emptyUsedIn(): ConceptUsedIn {
  return {
    cases: [],
    projects: [],
    people: [],
    paths: []
  };
}

function emptyNeighbors(): ConceptNeighbors {
  return {
    prerequisites: [],
    successors: [],
    related: [],
    extends: []
  };
}

export function buildRelationIndex(
  input: RelationIndexInput,
  contentHash: string
): RelationIndex {
  const conceptUsedInMap = new Map<string, ConceptUsedIn>();
  const conceptNeighborsMap = new Map<string, ConceptNeighbors>();
  const caseProjectsMap = new Map<string, Set<string>>();
  const peopleMap = new Map<string, { concepts: string[]; works: WorkLink[] }>();

  for (const concept of input.concepts) {
    conceptUsedInMap.set(concept.id, emptyUsedIn());
    conceptNeighborsMap.set(concept.id, {
      prerequisites: sorted(stringArray(concept.data.prerequisites)),
      successors: [],
      related: sorted(stringArray(concept.data.related)),
      extends: sorted(stringArray(concept.data.extends))
    });
  }

  for (const concept of input.concepts) {
    for (const prerequisite of stringArray(concept.data.prerequisites)) {
      const neighbor = conceptNeighborsMap.get(prerequisite) ?? emptyNeighbors();
      neighbor.successors = sorted([...neighbor.successors, concept.id]);
      conceptNeighborsMap.set(prerequisite, neighbor);
    }
  }

  for (const caseEntry of input.cases) {
    caseProjectsMap.set(caseEntry.id, new Set());

    for (const concept of stringArray(caseEntry.data.concepts)) {
      const usedIn = conceptUsedInMap.get(concept) ?? emptyUsedIn();
      usedIn.cases = sorted([...usedIn.cases, caseEntry.id]);
      conceptUsedInMap.set(concept, usedIn);
    }
  }

  for (const project of input.projects) {
    for (const concept of stringArray(project.data.concepts)) {
      const usedIn = conceptUsedInMap.get(concept) ?? emptyUsedIn();
      usedIn.projects = sorted([...usedIn.projects, project.id]);
      conceptUsedInMap.set(concept, usedIn);
    }

    for (const caseId of stringArray(project.data.cases)) {
      const projects = caseProjectsMap.get(caseId) ?? new Set<string>();
      projects.add(project.id);
      caseProjectsMap.set(caseId, projects);
    }
  }

  for (const person of input.people) {
    const concepts = sorted(stringArray(person.data.concepts));
    peopleMap.set(person.id, {
      concepts,
      works: workArray(person.data.works)
    });

    for (const concept of concepts) {
      const usedIn = conceptUsedInMap.get(concept) ?? emptyUsedIn();
      usedIn.people = sorted([...usedIn.people, person.id]);
      conceptUsedInMap.set(concept, usedIn);
    }
  }

  for (const path of input.paths) {
    for (const concept of stringArray(path.data.nodes)) {
      const usedIn = conceptUsedInMap.get(concept) ?? emptyUsedIn();
      usedIn.paths = sorted([...usedIn.paths, path.id]);
      conceptUsedInMap.set(concept, usedIn);
    }
  }

  const concepts = Object.fromEntries(
    sorted(conceptUsedInMap.keys()).map((id) => [
      id,
      {
        usedIn: conceptUsedInMap.get(id) ?? emptyUsedIn(),
        neighbors: conceptNeighborsMap.get(id) ?? emptyNeighbors()
      }
    ])
  );

  const cases = Object.fromEntries(
    sorted(caseProjectsMap.keys()).map((id) => {
      const projects = sorted(caseProjectsMap.get(id) ?? []);
      return [
        id,
        {
          project: projects[0] ?? null,
          projects
        }
      ];
    })
  );

  const people = Object.fromEntries(
    sorted(peopleMap.keys()).map((id) => [
      id,
      peopleMap.get(id) ?? { concepts: [], works: [] }
    ])
  );

  return {
    meta: {
      version: 1,
      contentHash
    },
    concepts,
    cases,
    people
  };
}

export function conceptUsedIn(index: RelationIndex, id: string): ConceptUsedIn {
  return index.concepts[id]?.usedIn ?? emptyUsedIn();
}

export function caseUsedIn(index: RelationIndex, id: string): string | null {
  return index.cases[id]?.project ?? null;
}

export function personPortfolio(
  index: RelationIndex,
  id: string
): { concepts: string[]; works: WorkLink[] } {
  return index.people[id] ?? { concepts: [], works: [] };
}

export function conceptNeighbors(index: RelationIndex, id: string): ConceptNeighbors {
  return index.concepts[id]?.neighbors ?? emptyNeighbors();
}
