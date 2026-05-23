import React from "react";

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  const config =
    score > 79
      ? {
          label: "Strong",
          bg: "bg-badge-green",
          text: "text-badge-green-text",
          dot: "bg-green-500",
        }
      : score > 59
        ? {
            label: "Good Start",
            bg: "bg-badge-yellow",
            text: "text-badge-yellow-text",
            dot: "bg-yellow-500",
          }
        : {
            label: "Needs Work",
            bg: "bg-badge-red",
            text: "text-badge-red-text",
            dot: "bg-red-500",
          };

  return (
    <span
      className={`score-badge ${config.bg} ${config.text} text-xs font-semibold gap-1.5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default ScoreBadge;
