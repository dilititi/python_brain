import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import { loadPyodide } from "pyodide";

type CodeExample = {
  title?: string;
  code?: string;
  runnable?: boolean;
};

type CodeExampleCase = {
  file: string;
  title: string;
  code: string;
};

const root = process.cwd();
const conceptsRoot = join(root, "src", "content", "concepts");

async function readRunnableExamples(): Promise<CodeExampleCase[]> {
  const files = (await readdir(conceptsRoot)).filter((file) => /\.mdx?$/.test(file)).sort();
  const cases: CodeExampleCase[] = [];

  for (const file of files) {
    const path = join(conceptsRoot, file);
    const raw = await readFile(path, "utf8");
    const data = matter(raw).data;
    const codeExamples = Array.isArray(data.codeExamples) ? data.codeExamples as CodeExample[] : [];

    codeExamples.forEach((example, index) => {
      if (example.runnable === false) {
        return;
      }

      if (typeof example.code !== "string" || example.code.trim().length === 0) {
        return;
      }

      cases.push({
        file: relative(root, path),
        title: typeof example.title === "string" && example.title.trim() ? example.title : `codeExamples[${index}]`,
        code: example.code
      });
    });
  }

  return cases;
}

const examples = await readRunnableExamples();
const pyodide = await loadPyodide();
const failures: string[] = [];

for (const example of examples) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  pyodide.setStdout({ batched: (text) => stdout.push(text) });
  pyodide.setStderr({ batched: (text) => stderr.push(text) });

  const globals = pyodide.toPy({ __name__: "__main__" });

  try {
    await pyodide.runPythonAsync(example.code, {
      globals,
      filename: `${example.file}#${example.title}`
    });
  } catch (error) {
    failures.push([
      `${example.file} | codeExamples.${example.title}`,
      `error: ${error instanceof Error ? error.message : String(error)}`,
      stderr.length > 0 ? `stderr: ${stderr.join("\n")}` : null,
      stdout.length > 0 ? `stdout: ${stdout.join("\n")}` : null
    ].filter(Boolean).join("\n"));
  } finally {
    globals.destroy();
  }
}

if (failures.length > 0) {
  console.error(`Code example runtime failures (${failures.length}/${examples.length}):`);
  console.error(failures.join("\n\n---\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Code examples runnable in Pyodide: ${examples.length} passed.`);
}
