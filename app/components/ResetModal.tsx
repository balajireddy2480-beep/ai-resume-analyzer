import React, { useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { useToast } from "./Toast";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResetModal = ({ isOpen, onClose }: ResetModalProps) => {
  const { kv } = usePuterStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Safely delete only resume-related keys (NOT kv.flush which wipes everything)
      const resumeKeys = await kv.list("resume-*");
      const analysisKeys = await kv.list("analysis-*");

      const allKeys = [
        ...(Array.isArray(resumeKeys) ? (resumeKeys as string[]) : []),
        ...(Array.isArray(analysisKeys) ? (analysisKeys as string[]) : []),
      ];

      await Promise.all(allKeys.map((key) => kv.delete(key)));

      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();

      showToast("App data cleared successfully", "success");
      onClose();

      // Small delay so user sees the toast before redirect
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error("Reset failed:", err);
      showToast("Failed to clear data. Please try again.", "error");
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-5 animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <span className="text-lg">🗑️</span>
            </div>
            <h2
              id="reset-modal-title"
              className="text-lg font-bold text-gray-900 !text-gray-900"
            >
              Reset App Data
            </h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to clear your uploaded resumes and analysis data?
            </p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mt-1">
              This will permanently remove uploaded files, feedback, and cached analysis.
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Clearing...
                </>
              ) : (
                "Reset Data"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetModal;
