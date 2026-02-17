import { NextRequest, NextResponse } from "next/server";
import { scrapeWebsite } from "@/lib/scraper";
import { parseCSV } from "@/lib/csv-parser";
import { analyzeSpeed } from "@/lib/analyzers/speed";
import { analyzeLeakage } from "@/lib/analyzers/leakage";
import { analyzeInfrastructure } from "@/lib/analyzers/infrastructure";
import { analyzeProcess } from "@/lib/analyzers/process";
import { analyzeReputation } from "@/lib/analyzers/reputation";
import { getRecommendation } from "@/lib/recommendations";
import { INDUSTRIES } from "@/data/industry-benchmarks";
import type { CategoryScore, ScanResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const websiteUrl = formData.get("websiteUrl") as string;
    const industry = formData.get("industry") as string;
    const metro = formData.get("metro") as string;
    const csvFile = formData.get("csvFile") as File | null;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    if (!industry || !INDUSTRIES[industry]) {
      return NextResponse.json(
        { error: "Valid industry selection is required" },
        { status: 400 }
      );
    }

    // Parse CSV
    let reviews: import("@/lib/types").ParsedReview[] = [];
    if (csvFile) {
      const csvText = await csvFile.text();
      reviews = parseCSV(csvText);
    }

    // Scrape website
    const pages = await scrapeWebsite(websiteUrl);

    if (pages.length === 0 || pages.every((p) => p.error)) {
      return NextResponse.json(
        {
          error:
            "Could not reach the website. Please check the URL and try again.",
        },
        { status: 422 }
      );
    }

    // Extract company name from homepage title
    const homepage = pages[0];
    let companyName = homepage.title || websiteUrl;
    // Clean up title — remove common suffixes
    companyName = companyName
      .replace(/\s*[-|–—]\s*(Home|Homepage|Welcome|Official).*$/i, "")
      .replace(/\s*[-|–—]\s*$/i, "")
      .trim();
    if (companyName.length > 60) {
      companyName = companyName.slice(0, 57) + "...";
    }

    // Run all analyzers
    const speedScore = analyzeSpeed(pages);
    const leakageScore = analyzeLeakage(pages);
    const infraScore = analyzeInfrastructure(pages);
    const processScore = analyzeProcess(pages, reviews);
    const { score: reputationScore, highlights, stats } =
      analyzeReputation(reviews);

    // Merge copy/paste rate from process analyzer into stats
    const processDetails = processScore.details.reviewResponses as
      | { copyPasteRate: number }
      | undefined;
    if (processDetails) {
      stats.copyPasteRate = processDetails.copyPasteRate;
    }

    const scores: CategoryScore[] = [
      speedScore,
      leakageScore,
      infraScore,
      processScore,
      reputationScore,
    ];

    const overallScore = Math.round(
      scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    );

    // Find priority leak (lowest score)
    const priorityLeak = [...scores].sort((a, b) => a.score - b.score)[0];

    // Get recommendation based on lowest score
    const benchmark = INDUSTRIES[industry];
    const recommendation = getRecommendation(scores, benchmark);

    // Calculate monthly impact for priority leak
    const monthlyImpact = recommendation.impactDollar;

    const result: ScanResult = {
      companyName,
      metro,
      industry,
      industryLabel: benchmark.label,
      scores,
      overallScore,
      priorityLeak: {
        letter: priorityLeak.letter,
        label: priorityLeak.label,
        score: priorityLeak.score,
        findings: priorityLeak.findings.filter((f) => f.type === "negative"),
        monthlyImpact,
      },
      reviewHighlights: highlights,
      reviewStats: stats,
      recommendation,
      recordingMode: false,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during the scan",
      },
      { status: 500 }
    );
  }
}
