import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/formatSize";

interface FileUploaderProps {
  onFilesSelect?: (files: File | null) => void;
}

const FileUploader = ({ onFilesSelect }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0] || null;

      onFilesSelect?.(selectedFile);
    },
    [onFilesSelect],
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxSize: 20 * 1024 * 1024, // 20 MB
    });

  const file = acceptedFiles[0] || null;

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="space-y-4 cursor-pointer">
          {file ? (
            <div
              className="uploader-selceted-file"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/pdf.png" alt="PDF Icon" className="size-10" />
              <div className="text-center space-y-2">
                <div>
                  <p className="text-lsm font-medium text-gray-700 truncate max-w-xs mx-auto">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                className="p-2 cursor-pointer"
                onClick={(e) => {
                  onFilesSelect?.(null);
                }}
              >
                <img
                  src="/icons/cross.svg"
                  alt="Remove File"
                  className="w-4 h-4"
                />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img
                  src="/icons/info.svg"
                  alt="Upload Resume"
                  className="size-20"
                />
              </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to Upload</span> or drag
                and drop
              </p>
              <p className="text-lg text-gray-500">pdf(max 20 MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
