import { ArrowRight, Circle, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ASSESSMENT_BANK_VERSION,
  assessmentQuestions,
  shuffleAssessmentOptions,
  type AssessmentOption,
  type ShuffledAssessmentQuestion
} from "../../lib/assessment-bank";
import {
  scoreAssessment,
  trackLabels,
  type AssessmentAnswer
} from "../../lib/path-planner";
import "./islands.css";

const questions = assessmentQuestions;

const storageKey = "pkb:assessment";

function readStoredAnswers(): AssessmentAnswer[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.bankVersion !== ASSESSMENT_BANK_VERSION) {
      return [];
    }

    const answers = Array.isArray(parsed?.answers) ? parsed.answers : [];
    const restored: AssessmentAnswer[] = [];

    for (let index = 0; index < questions.length; index += 1) {
      const answer = answers[index];
      if (!answer || answer.questionId !== questions[index].id) {
        break;
      }

      restored.push(answer);
    }

    return restored;
  } catch {
    return [];
  }
}

export default function AssessmentQuiz() {
  const [quizQuestions, setQuizQuestions] = useState<ShuffledAssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const current = quizQuestions[answers.length];
  const done = loaded && quizQuestions.length > 0 && answers.length === quizQuestions.length;
  const recommendation = done ? scoreAssessment(answers) : null;

  useEffect(() => {
    setQuizQuestions(shuffleAssessmentOptions(questions));
    setAnswers(readStoredAnswers());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (answers.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        bankVersion: ASSESSMENT_BANK_VERSION,
        answers,
        recommendation,
        updatedAt: new Date().toISOString()
      })
    );
  }, [answers, loaded, recommendation]);

  function choose(option: AssessmentOption) {
    if (!current) {
      return;
    }

    setAnswers((items) => [
      ...items,
      {
        questionId: current.id,
        confidence: option.confidence as 0 | 1 | 2 | 3,
        knownConcepts: [...(option.knownConcepts ?? [])],
        track: option.track
      }
    ]);
  }

  function reset() {
    setQuizQuestions(shuffleAssessmentOptions(questions));
    setAnswers([]);
  }

  return (
    <div className="quiz-panel">
      {!loaded && (
        <p>测评准备中...</p>
      )}

      {!done && current && (
        <>
          <div className="quiz-progress">
            <span>{answers.length + 1}</span>
            <strong>{quizQuestions.length}</strong>
          </div>
          <h2>{current.title}</h2>
          <div className="quiz-options">
            {current.options.map((option) => (
              <button key={option.label} type="button" onClick={() => choose(option)}>
                <Circle size={18} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {recommendation && (
        <>
          <h2>{trackLabels[recommendation.track]}</h2>
          <p>{recommendation.reason}</p>
          <p>已识别 {recommendation.startAfter.length} 个可跳过或快速复习的起点知识点。</p>
          <div className="island-toolbar">
            <a className="button-link" href={`/path/${recommendation.track}/`}>
              <ArrowRight size={16} />
              <span>进入方向</span>
            </a>
            <button type="button" onClick={reset}>
              <RotateCcw size={16} />
              <span>重来</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
