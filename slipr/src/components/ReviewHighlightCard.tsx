"use client";

import type { ReviewHighlight } from "@/lib/types";

interface Props {
  highlight: ReviewHighlight;
}

export default function ReviewHighlightCard({ highlight }: Props) {
  const stars = "★".repeat(Math.round(highlight.rating)) +
    "☆".repeat(5 - Math.round(highlight.rating));

  const categoryColors: Record<string, string> = {
    speed: "#DC2626",
    infrastructure: "#F59E0B",
    process: "#E8692D",
    general: "#6B7280",
  };

  const categoryLabels: Record<string, string> = {
    speed: "Speed/Response Issue",
    infrastructure: "Booking/Access Issue",
    process: "Process Issue",
    general: "Negative Review",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded"
          style={{
            color: categoryColors[highlight.category] || "#6B7280",
            backgroundColor:
              (categoryColors[highlight.category] || "#6B7280") + "15",
          }}
        >
          {categoryLabels[highlight.category] || highlight.category}
        </span>
        <span className="text-xs text-gray-400">{highlight.date}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-400 text-sm">{stars}</span>
        <span className="text-xs text-gray-500">
          {highlight.rating}-star review
        </span>
      </div>
      <p className="text-sm text-gray-700 italic">
        &ldquo;{highlight.text}&rdquo;
      </p>
    </div>
  );
}
