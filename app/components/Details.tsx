import React, { useState } from "react";

interface Tip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

interface CategorySection {
  score: number;
  tips: Tip[];
}

interface DetailsProps {
  feedback: Feedback;
}

const categoryConfig = [
  {
    key: "toneAndStyle" as const,
    label: "Tone & Style",
    icon: "✍️",
  },
  {
    key: "content" as const,
    label: "Content Quality",
    icon: "📄",
  },
  {
    key: "structure" as const,
    label: "Resume Structure",
    icon: "🏗️",
  },
  {
    key: "skills" as const,
    label: "Skills & Keywords",
    icon: "🔧",
  },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
};

const getBarColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-400";
  return "bg-red-400";
};

const CategoryCard = ({
  label,
  icon,
  section,
}: {
  label: string;
  icon: string;
  section: CategorySection;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${getScoreColor(section.score)}`}>
            {section.score}/100
          </span>
          <span
            className={`text-gray-400 text-xs transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Progress bar — always visible */}
      <div className="px-4 pb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${getBarColor(section.score)}`}
            style={{ width: `${section.score}%` }}
          />
        </div>
      </div>

      {/* Expanded tips */}
      {expanded && section.tips && section.tips.length > 0 && (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-gray-50">
          {section.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <img
                src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                alt={tip.type}
              />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-800">{tip.tip}</p>
                {tip.explanation && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {tip.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Details = ({ feedback }: DetailsProps) => {
  const [showImproveMode, setShowImproveMode] = useState(false);
  const strengths = feedback.strengths ?? [];
  const improvements = feedback.improvements ?? [];
  const missingKeywords = feedback.missingKeywords ?? [];
  const improveSuggestions = feedback.improveSuggestions ?? [];

  return (
    <div className="flex flex-col gap-3">
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          {strengths.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Key Strengths
              </p>
              {strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <img src="/icons/check.svg" className="w-4 h-4 mt-0.5" alt="good" />
                  <p className="text-sm text-gray-700">{strength}</p>
                </div>
              ))}
            </div>
          )}

          {improvements.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Improvements Needed
              </p>
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <img
                    src="/icons/warning.svg"
                    className="w-4 h-4 mt-0.5"
                    alt="improve"
                  />
                  <p className="text-sm text-gray-700">{improvement}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {missingKeywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Missing Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {improveSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <button
            type="button"
            className="primary-button w-fit"
            onClick={() => setShowImproveMode((value) => !value)}
          >
            Improve Resume
          </button>

          {showImproveMode && (
            <div className="flex flex-col gap-3">
              {improveSuggestions.map((suggestion, index) => (
                <div key={index} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Before</p>
                    <p className="text-sm text-gray-600">{suggestion.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">After</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {suggestion.after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
        Detailed Breakdown
      </p>
      {categoryConfig.map((cat) => {
        const section = feedback[cat.key] as CategorySection;
        return (
          <CategoryCard
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            section={section}
          />
        );
      })}
    </div>
  );
};

export default Details;
