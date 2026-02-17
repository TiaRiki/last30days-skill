import type { ParsedReview, CategoryScore, Finding, ReviewHighlight } from "../types";
import { NEGATIVE_REVIEW_KEYWORDS } from "@/data/detection-patterns";

function daysBetween(dateStr: string, now: Date): number {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return Infinity;
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return Infinity;
  }
}

function relativeDate(dateStr: string, now: Date): string {
  const days = daysBetween(dateStr, now);
  if (days === Infinity) return "unknown date";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function analyzeReputation(reviews: ParsedReview[]): {
  score: CategoryScore;
  highlights: ReviewHighlight[];
  stats: {
    overallRating: number;
    totalReviews: number;
    last7Days: number;
    last30Days: number;
    last90Days: number;
    monthlyVelocity: number;
    responseRate: number;
    copyPasteRate: number;
    avgResponseLength: number;
  };
} {
  const now = new Date();
  const findings: Finding[] = [];
  const details: Record<string, unknown> = {};

  // Core Metrics
  const totalReviews = reviews.length;
  const overallRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const last7Days = reviews.filter((r) => daysBetween(r.date, now) <= 7).length;
  const last30Days = reviews.filter(
    (r) => daysBetween(r.date, now) <= 30
  ).length;
  const last90Days = reviews.filter(
    (r) => daysBetween(r.date, now) <= 90
  ).length;

  // Calculate monthly velocity from all reviews
  const reviewDates = reviews
    .map((r) => daysBetween(r.date, now))
    .filter((d) => d !== Infinity);
  const oldestReviewDays =
    reviewDates.length > 0 ? Math.max(...reviewDates) : 1;
  const monthSpan = Math.max(1, oldestReviewDays / 30);
  const monthlyVelocity = totalReviews / monthSpan;

  // Response stats (basic — detailed analysis in process.ts)
  const withResponses = reviews.filter(
    (r) => r.ownerResponse && r.ownerResponse.trim().length > 0
  );
  const responseRate =
    totalReviews > 0 ? withResponses.length / totalReviews : 0;
  const avgResponseLength =
    withResponses.length > 0
      ? withResponses.reduce((sum, r) => sum + (r.ownerResponse?.length || 0), 0) /
        withResponses.length
      : 0;

  details.coreMetrics = {
    overallRating: Math.round(overallRating * 10) / 10,
    totalReviews,
    last7Days,
    last30Days,
    last90Days,
    monthlyVelocity: Math.round(monthlyVelocity * 10) / 10,
  };

  // Rating findings
  if (overallRating >= 4.8) {
    findings.push({
      type: "positive",
      text: `${overallRating.toFixed(1)} star rating — excellent reputation`,
    });
  } else if (overallRating >= 4.5) {
    findings.push({
      type: "positive",
      text: `${overallRating.toFixed(1)} star rating — strong reputation`,
    });
  } else if (overallRating >= 4.0) {
    findings.push({
      type: "neutral",
      text: `${overallRating.toFixed(1)} star rating — room for improvement`,
    });
  } else {
    findings.push({
      type: "negative",
      text: `${overallRating.toFixed(1)} star rating — below industry standard, actively losing prospects`,
    });
  }

  // Volume findings
  if (totalReviews >= 200) {
    findings.push({
      type: "positive",
      text: `${totalReviews} total reviews — strong social proof`,
    });
  } else if (totalReviews >= 100) {
    findings.push({
      type: "neutral",
      text: `${totalReviews} total reviews — decent but competitors may have more`,
    });
  } else if (totalReviews >= 25) {
    findings.push({
      type: "negative",
      text: `Only ${totalReviews} reviews — thin social proof, need a review generation system`,
    });
  } else {
    findings.push({
      type: "negative",
      text: `Only ${totalReviews} reviews — critically low social proof`,
    });
  }

  // Velocity findings
  if (monthlyVelocity >= 8) {
    findings.push({
      type: "positive",
      text: `${monthlyVelocity.toFixed(1)} reviews/month — strong velocity`,
    });
  } else if (monthlyVelocity >= 3) {
    findings.push({
      type: "neutral",
      text: `${monthlyVelocity.toFixed(1)} reviews/month — moderate velocity`,
    });
  } else {
    findings.push({
      type: "negative",
      text: `${monthlyVelocity.toFixed(1)} reviews/month — stagnant review flow`,
    });
  }

  // Recency
  if (last7Days > 0) {
    findings.push({
      type: "positive",
      text: `${last7Days} reviews in the last 7 days`,
    });
  } else if (last30Days > 0) {
    findings.push({
      type: "neutral",
      text: `Last review was ${last30Days > 1 ? "within 30 days" : "recent"}`,
    });
  } else {
    findings.push({
      type: "negative",
      text: "No reviews in the last 30 days — reputation looks inactive to prospects",
    });
  }

  // Sentiment Analysis on Negative Reviews (1-3 stars)
  const negativeReviews = reviews.filter(
    (r) => r.rating <= 3 && r.reviewText
  );
  const sentimentCategories: Record<string, number> = {
    speed: 0,
    infrastructure: 0,
    process: 0,
    general: 0,
  };

  for (const review of negativeReviews) {
    const textLower = review.reviewText.toLowerCase();
    for (const [category, keywords] of Object.entries(
      NEGATIVE_REVIEW_KEYWORDS
    )) {
      if (keywords.some((kw) => textLower.includes(kw))) {
        sentimentCategories[category]++;
      }
    }
  }

  details.sentimentCategories = sentimentCategories;

  const topIssue = Object.entries(sentimentCategories)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];

  if (topIssue && topIssue[1] >= 3) {
    const categoryLabels: Record<string, string> = {
      speed: "speed/response time",
      infrastructure: "booking/scheduling difficulty",
      process: "organizational/process issues",
      general: "general service quality",
    };
    findings.push({
      type: "negative",
      text: `${topIssue[1]} negative reviews mention ${categoryLabels[topIssue[0]]} — recurring pattern`,
    });
  }

  // Extract Review Highlights
  const highlights: ReviewHighlight[] = [];

  // Find most impactful negative reviews about speed/communication
  const speedComplaints = negativeReviews
    .filter((r) => {
      const textLower = r.reviewText.toLowerCase();
      return NEGATIVE_REVIEW_KEYWORDS.speed.some((kw) =>
        textLower.includes(kw)
      );
    })
    .sort((a, b) => a.rating - b.rating);

  for (const review of speedComplaints.slice(0, 2)) {
    const snippet = extractQuote(
      review.reviewText,
      NEGATIVE_REVIEW_KEYWORDS.speed
    );
    if (snippet) {
      highlights.push({
        text: snippet,
        rating: review.rating,
        date: relativeDate(review.date, now),
        category: "speed",
      });
    }
  }

  // Process complaints
  const processComplaints = negativeReviews
    .filter((r) => {
      const textLower = r.reviewText.toLowerCase();
      return NEGATIVE_REVIEW_KEYWORDS.process.some((kw) =>
        textLower.includes(kw)
      );
    })
    .sort((a, b) => a.rating - b.rating);

  for (const review of processComplaints.slice(0, 1)) {
    const snippet = extractQuote(
      review.reviewText,
      NEGATIVE_REVIEW_KEYWORDS.process
    );
    if (snippet) {
      highlights.push({
        text: snippet,
        rating: review.rating,
        date: relativeDate(review.date, now),
        category: "process",
      });
    }
  }

  // If we don't have enough highlights, add any negative reviews
  if (highlights.length === 0 && negativeReviews.length > 0) {
    const worst = negativeReviews.sort((a, b) => a.rating - b.rating)[0];
    if (worst.reviewText.length > 10) {
      const snippet =
        worst.reviewText.length > 80
          ? worst.reviewText.slice(0, 77) + "..."
          : worst.reviewText;
      highlights.push({
        text: snippet,
        rating: worst.rating,
        date: relativeDate(worst.date, now),
        category: "general",
      });
    }
  }

  // Calculate Score
  let score = 1;

  // Rating
  if (overallRating >= 4.8) score += 4;
  else if (overallRating >= 4.5) score += 3;
  else if (overallRating >= 4.0) score += 2;
  else if (overallRating >= 3.5) score += 1;

  // Volume
  if (totalReviews >= 200) score += 3;
  else if (totalReviews >= 100) score += 2;
  else if (totalReviews >= 50) score += 1;

  // Velocity
  if (monthlyVelocity >= 8) score += 2;
  else if (monthlyVelocity >= 3) score += 1;

  // Negative sentiment penalty
  const totalNegativeThemes = Object.values(sentimentCategories).reduce(
    (a, b) => a + b,
    0
  );
  if (totalNegativeThemes >= 10) score -= 2;
  else if (totalNegativeThemes >= 5) score -= 1;

  score = Math.min(10, Math.max(1, score));

  return {
    score: {
      letter: "R",
      label: "Reputation",
      score,
      findings,
      details,
    },
    highlights,
    stats: {
      overallRating: Math.round(overallRating * 10) / 10,
      totalReviews,
      last7Days,
      last30Days,
      last90Days,
      monthlyVelocity: Math.round(monthlyVelocity * 10) / 10,
      responseRate: Math.round(responseRate * 100) / 100,
      copyPasteRate: 0, // filled in by process analyzer
      avgResponseLength: Math.round(avgResponseLength),
    },
  };
}

// Extract the most relevant quote from a review
function extractQuote(text: string, keywords: string[]): string | null {
  if (!text || text.length < 10) return null;

  // Try to find a sentence containing one of the keywords
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      const trimmed = sentence.trim();
      if (trimmed.length > 80) {
        // Find the keyword and center around it
        for (const kw of keywords) {
          const idx = lower.indexOf(kw);
          if (idx !== -1) {
            const start = Math.max(0, idx - 30);
            const end = Math.min(trimmed.length, idx + kw.length + 40);
            let snippet = trimmed.slice(start, end).trim();
            if (start > 0) snippet = "..." + snippet;
            if (end < trimmed.length) snippet = snippet + "...";
            return snippet;
          }
        }
      }
      return trimmed;
    }
  }

  // Fallback: just return start of text
  return text.length > 80 ? text.slice(0, 77) + "..." : text;
}
