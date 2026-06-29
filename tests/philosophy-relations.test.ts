import assert from "node:assert/strict";
import test from "node:test";

async function loadValidator() {
  try {
    return await import("../src/lib/philosophy-relations");
  } catch (error) {
    assert.fail(`philosophy relation validator is unavailable: ${String(error)}`);
  }
}

function validFixture() {
  return {
    questions: [{
      id: "what-is-history",
      data: {
        stances: [{ perspective: "foucault" }],
        relatedReadings: ["discipline-and-punish"]
      }
    }],
    perspectives: [{
      id: "foucault",
      data: {
        keyNotions: ["power-knowledge"],
        readings: ["discipline-and-punish"]
      }
    }],
    readings: [{ id: "discipline-and-punish", data: { perspective: "foucault" } }],
    notions: [{ id: "power-knowledge", data: { perspective: "foucault" } }],
    entries: [{
      id: "2026-06-21-entry-1",
      data: {
        question: "what-is-history",
        triggeredBy: "discipline-and-punish",
        fromVersion: 0,
        toVersion: 1,
        priorStance: "v0 stance",
        newStance: "v1 stance"
      }
    }],
    sources: [{
      id: "history-overview",
      data: {
        relatedQuestions: ["what-is-history"],
        relatedNotions: ["power-knowledge"],
        relatedPerspectives: ["foucault"]
      }
    }],
    understandingClaims: [{
      id: "foucault-power-knowledge-claim",
      data: {
        claim: "This claim explains power knowledge through concrete institutional practices.",
        status: "testing",
        confidence: "medium",
        targetType: "notion",
        target: "power-knowledge",
        relatedQuestions: ["what-is-history"],
        relatedNotions: ["power-knowledge"],
        relatedPerspectives: ["foucault"],
        relatedReadings: ["discipline-and-punish"],
        relatedSources: ["history-overview"],
        relatedEntries: ["2026-06-21-entry-1"],
        evidence: [{
          type: "close-reading",
          refType: "reading",
          ref: "discipline-and-punish",
          note: "The reading explains how knowledge and power form practices together.",
          strength: "strong"
        }]
      }
    }]
  };
}

test("valid philosophy slug relations produce no errors", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  assert.deepEqual(validatePhilosophyRelations(validFixture()), []);
});

test("missing philosophy slugs identify the source collection and field", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.sources[0].data.relatedQuestions = ["missing-question"];
  fixture.questions[0].data.relatedReadings = ["missing-reading"];

  assert.deepEqual(validatePhilosophyRelations(fixture), [
    'questions/what-is-history | relatedReadings[0] references missing reading "missing-reading"',
    'sources/history-overview | relatedQuestions[0] references missing question "missing-question"'
  ]);
});

test("entry version history must advance one step and preserve stance continuity", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.entries.push({
    id: "2026-06-22-entry-2",
    data: {
      question: "what-is-history",
      triggeredBy: "discipline-and-punish",
      fromVersion: 1,
      toVersion: 3,
      priorStance: "a different v1 stance",
      newStance: "v3 stance"
    }
  });

  assert.deepEqual(validatePhilosophyRelations(fixture), [
    "entries/2026-06-22-entry-2 | toVersion must equal fromVersion + 1",
    "entries/2026-06-22-entry-2 | priorStance must match the previous entry newStance for question what-is-history"
  ]);
});

test("collection ids and relation values must use valid philosophy slugs", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.understandingClaims = [];
  fixture.sources[0].id = "History Overview";
  fixture.sources[0].data.relatedNotions = ["Power Knowledge"];

  assert.deepEqual(validatePhilosophyRelations(fixture), [
    "sources/History Overview | id must be kebab-case (lowercase letters, numbers, and single hyphens)",
    'sources/History Overview | relatedNotions[0] must be a kebab-case notion slug, received "Power Knowledge"'
  ]);
});

test("entry ids include their date and triggered readings belong to the question", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.understandingClaims = [];
  fixture.entries[0].id = "foucault-change";
  fixture.readings.push({ id: "other-reading", data: { perspective: "foucault" } });
  fixture.entries[0].data.triggeredBy = "other-reading";

  assert.deepEqual(validatePhilosophyRelations(fixture), [
    "entries/foucault-change | id must start with YYYY-MM-DD followed by a kebab-case slug",
    'entries/foucault-change | triggeredBy reading "other-reading" must be listed in questions/what-is-history relatedReadings'
  ]);
});

test("understanding claims validate target, related objects, and evidence references", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.understandingClaims[0].data.target = "missing-notion";
  fixture.understandingClaims[0].data.relatedReadings = ["missing-reading"];
  fixture.understandingClaims[0].data.relatedEntries = ["missing-entry"];
  fixture.understandingClaims[0].data.evidence = [{
    type: "source-triangulation",
    refType: "source",
    ref: "missing-source",
    note: "This evidence points at a source that does not exist.",
    strength: "moderate"
  }];

  assert.deepEqual(validatePhilosophyRelations(fixture), [
    'understanding-claims/foucault-power-knowledge-claim | target references missing notion "missing-notion"',
    'understanding-claims/foucault-power-knowledge-claim | relatedReadings[0] references missing reading "missing-reading"',
    'understanding-claims/foucault-power-knowledge-claim | relatedEntries[0] references missing entry "missing-entry"',
    'understanding-claims/foucault-power-knowledge-claim | evidence[0].ref references missing source "missing-source"'
  ]);
});

test("draft understanding claim scaffolds may leave target empty", async () => {
  const { validatePhilosophyRelations } = await loadValidator();
  const fixture = validFixture();
  fixture.understandingClaims[0].data.status = "draft";
  fixture.understandingClaims[0].data.target = "";
  fixture.understandingClaims[0].data.evidence = [];

  assert.deepEqual(validatePhilosophyRelations(fixture), []);
});
