import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const slugRef = z.string().min(1);

const track = z.enum([
  "beginner",
  "web",
  "data",
  "automation",
  "ai",
  "creative"
]);

const level = z.enum(["intro", "core", "advanced"]);
const url = z.url();

const workLink = z.object({
  title: z.string(),
  creator: z.string().optional(),
  type: z.enum(["library", "framework", "book", "talk", "pep", "project"]),
  url: url.optional(),
  role: z.string()
});

const historyEvent = z
  .object({
    year: z.union([z.number(), z.string()]).optional(),
    pep: z.string().regex(/^PEP \d+$/).optional(),
    event: z.string(),
    source: url.optional()
  })
  .refine((event) => event.year || event.pep, {
    message: "history event must include year or pep"
  });

const codeExample = z.object({
  title: z.string(),
  description: z.string(),
  code: z.string(),
  runnable: z.boolean().default(true)
});

const concepts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/concepts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    summary: z.string().max(80).optional(),
    whyImportant: z.string().max(200).optional(),
    definition: z.string(),
    mentalModel: z.string(),
    category: z.enum([
      "language",
      "syntax",
      "control-flow",
      "data-structure",
      "function",
      "oop",
      "file-io",
      "module-eng",
      "stdlib",
      "third-party"
    ]),
    level,
    tracks: z.array(track).default([]),
    prerequisites: z.array(slugRef).default([]),
    related: z.array(slugRef).default([]),
    extends: z.array(slugRef).default([]),
    appliedIn: z
      .object({
        cases: z.array(slugRef).default([]),
        projects: z.array(slugRef).default([])
      })
      .default({ cases: [], projects: [] }),
    people: z.array(slugRef).default([]),
    works: z.array(workLink).default([]),
    history: z.array(historyEvent).min(1),
    tags: z.array(z.string()).default([]),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    codeExamples: z.array(codeExample).default([])
  })
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    scenario: z.string(),
    difficulty: level,
    tracks: z.array(track).default([]),
    concepts: z.array(slugRef).default([]),
    projects: z.array(slugRef).default([]),
    people: z.array(slugRef).default([]),
    sourceUrl: url.optional(),
    code: z.string().optional()
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    outcome: z.string(),
    difficulty: level,
    tracks: z.array(track).default([]),
    concepts: z.array(slugRef).default([]),
    cases: z.array(slugRef).default([]),
    people: z.array(slugRef).default([]),
    milestones: z.array(z.string()).default([])
  })
});

const people = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    roles: z.array(z.string()).default([]),
    concepts: z.array(slugRef).default([]),
    works: z.array(workLink).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          url
        })
      )
      .default([])
  })
});

const paths = defineCollection({
  loader: glob({ pattern: "**/*.{yaml,yml}", base: "./src/content/paths" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track,
    audience: z.string(),
    estimatedNodes: z.number(),
    nodes: z.array(slugRef),
    milestones: z
      .array(
        z.object({
          title: z.string(),
          nodes: z.array(slugRef)
        })
      )
      .default([]),
    explorationDay: z
      .object({
        cadence: z.string(),
        prompt: z.string()
      })
      .optional()
  })
});

export const collections = {
  concepts,
  cases,
  projects,
  people,
  paths
};
