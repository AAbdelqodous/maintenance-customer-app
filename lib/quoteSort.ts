// Spec 009 US2 — pure sort/compare helper for quote responses.
import type { QuoteResponse, RequestSortKey } from '../types/quoteRequests';

export const SORT_KEYS: RequestSortKey[] = ['PRICE', 'RATING', 'DISTANCE', 'SOONEST'];

/**
 * Active, comparable responses sorted for the compare view.
 * Excludes WITHDRAWN and NOT_SELECTED (only currently-biddable quotes are compared).
 * - PRICE    → lowest priceMin first
 * - RATING   → highest rating first
 * - DISTANCE → nearest first (missing distance sorts last)
 * - SOONEST  → earliest respondedAt first (proxy for availability)
 */
export function sortResponses(
  responses: QuoteResponse[],
  key: RequestSortKey,
): QuoteResponse[] {
  const active = responses.filter(
    (r) => r.state === 'SUBMITTED' || r.state === 'UPDATED',
  );
  const sorted = [...active];
  switch (key) {
    case 'PRICE':
      sorted.sort((a, b) => a.priceMin - b.priceMin);
      break;
    case 'RATING':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'DISTANCE':
      sorted.sort(
        (a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY),
      );
      break;
    case 'SOONEST':
      sorted.sort(
        (a, b) => new Date(a.respondedAt).getTime() - new Date(b.respondedAt).getTime(),
      );
      break;
  }
  return sorted;
}
