import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/formatSize";

interface FileUploaderProps {
  onFilesSelect?: (file: File | null) => void;
  onError?: (message: string) => void;
}

const FileUploader = ({ onFilesSelect, onError }: FileUploaderProps) => {
  // Use a key to force-reset the dropzone when removing a file
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const code = rejection.errors[0]?.code;
        if (code === "file-invalid-type") {
          onError?.("Only PDF or DOCX files are supported");
        } else if (code === "file-too-large") {
          onError?.("File exceeds 20 MB limit.");
        } else {
          onError?.("Invalid file. Please upload a PDF or DOCX under 20 MB.");
        }
        return;
      }

      const file = acceptedFiles[0] ?? null;
      setSelectedFile(file);
      onFilesSelect?.(file);
    },
    [onFilesSelect, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setDropzoneKey((k) => k + 1); // Reset dropzone internal state
    onFilesSelect?.(null);
  };

  return (
    <div className="w-full gradient-border">
      <div
        {...getRootProps()}
        className={`uploader-drag-area transition-colors duration-200 ${
          isDragActive ? "bg-blue-50 border-blue-300" : ""
        }`}
      >
        <input key={dropzoneKey} {...getInputProps()} id="uploader" />

        {selectedFile ? (
          <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
            <img src="/images/pdf.png" alt="Resume file" className="size-8 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-700 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer flex-shrink-0"
              onClick={handleRemove}
              aria-label="Remove file"
            >
              <img src="/icons/cross.svg" alt="Remove" className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/icons/info.svg" alt="Upload" className="size-14" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Click to upload</span>
                {" "}or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF or DOCX - Max 20 MB</p>
            </div>
            {isDragActive && (
              <p className="text-sm text-blue-500 font-medium animate-pulse">
                Drop your resume here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
