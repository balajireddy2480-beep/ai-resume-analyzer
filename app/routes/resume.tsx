import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import StrengthMeter from "~/components/StrengthMeter";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Resume" },
  { name: "description", content: "Detailed overview of your resume" },
];

const resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  // Track created blob URLs for cleanup
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (isLoading || !id) return;

    const loadResume = async () => {
      setDataLoading(true);
      setLoadError("");
      try {
        const localResumeData = window.localStorage.getItem(`resume-${id}`);
        if (localResumeData) {
          const localData = JSON.parse(localResumeData);
          setFeedback(localData.feedback);
          setDataLoading(false);
          return;
        }

        if (!auth.isAuthenticated) {
          navigate(`/auth?next=/resume/${id}`);
          return;
        }

        // FIX: use dash separator to match how upload.tsx saves: `resume-${uuid}`
        const resumeData = await kv.get(`resume-${id}`);
        if (!resumeData) {
          setLoadError("Resume analysis was not found.");
          return;
        }

        const data = JSON.parse(resumeData);
        window.localStorage.setItem(`resume-${id}`, JSON.stringify(data));

        const resumeBlob = data.resumePath ? await fs.read(data.resumePath) : null;
        if (resumeBlob) {
          const type =
            data.fileType === "docx" ||
            data.fileType ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/pdf";
          const fileBlob = new Blob([resumeBlob], { type });
          const url = URL.createObjectURL(fileBlob);
          blobUrlsRef.current.push(url);
          setResumeUrl(url);
        }

        if (data.imagePath) {
          const imageBlob = await fs.read(data.imagePath);
          if (imageBlob) {
            const url = URL.createObjectURL(imageBlob);
            blobUrlsRef.current.push(url);
            setImageUrl(url);
          }
        }

        setFeedback(data.feedback);
      } catch (err) {
        console.error("Failed to load resume:", err);
        setLoadError("Could not load resume feedback. Please try again.");
      } finally {
        setDataLoading(false);
      }
    };

    loadResume();

    // Cleanup blob URLs on unmount to prevent memory leaks
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, [id, isLoading, auth.isAuthenticated, navigate]);

  return (
    <main className="!pt-0">
      <nav className="px-4 py-3">
        <Link to="/" className="back-button w-fit">
          <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back</span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        {/* Left panel: resume preview */}
        <section
          className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center overflow-hidden"
        >
          {dataLoading ? (
            <div className="resume-preview-skeleton" />
          ) : imageUrl && resumeUrl ? (
            <div className="animate-in fade-in duration-700 gradient-border w-fit max-w-full h-[90%] flex items-center justify-center overflow-hidden">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain object-top rounded-2xl"
                  title="View full resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          ) : resumeUrl ? (
            <div className="text-center text-gray-500 p-8 bg-white rounded-2xl shadow-sm">
              <p className="text-sm font-medium">Preview unavailable for this file.</p>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 font-semibold mt-2 inline-block"
              >
                Open uploaded resume
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-400 p-8">
              <p className="text-sm">No preview available</p>
            </div>
          )}
        </section>

        {/* Right panel: feedback */}
        <section className="feedback-section">
          <h2 className="text-4xl text-black font-bold">Resume Review</h2>

          {dataLoading ? (
            <div className="flex flex-col gap-6">
              <div className="skeleton-block h-32 rounded-2xl" />
              <div className="skeleton-block h-48 rounded-2xl" />
              <div className="skeleton-block h-64 rounded-2xl" />
            </div>
          ) : feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-700">
              <Summary feedback={feedback} />
              <StrengthMeter feedback={feedback} />
              <ATS
                score={feedback.ATS.score ?? 0}
                suggestion={feedback.ATS.tips ?? []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              {loadError ? (
                <>
                  <img src="/icons/warning.svg" className="w-10 h-10" alt="warning" />
                  <p className="text-gray-600 text-sm">{loadError}</p>
                  <Link to="/upload" className="primary-button w-fit">
                    Try another resume
                  </Link>
                </>
              ) : (
                <>
                  <img
                    src="/images/resume-scan-2.gif"
                    className="w-48 h-48 object-contain"
                    alt="Scanning resume"
                  />
                  <p className="text-gray-500 text-sm">Loading your feedback...</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default resume;
