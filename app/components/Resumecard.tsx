import React from "react";
import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import ScoreBadge from "./ScoreBadge";

interface ResumecardProps {
  resume: {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
  };
}

const Resumecard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: ResumecardProps) => {
  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="resume-card-header">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="!text-black font-bold break-words text-base leading-tight">
            {companyName || "Company"}
          </h2>
          <h3 className="text-sm break-words text-gray-500">
            {jobTitle || "Position"}
          </h3>
          <div className="mt-1">
            <ScoreBadge score={feedback.overallScore} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback.overallScore} />
        </div>
      </div>

      <div className="gradient-border animate-in fade-in duration-700 !p-0 h-px" />

      <div className="w-full h-[260px] overflow-hidden rounded-xl bg-gray-50 flex justify-center items-start mt-2">
        {imagePath ? (
          <img
            src={imagePath}
            alt={`${companyName ?? "Resume"} preview`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="skeleton-block w-full h-full rounded-xl" />
          </div>
        )}
      </div>
    </Link>
  );
};

export default Resumecard;
