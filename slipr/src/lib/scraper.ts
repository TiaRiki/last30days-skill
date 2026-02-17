import * as cheerio from "cheerio";
import type { ScrapedPage } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function scrapePage(url: string): Promise<ScrapedPage> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || url;

    return {
      url,
      html,
      title,
      loadTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      url,
      html: "",
      title: url,
      loadTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Failed to fetch",
    };
  }
}

export async function scrapeWebsite(
  baseUrl: string
): Promise<ScrapedPage[]> {
  // Normalize URL
  let normalizedUrl = baseUrl.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }
  // Remove trailing slash
  normalizedUrl = normalizedUrl.replace(/\/+$/, "");

  // Build list of pages to scrape
  const pagesToScrape = [
    normalizedUrl,
    normalizedUrl + "/contact",
    normalizedUrl + "/about",
    normalizedUrl + "/services",
  ];

  // Scrape all pages in parallel
  const results = await Promise.allSettled(
    pagesToScrape.map((url) => scrapePage(url))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ScrapedPage> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);
}

// Extract all text content from HTML for text-based scanning
export function extractTextContent(html: string): string {
  const $ = cheerio.load(html);
  // Remove script and style tags
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Get the full HTML source for pattern matching (includes scripts)
export function getFullSource(pages: ScrapedPage[]): string {
  return pages.map((p) => p.html).join("\n");
}

// Get combined text content across all pages
export function getCombinedText(pages: ScrapedPage[]): string {
  return pages.map((p) => extractTextContent(p.html)).join(" ");
}
