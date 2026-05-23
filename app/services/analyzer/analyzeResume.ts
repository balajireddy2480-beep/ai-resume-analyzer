import type { ParsedResume } from "~/services/parser/parseResume";

type Tip = {
  type: "good" | "improve";
  tip: string;
  explanation: string;
};

export interface ResumeAnalysisInput {
  parsedResume: ParsedResume;
  jobTitle?: string;
  jobDescription?: string;
}

const ROLE_SKILLS: Record<string, string[]> = {
  frontend: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "REST", "Testing"],
  backend: ["Node.js", "Express", "SQL", "MongoDB", "REST", "Docker", "AWS"],
  "full stack": ["React", "Node.js", "TypeScript", "Express", "MongoDB", "REST", "Git"],
  cloud: ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "SQL"],
  data: ["Python", "SQL", "Testing", "AWS"],
  mobile: ["JavaScript", "TypeScript", "React", "Java", "Git"],
};

const ACTION_VERBS = /\b(built|developed|designed|implemented|created|optimized|improved|reduced|increased|launched|led|managed|integrated|automated|deployed)\b/i;
const METRIC_PATTERN = /\b(\d+%|\d+\+|\d+x|[0-9]+ users|[0-9]+ms|[0-9]+ seconds|reduced|increased|improved|optimized)\b/i;
const SECTION_PATTERNS = {
  skills: /\b(skills|technical skills|technologies)\b/i,
  projects: /\b(projects|portfolio)\b/i,
  education: /\b(education|university|college|degree|b\.?tech|bachelor|master)\b/i,
  experience: /\b(experience|employment|internship|work history)\b/i,
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findRoleSkills(jobTitle = "", jobDescription = "") {
  const source = `${jobTitle} ${jobDescription}`.toLowerCase();
  const matchedRoles = Object.entries(ROLE_SKILLS)
    .filter(([role]) => source.includes(role))
    .flatMap(([, skills]) => skills);

  const mentionedSkills = unique(Object.values(ROLE_SKILLS).flat()).filter((skill) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(skill)}([^a-z0-9+#]|$)`, "i");
    return pattern.test(source);
  });

  return unique([...mentionedSkills, ...matchedRoles]);
}

function keywordList(jobDescription = "", parsed: ParsedResume) {
  const jdWords =
    jobDescription
      .toLowerCase()
      .match(/\b[a-z][a-z0-9+#.-]{2,}\b/g)
      ?.filter((word) => !["and", "the", "for", "with", "you", "our", "are", "will"].includes(word)) ??
    [];

  return unique([...findRoleSkills("", jobDescription), ...jdWords.slice(0, 16), ...parsed.keywords.slice(0, 10)]);
}

function countMatches(values: string[], text: string) {
  return values.filter((value) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(value)}([^a-z0-9+#]|$)`, "i");
    return pattern.test(text);
  });
}

function scoreSkills(parsed: ParsedResume, requiredSkills: string[]) {
  if (requiredSkills.length > 0) {
    const matched = countMatches(requiredSkills, parsed.text);
    return {
      score: clampScore(35 + (matched.length / requiredSkills.length) * 65),
      matched,
      missing: requiredSkills.filter((skill) => !matched.includes(skill)),
    };
  }

  return {
    score: clampScore(Math.min(100, 35 + parsed.skills.length * 8)),
    matched: parsed.skills,
    missing: ["Docker", "AWS", "CI/CD"].filter((skill) => !parsed.skills.includes(skill)),
  };
}

function scoreStructure(text: string, parsed: ParsedResume) {
  const sectionScore = Object.values(SECTION_PATTERNS).reduce(
    (total, pattern) => total + (pattern.test(text) ? 18 : 0),
    0,
  );
  const lengthScore = text.length > 1200 ? 18 : text.length > 700 ? 12 : 6;
  const educationScore = parsed.education.length > 0 ? 10 : 0;

  return clampScore(sectionScore + lengthScore + educationScore);
}

function scoreProjects(parsed: ParsedResume) {
  const projectText = parsed.projects.join(" ");
  if (!projectText) return 35;

  const projectCountScore = Math.min(30, parsed.projects.length * 10);
  const actionScore = ACTION_VERBS.test(projectText) ? 25 : 10;
  const metricScore = METRIC_PATTERN.test(projectText) ? 25 : 8;
  const techScore = parsed.skills.length >= 4 ? 20 : parsed.skills.length * 4;

  return clampScore(projectCountScore + actionScore + metricScore + techScore);
}

function scoreExperience(parsed: ParsedResume) {
  const experienceText = parsed.experience.join(" ") || parsed.text;
  const hasExperienceSection = parsed.experience.length > 0;
  const actionScore = ACTION_VERBS.test(experienceText) ? 28 : 12;
  const metricScore = METRIC_PATTERN.test(experienceText) ? 28 : 8;
  const scopeScore = /\b(intern|engineer|developer|manager|lead|freelance|remote|client)\b/i.test(experienceText)
    ? 24
    : 8;
  const sectionScore = hasExperienceSection ? 20 : 8;

  return clampScore(actionScore + metricScore + scopeScore + sectionScore);
}

function scoreKeywordDensity(parsed: ParsedResume, keywords: string[]) {
  if (keywords.length === 0) return clampScore(45 + parsed.keywords.length * 2);
  const matched = countMatches(keywords, parsed.text);
  return clampScore(25 + (matched.length / keywords.length) * 75);
}

function makeTips({
  skillsScore,
  structureScore,
  projectScore,
  experienceScore,
  keywordScore,
  missingKeywords,
  parsed,
}: {
  skillsScore: number;
  structureScore: number;
  projectScore: number;
  experienceScore: number;
  keywordScore: number;
  missingKeywords: string[];
  parsed: ParsedResume;
}) {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (skillsScore >= 75) strengths.push("Strong technical skills are visible.");
  else improvements.push("Add more role-specific technical skills.");

  if (structureScore >= 75) strengths.push("Resume structure is easy for ATS systems to scan.");
  else improvements.push("Use clear sections for skills, projects, experience, and education.");

  if (projectScore >= 75) strengths.push("Project section shows relevant hands-on work.");
  else improvements.push("Add stronger project bullets with technologies, impact, and outcomes.");

  if (experienceScore >= 70) strengths.push("Experience bullets include useful action-oriented language.");
  else improvements.push("Include action verbs and measurable achievements in experience bullets.");

  if (keywordScore < 70 && missingKeywords.length > 0) {
    improvements.push(`Add missing ATS keywords such as ${missingKeywords.slice(0, 3).join(", ")}.`);
  }

  if (parsed.certifications.length > 0) {
    strengths.push("Certifications add credibility to the profile.");
  }

  return { strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 5) };
}

function buildImproveSuggestions(parsed: ParsedResume, missingKeywords: string[]) {
  const projectLine = parsed.projects[0] || "Built website";
  const hasMetric = METRIC_PATTERN.test(projectLine);
  const addedKeyword = missingKeywords[0] ? ` using ${missingKeywords[0]}` : "";

  return [
    {
      before: projectLine.length > 120 ? `${projectLine.slice(0, 117)}...` : projectLine,
      after: hasMetric
        ? projectLine
        : `Developed a scalable full-stack web platform${addedKeyword}, improving usability, reliability, and performance.`,
    },
    {
      before: "Worked on project features",
      after: "Implemented user-facing features with clear ownership, reusable components, and measurable delivery impact.",
    },
  ];
}

function category(score: number, goodTip: string, improveTip: string, explanation: string): { score: number; tips: Tip[] } {
  return {
    score,
    tips: [
      {
        type: score >= 70 ? "good" : "improve",
        tip: score >= 70 ? goodTip : improveTip,
        explanation,
      },
    ],
  };
}

export function analyzeResume({
  parsedResume,
  jobTitle = "",
  jobDescription = "",
}: ResumeAnalysisInput): Feedback {
  const requiredSkills = findRoleSkills(jobTitle, jobDescription);
  const keywords = keywordList(jobDescription, parsedResume);
  const skillResult = scoreSkills(parsedResume, requiredSkills);
  const structureScore = scoreStructure(parsedResume.text, parsedResume);
  const projectScore = scoreProjects(parsedResume);
  const experienceScore = scoreExperience(parsedResume);
  const keywordScore = scoreKeywordDensity(parsedResume, keywords);
  const atsScore = clampScore(
    skillResult.score * 0.3 +
      structureScore * 0.25 +
      projectScore * 0.2 +
      experienceScore * 0.15 +
      keywordScore * 0.1,
  );
  const missingKeywords = unique(skillResult.missing).slice(0, 8);
  const { strengths, improvements } = makeTips({
    skillsScore: skillResult.score,
    structureScore,
    projectScore,
    experienceScore,
    keywordScore,
    missingKeywords,
    parsed: parsedResume,
  });

  return {
    overallScore: atsScore,
    ATS: {
      score: atsScore,
      tips: [
        {
          type: atsScore >= 70 ? "good" : "improve",
          tip:
            atsScore >= 70
              ? "Resume has a solid ATS foundation."
              : "Resume needs stronger ATS keyword coverage and clearer sections.",
        },
        ...improvements.slice(0, 3).map((tip) => ({ type: "improve" as const, tip })),
      ],
    },
    toneAndStyle: category(
      clampScore((experienceScore + projectScore) / 2),
      "Action language is working well.",
      "Use stronger action verbs.",
      "Recruiters respond better to concise bullets that start with impact-focused verbs.",
    ),
    content: category(
      clampScore(projectScore * 0.55 + experienceScore * 0.45),
      "Content has useful role evidence.",
      "Add measurable achievements.",
      "Projects and experience should show scope, tools, and outcomes instead of only listing tasks.",
    ),
    structure: category(
      structureScore,
      "Core resume sections are present.",
      "Improve section clarity.",
      "ATS systems parse resumes best when headings are simple and predictable.",
    ),
    skills: category(
      skillResult.score,
      "Skills align with the target role.",
      "Add missing technical keywords.",
      "Skills were scored against the resume text and the supplied job details when available.",
    ),
    resumeHealth: atsScore >= 80 ? "Strong" : atsScore >= 60 ? "Good" : "Needs Work",
    strengths,
    improvements,
    missingKeywords,
    categoryScores: {
      skillsMatch: skillResult.score,
      projects: projectScore,
      experience: experienceScore,
      formatting: structureScore,
      atsCompatibility: atsScore,
      keywordDensity: keywordScore,
    },
    improveSuggestions: buildImproveSuggestions(parsedResume, missingKeywords),
    parsedResume,
  };
}
