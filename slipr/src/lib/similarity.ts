// Text similarity using Levenshtein distance

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// Detect copy/paste responses: compares all responses pairwise
// Returns { copyPasteRate, templateDetected }
export function detectCopyPasteResponses(responses: string[]): {
  copyPasteRate: number;
  templateDetected?: string;
} {
  if (responses.length < 3) {
    return { copyPasteRate: 0 };
  }

  // Normalize responses for comparison
  const normalized = responses.map((r) =>
    r.toLowerCase().replace(/\s+/g, " ").trim()
  );

  // For efficiency, sample if too many responses
  const sampled =
    normalized.length > 50
      ? normalized.sort(() => Math.random() - 0.5).slice(0, 50)
      : normalized;

  let similarPairs = 0;
  let totalPairs = 0;
  const responseFrequency: Map<string, number> = new Map();

  for (let i = 0; i < sampled.length; i++) {
    // Track frequency of similar responses
    let matched = false;
    for (const [key, count] of responseFrequency) {
      if (similarity(sampled[i], key) > 0.8) {
        responseFrequency.set(key, count + 1);
        matched = true;
        break;
      }
    }
    if (!matched) {
      responseFrequency.set(sampled[i], 1);
    }

    for (let j = i + 1; j < sampled.length; j++) {
      totalPairs++;
      if (similarity(sampled[i], sampled[j]) > 0.8) {
        similarPairs++;
      }
    }
  }

  const copyPasteRate = totalPairs > 0 ? similarPairs / totalPairs : 0;

  // Find the most common template
  let maxCount = 0;
  let template: string | undefined;
  for (const [text, count] of responseFrequency) {
    if (count > maxCount) {
      maxCount = count;
      template = text;
    }
  }

  // Only report template if it appears in >30% of responses
  const templateDetected =
    template && maxCount / sampled.length > 0.3
      ? responses.find(
          (r) =>
            similarity(
              r.toLowerCase().replace(/\s+/g, " ").trim(),
              template!
            ) > 0.8
        )
      : undefined;

  return { copyPasteRate, templateDetected };
}
