"use client";

import { useState, useRef } from "react";
import { INDUSTRY_OPTIONS } from "@/data/industry-benchmarks";

interface InputFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  error: string | null;
}

export default function InputForm({ onSubmit, loading, error }: InputFormProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [metro, setMetro] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [hiringFile, setHiringFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hiringFileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("websiteUrl", websiteUrl);
    formData.set("googleBusinessUrl", googleBusinessUrl);
    formData.set("industry", industry);
    formData.set("metro", metro);
    if (csvFile) {
      formData.set("csvFile", csvFile);
    }
    if (hiringFile) {
      formData.set("hiringFile", hiringFile);
    }
    onSubmit(formData);
  }

  const isValid = websiteUrl.trim() && industry && csvFile;

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1B365D]">
          Run a Revenue Leak Scan
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter the business details below. We&apos;ll analyze their website,
          review data, and digital footprint.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Website URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8692D] focus:border-[#E8692D] outline-none transition text-gray-900"
            required
          />
        </div>

        {/* Google Business URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Business Profile URL{" "}
            <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={googleBusinessUrl}
            onChange={(e) => setGoogleBusinessUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8692D] focus:border-[#E8692D] outline-none transition text-gray-900"
          />
        </div>

        {/* CSV Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Outscraper CSV Upload <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              csvFile
                ? "border-[#10B981] bg-green-50"
                : "border-gray-300 hover:border-[#E8692D] hover:bg-orange-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {csvFile ? (
              <div>
                <svg
                  className="w-8 h-8 mx-auto text-[#10B981] mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {csvFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(csvFile.size / 1024).toFixed(1)} KB — Click to replace
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Click to upload Outscraper CSV
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Single company review export
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hiring Signals Upload (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hiring Signals{" "}
            <span className="text-gray-400">(optional)</span>
          </label>
          <div
            onClick={() => hiringFileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
              hiringFile
                ? "border-[#10B981] bg-green-50"
                : "border-gray-300 hover:border-[#E8692D] hover:bg-orange-50"
            }`}
          >
            <input
              ref={hiringFileRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setHiringFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {hiringFile ? (
              <div>
                <svg
                  className="w-6 h-6 mx-auto text-[#10B981] mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {hiringFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(hiringFile.size / 1024).toFixed(1)} KB — Click to replace
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="w-6 h-6 mx-auto text-gray-400 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Upload hiring research from your prep work
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Accepts .pdf, .txt, .md files
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Industry & Metro Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8692D] focus:border-[#E8692D] outline-none transition text-gray-900 bg-white"
              required
            >
              <option value="">Select industry...</option>
              {INDUSTRY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metro
            </label>
            <input
              type="text"
              value={metro}
              onChange={(e) => setMetro(e.target.value)}
              placeholder="Dallas, TX"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8692D] focus:border-[#E8692D] outline-none transition text-gray-900"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className={`w-full py-3 px-6 rounded-lg text-white font-bold text-lg transition-all ${
            isValid && !loading
              ? "bg-[#E8692D] hover:bg-[#d15a22] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              SCANNING...
            </span>
          ) : (
            "RUN SCAN"
          )}
        </button>
      </form>
    </div>
  );
}
