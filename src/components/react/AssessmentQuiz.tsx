import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { scoreAssessment, type AssessmentAnswer } from "../../lib/path-planner";
import "./islands.css";

const questions = [
  {
    id: "for-range",
    title: "看到 for i in range(10):",
    options: [
      { label: "能想到重复 10 次", confidence: 2, knownConcepts: ["for-loop"] },
      { label: "大概见过但说不清", confidence: 1, knownConcepts: [] },
      { label: "完全陌生", confidence: 0, knownConcepts: [] }
    ]
  },
  {
    id: "data-goal",
    title: "现在最想做哪类事情",
    options: [
      { label: "清洗 CSV 表格", confidence: 2, track: "data" },
      { label: "写一个网站接口", confidence: 2, track: "web" },
      { label: "批量处理文件", confidence: 2, track: "automation" }
    ]
  },
  {
    id: "function",
    title: "函数最像什么",
    options: [
      { label: "可复用的小机器", confidence: 2, knownConcepts: ["function"] },
      { label: "一段被命名的代码", confidence: 1, knownConcepts: ["function"] },
      { label: "还没有概念", confidence: 0, knownConcepts: [] }
    ]
  }
] as const;

export default function AssessmentQuiz() {
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const current = questions[answers.length];
  const done = answers.length === questions.length;
  const recommendation = done ? scoreAssessment(answers) : null;

  function choose(option: (typeof questions)[number]["options"][number]) {
    setAnswers((items) => [
      ...items,
      {
        questionId: current.id,
        confidence: option.confidence as 0 | 1 | 2 | 3,
        knownConcepts: "knownConcepts" in option ? [...option.knownConcepts] : [],
        track: "track" in option ? option.track : undefined
      }
    ]);
  }

  return (
    <div className="quiz-panel">
      {!done && current && (
        <>
          <div className="quiz-progress">
            <span>{answers.length + 1}</span>
            <strong>{questions.length}</strong>
          </div>
          <h2>{current.title}</h2>
          <div className="quiz-options">
            {current.options.map((option) => (
              <button key={option.label} type="button" onClick={() => choose(option)}>
                <CheckCircle2 size={18} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {recommendation && (
        <>
          <h2>{recommendation.track}</h2>
          <p>{recommendation.reason}</p>
          <div className="island-toolbar">
            <a className="button-link" href={`/path/${recommendation.track}/`}>
              <ArrowRight size={16} />
              <span>进入路径</span>
            </a>
            <button type="button" onClick={() => setAnswers([])}>
              <RotateCcw size={16} />
              <span>重来</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
