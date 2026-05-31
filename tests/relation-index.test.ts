import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRelationIndex,
  caseUsedIn,
  conceptNeighbors,
  conceptUsedIn,
  personPortfolio,
  type RelationIndexInput
} from "../src/lib/relation-index";

function fixture(): RelationIndexInput {
  return {
    concepts: [
      {
        id: "function",
        data: {
          prerequisites: [],
          related: [],
          extends: ["decorator"]
        }
      },
      {
        id: "decorator",
        data: {
          prerequisites: ["function"],
          related: ["closure"],
          extends: []
        }
      },
      {
        id: "closure",
        data: {
          prerequisites: ["function"],
          related: [],
          extends: []
        }
      }
    ],
    cases: [
      {
        id: "flask-routing",
        data: {
          concepts: ["decorator", "function"]
        }
      }
    ],
    projects: [
      {
        id: "mini-web-api",
        data: {
          concepts: ["decorator"],
          cases: ["flask-routing"]
        }
      }
    ],
    people: [
      {
        id: "guido-van-rossum",
        data: {
          concepts: ["function", "decorator"],
          works: [
            {
              title: "Python",
              type: "project",
              role: "Defines functions and decorators in the language."
            }
          ]
        }
      }
    ],
    paths: [
      {
        id: "web",
        data: {
          nodes: ["function", "decorator"]
        }
      }
    ]
  };
}

test("buildRelationIndex computes concept reverse usage and neighbors", () => {
  const index = buildRelationIndex(fixture(), "hash-a");

  assert.deepEqual(conceptUsedIn(index, "decorator"), {
    cases: ["flask-routing"],
    projects: ["mini-web-api"],
    people: ["guido-van-rossum"],
    paths: ["web"]
  });

  assert.deepEqual(conceptNeighbors(index, "function"), {
    prerequisites: [],
    successors: ["closure", "decorator"],
    related: [],
    extends: ["decorator"]
  });

  assert.equal(index.meta.contentHash, "hash-a");
});

test("caseUsedIn and personPortfolio expose stable helper APIs", () => {
  const index = buildRelationIndex(fixture(), "hash-b");

  assert.equal(caseUsedIn(index, "flask-routing"), "mini-web-api");
  assert.deepEqual(personPortfolio(index, "guido-van-rossum"), {
    concepts: ["decorator", "function"],
    works: [
      {
        title: "Python",
        type: "project",
        role: "Defines functions and decorators in the language."
      }
    ]
  });
});

test("buildRelationIndex includes concept-authored appliedIn and people refs", () => {
  const input = fixture();
  const functionEntry = input.concepts.find((entry) => entry.id === "function");
  assert.ok(functionEntry);

  functionEntry.data = {
    ...functionEntry.data,
    appliedIn: {
      cases: ["function-call-playground"],
      projects: ["python-basics-lab"]
    },
    people: ["guido-van-rossum"]
  };

  const index = buildRelationIndex(input, "concept-authored");

  assert.deepEqual(conceptUsedIn(index, "function"), {
    cases: ["flask-routing", "function-call-playground"],
    projects: ["python-basics-lab"],
    people: ["guido-van-rossum"],
    paths: ["web"]
  });
});

test("relation index updates when entries are added, removed, or changed", () => {
  const base = fixture();
  const baseIndex = buildRelationIndex(base, "base");

  assert.deepEqual(conceptUsedIn(baseIndex, "closure").cases, []);
  assert.equal(caseUsedIn(baseIndex, "flask-routing"), "mini-web-api");
  assert.deepEqual(conceptNeighbors(baseIndex, "function").successors, [
    "closure",
    "decorator"
  ]);

  const changed: RelationIndexInput = {
    ...base,
    concepts: base.concepts.map((entry) =>
      entry.id === "closure"
        ? {
            ...entry,
            data: {
              ...entry.data,
              prerequisites: ["decorator"]
            }
          }
        : entry
    ),
    cases: [
      ...base.cases,
      {
        id: "closure-callback",
        data: {
          concepts: ["closure"]
        }
      }
    ],
    projects: []
  };
  const changedIndex = buildRelationIndex(changed, "changed");

  assert.deepEqual(conceptUsedIn(changedIndex, "closure").cases, ["closure-callback"]);
  assert.equal(caseUsedIn(changedIndex, "flask-routing"), null);
  assert.deepEqual(conceptNeighbors(changedIndex, "function").successors, ["decorator"]);
  assert.deepEqual(conceptNeighbors(changedIndex, "decorator").successors, ["closure"]);
});
