/** Slugify a title into a URL/filesystem-safe token (lowercase, hyphenated, ASCII). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** UTC calendar date as YYYY-MM-DD. Date is passed in for deterministic testing. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Candidate id: `<UTC-date>-<title-slug>`, e.g. "2026-06-16-but-is-it-art".
 * Stable, sortable, human-legible. Empty slugs fall back to "untitled".
 */
export function makeId(title: string, date: Date): string {
  return `${isoDate(date)}-${slugify(title) || "untitled"}`;
}
