export const PHILOSOPHY_STALL_DAYS = 30;

export type LearningQuestion = {
  id: string;
  data: {
    status: "open" | "provisional" | "settled";
    updatedAt: string;
    relatedReadings: string[];
  };
};

export type LearningReading = {
  id: string;
  data: {
    title: string;
    status: "unread" | "reading" | "finished";
  };
};

function utcDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function daysBetween(earlier: string, later: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((utcDay(later) - utcDay(earlier)) / millisecondsPerDay));
}

export function deriveQuestionLearningState<
  TQuestion extends LearningQuestion,
  TReading extends LearningReading
>(question: TQuestion, readings: TReading[], today: string) {
  const readingById = new Map(readings.map((reading) => [reading.id, reading]));
  const relatedReadings = question.data.relatedReadings
    .map((id) => readingById.get(id))
    .filter((reading): reading is TReading => Boolean(reading));
  const pendingReadings = relatedReadings.filter((reading) => reading.data.status !== "finished");
  const completedReadings = relatedReadings.filter((reading) => reading.data.status === "finished");
  const nextReading = pendingReadings.find((reading) => reading.data.status === "reading")
    ?? pendingReadings.find((reading) => reading.data.status === "unread");
  const daysSinceUpdate = daysBetween(question.data.updatedAt, today);

  return {
    relatedReadings,
    pendingReadings,
    completedReadings,
    nextReading,
    daysSinceUpdate,
    isStalled: question.data.status !== "settled" && daysSinceUpdate >= PHILOSOPHY_STALL_DAYS
  };
}

