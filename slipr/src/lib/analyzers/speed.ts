import type { ScrapedPage, CategoryScore, Finding, DetectedItem } from "../types";
import { CHAT_WIDGETS } from "@/data/detection-patterns";
import { getFullSource, getCombinedText } from "../scraper";

export function analyzeSpeed(pages: ScrapedPage[]): CategoryScore {
  const source = getFullSource(pages);
  const text = getCombinedText(pages);
  const sourceLower = source.toLowerCase();
  const textLower = text.toLowerCase();

  const findings: Finding[] = [];
  const details: Record<string, unknown> = {};

  // 1. Chat Widget Detection
  const chatWidgets: DetectedItem[] = [];
  for (const [name, patterns] of Object.entries(CHAT_WIDGETS)) {
    const found = patterns.some((p) => sourceLower.includes(p.toLowerCase()));
    chatWidgets.push({ name, found });
    if (found) {
      findings.push({ type: "positive", text: `${name} chat widget detected` });
    }
  }
  const hasChat = chatWidgets.some((w) => w.found);
  details.chatWidgets = chatWidgets.filter((w) => w.found).map((w) => w.name);

  if (!hasChat) {
    findings.push({
      type: "negative",
      text: "No live chat widget detected — prospects can't get instant answers",
    });
  }

  // 2. SMS/Text Indicators
  const smsIndicators = {
    textMentioned:
      /text\s+us|text\s+to|send\s+(a\s+)?text/i.test(text) ||
      sourceLower.includes("sms:"),
    smsProtocol: sourceLower.includes('href="sms:'),
    textNearPhone: /(\d{3}[-.)]\s*\d{3}[-.)]\s*\d{4})[\s\S]{0,50}text/i.test(
      text
    ),
    shortcode: /\b\d{5,6}\b[\s\S]{0,30}text/i.test(text),
  };
  const hasText = Object.values(smsIndicators).some(Boolean);
  details.smsIndicators = smsIndicators;

  if (hasText) {
    findings.push({ type: "positive", text: "SMS/text option available" });
  } else {
    findings.push({
      type: "negative",
      text: "No text/SMS option — missing the #1 preferred contact method for under-40 prospects",
    });
  }

  // 3. After-Hours Signals
  const afterHoursSignals = {
    twentyFourSeven: /24\s*\/?\s*7|twenty.?four.?seven|around the clock/i.test(text),
    sameDay: /same.?day|same day/i.test(text),
    emergency: /emergency|urgent|immediate/i.test(text),
    responseTime:
      /respond\s+(within|in)\s+\d+\s*(hour|minute|min)/i.test(text) ||
      /\d+\s*(hour|minute|min)\s+response/i.test(text),
    businessHoursDisplayed:
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(text) &&
      /\d{1,2}:\d{2}\s*(am|pm|AM|PM)/i.test(text),
    limitedHours: false,
  };

  // Check for limited hours indicators
  if (
    afterHoursSignals.businessHoursDisplayed &&
    !afterHoursSignals.twentyFourSeven
  ) {
    const noWeekend =
      !(/saturday/i.test(text) && /\d{1,2}:\d{2}/i.test(text.split(/saturday/i)[1]?.slice(0, 100) || "")) ||
      /saturday:\s*closed/i.test(text) ||
      /sunday:\s*closed/i.test(text);
    if (noWeekend) {
      afterHoursSignals.limitedHours = true;
      findings.push({
        type: "negative",
        text: "Limited business hours displayed — no weekend or after-hours coverage",
      });
    }
  }

  details.afterHoursSignals = afterHoursSignals;

  if (afterHoursSignals.twentyFourSeven) {
    findings.push({ type: "positive", text: "24/7 availability indicated" });
  }
  if (afterHoursSignals.sameDay) {
    findings.push({ type: "positive", text: "Same-day service promoted" });
  }
  if (afterHoursSignals.emergency) {
    findings.push({ type: "positive", text: "Emergency services available" });
  }
  if (afterHoursSignals.responseTime) {
    findings.push({
      type: "positive",
      text: "Specific response time commitment displayed",
    });
  }
  if (
    !afterHoursSignals.twentyFourSeven &&
    !afterHoursSignals.sameDay &&
    !afterHoursSignals.emergency
  ) {
    findings.push({
      type: "negative",
      text: "No after-hours or emergency options — losing leads outside business hours",
    });
  }

  // 4. Contact Methods
  const contactMethods = {
    contactForm:
      sourceLower.includes("<form") &&
      (sourceLower.includes("contact") ||
        sourceLower.includes("message") ||
        sourceLower.includes("inquiry") ||
        sourceLower.includes("quote")),
    phoneVisible:
      /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g.test(text) ||
      sourceLower.includes('href="tel:'),
    emailVisible:
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(text) ||
      sourceLower.includes("mailto:"),
    phoneOnly: false,
    channelCount: 0,
  };

  let channels = 0;
  if (hasChat) channels++;
  if (hasText) channels++;
  if (contactMethods.contactForm) channels++;
  if (contactMethods.phoneVisible) channels++;
  if (contactMethods.emailVisible) channels++;
  contactMethods.channelCount = channels;

  if (channels === 1 && contactMethods.phoneVisible) {
    contactMethods.phoneOnly = true;
    findings.push({
      type: "negative",
      text: "Phone-only contact — single point of failure for lead capture",
    });
  } else if (channels <= 2) {
    findings.push({
      type: "negative",
      text: `Only ${channels} contact channels detected — limited options for prospects`,
    });
  } else {
    findings.push({
      type: "positive",
      text: `${channels} contact channels available`,
    });
  }

  details.contactMethods = contactMethods;

  // Calculate Score
  let score = 1;

  // Chat bonus
  if (hasChat) score += 3;
  // Text bonus
  if (hasText) score += 2;
  // After-hours bonus
  if (
    afterHoursSignals.twentyFourSeven ||
    afterHoursSignals.emergency ||
    afterHoursSignals.sameDay
  )
    score += 2;
  if (afterHoursSignals.responseTime) score += 1;
  // Contact method bonus
  if (channels >= 3) score += 2;
  else if (channels >= 2) score += 1;

  // Cap at 10
  score = Math.min(10, Math.max(1, score));

  return {
    letter: "S",
    label: "Speed",
    score,
    findings,
    details,
  };
}
