import Navbar from "~/components/Navbar";
import { useEffect, type ComponentType } from "react";
import type { Route } from "./+types/home";
import { resumes } from "~/constants";
import Resumecard from "~/components/Resumecard";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const ResumecardWithProps = Resumecard as ComponentType<{
  resume: (typeof resumes)[number];
}>;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your DREAM JOB!" },
  ];
}

export default function Home() {
  const { isLoading, auth } = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track your Applications & Resume ratings</h1>
          <h2>Review your submissions and check AI-powered feedback.</h2>
        </div>
      </section>

      {resumes.length > 0 && (
        <div className="flex justify-center items-center flex-wrap gap-6">
          {resumes.map((resume) => (
            <ResumecardWithProps key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </main>
  );
}
