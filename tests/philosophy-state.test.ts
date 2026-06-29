import assert from "node:assert/strict";
import test from "node:test";
import type { LearningQuestion, LearningReading } from "../src/lib/philosophy-state";

async function loadState() {
  try {
    return await import("../src/lib/philosophy-state");
  } catch (error) {
    assert.fail(`philosophy state helper is unavailable: ${String(error)}`);
  }
}

const readings: LearningReading[] = [
  { id: "unread-first", data: { title: "Unread first", status: "unread" } },
  { id: "active-second", data: { title: "Active second", status: "reading" } },
  { id: "finished-third", data: { title: "Finished third", status: "finished" } }
];

function question(overrides: Partial<LearningQuestion["data"]> = {}): LearningQuestion {
  return {
    id: "what-is-history",
    data: {
      status: "open",
      updatedAt: "2026-06-01",
      relatedReadings: readings.map((reading) => reading.id),
      ...overrides
    }
  };
}

test("currently reading text takes priority over earlier unread texts", async () => {
  const { deriveQuestionLearningState } = await loadState();
  const state = deriveQuestionLearningState(question(), readings, "2026-06-22");

  assert.equal(state.nextReading?.id, "active-second");
  assert.deepEqual(state.pendingReadings.map((reading) => reading.id), [
    "unread-first",
    "active-second"
  ]);
  assert.deepEqual(state.completedReadings.map((reading) => reading.id), ["finished-third"]);
  assert.equal(state.daysSinceUpdate, 21);
  assert.equal(state.isStalled, false);
});

test("first unread text is next when nothing is currently being read", async () => {
  const { deriveQuestionLearningState } = await loadState();
  const noActiveReading: LearningReading[] = readings.map((reading) => (
    reading.id === "active-second"
      ? { ...reading, data: { ...reading.data, status: "unread" } }
      : reading
  ));
  const state = deriveQuestionLearningState(question(), noActiveReading, "2026-06-22");

  assert.equal(state.nextReading?.id, "unread-first");
});

test("unsettled questions become stalled at thirty days", async () => {
  const { deriveQuestionLearningState, PHILOSOPHY_STALL_DAYS } = await loadState();
  const state = deriveQuestionLearningState(
    question({ updatedAt: "2026-05-23" }),
    readings,
    "2026-06-22"
  );

  assert.equal(PHILOSOPHY_STALL_DAYS, 30);
  assert.equal(state.daysSinceUpdate, 30);
  assert.equal(state.isStalled, true);
});

test("settled questions are not stalled and finished reading lists have no next item", async () => {
  const { deriveQuestionLearningState } = await loadState();
  const finishedReadings: LearningReading[] = readings.map((reading) => ({
    ...reading,
    data: { ...reading.data, status: "finished" }
  }));
  const state = deriveQuestionLearningState(
    question({ status: "settled", updatedAt: "2025-01-01" }),
    finishedReadings,
    "2026-06-22"
  );

  assert.equal(state.isStalled, false);
  assert.equal(state.nextReading, undefined);
  assert.equal(state.pendingReadings.length, 0);
});
