import assert from "node:assert/strict";
import test from "node:test";
import { auditConceptRecord } from "../scripts/audit-concepts";

const baseConcept = {
  summary: "一条简短定义。",
  whyImportant: "说明这个知识点为什么有用。",
  category: "syntax",
  worksRef: [
    {
      id: "python-docs",
      role: "官方文档承载这个概念。"
    }
  ]
};

test("concept codeExamples errors are blocking by default", () => {
  const issues = auditConceptRecord({
    label: "src/content/concepts/example.mdx",
    data: {
      ...baseConcept,
      codeExamples: []
    }
  });

  assert.equal(issues.filter((item) => item.severity === "error").length, 3);
  assert.equal(issues.filter((item) => item.severity === "warning").length, 0);
});

test("strict codeExamples flag remains compatible with default blocking errors", () => {
  const issues = auditConceptRecord({
    label: "src/content/concepts/example.mdx",
    data: {
      ...baseConcept,
      codeExamples: [
        {
          title: "standard",
          description: "推荐写法。",
          code: "print('ok')"
        }
      ]
    }
  }, { strictCodeExamples: true });

  assert.equal(issues.filter((item) => item.severity === "error").length, 2);
});

test("language concepts require useful display code but not three versions", () => {
  const issues = auditConceptRecord({
    label: "src/content/concepts/python-philosophy.mdx",
    data: {
      ...baseConcept,
      category: "language",
      codeExamples: [
        {
          title: "import this",
          description: "展示 Python 哲学。",
          code: "import this"
        }
      ]
    }
  });

  assert.deepEqual(issues, []);
});

test("TODO-like code is not useful", () => {
  const issues = auditConceptRecord({
    label: "src/content/concepts/example.mdx",
    data: {
      ...baseConcept,
      codeExamples: [
        {
          title: "naive",
          description: "新人写法。",
          code: "# TODO"
        }
      ]
    }
  });

  assert.equal(issues.filter((item) => item.severity === "error").length, 3);
  assert.equal(issues.filter((item) => item.severity === "warning").length, 0);
});
