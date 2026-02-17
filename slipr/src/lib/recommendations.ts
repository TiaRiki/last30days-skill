import type { CategoryScore, Recommendation } from "./types";
import type { IndustryBenchmark } from "@/data/industry-benchmarks";

export function getRecommendation(
  scores: CategoryScore[],
  benchmark: IndustryBenchmark
): Recommendation {
  // Find lowest scoring letter
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];

  const { avgTicket, avgMonthlyLeads, afterHoursPercent } = benchmark;

  switch (lowest.letter) {
    case "S": {
      const missedLeads = Math.round(avgMonthlyLeads * afterHoursPercent);
      const impact = Math.round(missedLeads * avgTicket * 0.5);
      return {
        systemName: "Speed-to-Lead Response System",
        includes: [
          "Auto-text on form submission with booking link",
          "After-hours AI responder across web chat, SMS, and GBP messages",
          "GBP message routing and missed call text-back",
        ],
        why: "78% of jobs go to whoever responds first. Every hour of delay costs 10% of potential conversions.",
        impact: `Estimated ${missedLeads} missed after-hours leads/month × $${avgTicket} avg ticket × 50% conversion lift = $${impact.toLocaleString()}/month in recovered revenue`,
        impactDollar: impact,
      };
    }

    case "I": {
      const frictionDropoff = Math.round(avgMonthlyLeads * 0.3);
      const impact = Math.round(frictionDropoff * avgTicket * 0.4);
      return {
        systemName: "Online Booking Implementation",
        includes: [
          "Self-service scheduling widget on website and GBP",
          "Automated confirmations via SMS and email",
          "Calendar sync with field team and office",
        ],
        why: "Every click-to-call friction point loses prospects who want to book NOW. 40% of bookings happen outside business hours.",
        impact: `Estimated ${frictionDropoff} friction drop-offs/month × $${avgTicket} avg ticket × 40% recovery rate = $${impact.toLocaleString()}/month in captured revenue`,
        impactDollar: impact,
      };
    }

    case "L": {
      const monthlyVisitors = avgMonthlyLeads * 30; // rough estimate
      const captureRate = 0.03;
      const conversionRate = 0.1;
      const impact = Math.round(
        monthlyVisitors * captureRate * conversionRate * avgTicket
      );
      return {
        systemName: "Lead Capture & Nurture System",
        includes: [
          "Email capture with value-driven lead magnet",
          "5-touch automated follow-up email sequence",
          "Facebook + Google retargeting pixel setup",
        ],
        why: "97% of website visitors leave without contacting you. Capture them before they're gone forever.",
        impact: `Estimated ${monthlyVisitors} monthly visitors × 3% capture × 10% conversion × $${avgTicket} = $${impact.toLocaleString()}/month in nurtured revenue`,
        impactDollar: impact,
      };
    }

    case "P": {
      const hoursPerWeek = 20;
      const hourlyCost = 25;
      const impact = Math.round(hoursPerWeek * hourlyCost * 4.3);
      return {
        systemName: "Workflow Automation System",
        includes: [
          "Automated review response with personalized AI replies",
          "Post-service follow-up sequences with review request",
          "Lead routing and task automation to eliminate manual handoffs",
        ],
        why: "Your team is doing manually what should run on autopilot. Every manual step is a chance for a lead to fall through the cracks.",
        impact: `Estimated ${hoursPerWeek} hrs/week of manual work × $${hourlyCost}/hr = $${impact.toLocaleString()}/month in labor cost savings plus reduced lead leakage`,
        impactDollar: impact,
      };
    }

    case "R": {
      const ratingLift = 0.5;
      const revenueIncrease = 0.07; // 7% per 0.5 star
      const monthlyRevenue = avgMonthlyLeads * avgTicket * 0.3; // 30% conversion baseline
      const impact = Math.round(monthlyRevenue * revenueIncrease);
      return {
        systemName: "Review Generation & Response System",
        includes: [
          "Automated post-service review request via SMS",
          "AI-personalized review responses within 1 hour",
          "Reputation monitoring dashboard with alerts",
        ],
        why: `Every 0.5 star rating increase = 5-9% revenue increase. Reviews are the new word of mouth — ${ratingLift} star improvement is achievable within 90 days.`,
        impact: `Estimated ${revenueIncrease * 100}% revenue lift on $${monthlyRevenue.toLocaleString()}/month baseline = $${impact.toLocaleString()}/month in additional revenue`,
        impactDollar: impact,
      };
    }

    default: {
      return {
        systemName: "Comprehensive Revenue Recovery System",
        includes: [
          "Full audit of current tech stack and processes",
          "Priority-ranked automation roadmap",
          "Quick-win implementations for immediate impact",
        ],
        why: "Multiple areas need attention. Start with the highest-impact, lowest-effort wins.",
        impact: `Estimated combined impact: $${Math.round(avgMonthlyLeads * avgTicket * 0.15).toLocaleString()}/month`,
        impactDollar: Math.round(avgMonthlyLeads * avgTicket * 0.15),
      };
    }
  }
}
