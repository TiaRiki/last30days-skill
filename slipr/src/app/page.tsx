"use client";

import { useState, useEffect, useRef } from "react";
import InputForm from "@/components/InputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import type { ScanResult } from "@/lib/types";

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState(false);

  // Day counter — persisted in localStorage
  const [dayNumber, setDayNumber] = useState(1);
  const [showDaySettings, setShowDaySettings] = useState(false);
  const [dayInput, setDayInput] = useState("");

  // CTA URL — customizable in settings
  const [ctaUrl, setCtaUrl] = useState("therevenurecoverypeople.com/scan");
  const [showSettings, setShowSettings] = useState(false);
  const [ctaInput, setCtaInput] = useState("");

  // Scan timer
  const scanStartRef = useRef<number>(0);

  // Load persisted state from localStorage
  useEffect(() => {
    const savedDay = localStorage.getItem("slipr-day-number");
    if (savedDay) setDayNumber(parseInt(savedDay, 10) || 1);
    const savedCta = localStorage.getItem("slipr-cta-url");
    if (savedCta) setCtaUrl(savedCta);
  }, []);

  // Save day number when it changes
  useEffect(() => {
    localStorage.setItem("slipr-day-number", String(dayNumber));
  }, [dayNumber]);

  // Save CTA URL when it changes
  useEffect(() => {
    localStorage.setItem("slipr-cta-url", ctaUrl);
  }, [ctaUrl]);

  async function handleScan(formData: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    scanStartRef.current = performance.now();

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

      const scanTimeSeconds =
        Math.round((performance.now() - scanStartRef.current) / 100) / 10;

      setResult({ ...data, recordingMode, scanTimeSeconds });
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

  function handleSaveDayNumber() {
    const num = parseInt(dayInput, 10);
    if (num > 0) {
      setDayNumber(num);
    }
    setShowDaySettings(false);
    setDayInput("");
  }

  function handleSaveCtaUrl() {
    if (ctaInput.trim()) {
      setCtaUrl(ctaInput.trim());
    }
    setShowSettings(false);
    setCtaInput("");
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-[#1B365D] text-white py-6 px-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-[#E8692D]">S.L.I.P.R.</span> Revenue Leak
                Scanner
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Diagnose operational gaps costing service businesses money
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Day Counter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDaySettings(!showDaySettings);
                  setDayInput(String(dayNumber));
                }}
                className="text-xl font-bold text-[#E8692D] hover:text-orange-300 transition-colors cursor-pointer"
                title="Click to set day number"
              >
                Day {dayNumber}
              </button>
              {showDaySettings && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-3 z-50 min-w-[180px]">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Set Day Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={dayInput}
                      onChange={(e) => setDayInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveDayNumber()}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-1 focus:ring-[#E8692D] outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveDayNumber}
                      className="px-3 py-1 bg-[#E8692D] text-white text-sm rounded hover:bg-[#d15a22] transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Mode Toggle */}
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

            {/* Settings Gear */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setCtaInput(ctaUrl);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[300px]">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Settings</h4>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      CTA URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ctaInput}
                        onChange={(e) => setCtaInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveCtaUrl()}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:ring-1 focus:ring-[#E8692D] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCtaUrl}
                        className="px-3 py-1 bg-[#E8692D] text-white text-sm rounded hover:bg-[#d15a22] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <ResultsDisplay
              result={result}
              dayNumber={dayNumber}
              ctaUrl={ctaUrl}
            />
          </>
        )}
      </div>
    </main>
  );
}
