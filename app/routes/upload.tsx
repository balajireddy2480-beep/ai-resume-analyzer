import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { generateUUID } from "~/lib/formatSize";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";

const upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isprocessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
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
    setIsProcessing(true);
    setStatusText("Uploading the file...");
    const UploaderFile = await fs.upload([file]);
    if (!UploaderFile) return setStatusText("Failed to upload the file.");

    setStatusText(" Converting to Image ...");
    const image = await convertPdfToImage(file);
    if (!image.file)
      return setStatusText("ERROR: Failed to convert PDF to image.");
    setStatusText("uploading the image...");
    const uploadedImage = await fs.upload([image.file]);
    if (!uploadedImage) return setStatusText("Failed to upload the image.");

    setStatusText("Preparing data...");

    const uuid = generateUUID();

    const data = {
      id: uuid,
      resumePath: UploaderFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: null,
    };

    await kv.set(`resume-${uuid}`, JSON.stringify(data));

    setStatusText("Analyzing resume...");

    const response = await ai.feedback(
      UploaderFile.path,
      prepareInstructions({ jobTitle, jobDescription }),
    );

    if (!response) {
      return setStatusText("Failed to analyze the resume.");
    }

    const feedbackText =
      typeof response.message.content === "string"
        ? response.message.content
        : response.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);

    await kv.set(`resume-${uuid}`, JSON.stringify(data));

    setStatusText("Analysis complete! Redirecting to results page...");

    console.log(data);
    navigate(`/resume/${uuid}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formdata = new FormData(form);
    const companyName = formdata.get("company-name") as string;
    const jobTitle = formdata.get("job-title") as string;
    const jobDescription = formdata.get("job-description") as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isprocessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>drop your resume for ATS score and improvement suggestions</h2>
          )}
          {!isprocessing && (
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
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  rows={5}
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFilesSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
