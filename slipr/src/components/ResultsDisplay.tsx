"use client";

import { useState, useEffect } from "react";
import type { ScanResult, CategoryScore, Finding } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import ReviewHighlightCard from "./ReviewHighlightCard";

interface Props {
  result: ScanResult;
  dayNumber: number;
  ctaUrl: string;
}

// ---- Opportunity selection logic ----
interface Opportunity {
  text: string;
  category: string;
}

const OPPORTUNITIES = {
  leadNurture: [
    { text: "Educational email course — build trust before they're ready to buy", category: "lead_nurture" },
    { text: "Quote follow-up sequence — revive prospects who went cold", category: "lead_nurture" },
    { text: "Pre-service 'what to expect' sequence — reduce no-shows", category: "lead_nurture" },
  ],
  postService: [
    { text: "Post-service education sequence — reduce callbacks and complaints", category: "post_service" },
    { text: "Feedback loop sequence — catch complaints before they become bad reviews", category: "post_service" },
    { text: "Review request automation — ask at peak satisfaction", category: "post_service" },
    { text: "Maintenance reminder sequence — bring them back on schedule", category: "post_service" },
  ],
  reactivation: [
    { text: "Dormant customer reactivation — wake up 6+ month inactive customers", category: "reactivation" },
    { text: "Seasonal campaign automation — spring/fall/holiday touchpoints", category: "reactivation" },
    { text: "Lapsed quote follow-up — old quotes that never closed", category: "reactivation" },
  ],
  referral: [
    { text: "Referral program automation — turn happy customers into lead gen", category: "referral" },
    { text: "Post-review referral ask — strike while satisfaction is high", category: "referral" },
  ],
  internal: [
    { text: "Internal task routing — stop things falling through cracks", category: "internal" },
    { text: "New hire onboarding sequences — systematize training", category: "internal" },
  ],
};

function selectOpportunities(scores: CategoryScore[], reviewVelocity: number): Opportunity[] {
  const scoreMap: Record<string, number> = {};
  for (const s of scores) {
    scoreMap[s.letter] = s.score;
  }

  const selected: Opportunity[] = [];
  const usedCategories = new Set<string>();

  function addIfNew(opp: Opportunity) {
    if (selected.length >= 3) return;
    if (usedCategories.has(opp.text)) return;
    selected.push(opp);
    usedCategories.add(opp.text);
  }

  // If R score < 7 → include review request automation OR feedback loop
  if ((scoreMap["R"] || 10) < 7) {
    addIfNew(OPPORTUNITIES.postService[2]); // review request automation
  }

  // If L score < 6 → include educational email course OR quote follow-up
  if ((scoreMap["L"] || 10) < 6) {
    addIfNew(OPPORTUNITIES.leadNurture[0]); // educational email course
  }

  // If P score < 6 → include internal task routing
  if ((scoreMap["P"] || 10) < 6) {
    addIfNew(OPPORTUNITIES.internal[0]); // internal task routing
  }

  // If review velocity < 2/month → include review request automation
  if (reviewVelocity < 2) {
    addIfNew(OPPORTUNITIES.postService[2]); // review request automation
  }

  // Always include at least ONE reactivation/retention play
  if (!selected.some((o) => o.category === "reactivation" || o.category === "post_service")) {
    addIfNew(OPPORTUNITIES.reactivation[1]); // seasonal campaign
  }
  // If still no reactivation after above checks, force one
  if (!selected.some((o) => o.category === "reactivation")) {
    addIfNew(OPPORTUNITIES.reactivation[0]); // dormant reactivation
  }

  // Always include referral program if R score > 7
  if ((scoreMap["R"] || 0) > 7) {
    addIfNew(OPPORTUNITIES.referral[0]); // referral program
  }

  // Fill remaining slots to reach 3
  const fillers = [
    OPPORTUNITIES.postService[0], // post-service education
    OPPORTUNITIES.reactivation[1], // seasonal
    OPPORTUNITIES.referral[0], // referral
    OPPORTUNITIES.leadNurture[1], // quote follow-up
    OPPORTUNITIES.postService[3], // maintenance reminders
  ];
  for (const filler of fillers) {
    if (selected.length >= 3) break;
    addIfNew(filler);
  }

  return selected.slice(0, 3);
}

// ---- "What I See" bullet generation ----
function generateWhatISee(result: ScanResult): string[] {
  const bullets: string[] = [];
  const { scores, recommendation, reviewStats } = result;

  // Collect all negative findings across all scores, prioritize red then yellow
  const negatives: { text: string; score: number; letter: string }[] = [];
  for (const s of scores) {
    for (const f of s.findings) {
      if (f.type === "negative") {
        negatives.push({ text: f.text, score: s.score, letter: s.letter });
      }
    }
  }

  // Sort by score ascending (worst first)
  negatives.sort((a, b) => a.score - b.score);

  // Take top 2-3 negative findings, keeping bullets short
  for (const neg of negatives.slice(0, 3)) {
    // Trim to ~12 words max
    const words = neg.text.split(" ");
    const short = words.length > 12 ? words.slice(0, 12).join(" ") + "..." : neg.text;
    bullets.push(short);
  }

  // Reference the dollar impact from priority leak
  if (result.priorityLeak.monthlyImpact > 0 && bullets.length < 4) {
    const leakLabel = result.priorityLeak.label;
    const dollars = `$${result.priorityLeak.monthlyImpact.toLocaleString()}`;
    bullets.push(`${leakLabel} is the priority leak — ${dollars}/month walking out the door`);
  }

  // Velocity-based insight if applicable
  if (reviewStats.monthlyVelocity < 1 && bullets.length < 4) {
    bullets.push(`${reviewStats.monthlyVelocity} reviews/month — not asking consistently`);
  }

  return bullets.slice(0, 4);
}

export default function ResultsDisplay({ result, dayNumber, ctaUrl }: Props) {
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
    scanTimeSeconds,
  } = result;

  // Recording mode: stagger reveals
  const [visibleScores, setVisibleScores] = useState<number>(
    recordingMode ? 0 : 5
  );
  const [showPriority, setShowPriority] = useState(!recordingMode);
  const [showWhatISee, setShowWhatISee] = useState(!recordingMode);
  const [showRecommendation, setShowRecommendation] = useState(!recordingMode);
  const [showOpportunities, setShowOpportunities] = useState(!recordingMode);
  const [showReviews, setShowReviews] = useState(!recordingMode);
  const [showFindings, setShowFindings] = useState(!recordingMode);

  useEffect(() => {
    if (!recordingMode) return;

    const timers: NodeJS.Timeout[] = [];
    // Reveal scores one by one
    for (let i = 0; i < 5; i++) {
      timers.push(
        setTimeout(() => setVisibleScores(i + 1), 600 + i * 700)
      );
    }
    // Then sections in sequence
    timers.push(setTimeout(() => setShowPriority(true), 4200));
    timers.push(setTimeout(() => setShowWhatISee(true), 5200));
    timers.push(setTimeout(() => setShowRecommendation(true), 6200));
    timers.push(setTimeout(() => setShowOpportunities(true), 7200));
    timers.push(setTimeout(() => setShowReviews(true), 8200));
    timers.push(setTimeout(() => setShowFindings(true), 9200));

    return () => timers.forEach(clearTimeout);
  }, [recordingMode]);

  const whatISeeBullets = generateWhatISee(result);
  const opportunities = selectOpportunities(scores, reviewStats.monthlyVelocity);

  return (
    <div className="space-y-8">
      {/* 1. Header with Day Counter */}
      <div className="animate-fade-in-up text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#E8692D] mb-1">
          Day {dayNumber} | S.L.I.P.R. Scan Results
        </h2>
        {/* 2. Scan Timer */}
        {scanTimeSeconds != null && (
          <p className="text-xs text-gray-400 mb-2">
            &#x26A1; Scanned in {scanTimeSeconds} seconds
          </p>
        )}
        {/* 3. Company info */}
        <h3 className="text-2xl font-bold text-[#1B365D]">
          {companyName}
          {metro ? ` — ${metro}` : ""}
        </h3>
        <p className="text-gray-500 text-sm mt-1">{industryLabel}</p>
      </div>

      {/* 4. Scorecard */}
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

      {/* 5. Priority Leak */}
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

      {/* 6. "What I See" Panel — Recording Mode only */}
      {recordingMode && showWhatISee && (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#1B365D] animate-fade-in-up">
          <h3 className="text-lg font-bold text-[#1B365D] mb-4">
            &#x1F50D; WHAT I SEE
          </h3>
          <ul className="space-y-3 mb-4">
            {whatISeeBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[#DC2626] font-bold mt-0.5 flex-shrink-0">&#x2022;</span>
                <span className="text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-bold text-[#1B365D]">
              &#x1F4A1; WHAT I&apos;D BUILD FIRST:{" "}
              <span className="text-[#E8692D]">{recommendation.systemName}</span>
            </p>
          </div>
        </div>
      )}

      {/* 7. "What I'd Build First" Recommendation */}
      {showRecommendation && (
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
      )}

      {/* 8. "Other Opportunities I See" — Recording Mode only */}
      {recordingMode && showOpportunities && (
        <div className="bg-white rounded-xl shadow-md p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold text-[#1B365D] mb-4">
            &#x1F3AF; OTHER OPPORTUNITIES I SEE
          </h3>
          <ul className="space-y-3">
            {opportunities.map((opp, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[#E8692D] font-bold mt-0.5 flex-shrink-0">&#x2022;</span>
                <span className="text-gray-700">{opp.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 9. Review Snapshot */}
      {showReviews && reviewStats.totalReviews > 0 && (
        <div
          className={`bg-white rounded-xl shadow-md p-6 ${recordingMode ? "animate-fade-in-up" : ""}`}
        >
          <h3 className="font-bold text-[#1B365D] mb-4">Review Snapshot</h3>

          {/* Stats bar — velocity and recency are primary */}
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
              label="Monthly Velocity"
              value={`${reviewStats.monthlyVelocity}/mo`}
              color={
                reviewStats.monthlyVelocity >= 3
                  ? "#10B981"
                  : reviewStats.monthlyVelocity >= 1
                    ? "#F59E0B"
                    : "#DC2626"
              }
            />
            <StatBox
              label="Last 30 Days"
              value={reviewStats.last30Days.toString()}
              color={
                reviewStats.last30Days >= 3
                  ? "#10B981"
                  : reviewStats.last30Days >= 1
                    ? "#F59E0B"
                    : "#DC2626"
              }
            />
            <StatBox
              label="Total Reviews"
              value={reviewStats.totalReviews.toString()}
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

      {/* 10. Full Findings Breakdown — collapsed by default in recording mode */}
      {showFindings && (
        <FindingsBreakdown
          scores={scores}
          recordingMode={recordingMode}
        />
      )}

      {/* 11. CTA Bar — Recording Mode only */}
      {recordingMode && (
        <div className="bg-[#1B365D] rounded-xl shadow-lg p-4 text-center animate-fade-in-up">
          <p className="text-white text-lg font-semibold">
            Want your own S.L.I.P.R. scan?{" "}
            <span className="text-[#E8692D] font-bold">
              &#x2192; {ctaUrl}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function FindingsBreakdown({
  scores,
  recordingMode,
}: {
  scores: CategoryScore[];
  recordingMode: boolean;
}) {
  const [expanded, setExpanded] = useState(!recordingMode);

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${recordingMode ? "animate-fade-in-up" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-bold text-[#1B365D]">
          Full Findings Breakdown
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-6 mt-4">
          {scores.map((s) => (
            <FindingsSection key={s.letter} score={s} />
          ))}
        </div>
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
