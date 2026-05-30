import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");
const registryPath = join(root, "src", "content", "works-registry.yaml");

type InlineWork = {
  title?: string;
  creator?: string;
  type?: string;
  url?: string;
  role?: string;
};

type WorkRegistryItem = {
  id: string;
  title: string;
  creator?: string;
  type: string;
  url?: string;
};

type WorkRef = {
  id: string;
  role: string;
};

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "work";
}

function uniqueSlug(base: string, used: Set<string>) {
  let candidate = base;
  let index = 2;

  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  used.add(candidate);
  return candidate;
}

function keyFor(work: InlineWork) {
  return `${work.title ?? ""}\0${work.url ?? ""}`;
}

function withOrderedWorksRef(data: Record<string, unknown>, worksRef: WorkRef[]) {
  const next: Record<string, unknown> = {};
  let inserted = false;

  for (const [key, value] of Object.entries(data)) {
    if (key === "works" || key === "worksRef") {
      continue;
    }

    if (key === "history" && !inserted) {
      next.worksRef = worksRef;
      inserted = true;
    }

    next[key] = value;
  }

  if (!inserted) {
    next.worksRef = worksRef;
  }

  return next;
}

const files = (await readdir(conceptsRoot))
  .filter((file) => /\.mdx?$/.test(file))
  .sort();

const registry = new Map<string, WorkRegistryItem>();
const idsByKey = new Map<string, string>();
const usedIds = new Set<string>();
let migratedFiles = 0;

try {
  const rawRegistry = await readFile(registryPath, "utf8");
  const parsed = YAML.parse(rawRegistry) as { works?: WorkRegistryItem[] } | null;

  for (const work of Array.isArray(parsed?.works) ? parsed.works : []) {
    registry.set(work.id, work);
    idsByKey.set(keyFor(work), work.id);
    usedIds.add(work.id);
  }
} catch (error) {
  const code = error && typeof error === "object" && "code" in error
    ? (error as { code?: string }).code
    : undefined;

  if (code !== "ENOENT") {
    throw error;
  }
}

for (const file of files) {
  const path = join(conceptsRoot, file);
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);
  const works = Array.isArray(parsed.data.works) ? (parsed.data.works as InlineWork[]) : [];

  for (const work of works) {
    if (!work.title || !work.type) {
      continue;
    }

    const key = keyFor(work);
    if (idsByKey.has(key)) {
      continue;
    }

    const id = uniqueSlug(slugify(work.title), usedIds);
    idsByKey.set(key, id);
    registry.set(id, {
      id,
      title: work.title,
      creator: work.creator,
      type: work.type,
      url: work.url
    });
  }
}

for (const file of files) {
  const path = join(conceptsRoot, file);
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);
  const works = Array.isArray(parsed.data.works) ? (parsed.data.works as InlineWork[]) : [];

  const existingRefs = Array.isArray(parsed.data.worksRef)
    ? (parsed.data.worksRef as WorkRef[])
    : [];

  if (works.length === 0 && existingRefs.length === 0) {
    continue;
  }

  const refsById = new Map(existingRefs.map((ref) => [ref.id, ref]));

  for (const work of works) {
    const id = idsByKey.get(keyFor(work));
    if (!id || !work.role || refsById.has(id)) {
      continue;
    }

    refsById.set(id, {
      id,
      role: work.role
    });
  }

  parsed.data = withOrderedWorksRef(parsed.data, [...refsById.values()]);
  const nextRaw = matter.stringify(parsed.content, parsed.data);

  if (nextRaw !== raw) {
    migratedFiles += 1;
    await writeFile(path, nextRaw, "utf8");
  }
}

const registryData = {
  works: [...registry.values()].sort((left, right) => left.id.localeCompare(right.id))
};

await writeFile(registryPath, YAML.stringify(registryData, { lineWidth: 0 }), "utf8");

console.log(
  `Updated ${migratedFiles} concepts for worksRef and wrote ${registryData.works.length} works to src/content/works-registry.yaml`
);
