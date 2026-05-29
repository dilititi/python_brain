import { Play, Square } from "lucide-react";
import { useRef, useState } from "react";
import "./islands.css";

type CodeExample = {
  title: string;
  description: string;
  code: string;
  runnable?: boolean;
};

type Props = {
  examples: CodeExample[];
};

type PyodideApi = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>;
  }
}

const pyodideVersion = "0.29.4";
const pyodideBase = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`;

export default function CodeRunner({ examples }: Props) {
  const [active, setActive] = useState(0);
  const [code, setCode] = useState(examples[0]?.code ?? "");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef<PyodideApi | null>(null);

  async function ensurePyodide() {
    if (pyodideRef.current) {
      return pyodideRef.current;
    }

    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${pyodideBase}pyodide.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Pyodide 加载失败"));
        document.head.append(script);
      });
    }

    if (!window.loadPyodide) {
      throw new Error("Pyodide 入口不可用");
    }

    const pyodide = await window.loadPyodide({ indexURL: pyodideBase });

    pyodideRef.current = pyodide;
    return pyodide;
  }

  async function run() {
    setRunning(true);
    setOutput("");

    try {
      const pyodide = await ensurePyodide();
      const chunks: string[] = [];
      const append = (text: string) => {
        chunks.push(text);
        setOutput(chunks.join(""));
      };

      pyodide.setStdout({ batched: append });
      pyodide.setStderr({ batched: append });
      const result = await pyodide.runPythonAsync(code);

      if (result !== undefined) {
        append(String(result));
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  function choose(index: number) {
    setActive(index);
    setCode(examples[index]?.code ?? "");
    setOutput("");
  }

  if (examples.length === 0) {
    return null;
  }

  return (
    <div className="code-runner">
      <div className="example-tabs" role="tablist" aria-label="代码示例">
        {examples.map((example, index) => (
          <button
            key={example.title}
            type="button"
            className={active === index ? "active" : ""}
            onClick={() => choose(index)}
          >
            {example.title}
          </button>
        ))}
      </div>
      <p>{examples[active]?.description}</p>
      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        aria-label="Python 代码"
      />
      <div className="island-toolbar">
        <button type="button" onClick={run} disabled={running}>
          {running ? <Square size={16} /> : <Play size={16} />}
          <span>{running ? "运行中" : "运行"}</span>
        </button>
      </div>
      <pre className="runner-output">{output || " "}</pre>
    </div>
  );
}
