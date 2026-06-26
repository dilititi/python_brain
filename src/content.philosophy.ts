// src/content.philosophy.ts
//
// 接入方式：在 src/content.config.ts 顶部加
//   import { philosophyCollections } from "./content.philosophy";
// 然后把现有的
//   export const collections = { concepts, cases, projects, people, paths, assessments };
// 改成
//   export const collections = {
//     concepts, cases, projects, people, paths, assessments,
//     ...philosophyCollections
//   };
//
// 这一版对照了你项目里真实的 src/content.config.ts 改了三处：
//
// 1. API 用的是 Astro 6 的 Content Layer：defineCollection 配 loader:
//    glob(...)，schema 里的 z 来自 "astro/zod"，不是泛泛的 "astro:content"。
//    我最早那版用的是旧的 type: "content" 写法，在你这个 Astro 6.4 项目里
//    会报错，已经全部改过来。
//
// 2. 跨 collection 的引用沿用你已有的 slugRef = z.string().min(1) 字符串
//    引用写法，没有用 astro:content 的 reference()——这是你项目里
//    concepts/cases/projects/people/paths 全部在用的约定，新 collection
//    跟着同一套，渲染层才不用区分两种取值方式。
//
// 3. 两处命名冲突，已经改名：
//    - concepts → notions：你现有的 concepts collection 是 Python 知识图谱
//      专用的，schema 里的 conceptCategory（language/syntax/control-flow…）
//      和 mastery matrix 强绑定，哲学概念塞进去字段对不上。
//    - works → readings：你项目里 "works" 这个词已经被占用了——
//      works-registry.yaml + workRef/workLink 表示的是"被引用的外部资源"
//      （库、书、PEP、talk），是 citation 性质，不是要单独追踪阅读状态、
//      写笔记的实体。哲学场域里的《资本论》《规训与惩罚》这种要长期
//      跟读、记录状态的primary text，语义上不是一回事，改名 readings
//      避免和 workRef.id 的引用空间混淆。
//
// 另外 entries.date 没有用 z.date()，改成和你 concepts.updatedAt 一样的
// z.string().regex(/^\d{4}-\d{2}-\d{2}$/)——纯字符串，避免 YAML 把没加
// 引号的日期自动解析成 Date 对象、和 schema 类型对不上。

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import {
  abilityDimensionOrder,
  type AbilityDimension,
} from "./data/philosophy/abilities";
import { philosophySlugPattern } from "./lib/philosophy-authoring";

const slugRef = z.string().regex(philosophySlugPattern, {
  message: "reference must be a kebab-case slug"
});
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const abilityDimension = z.enum(
  [...abilityDimensionOrder] as [AbilityDimension, ...AbilityDimension[]]
);

const perspectives = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/perspectives" }),
  schema: z.object({
    title: z.string(),
    thinkers: z.array(z.string()).min(1),
    tradition: z.string().optional(), // 如「德国唯心论」「结构主义」「后结构主义」
    coreClaims: z.array(z.string()).min(1), // 理论自身的核心主张，不针对任何具体问题
    keyNotions: z.array(slugRef).default([]),
    readings: z.array(slugRef).default([]),
    summary: z.string().optional() // 一句话定调，给列表页 / 著作卡用
  })
});

const readings = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/readings" }),
  schema: z.object({
    title: z.string(),
    originalTitle: z.string().optional(),
    author: z.string(),
    year: z.number().optional(),
    perspective: slugRef,
    status: z.enum(["unread", "reading", "finished"]).default("unread"),
    updatedAt: dateString,
    notes: z.string().optional() // 版本、重点章节
  })
});

const notions = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notions" }),
  schema: z.object({
    title: z.string(),
    perspective: slugRef.optional(),
    summary: z.string(),
    abilities: z.array(abilityDimension).max(4).default([])
  })
});

const questionDimension = z.object({
  key: z.string().min(1), // 被下面 stances.answers.dimension 引用
  label: z.string() // 如「驱动历史的根本动力是什么」
});

const questionStance = z.object({
  perspective: slugRef,
  note: z.string(), // 一句话定调，矩阵表头下面的小字
  answers: z.array(
    z.object({
      dimension: z.string().min(1),
      position: z.string() // 自由文本，不是数字
    })
  )
});

const localMapNodeType = z.enum([
  "perspective",
  "reading",
  "source",
  "notion",
  "understanding-claim",
  "entry"
]);

const questionLocalMapSchema = z.object({
  enabled: z.boolean().default(false),
  variant: z.enum(["summary", "detail-panel", "object-map"]).default("summary"),
  includeTypes: z.array(localMapNodeType).default([
    "perspective",
    "reading",
    "source",
    "notion",
    "understanding-claim"
  ]),
  maxNodes: z.number().int().min(5).max(40).default(20),
  showLegend: z.boolean().default(true),
  showFilters: z.boolean().default(true),
  showDetailPanel: z.boolean().default(true),
  note: z.string().optional()
}).default({
  enabled: false,
  variant: "summary",
  includeTypes: [
    "perspective",
    "reading",
    "source",
    "notion",
    "understanding-claim"
  ],
  maxNodes: 20,
  showLegend: true,
  showFilters: true,
  showDetailPanel: true
});

const questionSchema = z
  .object({
    title: z.string(),
    status: z.enum(["open", "provisional", "settled"]).default("open"),
    abilities: z.array(abilityDimension).max(4).default([]),
    currentAnswer: z.string(), // 模块1：我的当前回答（摘要，正文里展开）
    dimensions: z.array(questionDimension).default([]), // 这套维度只对本问题成立
    stances: z.array(questionStance).default([]), // 模块2：理论回答矩阵的数据来源
    relatedReadings: z.array(slugRef).default([]), // 模块4：相关著作卡片
    openQuestions: z.array(z.string()).default([]),
    localMap: questionLocalMapSchema,
    updatedAt: dateString
  })
  .superRefine((data, ctx) => {
    // referential integrity：矩阵里每一格都要能对上声明过的维度，
    // 每个声明过的维度也都要被每个立场回答到——防止矩阵漏格或野字段，
    // 跟你项目里 case 的 superRefine 风格一致。
    const dimensionKeys = new Set(data.dimensions.map((dimension) => dimension.key));

    data.stances.forEach((stance, stanceIndex) => {
      const answeredKeys = new Set(stance.answers.map((answer) => answer.dimension));

      dimensionKeys.forEach((key) => {
        if (!answeredKeys.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["stances", stanceIndex, "answers"],
            message: `stance "${stance.perspective}" is missing an answer for dimension "${key}"`
          });
        }
      });

      stance.answers.forEach((answer, answerIndex) => {
        if (!dimensionKeys.has(answer.dimension)) {
          ctx.addIssue({
            code: "custom",
            path: ["stances", stanceIndex, "answers", answerIndex, "dimension"],
            message: `"${answer.dimension}" is not declared in this question's dimensions`
          });
        }
      });
    });
  });

const questions = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/questions" }),
  schema: questionSchema
});

const entries = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/entries" }),
  schema: z
    .object({
      title: z.string(),
      date: dateString,
      question: slugRef,
      triggeredBy: slugRef.optional(), // 哪条 reading 触发了这次转变
      fromVersion: z.number().int().nonnegative(),
      toVersion: z.number().int().positive(),
      reason: z.string(),
      evidence: z.array(z.string()).min(1),
      priorStance: z.string(),
      newStance: z.string(),
      accepted: z.array(z.string()).min(1),
      doubts: z.array(z.string()).min(1),
      newQuestions: z.array(z.string()).min(1)
    })
    .superRefine((data, ctx) => {
      if (data.toVersion !== data.fromVersion + 1) {
        ctx.addIssue({
          code: "custom",
          path: ["toVersion"],
          message: "toVersion must equal fromVersion + 1"
        });
      }
    })
});
// 模块3：阅读立场时间线，按 question 过滤、按 version 排序即可渲染

const understandingClaimTargetType = z.enum([
  "question",
  "notion",
  "perspective",
  "reading",
  "source",
  "entry",
  "concept",
  "case",
  "project",
  "person",
  "path",
  "other"
]);

const understandingClaimEvidenceType = z.enum([
  "paraphrase",
  "close-reading",
  "contextualization",
  "comparison",
  "application",
  "critique",
  "teaching",
  "original-language-check",
  "source-triangulation",
  "reflection",
  "other"
]);

const understandingClaimRefType = z.enum([
  "question",
  "notion",
  "perspective",
  "reading",
  "source",
  "entry",
  "concept",
  "case",
  "project",
  "person",
  "path",
  "external",
  "none"
]);

const understandingClaimEvidence = z.object({
  type: understandingClaimEvidenceType,
  refType: understandingClaimRefType.default("none"),
  ref: z.string().min(1).optional(),
  note: z.string().optional(),
  strength: z.enum(["weak", "moderate", "strong"]).default("moderate")
});

const understandingClaims = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/understanding-claims" }),
  schema: z
    .object({
      title: z.string(),
      targetType: understandingClaimTargetType,
      target: z.string().optional(),
      claim: z.string(),
      status: z.enum(["draft", "testing", "supported", "contested", "revised", "retired"]).default("draft"),
      confidence: z.enum(["low", "medium", "high"]).default("low"),
      relatedQuestions: z.array(slugRef).default([]),
      relatedNotions: z.array(slugRef).default([]),
      relatedPerspectives: z.array(slugRef).default([]),
      relatedReadings: z.array(slugRef).default([]),
      relatedSources: z.array(slugRef).default([]),
      relatedEntries: z.array(z.string().min(1)).default([]),
      evidence: z.array(understandingClaimEvidence).default([]),
      gaps: z.array(z.string()).default([]),
      counterEvidence: z.array(z.string()).default([]),
      nextTasks: z.array(z.string()).default([]),
      createdAt: dateString.optional(),
      updatedAt: dateString.optional()
    })
    .superRefine((data, ctx) => {
      if (data.status !== "draft" && data.targetType !== "other" && !data.target) {
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: `target is required when targetType is "${data.targetType}"`
        });
      }

      if (data.status !== "draft" && data.claim.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["claim"],
          message: "non-draft understanding claims need a claim of at least 10 characters"
        });
      }

      if (data.status === "supported" && data.evidence.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "supported understanding claims need at least one evidence item"
        });
      }

      if (data.confidence === "high" && data.evidence.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "high confidence understanding claims need at least two evidence items"
        });
      }

      data.evidence.forEach((item, index) => {
        if (item.refType !== "none" && item.refType !== "external" && !item.ref) {
          ctx.addIssue({
            code: "custom",
            path: ["evidence", index, "ref"],
            message: `ref is required when refType is "${item.refType}"`
          });
        }
      });
    })
});

export const philosophyCollections = {
  perspectives,
  readings,
  notions,
  questions,
  entries,
  "understanding-claims": understandingClaims
};
