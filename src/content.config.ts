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
const httpsUrl = z.url().refine((value) => value.startsWith("https://"), {
  message: "source must be an https URL"
});

const workLink = z.object({
  title: z.string(),
  creator: z.string().optional(),
  type: z.enum(["library", "framework", "book", "talk", "pep", "project"]),
  url: url.optional(),
  role: z.string()
});

const workRef = z.object({
  id: slugRef,
  role: z.string()
});

const sourceLink = z.object({
  label: z.string(),
  url: httpsUrl
});

const caseCodeVersion = z.object({
  label: z.enum(["naive", "standard", "production"]),
  code: z.string()
});

const nonEmptyStringArray = z.array(z.string().min(1)).min(1);

const historyEvent = z
  .object({
    year: z.union([z.number(), z.string()]).optional(),
    pep: z.string().regex(/^PEP \d+$/).optional(),
    event: z.string(),
    source: httpsUrl.optional()
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

const mindsetShift = z.object({
  shift: z.string().max(60),
  why: z.string().max(200),
  blockedBy: z.array(z.string()).default([])
});

const earlyCareer = z.object({
  ageOrYear: z.string(),
  whatTheyDid: z.string().max(300),
  itLedTo: z.string().max(200),
  source: httpsUrl
});

const concepts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/concepts" }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(80),
    whyImportant: z.string().max(200),
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
    worksRef: z.array(workRef).default([]),
    history: z.array(historyEvent).min(1),
    tags: z.array(z.string()).default([]),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    codeExamples: z.array(codeExample).default([]),
    requiresMindset: z.array(mindsetShift).default([])
  })
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    scenario: z.string(),
    level,
    tracks: z.array(track).default([]),
    concepts: z.array(slugRef).min(2),
    project: slugRef.optional(),
    projects: z.array(slugRef).default([]),
    libraries: z.array(z.string()).default([]),
    people: z.array(slugRef).default([]),
    sourceUrl: httpsUrl.optional(),
    codeVersions: z
      .array(caseCodeVersion)
      .min(1)
      .refine((versions) => versions.some((version) => version.label === "standard"), {
        message: "case must include a standard code version"
      }),
    pitfalls: nonEmptyStringArray,
    extensions: nonEmptyStringArray
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),
    stage: level,
    description: z.string(),
    youWillLearn: nonEmptyStringArray,
    finalOutput: z.string(),
    structure: z.string(),
    coreFlow: nonEmptyStringArray,
    tracks: z.array(track).default([]),
    concepts: z.array(slugRef).min(3),
    cases: z.array(slugRef).default([]),
    people: z.array(slugRef).default([]),
    upgradePath: nonEmptyStringArray
  })
});

const people = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    field: z.string(),
    description: z.string(),
    quote: z.string().optional(),
    concepts: z.array(slugRef).min(3),
    works: z.array(workLink).default([]),
    sources: z.array(sourceLink).min(1),
    earlyCareer: earlyCareer.optional()
  })
});

const paths = defineCollection({
  loader: glob({ pattern: "**/*.{yaml,yml}", base: "./src/content/paths" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track,
    audience: z.string(),
    forWhom: nonEmptyStringArray,
    notForWhom: nonEmptyStringArray,
    opportunityCost: z.string().max(300),
    estimatedNodes: z.number(),
    nodes: z.array(slugRef),
    milestones: z
      .array(
        z.object({
          title: z.string(),
          nodes: z.array(slugRef),
          cases: z.array(slugRef).min(1),
          projects: z.array(slugRef).min(1)
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
