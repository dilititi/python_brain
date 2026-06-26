import { getCollection } from "astro:content";
import { buildPhilosophySearchDocuments, type SearchDocument } from "./philosophy-search";
import { getAllContent } from "./relations";

export async function getSearchDocuments() {
  const { concepts, cases, projects, people, paths } = await getAllContent();
  const [questions, perspectives, readings, notions, entries, sources, understandingClaims] = await Promise.all([
    getCollection("questions"),
    getCollection("perspectives"),
    getCollection("readings"),
    getCollection("notions"),
    getCollection("entries"),
    getCollection("sources"),
    getCollection("understanding-claims")
  ]);

  const pythonDocuments: SearchDocument[] = [
    ...concepts.map((entry) => ({
      id: `concept:${entry.id}`,
      title: entry.data.title,
      description: entry.data.summary,
      href: `/concepts/${entry.id}/`,
      kind: "知识点"
    })),
    ...cases.map((entry) => ({
      id: `case:${entry.id}`,
      title: entry.data.title,
      description: entry.data.description,
      href: `/cases/${entry.id}/`,
      kind: "案例"
    })),
    ...projects.map((entry) => ({
      id: `project:${entry.id}`,
      title: entry.data.title,
      description: entry.data.description,
      href: `/projects/${entry.id}/`,
      kind: "项目"
    })),
    ...people.map((entry) => ({
      id: `person:${entry.id}`,
      title: entry.data.name,
      description: entry.data.description,
      href: `/people/${entry.id}/`,
      kind: "人物"
    })),
    ...paths.map((entry) => ({
      id: `path:${entry.id}`,
      title: entry.data.title,
      description: entry.data.description,
      href: `/path/${entry.id}/`,
      kind: "方向"
    }))
  ];

  return [
    ...pythonDocuments,
    ...buildPhilosophySearchDocuments({
      questions,
      perspectives,
      readings,
      notions,
      entries,
      sources,
      understandingClaims
    })
  ];
}
