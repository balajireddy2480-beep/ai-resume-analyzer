import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { generateUUID } from "~/lib/formatSize";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { analyzeResume } from "~/services/analyzer/analyzeResume";
import {
  isSupportedResumeFile,
  parseResume,
  parseResumeText,
} from "~/services/parser/parseResume";

type ProcessingStatus =
  | "idle"
  | "uploading"
  | "parsing"
  | "analyzing"
  | "completed"
  | "error";

const upload = () => {
  const { fs, kv, ai } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setFileError("");
    setProcessingStatus("idle");
  };

  const handleFileError = (message: string) => {
    setFileError(message);
    setFile(null);
    setProcessingStatus("error");
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    if (!isSupportedResumeFile(file)) {
      setFileError("Only PDF or DOCX files are supported");
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setStatusText("Uploading your resume...");
    setFileError("");

    try {
      setProcessingStatus("parsing");
      setStatusText("Extracting resume content...");
      let parsedResume;
      try {
        parsedResume = await parseResume(file);
      } catch (parseErr) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          throw parseErr;
        }

        setStatusText("Reading scanned resume text...");
        const image = await convertPdfToImage(file);
        if (!image.file) {
          throw parseErr;
        }

        const ocrText = await ai.img2txt(image.file);
        parsedResume = parseResumeText(ocrText ?? "");

        if (!parsedResume.text || parsedResume.text.length < 40) {
          throw parseErr;
        }
      }

      setProcessingStatus("analyzing");
      setStatusText("Analyzing ATS score and feedback...");
      const parsedFeedback = analyzeResume({
        parsedResume,
        jobTitle,
        jobDescription,
      });

      const uuid = generateUUID();

      const data = {
        id: uuid,
        resumePath: "",
        imagePath: "",
        fileType: file.type || (file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf"),
        companyName,
        jobTitle,
        jobDescription,
        feedback: parsedFeedback as Feedback | null,
        parsedResume,
        uploadedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(`resume-${uuid}`, JSON.stringify(data));

      const saveAnalysis = async () => {
        const uploadedFile = await fs.upload([file]);
        if (uploadedFile) {
          data.resumePath = uploadedFile.path;
        }

        if (file.name.toLowerCase().endsWith(".pdf")) {
          setStatusText("Preparing resume preview...");
          const image = await convertPdfToImage(file);
          if (image.file) {
            const uploadedImage = await fs.upload([image.file]);
            data.imagePath = uploadedImage?.path ?? "";
          }
        }

        await kv.set(`resume-${uuid}`, JSON.stringify(data));
        window.localStorage.setItem(`resume-${uuid}`, JSON.stringify(data));
      };

      void saveAnalysis().catch((saveErr) => {
        console.warn("Analysis completed, but cloud save failed:", saveErr);
      });

      setProcessingStatus("completed");
      setStatusText("Analysis complete! Redirecting...");
      navigate(`/resume/${uuid}`);
    } catch (err) {
      console.error("Unexpected analysis error:", err);
      setProcessingStatus("error");
      const message =
        err instanceof Error && err.message.includes("Only PDF or DOCX")
          ? "Only PDF or DOCX files are supported"
          : "Could not analyze resume. Please try another file.";
      setStatusText(message);
      setFileError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setFileError("Please select a PDF or DOCX resume before analyzing.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <h2 className="animate-pulse">{statusText}</h2>
              <div className="upload-progress-bar">
                <div className="upload-progress-bar-fill" />
              </div>
              <img
                src="/images/resume-scan.gif"
                className="w-64 h-64 object-contain"
                alt="Scanning resume"
              />
            </div>
          ) : (
            <>
              <h2>Drop your resume for ATS score and improvement suggestions</h2>

              <form
                id="upload-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mt-8"
              >
                <div className="form-div">
                  <label htmlFor="company-name">Company Name</label>
                  <input
                    type="text"
                    name="company-name"
                    placeholder="e.g. Google"
                    id="company-name"
                  />
                </div>
                <div className="form-div">
                  <label htmlFor="job-title">Job Title</label>
                  <input
                    type="text"
                    name="job-title"
                    placeholder="e.g. Frontend Developer"
                    id="job-title"
                  />
                </div>
                <div className="form-div">
                  <label htmlFor="job-description">Job Description</label>
                  <textarea
                    name="job-description"
                    placeholder="Paste the job description here (optional but recommended for better analysis)"
                    id="job-description"
                    rows={5}
                  />
                </div>
                <div className="form-div">
                  <label htmlFor="uploader">Upload Resume</label>
                  <FileUploader
                    onFilesSelect={handleFileSelect}
                    onError={handleFileError}
                  />
                  {fileError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <img src="/icons/warning.svg" className="w-4 h-4" alt="warning" />
                      {fileError}
                    </p>
                  )}
                </div>

                <button className="primary-button" type="submit">
                  Analyze Resume
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
