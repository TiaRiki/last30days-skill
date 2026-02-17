import type { ScrapedPage, CategoryScore, Finding } from "../types";
import {
  BOOKING_WIDGETS,
  CRM_SIGNATURES,
} from "@/data/detection-patterns";
import { getFullSource, getCombinedText } from "../scraper";

export function analyzeInfrastructure(pages: ScrapedPage[]): CategoryScore {
  const source = getFullSource(pages);
  const text = getCombinedText(pages);
  const sourceLower = source.toLowerCase();
  const textLower = text.toLowerCase();

  const findings: Finding[] = [];
  const details: Record<string, unknown> = {};

  // 1. Online Booking Widgets
  const detectedBooking: string[] = [];
  for (const [name, patterns] of Object.entries(BOOKING_WIDGETS)) {
    const found = patterns.some((p) => sourceLower.includes(p.toLowerCase()));
    if (found) {
      detectedBooking.push(name);
    }
  }

  // Also check for custom booking forms
  const hasCustomBooking =
    (sourceLower.includes('type="date"') ||
      sourceLower.includes("datepicker") ||
      sourceLower.includes("date-picker") ||
      sourceLower.includes("timepicker") ||
      sourceLower.includes("time-picker")) &&
    (sourceLower.includes("book") || sourceLower.includes("schedule") || sourceLower.includes("appointment"));

  if (hasCustomBooking && detectedBooking.length === 0) {
    detectedBooking.push("Custom Booking Form");
  }

  details.bookingWidgets = detectedBooking;

  if (detectedBooking.length > 0) {
    findings.push({
      type: "positive",
      text: `Online booking detected: ${detectedBooking.join(", ")}`,
    });
  } else {
    findings.push({
      type: "negative",
      text: "No online booking — every prospect must call or email to schedule, creating friction and drop-off",
    });
  }

  // 2. CRM Detection
  const detectedCRM: string[] = [];
  for (const [name, patterns] of Object.entries(CRM_SIGNATURES)) {
    const found = patterns.some((p) => sourceLower.includes(p.toLowerCase()));
    if (found) {
      detectedCRM.push(name);
    }
  }

  details.crmDetected = detectedCRM;

  if (detectedCRM.length > 0) {
    findings.push({
      type: "positive",
      text: `CRM/marketing platform: ${detectedCRM.join(", ")}`,
    });
  } else {
    findings.push({
      type: "negative",
      text: "No CRM detected — leads may be tracked in spreadsheets or not at all",
    });
  }

  // 3. Payment Infrastructure
  const payment = {
    creditCards:
      /credit\s*card|visa|mastercard|american\s*express|amex|discover/i.test(text) ||
      /fa-cc-visa|fa-cc-mastercard|cc-amex|payment-icon/i.test(sourceLower),
    square: /square(up)?\.com|squareup/i.test(sourceLower),
    stripe: /stripe\.com|js\.stripe\.com/i.test(sourceLower),
    paypal: /paypal\.com|paypal/i.test(sourceLower),
    financing:
      /financing\s+available|payment\s+plan|wisetack|greensky|hearth/i.test(
        text
      ),
    paymentIcons:
      /payment.*(icon|logo|badge)|accept.*(card|payment)/i.test(sourceLower),
  };

  const paymentMethods = Object.entries(payment)
    .filter(([, v]) => v)
    .map(([k]) => k);
  details.payment = payment;

  if (paymentMethods.length >= 2) {
    findings.push({
      type: "positive",
      text: `Payment options detected: ${paymentMethods.join(", ")}`,
    });
  } else if (paymentMethods.length === 1) {
    findings.push({
      type: "neutral",
      text: `Limited payment info: ${paymentMethods[0]}`,
    });
  } else {
    findings.push({
      type: "negative",
      text: "No payment information visible — prospects don't know what payment methods you accept",
    });
  }

  if (payment.financing) {
    findings.push({
      type: "positive",
      text: "Financing option available — reduces price friction for larger jobs",
    });
  }

  // 4. Technical Infrastructure
  const technical = {
    ssl: pages.some((p) => p.url.startsWith("https://")),
    mobileViewport: /viewport/.test(sourceLower) && /width=device-width/.test(sourceLower),
    loadTime: "fast" as "fast" | "medium" | "slow",
    serviceAreaPages: false,
  };

  // Assess load time from homepage
  const homepage = pages[0];
  if (homepage) {
    if (homepage.loadTimeMs < 2000) technical.loadTime = "fast";
    else if (homepage.loadTimeMs < 5000) technical.loadTime = "medium";
    else technical.loadTime = "slow";
  }

  // Check for service area pages
  technical.serviceAreaPages =
    /\/(locations?|areas?.?served|service.?area|cities)/i.test(source) ||
    /areas\s+we\s+serve|service\s+area|locations\s+served/i.test(text);

  details.technical = technical;

  if (!technical.ssl) {
    findings.push({
      type: "negative",
      text: "No SSL (HTTPS) — site shows as 'Not Secure', destroying trust instantly",
    });
  }
  if (!technical.mobileViewport) {
    findings.push({
      type: "negative",
      text: "No mobile viewport — site may not render properly on phones where 60%+ of searches happen",
    });
  }
  if (technical.loadTime === "slow") {
    findings.push({
      type: "negative",
      text: `Slow page load (${homepage?.loadTimeMs || 0}ms) — 53% of visitors leave if page takes >3s`,
    });
  } else if (technical.loadTime === "fast") {
    findings.push({
      type: "positive",
      text: `Fast page load (${homepage?.loadTimeMs || 0}ms)`,
    });
  }
  if (technical.serviceAreaPages) {
    findings.push({
      type: "positive",
      text: "Service area pages detected — good for local SEO",
    });
  } else {
    findings.push({
      type: "negative",
      text: "No service area pages — missing local SEO for nearby cities",
    });
  }

  // Calculate Score
  let score = 1;

  // Booking: +3
  if (detectedBooking.length > 0) score += 3;
  // CRM: +2
  if (detectedCRM.length > 0) score += 2;
  // Payment: +1
  if (paymentMethods.length >= 2) score += 1;
  if (payment.financing) score += 1;
  // Technical: +3
  if (technical.ssl) score += 1;
  if (technical.mobileViewport) score += 1;
  if (technical.serviceAreaPages) score += 1;
  // Load time penalty
  if (technical.loadTime === "slow") score -= 1;

  score = Math.min(10, Math.max(1, score));

  return {
    letter: "I",
    label: "Infrastructure",
    score,
    findings,
    details,
  };
}
