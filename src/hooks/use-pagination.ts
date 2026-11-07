/* Page-number helpers for <Pagination> (page and limit themselves are parsed from the URL on the server). */

export type PageRange = (number | "gap")[];

/** 1 … 4 5 6 … 12 */
export function pageRange(current: number, total: number, siblings = 1): PageRange {
  if (total <= 5 + siblings * 2) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const range: PageRange = [1];
  if (start > 2) range.push("gap");
  for (let i = start; i <= end; i += 1) range.push(i);
  if (end < total - 1) range.push("gap");
  range.push(total);
  return range;
}
