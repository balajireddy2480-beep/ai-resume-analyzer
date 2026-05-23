import React from "react";

interface StrengthMeterProps {
  feedback: Feedback;
}

const MeterBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="text-xs font-bold text-gray-800">{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const StrengthMeter = ({ feedback }: StrengthMeterProps) => {
  // Derived metrics from feedback scores
  const resumeStrength = feedback.overallScore;
  const atsCompatibility = feedback.ATS.score;
  const recruiterFriendliness = Math.round(
    (feedback.toneAndStyle.score + feedback.content.score + feedback.structure.score) / 3,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-base">📊</span>
        <h3 className="text-sm font-semibold text-gray-900">Resume Strength</h3>
      </div>
      <div className="flex flex-col gap-3">
        <MeterBar
          label="Overall Strength"
          value={resumeStrength}
          color="bg-gradient-to-r from-indigo-400 to-violet-500"
        />
        <MeterBar
          label="ATS Compatibility"
          value={atsCompatibility}
          color={
            atsCompatibility >= 80
              ? "bg-green-500"
              : atsCompatibility >= 60
                ? "bg-yellow-400"
                : "bg-red-400"
          }
        />
        <MeterBar
          label="Recruiter Friendliness"
          value={recruiterFriendliness}
          color="bg-gradient-to-r from-pink-400 to-rose-400"
        />
      </div>
    </div>
  );
};

export default StrengthMeter;
