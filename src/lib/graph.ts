import {
  conceptNeighbors,
  conceptUsedIn,
  getAllContent,
  getRelationIndex
} from "./relations";

export type GraphNode = {
  id: string;
  label: string;
  kind: "concept" | "case" | "project" | "person";
  category?: string;
  href: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind:
    | "prerequisite"
    | "related"
    | "extends"
    | "applies"
    | "builds"
    | "created-by";
};

function addEdge(edges: GraphEdge[], edge: Omit<GraphEdge, "id">) {
  const id = `${edge.source}:${edge.kind}:${edge.target}`;

  if (!edges.some((item) => item.id === id)) {
    edges.push({ id, ...edge });
  }
}

export async function buildGraph() {
  const [{ concepts, cases, projects, people }, relationIndex] = await Promise.all([
    getAllContent(),
    getRelationIndex()
  ]);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const entry of concepts) {
    const neighbors = conceptNeighbors(relationIndex, entry.id);
    const usedIn = conceptUsedIn(relationIndex, entry.id);

    nodes.push({
      id: `concept:${entry.id}`,
      label: entry.data.title,
      kind: "concept",
      category: entry.data.category,
      href: `/concepts/${entry.id}/`
    });

    for (const target of neighbors.prerequisites) {
      addEdge(edges, {
        source: `concept:${target}`,
        target: `concept:${entry.id}`,
        kind: "prerequisite"
      });
    }

    for (const target of neighbors.related) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `concept:${target}`,
        kind: "related"
      });
    }

    for (const target of neighbors.extends) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `concept:${target}`,
        kind: "extends"
      });
    }

    for (const caseId of usedIn.cases) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `case:${caseId}`,
        kind: "applies"
      });
    }

    for (const projectId of usedIn.projects) {
      addEdge(edges, {
        source: `concept:${entry.id}`,
        target: `project:${projectId}`,
        kind: "builds"
      });
    }

    for (const personId of usedIn.people) {
      addEdge(edges, {
        source: `person:${personId}`,
        target: `concept:${entry.id}`,
        kind: "created-by"
      });
    }
  }

  for (const entry of cases) {
    nodes.push({
      id: `case:${entry.id}`,
      label: entry.data.title,
      kind: "case",
      href: `/cases/${entry.id}/`
    });

    for (const projectId of relationIndex.cases[entry.id]?.projects ?? []) {
      addEdge(edges, {
        source: `case:${entry.id}`,
        target: `project:${projectId}`,
        kind: "builds"
      });
    }
  }

  for (const entry of projects) {
    nodes.push({
      id: `project:${entry.id}`,
      label: entry.data.title,
      kind: "project",
      href: `/projects/${entry.id}/`
    });
  }

  for (const entry of people) {
    nodes.push({
      id: `person:${entry.id}`,
      label: entry.data.name,
      kind: "person",
      href: `/people/${entry.id}/`
    });
  }

  return { nodes, edges };
}
