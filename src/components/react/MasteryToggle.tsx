import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import "./islands.css";

type MasteryStatus = "unseen" | "learning" | "mastered";

type Props = {
  conceptId: string;
};

const storageKey = "pkb:mastery";
const statuses: Array<{
  value: MasteryStatus;
  label: string;
  icon: typeof Circle;
}> = [
  { value: "unseen", label: "未学", icon: Circle },
  { value: "learning", label: "半掌握", icon: Clock3 },
  { value: "mastered", label: "已掌握", icon: CheckCircle2 }
];

function readMastery(): Record<string, MasteryStatus> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMastery(values: Record<string, MasteryStatus>) {
  window.localStorage.setItem(storageKey, JSON.stringify(values));
  window.dispatchEvent(new CustomEvent("pkb:mastery-change", { detail: values }));
}

export default function MasteryToggle({ conceptId }: Props) {
  const [status, setStatus] = useState<MasteryStatus>("unseen");

  useEffect(() => {
    const values = readMastery();
    setStatus(values[conceptId] ?? "unseen");
  }, [conceptId]);

  function choose(nextStatus: MasteryStatus) {
    const values = readMastery();

    if (nextStatus === "unseen") {
      delete values[conceptId];
    } else {
      values[conceptId] = nextStatus;
    }

    writeMastery(values);
    setStatus(nextStatus);
  }

  return (
    <div className="mastery-toggle" aria-label="掌握状态">
      {statuses.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            className={status === item.value ? "active" : ""}
            data-status={item.value}
            aria-pressed={status === item.value}
            onClick={() => choose(item.value)}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
