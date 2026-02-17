"use client";

import { useState, useEffect } from "react";
import type { ScanResult, CategoryScore, Finding } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import ReviewHighlightCard from "./ReviewHighlightCard";

interface Props {
  result: ScanResult;
}

export default function ResultsDisplay({ result }: Props) {
  const {
    companyName,
    metro,
    industryLabel,
    scores,
    overallScore,
    priorityLeak,
    reviewHighlights,
    reviewStats,
    recommendation,
    recordingMode,
  } = result;

  // Recording mode: stagger reveals
  const [visibleScores, setVisibleScores] = useState<number>(
    recordingMode ? 0 : 5
  );
  const [showPriority, setShowPriority] = useState(!recordingMode);
  const [showReviews, setShowReviews] = useState(!recordingMode);
  const [showRecommendation, setShowRecommendation] = useState(!recordingMode);

  useEffect(() => {
    if (!recordingMode) return;

    const timers: NodeJS.Timeout[] = [];
    // Reveal scores one by one
    for (let i = 0; i < 5; i++) {
      timers.push(
        setTimeout(() => setVisibleScores(i + 1), 600 + i * 700)
      );
    }
    // Then sections
    timers.push(setTimeout(() => setShowPriority(true), 4200));
    timers.push(setTimeout(() => setShowReviews(true), 5200));
    timers.push(setTimeout(() => setShowRecommendation(true), 6200));

    return () => timers.forEach(clearTimeout);
  }, [recordingMode]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#E8692D] mb-1">
          S.L.I.P.R. Scan Results
        </h2>
        <h3 className="text-2xl font-bold text-[#1B365D]">
          {companyName}
          {metro ? ` — ${metro}` : ""}
        </h3>
        <p className="text-gray-500 text-sm mt-1">{industryLabel}</p>
      </div>

      {/* Scorecard */}
      <div className="animate-fade-in-up bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-5 gap-3">
          {scores.map((s, idx) => (
            <ScoreCard
              key={s.letter}
              score={s}
              visible={idx < visibleScores}
              delay={recordingMode ? idx * 700 : 0}
            />
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-400">Overall Score</span>
          <span className="ml-2 text-lg font-bold text-[#1B365D]">
            {overallScore}/10
          </span>
        </div>
      </div>

      {/* Priority Leak */}
      {showPriority && (
        <div
          className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
            priorityLeak.score <= 3
              ? "border-[#DC2626]"
              : priorityLeak.score <= 6
                ? "border-[#F59E0B]"
                : "border-[#10B981]"
          } ${recordingMode ? "animate-fade-in-up" : ""}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                priorityLeak.score <= 3
                  ? "bg-[#DC2626]"
                  : priorityLeak.score <= 6
                    ? "bg-[#F59E0B]"
                    : "bg-[#10B981]"
              }`}
            >
              {priorityLeak.letter}
            </div>
            <div>
              <h3 className="font-bold text-[#1B365D]">
                Priority Leak: {priorityLeak.label}
              </h3>
              <p className="text-sm text-gray-500">
                Score: {priorityLeak.score}/10 — Estimated monthly impact:{" "}
                <span className="font-bold text-[#DC2626]">
                  ${priorityLeak.monthlyImpact.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {priorityLeak.findings.map((f, i) => (
              <FindingRow key={i} finding={f} />
            ))}
          </ul>
        </div>
      )}

      {/* Review Highlights */}
      {showReviews && reviewStats.totalReviews > 0 && (
        <div
          className={`bg-white rounded-xl shadow-md p-6 ${recordingMode ? "animate-fade-in-up" : ""}`}
        >
          <h3 className="font-bold text-[#1B365D] mb-4">Review Snapshot</h3>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatBox
              label="Rating"
              value={`${reviewStats.overallRating} stars`}
              color={
                reviewStats.overallRating >= 4.5
                  ? "#10B981"
                  : reviewStats.overallRating >= 4.0
                    ? "#F59E0B"
                    : "#DC2626"
              }
            />
            <StatBox
              label="Total Reviews"
              value={reviewStats.totalReviews.toString()}
            />
            <StatBox
              label="Last 30 Days"
              value={reviewStats.last30Days.toString()}
            />
            <StatBox
              label="Monthly Velocity"
              value={`${reviewStats.monthlyVelocity}/mo`}
            />
          </div>

          {/* Response stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatBox
              label="Response Rate"
              value={`${Math.round(reviewStats.responseRate * 100)}%`}
              color={
                reviewStats.responseRate >= 0.7
                  ? "#10B981"
                  : reviewStats.responseRate >= 0.4
                    ? "#F59E0B"
                    : "#DC2626"
              }
            />
            <StatBox
              label="Copy/Paste Rate"
              value={`${Math.round(reviewStats.copyPasteRate * 100)}%`}
              color={
                reviewStats.copyPasteRate <= 0.3
                  ? "#10B981"
                  : reviewStats.copyPasteRate <= 0.5
                    ? "#F59E0B"
                    : "#DC2626"
              }
            />
            <StatBox
              label="Avg Response Length"
              value={`${reviewStats.avgResponseLength} chars`}
            />
          </div>

          {/* Highlight cards */}
          {reviewHighlights.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Notable Reviews
              </h4>
              {reviewHighlights.map((h, i) => (
                <ReviewHighlightCard key={i} highlight={h} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Findings */}
      {showRecommendation && (
        <>
          {/* Recommendation */}
          <div
            className={`bg-[#1B365D] text-white rounded-xl shadow-md p-6 ${recordingMode ? "animate-fade-in-up" : ""}`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#E8692D] flex items-center justify-center text-white flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wide text-[#E8692D] font-bold">
                  What I&apos;d Build First
                </h3>
                <h4 className="text-xl font-bold mt-1">
                  {recommendation.systemName}
                </h4>
              </div>
            </div>

            <ul className="space-y-2 mb-4 ml-13">
              {recommendation.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-[#E8692D] mt-0.5 flex-shrink-0">
                    +
                  </span>
                  <span className="text-gray-200">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white/10 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-bold text-white">Why: </span>
                {recommendation.why}
              </p>
              <p className="text-sm mt-2">
                <span className="font-bold text-[#E8692D]">Impact: </span>
                <span className="text-gray-200">{recommendation.impact}</span>
              </p>
            </div>
          </div>

          {/* All Findings Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-[#1B365D] mb-4">
              Full Findings Breakdown
            </h3>
            <div className="space-y-6">
              {scores.map((s) => (
                <FindingsSection key={s.letter} score={s} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div
        className="text-lg font-bold"
        style={color ? { color } : { color: "#1B365D" }}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function FindingsSection({ score }: { score: CategoryScore }) {
  const scoreColor =
    score.score <= 3
      ? "#DC2626"
      : score.score <= 6
        ? "#F59E0B"
        : "#10B981";

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: scoreColor }}
        >
          {score.letter}
        </span>
        <span className="font-semibold text-[#1B365D]">{score.label}</span>
        <span
          className="text-sm font-bold ml-auto"
          style={{ color: scoreColor }}
        >
          {score.score}/10
        </span>
      </div>
      <ul className="space-y-1 ml-10">
        {score.findings.map((f, i) => (
          <FindingRow key={i} finding={f} />
        ))}
      </ul>
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const icon =
    finding.type === "positive"
      ? { symbol: "+", color: "#10B981" }
      : finding.type === "negative"
        ? { symbol: "-", color: "#DC2626" }
        : { symbol: "~", color: "#F59E0B" };

  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className="font-bold mt-0.5 flex-shrink-0 w-4 text-center"
        style={{ color: icon.color }}
      >
        {icon.symbol}
      </span>
      <span className="text-gray-700">{finding.text}</span>
    </li>
  );
}
