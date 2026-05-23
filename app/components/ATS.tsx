import React from "react";

interface ATSTip {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestion: ATSTip[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-badge-green";
  if (score >= 60) return "bg-badge-yellow";
  return "bg-badge-red";
};

const ATS = ({ score, suggestion }: ATSProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <img
              src={
                score >= 80
                  ? "/icons/ats-good.svg"
                  : score >= 60
                    ? "/icons/ats-warning.svg"
                    : "/icons/ats-bad.svg"
              }
              className="w-5 h-5"
              alt="ATS score"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility</h3>
        </div>
        <div className={`score-badge ${getScoreBg(score)}`}>
          <span
            className={`text-sm font-bold ${getScoreColor(score)}`}
          >
            {score}/100
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            score >= 80
              ? "bg-green-500"
              : score >= 60
                ? "bg-yellow-400"
                : "bg-red-400"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Tips */}
      {suggestion && suggestion.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Suggestions
          </p>
          <ul className="flex flex-col gap-2">
            {suggestion.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-gray-700"
              >
                <img
                  src={
                    tip.type === "good"
                      ? "/icons/check.svg"
                      : "/icons/warning.svg"
                  }
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  alt={tip.type}
                />
                <span>{tip.tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ATS;
