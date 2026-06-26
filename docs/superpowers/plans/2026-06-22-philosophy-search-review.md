# Philosophy Search and Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend global search to philosophy content, add source facets, and provide a chronological stance review.

**Architecture:** Pure mappers create search documents and review rows from Content Layer records. Existing static JSON and Astro pages consume those mappers; native DOM scripts filter already-rendered cards.

**Tech Stack:** Astro 6.4, TypeScript, node:test, Playwright, vanilla DOM APIs.

---

### Task 1: Define search and review data with failing tests

**Files:**
- Create: `tests/philosophy-search.test.ts`
- Create: `src/lib/philosophy-search.ts`

- [ ] Write a fixture containing one record from each philosophy collection.
- [ ] Assert six document kinds, stable ids/hrefs, searchable judgment keywords, and newest-first review rows.
- [ ] Run the focused test and confirm it fails because the module is missing.
- [ ] Implement the pure mappers and rerun the focused test.

### Task 2: Extend the global search endpoint

**Files:**
- Modify: `src/lib/search-index.ts`
- Modify: `src/components/astro/SearchBox.astro`

- [ ] Load six philosophy collections alongside existing Python content.
- [ ] Append pure mapper output to search documents.
- [ ] Match `keywords`, update the placeholder, and raise the visible result cap to 8.

### Task 3: Add source facets and review page

**Files:**
- Modify: `src/pages/sources/index.astro`
- Create: `src/pages/philosophy/review.astro`
- Modify: `src/pages/philosophy.astro`
- Modify: `src/styles/philosophy.css`

- [ ] Add Question/reliability/status source filters with result count and empty state.
- [ ] Render review rows newest first with Question and Reading labels.
- [ ] Add Question filtering and a dashboard entry link.

### Task 4: Verify user flows

**Files:**
- Modify: `e2e/philosophy-pages.spec.ts`

- [ ] Add failing browser expectations for philosophy search, source filters, and review summaries.
- [ ] Implement until focused E2E passes.
- [ ] Run mobile QA, `npm test`, `npm run test:e2e`, and `npm run build`.

