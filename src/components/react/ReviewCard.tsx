import { Check, RotateCcw, Smile } from "lucide-react";
import { useState } from "react";
import "./islands.css";

type Props = {
  prompt: string;
  answer: string;
};

export default function ReviewCard({ prompt, answer }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<string | null>(null);

  return (
    <div className="review-card">
      <p>{prompt}</p>
      {revealed && <strong>{answer}</strong>}
      <div className="island-toolbar">
        <button type="button" onClick={() => setRevealed(true)}>
          <Smile size={16} />
          <span>翻开</span>
        </button>
        <button type="button" onClick={() => setGrade("again")}>
          <RotateCcw size={16} />
          <span>再来</span>
        </button>
        <button type="button" onClick={() => setGrade("good")}>
          <Check size={16} />
          <span>记住了</span>
        </button>
      </div>
      {grade && <small>{grade === "good" ? "下次间隔会拉长" : "今天晚点再出现"}</small>}
    </div>
  );
}
