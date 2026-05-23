import React, { useState } from "react";
import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import ResetModal from "./ResetModal";

const Navbar = () => {
  const { auth } = usePuterStore();
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <nav className="navbar">
        <Link to="/">
          <p className="text-2xl font-bold text-gradient">RESUMIND</p>
        </Link>

        <div className="flex items-center gap-3">
          {/* Reset data — subtle icon button */}
          {auth.isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              title="Reset App Data"
              aria-label="Reset App Data"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}

          <Link to="/upload" className="primary-button w-fit">
            Upload Resume
          </Link>
        </div>
      </nav>

      <ResetModal isOpen={showReset} onClose={() => setShowReset(false)} />
    </>
  );
};

export default Navbar;
