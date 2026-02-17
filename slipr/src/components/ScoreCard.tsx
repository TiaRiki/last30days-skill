"use client";

import type { CategoryScore } from "@/lib/types";

interface Props {
  score: CategoryScore;
  visible: boolean;
  delay: number;
}

export default function ScoreCard({ score, visible, delay }: Props) {
  const color =
    score.score <= 3
      ? "#DC2626"
      : score.score <= 6
        ? "#F59E0B"
        : "#10B981";

  const colorLabel =
    score.score <= 3 ? "RED" : score.score <= 6 ? "YEL" : "GRN";

  const bgLight =
    score.score <= 3
      ? "bg-red-50"
      : score.score <= 6
        ? "bg-amber-50"
        : "bg-emerald-50";

  return (
    <div
      className={`${bgLight} rounded-xl p-4 text-center transition-all duration-500 border-2 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
      style={{
        borderColor: visible ? color : "transparent",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="text-3xl font-black tracking-tight"
        style={{ color }}
      >
        {score.letter}
      </div>
      <div
        className="text-[10px] font-bold uppercase tracking-wider mt-1"
        style={{ color }}
      >
        {colorLabel}
      </div>
      <div className="text-2xl font-bold text-gray-800 mt-1">
        {visible ? score.score : "—"}
      </div>
      <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">
        {score.label}
      </div>
    </div>
  );
}
