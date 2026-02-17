import type { ScrapedPage, CategoryScore, Finding } from "../types";
import { TRACKING_PIXELS } from "@/data/detection-patterns";
import { getFullSource, getCombinedText } from "../scraper";

export function analyzeLeakage(pages: ScrapedPage[]): CategoryScore {
  const source = getFullSource(pages);
  const text = getCombinedText(pages);
  const sourceLower = source.toLowerCase();
  const textLower = text.toLowerCase();

  const findings: Finding[] = [];
  const details: Record<string, unknown> = {};

  // 1. Email Capture Detection
  const emailCapture = {
    newsletterSignup: false,
    footerEmailSignup: false,
    popupCapture: false,
    exitIntent: false,
    leadMagnets: [] as string[],
  };

  // Check for newsletter/email signup forms
  emailCapture.newsletterSignup =
    /newsletter|subscribe|sign\s*up|email\s*list|mailing\s*list/i.test(source) &&
    (sourceLower.includes('type="email"') || sourceLower.includes("type='email'"));

  // Check for footer email captures
  emailCapture.footerEmailSignup =
    /<footer[\s\S]*?type=["']email["']/i.test(source) ||
    /<footer[\s\S]*?(subscribe|newsletter)/i.test(source);

  // Check for popup/modal email captures
  emailCapture.popupCapture =
    /modal|popup|overlay/i.test(source) &&
    /email|subscribe|sign.?up/i.test(source);

  // Check for exit-intent
  emailCapture.exitIntent =
    /exit.?intent|mouseleave|ouibounce|optinmonster/i.test(sourceLower);

  // Check for lead magnets
  const leadMagnetPatterns = [
    { regex: /free\s+guide/i, label: "Free Guide" },
    { regex: /free\s+estimate/i, label: "Free Estimate" },
    { regex: /free\s+quote/i, label: "Free Quote" },
    { regex: /download\s+(your|our|free|the)/i, label: "Download Offer" },
    { regex: /get\s+your\s+free/i, label: "Free Offer" },
    { regex: /free\s+consultation/i, label: "Free Consultation" },
    { regex: /free\s+assessment/i, label: "Free Assessment" },
    { regex: /free\s+inspection/i, label: "Free Inspection" },
    { regex: /ebook|e-book/i, label: "eBook" },
    { regex: /checklist/i, label: "Checklist" },
  ];

  for (const { regex, label } of leadMagnetPatterns) {
    if (regex.test(text)) {
      emailCapture.leadMagnets.push(label);
    }
  }

  const hasEmailCapture =
    emailCapture.newsletterSignup ||
    emailCapture.footerEmailSignup ||
    emailCapture.popupCapture;
  const hasLeadMagnets = emailCapture.leadMagnets.length > 0;

  details.emailCapture = emailCapture;

  if (hasEmailCapture) {
    findings.push({ type: "positive", text: "Email capture form detected" });
  } else {
    findings.push({
      type: "negative",
      text: "No email capture — 97% of visitors leave without contacting, and you can't follow up",
    });
  }

  if (hasLeadMagnets) {
    findings.push({
      type: "positive",
      text: `Lead magnets found: ${emailCapture.leadMagnets.join(", ")}`,
    });
  } else {
    findings.push({
      type: "negative",
      text: "No lead magnets — nothing to exchange for prospect email addresses",
    });
  }

  if (emailCapture.exitIntent) {
    findings.push({ type: "positive", text: "Exit-intent popup detected" });
  }

  // 2. Tracking Pixels
  const detectedPixels: string[] = [];
  const missingPixels: string[] = [];
  const criticalPixels = [
    "Facebook Pixel",
    "Google Tag Manager",
    "Google Analytics (GA4)",
  ];

  for (const [name, patterns] of Object.entries(TRACKING_PIXELS)) {
    const found = patterns.some((p) => sourceLower.includes(p.toLowerCase()));
    if (found) {
      detectedPixels.push(name);
    } else if (criticalPixels.includes(name)) {
      missingPixels.push(name);
    }
  }

  details.trackingPixels = { detected: detectedPixels, missing: missingPixels };

  if (detectedPixels.length >= 3) {
    findings.push({
      type: "positive",
      text: `Tracking stack: ${detectedPixels.join(", ")}`,
    });
  } else if (detectedPixels.length > 0) {
    findings.push({
      type: "neutral",
      text: `Limited tracking: ${detectedPixels.join(", ")}`,
    });
    if (missingPixels.length > 0) {
      findings.push({
        type: "negative",
        text: `Missing critical pixels: ${missingPixels.join(", ")}`,
      });
    }
  } else {
    findings.push({
      type: "negative",
      text: "No tracking pixels detected — flying completely blind on ad spend and visitor behavior",
    });
  }

  // 3. Lead Nurture Indicators
  const nurture = {
    blogPresent: false,
    resourcesSection: false,
    emailFollowUp: false,
  };

  nurture.blogPresent =
    sourceLower.includes("/blog") ||
    sourceLower.includes("/news") ||
    sourceLower.includes("/articles");

  nurture.resourcesSection =
    sourceLower.includes("/resources") ||
    sourceLower.includes("/guides") ||
    sourceLower.includes("/tips") ||
    sourceLower.includes("/learning");

  nurture.emailFollowUp =
    /follow.?up\s+email|email\s+sequence|drip|nurture/i.test(text);

  details.nurture = nurture;

  if (nurture.blogPresent) {
    findings.push({ type: "positive", text: "Blog/content section present" });
  } else {
    findings.push({
      type: "negative",
      text: "No blog or content — missing SEO opportunity and nurture content",
    });
  }

  if (nurture.resourcesSection) {
    findings.push({
      type: "positive",
      text: "Resources/guides section found",
    });
  }

  // Calculate Score
  let score = 1;

  // Email capture: +3
  if (hasEmailCapture) score += 2;
  if (hasLeadMagnets) score += 1;
  if (emailCapture.exitIntent) score += 1;

  // Tracking: +3
  if (detectedPixels.length >= 3) score += 3;
  else if (detectedPixels.length >= 1) score += 1;

  // Nurture: +2
  if (nurture.blogPresent) score += 1;
  if (nurture.resourcesSection) score += 1;

  score = Math.min(10, Math.max(1, score));

  return {
    letter: "L",
    label: "Leakage",
    score,
    findings,
    details,
  };
}
