import Navbar from "~/components/Navbar";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import Resumecard from "~/components/Resumecard";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your DREAM JOB!" },
  ];
}

// Curated trending data — reflects real market, not fake SaaS vanity metrics
const TRENDING_SKILLS = [
  "React", "TypeScript", "Python", "Node.js",
  "Docker", "AWS", "AI/ML", "PostgreSQL", "GraphQL", "Next.js",
];

const TOP_HIRING_ROLES = [
  { role: "Frontend Developer", trend: "↑ High demand" },
  { role: "Full Stack Engineer", trend: "↑ High demand" },
  { role: "AI/ML Engineer", trend: "🔥 Surging" },
  { role: "DevOps Engineer", trend: "↑ Steady" },
  { role: "Backend Developer", trend: "↑ High demand" },
];

interface ResumeData {
  id: string;
  companyName: string;
  jobTitle: string;
  imagePath: string;
  resumePath: string;
  feedback: Feedback;
  uploadedAt?: string;
}

interface AppStats {
  totalAnalyzed: number;
  savedAnalyses: number;
  averageATS: number;
  recentUploads: number;
}

export default function Home() {
  const { isLoading, auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [resumeImageUrls, setResumeImageUrls] = useState<Record<string, string>>({});
  const [resumesLoading, setResumesLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);

  // Wait for loading to settle before redirecting
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [isLoading, auth.isAuthenticated]);

  // Load real resume history from Puter KV store
  useEffect(() => {
    if (isLoading || !auth.isAuthenticated) return;

    const loadResumes = async () => {
      setResumesLoading(true);
      try {
        const rawList = await kv.list("resume-*");
        if (!rawList || rawList.length === 0) {
          setResumesLoading(false);
          return;
        }

        // Puter kv.list returns string[] (key names) when returnValues=false
        // Safely extract key name strings regardless of shape
        const keyStrings: string[] = rawList.map((item) => {
          if (typeof item === "string") return item;
          // KVItem shape fallback
          if (item && typeof item === "object" && "key" in item) return (item as { key: string }).key;
          return String(item);
        }).filter(Boolean);

        if (keyStrings.length === 0) {
          setResumesLoading(false);
          return;
        }

        const resumeEntries: ResumeData[] = [];
        for (const key of keyStrings) {
          try {
            const raw = await kv.get(key);
            if (raw) {
              const data = JSON.parse(raw) as ResumeData;
              // Only include completed analyses (those with feedback)
              if (data && data.id && data.feedback) {
                resumeEntries.push(data);
              }
            }
          } catch (e) {
            console.warn("Skipping malformed KV entry:", key, e);
          }
        }

        // Sort newest first
        resumeEntries.sort((a, b) => {
          const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return tb - ta;
        });

        setResumes(resumeEntries);

        // Compute real stats from actual data
        if (resumeEntries.length > 0) {
          const avgATS = Math.round(
            resumeEntries.reduce((sum, r) => sum + (r.feedback?.ATS?.score ?? 0), 0) /
              resumeEntries.length,
          );
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentCount = resumeEntries.filter(
            (r) => r.uploadedAt && new Date(r.uploadedAt).getTime() > weekAgo,
          ).length;

          setStats({
            totalAnalyzed: resumeEntries.length,
            savedAnalyses: resumeEntries.length,
            averageATS: avgATS,
            recentUploads: recentCount,
          });
        }

        // Load preview images for each resume
        const imageUrls: Record<string, string> = {};
        await Promise.all(
          resumeEntries.map(async (resume) => {
            try {
              if (!resume.imagePath) return;
              const blob = await fs.read(resume.imagePath);
              if (blob) {
                imageUrls[resume.id] = URL.createObjectURL(blob);
              }
            } catch {
              // Image not available — card will show without preview
            }
          }),
        );
        setResumeImageUrls(imageUrls);
      } catch (err) {
        console.error("Failed to load resumes:", err);
      } finally {
        setResumesLoading(false);
      }
    };

    loadResumes();
  }, [isLoading, auth.isAuthenticated]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      {/* Hero section */}
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track your Applications &amp; Resume ratings</h1>
          <h2>Review your submissions and check AI-powered feedback.</h2>
          {!resumesLoading && resumes.length === 0 && (
            <Link to="/upload" className="primary-button w-fit px-8 mt-2">
              Upload your first resume
            </Link>
          )}
        </div>
      </section>

      {/* Real stats — only shown when user has data */}
      {stats && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={stats.totalAnalyzed} label="Resumes Analyzed" />
            <StatCard value={stats.savedAnalyses} label="Saved Analyses" />
            <StatCard value={`${stats.averageATS}%`} label="Avg. ATS Score" />
            <StatCard value={stats.recentUploads} label="Uploaded This Week" />
          </div>
        </section>
      )}

      {/* Resume history */}
      {resumesLoading ? (
        <div className="flex justify-center items-center flex-wrap gap-6 px-4 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="resume-card skeleton-card" />
          ))}
        </div>
      ) : resumes.length > 0 ? (
        <div className="flex justify-center items-start flex-wrap gap-6 px-4 mb-12">
          {resumes.map((resume) => (
            <Resumecard
              key={resume.id}
              resume={{ ...resume, imagePath: resumeImageUrls[resume.id] || "" }}
            />
          ))}
        </div>
      ) : null}

      {/* Trending Skills */}
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            🔥 Trending Skills in 2025
          </h3>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SKILLS.map((skill) => (
              <span key={skill} className="skill-pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Top Hiring Roles */}
      <section className="max-w-4xl mx-auto px-4 mb-14">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            💼 Top Hiring Roles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOP_HIRING_ROLES.map(({ role, trend }) => (
              <div
                key={role}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">{role}</span>
                <span className="text-xs text-gray-400">{trend}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const StatCard = ({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
    <p className="text-2xl font-bold text-gradient">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);
