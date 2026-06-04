import type { EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { CheckCircle2, Circle, Play, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateProgress,
  PROGRESS_SCHEMA_VERSION,
  type AssessmentKind,
  type ProgressCategoryConfig,
  type ProgressAttempt,
  type ProgressCategory,
  type ProgressTier
} from "../../lib/progress-calculator";
import "./islands.css";

type AssessmentChoice = {
  label: string;
  value: string;
  correct: boolean;
  feedback?: string;
};

type AssessmentTestCase = {
  name: string;
  code?: string;
};

export type AssessmentPayload = {
  id: string;
  title: string;
  description?: string;
  category: ProgressCategory;
  kind: AssessmentKind;
  targetTier: ProgressTier;
  concepts: string[];
  prompt: string;
  timeLimit?: number;
  starterCode?: string;
  testCases: AssessmentTestCase[];
  choices: AssessmentChoice[];
  referenceSolution?: string;
  rubric: string[];
  categoryConfig: ProgressCategoryConfig;
};

type TestResult = {
  name: string;
  passed: boolean;
  output: string;
  error: string;
};

type StoredAttempts = {
  schemaVersion: number;
  attempts: ProgressAttempt[];
  updatedAt?: string;
};

type PyodideRuntime = {
  globals: {
    set: (name: string, value: unknown) => void;
  };
  runPythonAsync: (code: string) => Promise<unknown>;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

const pyodideVersion = "0.29.4";
const pyodideBase = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`;
const attemptsStorageKey = "pkb:attempts";
const progressStorageKey = "pkb:progress";

let pyodidePromise: Promise<PyodideRuntime> | null = null;

function loadPyodideScript() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${pyodideBase}pyodide.js"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Pyodide 加载失败")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${pyodideBase}pyodide.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pyodide 加载失败"));
    document.head.append(script);
  });
}

async function ensurePyodide() {
  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = (async () => {
    if (!window.loadPyodide) {
      await loadPyodideScript();
    }

    if (!window.loadPyodide) {
      throw new Error("Pyodide 入口不可用");
    }

    return window.loadPyodide({ indexURL: pyodideBase });
  })();

  return pyodidePromise;
}

function toPlainResult(value: unknown): TestResult {
  if (value && typeof value === "object" && "toJs" in value && typeof value.toJs === "function") {
    return value.toJs({ dict_converter: Object.fromEntries }) as TestResult;
  }

  return value as TestResult;
}

function readStoredAttempts(): ProgressAttempt[] {
  try {
    const raw = window.localStorage.getItem(attemptsStorageKey);
    const parsed = raw ? JSON.parse(raw) as StoredAttempts : null;

    if (parsed?.schemaVersion !== PROGRESS_SCHEMA_VERSION || !Array.isArray(parsed.attempts)) {
      return [];
    }

    return parsed.attempts;
  } catch {
    return [];
  }
}

function writeAttempt(attempt: ProgressAttempt, categoryConfig: ProgressCategoryConfig) {
  const attempts = [...readStoredAttempts(), attempt].slice(-300);
  const updatedAt = new Date().toISOString();
  const progress = calculateProgress(attempts, categoryConfig);

  window.localStorage.setItem(
    attemptsStorageKey,
    JSON.stringify({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      attempts,
      updatedAt
    })
  );

  window.localStorage.setItem(
    progressStorageKey,
    JSON.stringify({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      snapshot: progress,
      updatedAt
    })
  );

  window.dispatchEvent(new CustomEvent("pkb:progress-updated", { detail: { attempt, progress } }));
}

function pyodideTestScript() {
  return `
import io
import sys
import traceback

_stdout = io.StringIO()
_stderr = io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
_result = {"passed": False, "output": "", "error": ""}

try:
    sys.stdout = _stdout
    sys.stderr = _stderr
    _namespace = {}
    exec(USER_CODE, _namespace)
    exec(TEST_CODE, _namespace)
    _result["passed"] = True
except BaseException:
    _result["error"] = traceback.format_exc()
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr
    _result["output"] = _stdout.getvalue() + _stderr.getvalue()

_result
`;
}

function summarizeFailure(results: TestResult[]) {
  const failed = results.find((result) => !result.passed);
  return failed ? `测试未通过：${failed.name}` : undefined;
}

function isCodingAssessment(kind: AssessmentKind) {
  return kind !== "recognition";
}

export default function AssessmentRunner({ assessment }: { assessment: AssessmentPayload }) {
  const editorHost = useRef<HTMLDivElement | null>(null);
  const editorView = useRef<CodeMirrorEditorView | null>(null);
  const startedAt = useRef<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "submitted">("idle");
  const [editorStatus, setEditorStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [results, setResults] = useState<TestResult[]>([]);
  const [message, setMessage] = useState("");
  const [lastPassed, setLastPassed] = useState<boolean | null>(null);
  const coding = isCodingAssessment(assessment.kind);
  const correctChoice = useMemo(
    () => assessment.choices.find((choice) => choice.correct),
    [assessment.choices]
  );

  useEffect(() => {
    if (!coding || !editorHost.current || editorView.current) {
      return;
    }

    let disposed = false;
    setEditorStatus("loading");

    Promise.all([
      import("@codemirror/commands"),
      import("@codemirror/lang-python"),
      import("@codemirror/language"),
      import("@codemirror/view")
    ])
      .then(([
        { defaultKeymap, history, historyKeymap, indentWithTab },
        { python },
        { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting },
        { drawSelection, EditorView, highlightActiveLine, keymap, lineNumbers }
      ]) => {
        if (disposed || !editorHost.current) {
          return;
        }

        editorView.current = new EditorView({
          doc: assessment.starterCode ?? "",
          extensions: [
            lineNumbers(),
            history(),
            drawSelection(),
            highlightActiveLine(),
            indentOnInput(),
            bracketMatching(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            python(),
            keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
            EditorView.lineWrapping,
            EditorView.theme({
              "&": {
                minHeight: "260px",
                borderRadius: "8px",
                border: "1px solid #d9e0ea",
                overflow: "hidden"
              },
              ".cm-scroller": {
                fontFamily: "\"JetBrains Mono\", \"Cascadia Code\", Consolas, monospace"
              }
            })
          ],
          parent: editorHost.current
        });
        setEditorStatus("ready");
      })
      .catch(() => {
        if (!disposed) {
          setEditorStatus("error");
          setMessage("编辑器加载失败，刷新页面后重试。");
        }
      });

    return () => {
      disposed = true;
      editorView.current?.destroy();
      editorView.current = null;
    };
  }, [assessment.starterCode, coding]);

  function makeAttempt(passed: boolean, pattern?: string): ProgressAttempt {
    return {
      id: `${assessment.id}:${Date.now()}`,
      category: assessment.category,
      occurredAt: new Date().toISOString(),
      kind: "assessment",
      passed,
      concepts: assessment.concepts,
      assessmentId: assessment.id,
      assessmentKind: assessment.kind,
      targetTier: assessment.targetTier,
      pattern,
      durationSeconds: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : undefined
    };
  }

  function submitRecognition() {
    if (!selectedChoice) {
      setMessage("先选择一个答案。");
      return;
    }

    startedAt.current ??= Date.now();
    const choice = assessment.choices.find((item) => item.value === selectedChoice);
    const passed = Boolean(choice?.correct);
    const pattern = passed ? undefined : "识别题答案判断错误";

    writeAttempt(makeAttempt(passed, pattern), assessment.categoryConfig);
    setLastPassed(passed);
    setStatus("submitted");
    setMessage(choice?.feedback ?? (passed ? "回答正确。" : `正确答案是：${correctChoice?.label ?? "未配置"}`));
  }

  async function runCodingAssessment() {
    if (!editorView.current) {
      setMessage(editorStatus === "error" ? "编辑器加载失败，刷新页面后重试。" : "编辑器还在加载，稍后再开始。");
      return;
    }

    const code = editorView.current.state.doc.toString();
    const testCases = assessment.testCases.filter((testCase) => testCase.code?.trim());

    if (testCases.length === 0) {
      setMessage("这道题还没有可运行测试。");
      return;
    }

    startedAt.current ??= Date.now();
    setStatus("loading");
    setMessage("正在加载 Pyodide，只会在点击评估后发生。");
    setResults([]);

    try {
      const pyodide = await ensurePyodide();
      setStatus("running");
      setMessage("正在运行测试用例。");

      const nextResults: TestResult[] = [];
      for (const testCase of testCases) {
        pyodide.globals.set("USER_CODE", code);
        pyodide.globals.set("TEST_CODE", testCase.code ?? "");
        const raw = await pyodide.runPythonAsync(pyodideTestScript());
        const result = toPlainResult(raw);
        nextResults.push({
          name: testCase.name,
          passed: Boolean(result.passed),
          output: String(result.output ?? ""),
          error: String(result.error ?? "")
        });
      }

      const passed = nextResults.every((result) => result.passed);
      writeAttempt(makeAttempt(passed, summarizeFailure(nextResults)), assessment.categoryConfig);
      setResults(nextResults);
      setLastPassed(passed);
      setStatus("submitted");
      setMessage(passed ? "全部测试通过，已写入本地进度。" : "测试未全部通过，已记录本次 attempt。");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const failedResult = {
        name: "运行时",
        passed: false,
        output: "",
        error: errorMessage
      };
      writeAttempt(makeAttempt(false, "Pyodide 或运行时错误"), assessment.categoryConfig);
      setResults([failedResult]);
      setLastPassed(false);
      setStatus("submitted");
      setMessage(errorMessage);
    }
  }

  function reset() {
    setSelectedChoice(null);
    setResults([]);
    setMessage("");
    setLastPassed(null);
    setStatus("idle");
    startedAt.current = null;

    if (editorView.current) {
      editorView.current.dispatch({
        changes: {
          from: 0,
          to: editorView.current.state.doc.length,
          insert: assessment.starterCode ?? ""
        }
      });
    }
  }

  return (
    <div className="assessment-runner">
      <section className="assessment-task" aria-labelledby="assessment-task-heading">
        <div>
          <p className="eyebrow">Task</p>
          <h2 id="assessment-task-heading">{assessment.title}</h2>
          <p>{assessment.prompt}</p>
        </div>
        <dl className="assessment-meta">
          <div>
            <dt>类型</dt>
            <dd>{assessment.kind}</dd>
          </div>
          <div>
            <dt>目标档位</dt>
            <dd>{assessment.targetTier}</dd>
          </div>
          {assessment.timeLimit && (
            <div>
              <dt>建议时限</dt>
              <dd>{Math.round(assessment.timeLimit / 60)} 分钟</dd>
            </div>
          )}
        </dl>
      </section>

      {coding ? (
        <section className="assessment-workspace" aria-label="代码编辑器">
          <div ref={editorHost} className="code-editor-host" />
          {editorStatus !== "ready" && (
            <p className="editor-status">
              {editorStatus === "error" ? "编辑器加载失败。" : "正在加载编辑器。"}
            </p>
          )}
          <div className="island-toolbar">
            <button
              type="button"
              onClick={runCodingAssessment}
              disabled={editorStatus !== "ready" || status === "loading" || status === "running"}
            >
              <Play size={16} />
              <span>
                {editorStatus !== "ready"
                  ? "加载编辑器"
                  : status === "loading"
                    ? "加载 Pyodide"
                    : status === "running"
                      ? "运行测试"
                      : "开始评估"}
              </span>
            </button>
            <button type="button" onClick={reset}>
              <RotateCcw size={16} />
              <span>重置</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="assessment-choices" aria-label="答案选项">
          {assessment.choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className={selectedChoice === choice.value ? "active" : ""}
              onClick={() => setSelectedChoice(choice.value)}
            >
              <Circle size={18} />
              <span>{choice.label}</span>
            </button>
          ))}
          <div className="island-toolbar">
            <button type="button" onClick={submitRecognition}>
              <CheckCircle2 size={16} />
              <span>提交答案</span>
            </button>
            <button type="button" onClick={reset}>
              <RotateCcw size={16} />
              <span>重置</span>
            </button>
          </div>
        </section>
      )}

      <section className="assessment-feedback" aria-live="polite" aria-label="评估反馈">
        {message && (
          <p className={lastPassed === null ? "" : lastPassed ? "pass" : "fail"}>
            {lastPassed === null ? null : lastPassed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{message}</span>
          </p>
        )}

        {results.length > 0 && (
          <div className="test-results">
            {results.map((result) => (
              <details key={result.name} open={!result.passed}>
                <summary>
                  {result.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{result.name}</span>
                </summary>
                <pre>{result.output || result.error || "通过，无输出。"}</pre>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="assessment-rubric" aria-label="评分标准">
        <h3>通过标准</h3>
        <ul>
          {assessment.rubric.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </div>
  );
}
