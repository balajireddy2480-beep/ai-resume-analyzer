import React from "react";
import { Link } from "react-router";
import type { resumes } from "~/constants";
import ScoreCircle from "./ScoreCircle";

const Resumecard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
}: {
  resume: Resume & { resumeUrl: string };
}) => {
  console.log(imagePath);
  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000 overflow-hidden"
    >
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          <h2 className="!text-black font-bold break-words">{companyName}</h2>
          <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback.overallScore} />
        </div>
      </div>
      <div className="gradient-border animate_in fade-in duration-1000" />

      <div className="w-full h-[280px] overflow-hidden rounded-xl bg-gray-50 flex justify-center image-center mt-4">
        <img
          src={imagePath}
          alt="Resume"
          className="w-full h-full object-cover object-top"
        />
      </div>
    </Link>
  );
};

export default Resumecard;
