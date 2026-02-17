import type { ParsedReview } from "./types";

// Column name mappings for Outscraper CSV format
const REVIEW_TEXT_COLUMNS = [
  "review_text",
  "reviewtext",
  "text",
  "review",
  "body",
  "review_body",
  "comment",
  "reviews.review_text",
];

const RATING_COLUMNS = [
  "review_rating",
  "reviewrating",
  "rating",
  "stars",
  "score",
  "reviews.review_rating",
];

const DATE_COLUMNS = [
  "review_datetime_utc",
  "review_date",
  "reviewdate",
  "date",
  "published_at",
  "datetime",
  "reviews.review_datetime_utc",
];

const OWNER_RESPONSE_COLUMNS = [
  "owner_answer",
  "owneranswer",
  "owner_response",
  "response",
  "reply",
  "owner_reply",
  "reviews.owner_answer",
];

const REVIEWER_NAME_COLUMNS = [
  "author_title",
  "reviewer_name",
  "reviewername",
  "author",
  "name",
  "reviewer",
  "reviews.author_title",
];

function findColumn(
  headers: string[],
  candidates: string[]
): string | undefined {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  // Partial match fallback
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate.toLowerCase()));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

export function parseCSV(csvText: string): ParsedReview[] {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);

  const textCol = findColumn(headers, REVIEW_TEXT_COLUMNS);
  const ratingCol = findColumn(headers, RATING_COLUMNS);
  const dateCol = findColumn(headers, DATE_COLUMNS);
  const responseCol = findColumn(headers, OWNER_RESPONSE_COLUMNS);
  const nameCol = findColumn(headers, REVIEWER_NAME_COLUMNS);

  if (!ratingCol) {
    throw new Error(
      "Could not find a rating column in the CSV. Expected columns like: " +
        RATING_COLUMNS.join(", ")
    );
  }

  const reviews: ParsedReview[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const rating = parseFloat(row[ratingCol] || "0");
    if (isNaN(rating) || rating === 0) continue;

    reviews.push({
      reviewText: textCol ? row[textCol] || "" : "",
      rating,
      date: dateCol ? row[dateCol] || "" : "",
      ownerResponse: responseCol ? row[responseCol] || undefined : undefined,
      reviewerName: nameCol ? row[nameCol] || undefined : undefined,
    });
  }

  return reviews;
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}
