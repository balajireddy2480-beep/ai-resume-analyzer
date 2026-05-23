import React from "react";
import ScoreBadge from "./ScoreBadge";
import ScoreGauge from "./scoreGuage";

const CategoryRow = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 80
      ? "text-green-600"
      : score > 49
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="flex flex-row items-center justify-between px-4 py-3 gap-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
        <ScoreBadge score={score} />
      </div>
      <p className="text-sm font-semibold flex-shrink-0">
        <span className={textColor}>{score}</span>
        <span className="text-gray-400">/100</span>
      </p>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Overall score header */}
      <div className="flex flex-row items-center p-5 gap-6">
        <ScoreGauge score={feedback.overallScore} />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">Your Resume Score</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Based on parsed resume content, structure, keywords, and ATS compatibility.
          </p>
          {feedback.resumeHealth && (
            <p className="text-sm font-semibold text-gray-700">
              Resume Health: {feedback.resumeHealth}
            </p>
          )}
          <div className="mt-1">
            <ScoreBadge score={feedback.overallScore} />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        {feedback.categoryScores ? (
          <>
            <CategoryRow title="Skills Match" score={feedback.categoryScores.skillsMatch} />
            <CategoryRow title="Projects" score={feedback.categoryScores.projects} />
            <CategoryRow title="Experience" score={feedback.categoryScores.experience} />
            <CategoryRow title="Formatting" score={feedback.categoryScores.formatting} />
            <CategoryRow
              title="ATS Compatibility"
              score={feedback.categoryScores.atsCompatibility}
            />
          </>
        ) : (
          <>
            <CategoryRow title="Tone & Style" score={feedback.toneAndStyle.score} />
            <CategoryRow title="Content Quality" score={feedback.content.score} />
            <CategoryRow title="Resume Structure" score={feedback.structure.score} />
            <CategoryRow title="Skills & Keywords" score={feedback.skills.score} />
          </>
        )}
      </div>
    </div>
  );
};

export default Summary;
