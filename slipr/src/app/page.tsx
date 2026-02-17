"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import type { ScanResult } from "@/lib/types";

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState(false);

  async function handleScan(formData: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Scan failed");
        return;
      }

      setResult({ ...data, recordingMode });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error — please try again"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-[#1B365D] text-white py-6 px-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-[#E8692D]">S.L.I.P.R.</span> Revenue Leak
              Scanner
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              Diagnose operational gaps costing service businesses money
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <span className="text-gray-300">Recording Mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={recordingMode}
                onClick={() => setRecordingMode(!recordingMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  recordingMode ? "bg-[#E8692D]" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    recordingMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!result ? (
          <>
            <InputForm
              onSubmit={handleScan}
              loading={loading}
              error={error}
            />
          </>
        ) : (
          <>
            <button
              onClick={handleReset}
              className="mb-6 text-sm text-[#1B365D] hover:text-[#E8692D] transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              New Scan
            </button>
            <ResultsDisplay result={result} />
          </>
        )}
      </div>
    </main>
  );
}
