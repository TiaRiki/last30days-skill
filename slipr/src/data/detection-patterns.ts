// Chat widget detection: script src patterns and DOM element identifiers
export const CHAT_WIDGETS: Record<string, string[]> = {
  Drift: ["drift.com", "js.driftt.com", "drift-widget"],
  Intercom: ["intercom.io", "widget.intercom.io", "intercom-container"],
  LiveChat: ["livechatinc.com", "livechat.com", "chat-widget-container"],
  Tidio: ["tidio.co", "tidiochat"],
  Crisp: ["crisp.chat", "crisp-client"],
  "Tawk.to": ["tawk.to", "embed.tawk.to"],
  "HubSpot Chat": [
    "js.hs-scripts.com",
    "hubspot.com/conversations",
    "hs-chat-open",
  ],
  "Zendesk Chat": ["zopim.com", "zendesk.com/embeddable", "zE("],
  "Facebook Messenger": [
    "connect.facebook.net",
    "fb-customerchat",
    "fb-messenger",
  ],
  Podium: ["podium.com", "podium-bubble"],
  Birdeye: ["birdeye.com", "birdeye-widget"],
  Olark: ["olark.com", "olark-chat"],
  "Smith.ai": ["smith.ai"],
  "Ruby Receptionist": ["ruby.com"],
};

// Tracking pixel detection patterns
export const TRACKING_PIXELS: Record<string, string[]> = {
  "Facebook Pixel": [
    "connect.facebook.net/en_US/fbevents.js",
    "fbq(",
    "facebook.com/tr",
  ],
  "Google Tag Manager": ["googletagmanager.com/gtm.js", "gtm.js"],
  "Google Analytics (GA4)": [
    "googletagmanager.com/gtag",
    "gtag(",
    "G-",
    "google-analytics.com/analytics.js",
  ],
  "Google Analytics (UA)": ["google-analytics.com/analytics.js", "UA-"],
  "LinkedIn Insight": ["snap.licdn.com", "_linkedin_partner_id"],
  "TikTok Pixel": ["analytics.tiktok.com", "ttq.load"],
  "Microsoft/Bing UET": ["bat.bing.com", "uetq"],
  "Twitter Pixel": ["static.ads-twitter.com", "twq("],
  "Pinterest Tag": ["pintrk(", "s.pinimg.com/ct/core.js"],
  "Hotjar": ["hotjar.com", "hj("],
  CallRail: ["callrail.com", "calltrk"],
  WhatConverts: ["whatconverts.com"],
};

// Online booking widget detection patterns
export const BOOKING_WIDGETS: Record<string, string[]> = {
  Calendly: ["calendly.com", "calendly-inline-widget"],
  "Acuity Scheduling": ["acuityscheduling.com", "squareup.com/appointments"],
  "Square Appointments": ["squareup.com/appointments", "square.site"],
  "Housecall Pro": ["housecallpro.com"],
  Jobber: ["getjobber.com", "jobber.com"],
  ServiceTitan: ["servicetitan.com"],
  FieldEdge: ["fieldedge.com"],
  Booksy: ["booksy.com"],
  Vagaro: ["vagaro.com"],
  MindBody: ["mindbodyonline.com", "healcode.com"],
  Setmore: ["setmore.com"],
  SimplyBook: ["simplybook.me"],
  "Booking Koala": ["bookingkoala.com"],
  "Launch27": ["launch27.com"],
  "ZenMaid": ["zenmaid.com"],
};

// CRM detection patterns
export const CRM_SIGNATURES: Record<string, string[]> = {
  HubSpot: [
    "js.hs-scripts.com",
    "hs-script-loader",
    "hubspot.com",
    "hbspt.forms",
  ],
  Salesforce: ["salesforce.com", "force.com", "pardot.com"],
  Zoho: ["zoho.com", "zohocdn.com"],
  "Keap/Infusionsoft": [
    "keap.com",
    "infusionsoft.com",
    "infusionsoft.app",
  ],
  GoHighLevel: [
    "gohighlevel.com",
    "highlevel.com",
    "msgsndr.com",
    "leadconnectorhq.com",
  ],
  Marketo: ["marketo.com", "marketo.net", "munchkin.js"],
  ActiveCampaign: ["activecampaign.com", "trackcmp.net"],
};

// Negative review keyword categories
export const NEGATIVE_REVIEW_KEYWORDS: Record<string, string[]> = {
  speed: [
    "slow",
    "waited",
    "waiting",
    "no response",
    "never called back",
    "took forever",
    "didn't hear back",
    "didn't respond",
    "no call back",
    "never responded",
    "still waiting",
    "hours later",
    "days later",
    "never showed",
    "late",
    "delayed",
  ],
  infrastructure: [
    "hard to book",
    "couldn't schedule",
    "no online",
    "had to call multiple times",
    "website",
    "couldn't find",
    "no way to",
    "difficult to reach",
    "phone tag",
    "voicemail",
    "busy signal",
  ],
  process: [
    "disorganized",
    "miscommunication",
    "forgot",
    "wrong time",
    "no-show",
    "no show",
    "confused",
    "mixed up",
    "lost my",
    "wrong address",
    "double booked",
    "didn't know",
    "unprepared",
    "missed appointment",
  ],
  general: [
    "rude",
    "unprofessional",
    "wouldn't recommend",
    "terrible",
    "horrible",
    "worst",
    "scam",
    "ripoff",
    "overcharged",
    "never again",
    "avoid",
    "awful",
    "disgusted",
  ],
};

// Process-related hiring role keywords
export const PROCESS_HIRING_ROLES: Record<string, string[]> = {
  "CSR / Customer Service": [
    "customer service",
    "csr",
    "customer support",
    "client service",
  ],
  Dispatcher: ["dispatcher", "dispatch", "routing", "scheduling coordinator"],
  "Office Manager / Admin": [
    "office manager",
    "office admin",
    "administrative",
    "front desk",
  ],
  "Lead Follow-up": [
    "lead follow",
    "follow up",
    "follow-up",
    "lead management",
  ],
  Receptionist: ["receptionist", "phone operator", "answering"],
  "Appointment Setter": [
    "appointment setter",
    "appointment scheduling",
    "booking coordinator",
  ],
};
