# Philosophy Authoring Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stable question/source authoring commands and reject malformed philosophy slugs or incomplete cross-collection relationships before Astro builds.

**Architecture:** Pure TypeScript helpers own slug rules and MDX rendering; one filesystem CLI writes either collection and delegates final integrity checks to the existing validator. Astro schemas and the independent relationship validator enforce the same slug contract.

**Tech Stack:** Astro 6.4 Content Layer, TypeScript, Node.js built-ins, gray-matter, node:test.

---

### Task 1: Define the authoring contract with failing tests

**Files:**
- Create: `tests/philosophy-authoring.test.ts`
- Create: `src/lib/philosophy-authoring.ts`

- [ ] **Step 1: Write failing tests for `assertPhilosophyId`, question templates, and source templates**

```ts
assert.doesNotThrow(() => assertPhilosophyId("questions", "what-is-history"));
assert.throws(() => assertPhilosophyId("questions", "What_Is_History"), /kebab-case/);
assert.match(renderQuestionTemplate({ id: "what-is-freedom", title: "自由是什么？", date: "2026-06-22" }), /status: open/);
assert.match(renderSourceTemplate(validSourceOptions), /relatedQuestions:\n  - what-is-history/);
```

- [ ] **Step 2: Run `npx tsx --test tests/philosophy-authoring.test.ts` and confirm module-not-found failure**

- [ ] **Step 3: Implement pure validation and render functions without filesystem access**

- [ ] **Step 4: Re-run the focused test and confirm all authoring tests pass**

### Task 2: Strengthen relation validation with TDD

**Files:**
- Modify: `tests/philosophy-relations.test.ts`
- Modify: `src/lib/philosophy-relations.ts`
- Modify: `src/content.philosophy.ts`
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add failing cases for malformed ids, malformed references, and an entry reading absent from its question**

```ts
fixture.questions[0].id = "What_Is_History";
fixture.sources[0].data.relatedQuestions = ["bad reference"];
fixture.entries[0].data.triggeredBy = "other-reading";
```

- [ ] **Step 2: Run the focused relation test and verify the new assertions fail for missing behavior**

- [ ] **Step 3: Add shared regex behavior to the independent validator and matching regex constraints to both Content Layer schemas**

- [ ] **Step 4: Re-run both focused suites and confirm they pass**

### Task 3: Add the filesystem command

**Files:**
- Create: `scripts/new-philosophy-content.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `new:question` and `new:source` scripts that select a template type**

```json
"new:question": "tsx scripts/new-philosophy-content.ts question",
"new:source": "tsx scripts/new-philosophy-content.ts source"
```

- [ ] **Step 2: Parse named options, render through the pure helper, reject existing paths, and write UTF-8 MDX**

- [ ] **Step 3: Run each command with `--dry-run` and verify the expected frontmatter is printed without creating files**

- [ ] **Step 4: Run malformed slug and missing-source-option commands and verify they exit 1 before writing**

### Task 4: Document the author workflow

**Files:**
- Create: `docs/philosophy-authoring.md`

- [ ] **Step 1: Document object boundaries, exact commands, required options, slug rules, and relation repair workflow**

- [ ] **Step 2: Include a pre-publish checklist using `validate:relations`, `test`, and `build`**

### Task 5: Verify the full project

**Files:**
- Test: `tests/philosophy-authoring.test.ts`
- Test: `tests/philosophy-relations.test.ts`
- Test: `e2e/philosophy-pages.spec.ts`

- [ ] **Step 1: Run `npm run validate:relations` and expect exit 0**

- [ ] **Step 2: Run `npm test` and expect all tests to pass**

- [ ] **Step 3: Run `npm run test:e2e` and expect all browser tests to pass**

- [ ] **Step 4: Run `npm run build` and expect relation validation, Astro check, and static generation to pass**

- [ ] **Step 5: Run `git diff --check` and confirm no whitespace errors or dependency changes**

