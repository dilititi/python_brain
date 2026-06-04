import { readdir, readFile } from "node:fs/promises";
import { join, parse, relative } from "node:path";
import YAML from "yaml";
import { loadPyodide } from "pyodide";

type AssessmentTestCase = {
  name?: string;
  code?: string;
};

type AssessmentRecord = {
  id: string;
  file: string;
  kind?: string;
  referenceSolution?: string;
  testCases?: AssessmentTestCase[];
};

const root = process.cwd();
const assessmentsRoot = join(root, "src", "content", "assessments");

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asTestCases(value: unknown): AssessmentTestCase[] {
  return Array.isArray(value)
    ? value.filter((item): item is AssessmentTestCase => isRecord(item))
    : [];
}

async function readAssessments(): Promise<AssessmentRecord[]> {
  const files = (await readdir(assessmentsRoot)).filter((file) => /\.ya?ml$/.test(file)).sort();
  const assessments: AssessmentRecord[] = [];

  for (const file of files) {
    const path = join(assessmentsRoot, file);
    const raw = await readFile(path, "utf8");
    const parsed = YAML.parse(raw);
    const data = isRecord(parsed) ? parsed : {};

    assessments.push({
      id: parse(file).name,
      file: relative(root, path),
      kind: typeof data.kind === "string" ? data.kind : undefined,
      referenceSolution: typeof data.referenceSolution === "string" ? data.referenceSolution : undefined,
      testCases: asTestCases(data.testCases)
    });
  }

  return assessments;
}

const assessments = await readAssessments();
const runnableCases = assessments.flatMap((assessment) => {
  if (assessment.kind === "recognition") {
    return [];
  }

  return (assessment.testCases ?? [])
    .filter((testCase) => typeof testCase.code === "string" && testCase.code.trim().length > 0)
    .map((testCase, index) => ({
      assessment,
      name: typeof testCase.name === "string" && testCase.name.trim() ? testCase.name : `testCases[${index}]`,
      code: testCase.code ?? ""
    }));
});
const skippedRecognition = assessments.filter((assessment) => assessment.kind === "recognition").length;
const pyodide = await loadPyodide();
const failures: string[] = [];

for (const item of runnableCases) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  pyodide.setStdout({ batched: (text) => stdout.push(text) });
  pyodide.setStderr({ batched: (text) => stderr.push(text) });

  const globals = pyodide.toPy({ __name__: "__main__" });
  const source = [
    item.assessment.referenceSolution ?? "",
    "",
    item.code
  ].join("\n");

  try {
    await pyodide.runPythonAsync(source, {
      globals,
      filename: `${item.assessment.file}#${item.name}`
    });
  } catch (error) {
    failures.push([
      `${item.assessment.file} | ${item.name}`,
      `assessment: ${item.assessment.id}`,
      `error: ${error instanceof Error ? error.message : String(error)}`,
      stderr.length > 0 ? `stderr: ${stderr.join("\n")}` : null,
      stdout.length > 0 ? `stdout: ${stdout.join("\n")}` : null
    ].filter(Boolean).join("\n"));
  } finally {
    globals.destroy();
  }
}

if (failures.length > 0) {
  console.error(`Assessment reference solution failures (${failures.length}/${runnableCases.length}):`);
  console.error(failures.join("\n\n---\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Assessment reference solutions: ${runnableCases.length} test cases passed, ${skippedRecognition} recognition assessments skipped.`);
}
