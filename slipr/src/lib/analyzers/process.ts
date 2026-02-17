import type { ScrapedPage, CategoryScore, Finding, ParsedReview } from "../types";
import { PROCESS_HIRING_ROLES } from "@/data/detection-patterns";
import { detectCopyPasteResponses } from "../similarity";
import { getCombinedText } from "../scraper";

// Hiring role keywords for file-based hiring signal detection
const HIRING_FILE_ROLES: Record<string, { keywords: string[]; interpretation: string }> = {
  "CSR / Customer Service": {
    keywords: ["csr", "customer service", "customer service representative"],
    interpretation: "Lead follow-up may be overwhelming the team",
  },
  Receptionist: {
    keywords: ["receptionist", "front desk"],
    interpretation: "Lead follow-up may be overwhelming the team",
  },
  "Appointment Setter": {
    keywords: ["appointment setter", "appointment setting"],
    interpretation: "Lead follow-up may be overwhelming the team",
  },
  "Lead Follow-up": {
    keywords: ["lead follow-up", "lead follow up", "lead followup"],
    interpretation: "Lead follow-up may be overwhelming the team",
  },
  Dispatcher: {
    keywords: ["dispatcher", "dispatch"],
    interpretation: "Scheduling and coordination is a bottleneck",
  },
  "Scheduling Coordinator": {
    keywords: ["scheduling coordinator", "schedule coordinator"],
    interpretation: "Scheduling and coordination is a bottleneck",
  },
  "Office Manager": {
    keywords: ["office manager"],
    interpretation: "Operations running on manual effort",
  },
  Admin: {
    keywords: ["admin", "administrative assistant", "office admin"],
    interpretation: "Operations running on manual effort",
  },
};

interface HiringFileAnalysis {
  rolesDetected: string[];
  interpretations: string[];
  contextFlags: string[];
  hasSignals: boolean;
}

function analyzeHiringFile(content: string): HiringFileAnalysis {
  const lower = content.toLowerCase();
  const rolesDetected: string[] = [];
  const interpretations: string[] = [];

  // Scan for role keywords
  for (const [role, { keywords, interpretation }] of Object.entries(HIRING_FILE_ROLES)) {
    if (keywords.some((k) => lower.includes(k))) {
      rolesDetected.push(role);
      if (!interpretations.includes(interpretation)) {
        interpretations.push(interpretation);
      }
    }
  }

  // Scan for context phrases
  const contextFlags: string[] = [];
  if (/multiple\s+postings|multiple\s+positions|multiple\s+openings/i.test(content) ||
      /urgently\s+hiring|urgent\s+hire|immediately|asap/i.test(content)) {
    contextFlags.push("High turnover signals — systems aren't supporting the team");
  }

  const hasSignals = rolesDetected.length > 0;

  return { rolesDetected, interpretations, contextFlags, hasSignals };
}

export function analyzeProcess(
  pages: ScrapedPage[],
  reviews: ParsedReview[],
  hiringFileContent?: string
): CategoryScore {
  const text = getCombinedText(pages);
  const findings: Finding[] = [];
  const details: Record<string, unknown> = {};

  // 1. Review Response Analysis
  const reviewsWithResponses = reviews.filter(
    (r) => r.ownerResponse && r.ownerResponse.trim().length > 0
  );
  const responseRate =
    reviews.length > 0 ? reviewsWithResponses.length / reviews.length : 0;

  const ownerResponses = reviewsWithResponses
    .map((r) => r.ownerResponse!)
    .filter((r) => r.length > 10);

  const avgResponseLength =
    ownerResponses.length > 0
      ? ownerResponses.reduce((sum, r) => sum + r.length, 0) /
        ownerResponses.length
      : 0;

  // Detect copy/paste responses
  const { copyPasteRate, templateDetected } =
    detectCopyPasteResponses(ownerResponses);

  details.reviewResponses = {
    responseRate,
    avgResponseLength: Math.round(avgResponseLength),
    copyPasteRate,
    templateDetected,
    totalReviews: reviews.length,
    respondedTo: reviewsWithResponses.length,
  };

  if (responseRate < 0.2) {
    findings.push({
      type: "negative",
      text: `Only ${Math.round(responseRate * 100)}% review response rate — ignoring customer feedback signals neglect`,
    });
  } else if (responseRate < 0.5) {
    findings.push({
      type: "negative",
      text: `${Math.round(responseRate * 100)}% review response rate — inconsistent engagement`,
    });
  } else if (responseRate >= 0.8) {
    findings.push({
      type: "positive",
      text: `${Math.round(responseRate * 100)}% review response rate`,
    });
  }

  if (copyPasteRate > 0.5) {
    findings.push({
      type: "negative",
      text: `${Math.round(copyPasteRate * 100)}% of responses are copy/paste — robotic replies hurt trust`,
    });
    if (templateDetected) {
      details.templateSnippet =
        templateDetected.length > 100
          ? templateDetected.slice(0, 100) + "..."
          : templateDetected;
    }
  } else if (copyPasteRate > 0.3) {
    findings.push({
      type: "negative",
      text: `${Math.round(copyPasteRate * 100)}% of responses appear templated`,
    });
  } else if (ownerResponses.length > 0) {
    findings.push({
      type: "positive",
      text: "Review responses appear personalized and varied",
    });
  }

  // 2. Website Process Indicators
  const processIndicators = {
    callForQuote:
      /call\s+(for|to get)\s+(a\s+)?quote|call\s+for\s+pricing/i.test(text),
    getBackToYou:
      /we'll\s+get\s+back\s+to\s+you|someone\s+will\s+(call|contact)\s+you/i.test(
        text
      ),
    requestCallback:
      /request\s+a?\s*callback|request\s+a?\s*call/i.test(text),
    noSelfService: false,
    onlineQuote:
      /online\s+quote|instant\s+quote|get\s+a?\s*quote\s+online|price\s+calculator/i.test(
        text
      ),
  };

  // Determine if there's no self-service
  processIndicators.noSelfService =
    processIndicators.callForQuote &&
    !processIndicators.onlineQuote;

  details.processIndicators = processIndicators;

  if (processIndicators.callForQuote && !processIndicators.onlineQuote) {
    findings.push({
      type: "negative",
      text: '"Call for quote" with no online quote option — manual bottleneck',
    });
  }
  if (processIndicators.getBackToYou) {
    findings.push({
      type: "negative",
      text: '"We\'ll get back to you" language indicates manual follow-up process',
    });
  }
  if (processIndicators.requestCallback) {
    findings.push({
      type: "negative",
      text: '"Request a callback" — manual queue instead of instant engagement',
    });
  }
  if (processIndicators.onlineQuote) {
    findings.push({
      type: "positive",
      text: "Online quote/estimate option available",
    });
  }

  // 3. Indeed/Hiring Analysis (placeholder — we detect from website for now)
  // Check if the website mentions hiring for process-heavy roles
  const hiringSignals: Record<string, boolean> = {};
  const textLower = text.toLowerCase();

  // Check for careers/jobs page links
  const hasJobsPage =
    /\/(careers?|jobs|hiring|join.?us|employment)/i.test(
      pages.map((p) => p.html).join("")
    ) ||
    /we're\s+hiring|join\s+our\s+team|now\s+hiring|career\s+opportunit/i.test(
      text
    );

  details.hasJobsPage = hasJobsPage;

  if (hasJobsPage) {
    // Check for automation-opportunity roles
    for (const [role, keywords] of Object.entries(PROCESS_HIRING_ROLES)) {
      hiringSignals[role] = keywords.some((k) => textLower.includes(k));
    }

    const processRolesHiring = Object.entries(hiringSignals)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (processRolesHiring.length > 0) {
      findings.push({
        type: "negative",
        text: `Hiring for automatable roles: ${processRolesHiring.join(", ")} — these tasks should run on autopilot`,
      });
    }

    details.hiringSignals = hiringSignals;
  }

  // 4. Hiring File Analysis (uploaded prep research)
  let hiringFileAnalysis: HiringFileAnalysis | undefined;
  if (hiringFileContent) {
    hiringFileAnalysis = analyzeHiringFile(hiringFileContent);
    details.hiringFileAnalysis = hiringFileAnalysis;

    if (hiringFileAnalysis.hasSignals) {
      // Build a combined finding with detected roles and interpretations
      const roleNames = hiringFileAnalysis.rolesDetected.join(" and ");
      const interpretationText = hiringFileAnalysis.interpretations.join("; ");
      findings.push({
        type: "negative",
        text: `Hiring for ${roleNames} — ${interpretationText}`,
      });

      // Add context flags as separate findings
      for (const flag of hiringFileAnalysis.contextFlags) {
        findings.push({ type: "negative", text: flag });
      }
    } else {
      findings.push({
        type: "positive",
        text: "No current hiring signals — team appears stable",
      });
    }
  }

  // Calculate Score
  let score = 7; // Start neutral-positive

  // Response rate penalty
  if (responseRate < 0.2) score -= 2;
  else if (responseRate < 0.5) score -= 1;
  else if (responseRate >= 0.8) score += 1;

  // Copy/paste penalty
  if (copyPasteRate > 0.5) score -= 2;
  else if (copyPasteRate > 0.3) score -= 1;

  // Manual process penalties
  if (processIndicators.callForQuote && !processIndicators.onlineQuote)
    score -= 1;
  if (processIndicators.getBackToYou) score -= 1;

  // Hiring penalty (website-detected)
  const processRolesCount = Object.values(hiringSignals).filter(Boolean).length;
  if (processRolesCount >= 2) score -= 2;
  else if (processRolesCount === 1) score -= 1;

  // Hiring file penalty (uploaded research)
  if (hiringFileAnalysis?.hasSignals) {
    const fileRolesCount = hiringFileAnalysis.rolesDetected.length;
    if (fileRolesCount >= 2) score -= 2;
    else if (fileRolesCount === 1) score -= 1;
  }

  score = Math.min(10, Math.max(1, score));

  return {
    letter: "P",
    label: "Process",
    score,
    findings,
    details,
  };
}
