# Philosophy Learning State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive next-reading and stalled-question state from Content Layer records and expose it through static pages and basic filters.

**Architecture:** A pure state helper consumes Question and Reading records plus an explicit date. Astro pages reuse its result; native browser scripts only filter already-rendered cards.

**Tech Stack:** Astro 6.4, TypeScript, node:test, Playwright, vanilla browser DOM APIs.

---

### Task 1: Define derived learning state

**Files:**
- Create: `tests/philosophy-state.test.ts`
- Create: `src/lib/philosophy-state.ts`

- [ ] Write tests for reading priority, completed readings, 30-day stalling, and settled questions.
- [ ] Run the focused test and confirm it fails because the helper is missing.
- [ ] Implement the smallest pure helper and rerun the focused test.

### Task 2: Complete state-bearing content fields

**Files:**
- Modify: `src/content.philosophy.ts`
- Modify: `src/content/questions/what-is-history.mdx`
- Modify: `src/content/readings/*.mdx`

- [ ] Require `updatedAt` on questions and readings.
- [ ] Add dates to all current readings and align the sample Question answer/status with its latest stance.
- [ ] Run `npx astro check`.

### Task 3: Add dashboard and indexes

**Files:**
- Modify: `src/pages/philosophy.astro`
- Modify: `src/pages/questions/index.astro`
- Modify: `src/pages/questions/[slug].astro`
- Create: `src/pages/readings/index.astro`
- Modify: `src/styles/philosophy.css`

- [ ] Render next-reading and stalled summaries on `/philosophy`.
- [ ] Add Question status/stalled filters and derived card metadata.
- [ ] Add the reading status index and filters.
- [ ] Mark the next reading in Question detail.

### Task 4: Verify behavior

**Files:**
- Modify: `e2e/philosophy-pages.spec.ts`

- [ ] Add browser expectations for the dashboard, Question filters, Reading filters, and next-reading marker.
- [ ] Run focused E2E, then `npm test`, `npm run test:e2e`, and `npm run build`.

