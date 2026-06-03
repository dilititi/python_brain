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
const todoPattern = /TODO|待补|暂无说明/;
const requiredCodeExampleTitles = ["naive", "standard", "production"] as const;
const conceptCategory = z.enum([
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
]);

const activeAssessmentCategory = z.enum([
  "language",
  "syntax",
  "control-flow",
  "data-structure",
  "function",
  "oop",
  "module-eng",
  "stdlib"
]);

const assessmentKind = z.enum([
  "recognition",
  "debugging",
  "completion",
  "timed-coding",
  "refactor"
]);

const targetTier = z.enum(["tier1", "tier2", "tier3", "tier4"]);

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

const assessmentChoice = z.object({
  label: z.string(),
  value: z.string(),
  correct: z.boolean().default(false),
  feedback: z.string().optional()
});

const assessmentTestCase = z.object({
  name: z.string(),
  input: z.unknown().optional(),
  expected: z.unknown().optional(),
  code: z.string().optional()
});

function isUsefulString(value: string) {
  return value.trim().length > 0 && !todoPattern.test(value);
}

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

const conceptSchema = z
  .object({
    title: z.string(),
    summary: z.string().max(80),
    whyImportant: z.string().max(200),
    definition: z.string(),
    mentalModel: z.string(),
    category: conceptCategory,
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
  .superRefine((data, ctx) => {
    const usefulExamples = data.codeExamples.filter((example) => (
      isUsefulString(example.title) &&
      isUsefulString(example.description) &&
      isUsefulString(example.code)
    ));

    if (data.category === "language") {
      if (usefulExamples.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["codeExamples"],
          message: "language concepts need at least one useful display code example"
        });
      }

      return;
    }

    for (const title of requiredCodeExampleTitles) {
      const example = usefulExamples.find((item) => item.title === title);

      if (!example) {
        ctx.addIssue({
          code: "custom",
          path: ["codeExamples", title],
          message: `non-language concepts need a useful ${title} code example`
        });
      }
    }

    data.codeExamples.forEach((example, index) => {
      if (!requiredCodeExampleTitles.includes(example.title as (typeof requiredCodeExampleTitles)[number])) {
        ctx.addIssue({
          code: "custom",
          path: ["codeExamples", index, "title"],
          message: "codeExamples title must be naive, standard, or production"
        });
      }
    });
  });

const concepts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/concepts" }),
  schema: conceptSchema
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

const assessmentSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    category: activeAssessmentCategory,
    kind: assessmentKind,
    targetTier,
    concepts: z.array(slugRef).min(1),
    prompt: z.string(),
    timeLimit: z.number().int().positive().optional(),
    starterCode: z.string().optional(),
    testCases: z.array(assessmentTestCase).default([]),
    choices: z.array(assessmentChoice).default([]),
    referenceSolution: z.string().optional(),
    rubric: nonEmptyStringArray
  })
  .superRefine((data, ctx) => {
    if (data.kind === "recognition") {
      if (data.choices.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: "recognition assessments need at least two choices"
        });
      }

      if (data.choices.filter((choice) => choice.correct).length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: "recognition assessments need exactly one correct choice"
        });
      }

      return;
    }

    if (!isUsefulString(data.starterCode ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["starterCode"],
        message: `${data.kind} assessments need starterCode`
      });
    }

    if (!isUsefulString(data.referenceSolution ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["referenceSolution"],
        message: `${data.kind} assessments need referenceSolution`
      });
    }

    if (data.testCases.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["testCases"],
        message: `${data.kind} assessments need at least one test case`
      });
    }

    if (data.kind === "timed-coding" && !data.timeLimit) {
      ctx.addIssue({
        code: "custom",
        path: ["timeLimit"],
        message: "timed-coding assessments need timeLimit"
      });
    }
  });

const assessments = defineCollection({
  loader: glob({ pattern: "**/*.{yaml,yml}", base: "./src/content/assessments" }),
  schema: assessmentSchema
});

export const collections = {
  concepts,
  cases,
  projects,
  people,
  paths,
  assessments
};
