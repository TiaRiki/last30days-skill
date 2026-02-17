// Core types for S.L.I.P.R. scanner

export interface ScanInput {
  websiteUrl: string;
  googleBusinessUrl?: string;
  industry: string;
  metro: string;
  csvData: ParsedReview[];
}

export interface ParsedReview {
  reviewText: string;
  rating: number;
  date: string;
  ownerResponse?: string;
  reviewerName?: string;
}

export interface ScrapedPage {
  url: string;
  html: string;
  title: string;
  loadTimeMs: number;
  error?: string;
}

export interface DetectedItem {
  name: string;
  found: boolean;
  details?: string;
}

export interface CategoryScore {
  letter: "S" | "L" | "I" | "P" | "R";
  label: string;
  score: number;
  findings: Finding[];
  details: Record<string, unknown>;
}

export interface Finding {
  type: "positive" | "negative" | "neutral";
  text: string;
}

export interface ReviewHighlight {
  text: string;
  rating: number;
  date: string;
  category: string;
}

export interface Recommendation {
  systemName: string;
  includes: string[];
  why: string;
  impact: string;
  impactDollar: number;
}

export interface ScanResult {
  companyName: string;
  metro: string;
  industry: string;
  industryLabel: string;
  scores: CategoryScore[];
  overallScore: number;
  priorityLeak: {
    letter: string;
    label: string;
    score: number;
    findings: Finding[];
    monthlyImpact: number;
  };
  reviewHighlights: ReviewHighlight[];
  reviewStats: {
    overallRating: number;
    totalReviews: number;
    last7Days: number;
    last30Days: number;
    last90Days: number;
    monthlyVelocity: number;
    responseRate: number;
    copyPasteRate: number;
    avgResponseLength: number;
    templateDetected?: string;
  };
  recommendation: Recommendation;
  recordingMode: boolean;
}
