import type {
  ProgressAttempt,
  ProgressCategory,
  ProgressTier
} from "./progress-calculator";

export const progressCategoryLabels: Record<ProgressCategory, string> = {
  language: "语言身份",
  syntax: "基础语法",
  "control-flow": "控制流",
  "data-structure": "数据结构",
  function: "函数",
  oop: "面向对象",
  "module-eng": "模块工程",
  stdlib: "标准库"
};

export const progressTierLabels: Record<ProgressTier, string> = {
  tier1: "会语法",
  tier2: "会功能",
  tier3: "会工程",
  tier4: "融会贯通"
};

export const mockProgressAttempts: ProgressAttempt[] = [
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `mock-syntax-read-${index}`,
    category: "syntax" as const,
    occurredAt: "2026-06-04T08:00:00.000Z",
    kind: "concept-read" as const,
    conceptId: `syntax-concept-${index}`
  })),
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `mock-syntax-recognition-${index}`,
    category: "syntax" as const,
    occurredAt: "2026-06-04T08:10:00.000Z",
    kind: "assessment" as const,
    assessmentKind: "recognition" as const,
    assessmentId: `syntax-recognition-${index}`
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `mock-syntax-standard-${index}`,
    category: "syntax" as const,
    occurredAt: "2026-06-04T08:20:00.000Z",
    kind: "code-run" as const,
    codeExampleTitle: "standard" as const,
    conceptId: `syntax-standard-${index}`
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `mock-syntax-timed-${index}`,
    category: "syntax" as const,
    occurredAt: "2026-06-04T08:30:00.000Z",
    kind: "assessment" as const,
    assessmentKind: "timed-coding" as const,
    assessmentId: `syntax-timed-${index}`
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    id: `mock-syntax-pep8-${index}`,
    category: "syntax" as const,
    occurredAt: "2026-06-04T08:40:00.000Z",
    kind: "pep8" as const,
    assessmentId: `syntax-pep8-${index}`
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `mock-function-read-${index}`,
    category: "function" as const,
    occurredAt: "2026-06-04T09:00:00.000Z",
    kind: "concept-read" as const,
    conceptId: `function-concept-${index}`
  })),
  {
    id: "mock-function-debug-fail",
    category: "function",
    occurredAt: "2026-06-04T09:20:00.000Z",
    kind: "assessment",
    assessmentKind: "debugging",
    assessmentId: "function-debug-return-print",
    passed: false,
    pattern: "return 和 print 混淆"
  },
  {
    id: "mock-module-timed",
    category: "module-eng",
    occurredAt: "2026-06-04T09:30:00.000Z",
    kind: "assessment",
    assessmentKind: "timed-coding",
    assessmentId: "module-eng-timed-config-loader"
  }
];
