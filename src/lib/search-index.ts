import { getAllContent } from "./relations";

export async function getSearchDocuments() {
  const { concepts, cases, projects, people, paths } = await getAllContent();

  return [
    ...concepts.map((entry) => ({
      id: `concept:${entry.id}`,
      title: entry.data.title,
      description: entry.data.description,
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
      kind: "路径"
    }))
  ];
}
