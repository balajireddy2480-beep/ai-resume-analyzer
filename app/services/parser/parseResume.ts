import mammoth from "mammoth";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export interface ParsedResume {
  text: string;
  skills: string[];
  education: string[];
  projects: string[];
  experience: string[];
  certifications: string[];
  technologies: string[];
  keywords: string[];
}

const SKILL_KEYWORDS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Redux",
  "HTML",
  "CSS",
  "Tailwind",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "SQL",
  "Python",
  "Java",
  "C++",
  "C#",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "CI/CD",
  "REST",
  "GraphQL",
  "Firebase",
  "Prisma",
  "Jest",
  "Testing",
  "Agile",
];

const SECTION_HEADINGS = [
  "summary",
  "objective",
  "skills",
  "technical skills",
  "projects",
  "experience",
  "work experience",
  "education",
  "certifications",
  "achievements",
];

const DEGREE_WORDS = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|bsc|msc|degree|university|college|cgpa|gpa)\b/i;
const CERT_WORDS = /\b(certified|certification|certificate|aws certified|azure certified|google cloud|coursera|udemy|nptel)\b/i;

async function loadPdfJs(): Promise<any> {
  // @ts-expect-error - pdfjs-dist exposes the browser build without bundled types.
  const lib = await import("pdfjs-dist/build/pdf.mjs");
  lib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return lib;
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractLines(text: string, matcher: RegExp) {
  return unique(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 3 && matcher.test(line)),
  ).slice(0, 8);
}

function extractSection(text: string, headings: string[]) {
  const lines = text.split("\n");
  const startIndex = lines.findIndex((line) => {
    const clean = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    return headings.some((heading) => clean === heading || clean.includes(heading));
  });

  if (startIndex === -1) return "";

  const collected: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const clean = lines[i].toLowerCase().replace(/[^a-z ]/g, "").trim();
    const isNextHeading = SECTION_HEADINGS.some(
      (heading) => clean === heading || clean.startsWith(`${heading} `),
    );

    if (isNextHeading && collected.length > 0) break;
    collected.push(lines[i]);
  }

  return collected.join("\n").trim();
}

function extractSkills(text: string) {
  return SKILL_KEYWORDS.filter((skill) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(skill)}([^a-z0-9+#]|$)`, "i");
    return pattern.test(text);
  });
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    "and",
    "the",
    "for",
    "with",
    "from",
    "that",
    "this",
    "your",
    "resume",
    "project",
    "using",
    "have",
    "will",
    "work",
    "team",
  ]);

  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9+#.-]{2,}\b/g) ?? [];

  for (const word of words) {
    if (stopWords.has(word) || /^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([word]) => word);
}

export function parseResumeText(text: string): ParsedResume {
  const normalized = normalizeText(text);
  const skills = extractSkills(normalized);
  const projectSection = extractSection(normalized, ["projects"]);
  const experienceSection = extractSection(normalized, ["experience", "work experience"]);
  const educationSection = extractSection(normalized, ["education"]);
  const certificationSection = extractSection(normalized, ["certifications"]);

  return {
    text: normalized,
    skills,
    education: extractLines(educationSection || normalized, DEGREE_WORDS),
    projects: unique(
      (projectSection || "")
        .split("\n")
        .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
        .filter((line) => line.length > 8),
    ).slice(0, 8),
    experience: unique(
      (experienceSection || "")
        .split("\n")
        .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
        .filter((line) => line.length > 8),
    ).slice(0, 8),
    certifications: extractLines(certificationSection || normalized, CERT_WORDS),
    technologies: skills,
    keywords: extractKeywords(normalized),
  };
}

async function parsePdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => item.str ?? "")
        .join(" ");
      pages.push(pageText);
    }

    return pages.join("\n");
  } catch (err) {
    console.warn("PDF.js text extraction failed, using raw PDF fallback:", err);
    return extractRawPdfText(arrayBuffer);
  }
}

async function parseDocx(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function extractRawPdfText(arrayBuffer: ArrayBuffer) {
  const decoded = new TextDecoder("latin1").decode(arrayBuffer);
  const literalText = Array.from(decoded.matchAll(/\(([^()]*)\)\s*Tj/g))
    .map((match) => match[1])
    .join(" ");
  const arrayText = Array.from(decoded.matchAll(/\[((?:.|\n)*?)\]\s*TJ/g))
    .map((match) =>
      Array.from(match[1].matchAll(/\(([^()]*)\)/g))
        .map((textMatch) => textMatch[1])
        .join(" "),
    )
    .join(" ");

  return normalizeText(`${literalText} ${arrayText}`.replace(/\\([()\\])/g, "$1"));
}

export function isSupportedResumeFile(file: File) {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".docx")
  );
}

export async function parseResume(file: File): Promise<ParsedResume> {
  if (!isSupportedResumeFile(file)) {
    throw new Error("Only PDF or DOCX files are supported");
  }

  const fileName = file.name.toLowerCase();
  const rawText = fileName.endsWith(".docx") ? await parseDocx(file) : await parsePdf(file);
  const parsed = parseResumeText(rawText || "");

  if (!parsed.text || parsed.text.length < 20) {
    throw new Error("Could not extract enough resume text");
  }

  return parsed;
}
