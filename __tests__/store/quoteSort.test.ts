import { sortResponses } from '../../lib/quoteSort';
import type { QuoteResponse, QuoteResponseState } from '../../types/quoteRequests';

function resp(
  id: number,
  over: Partial<QuoteResponse> & { state?: QuoteResponseState } = {},
): QuoteResponse {
  return {
    id,
    centerId: id,
    centerNameAr: `م${id}`,
    centerNameEn: `Center ${id}`,
    rating: 4,
    distance: 5,
    priceMin: 20,
    priceMax: 20,
    estimatedDurationMinutes: 60,
    state: 'SUBMITTED',
    respondedAt: '2026-05-29T10:00:00Z',
    ...over,
  };
}

describe('sortResponses', () => {
  it('PRICE → lowest priceMin first', () => {
    const out = sortResponses(
      [resp(1, { priceMin: 30 }), resp(2, { priceMin: 10 }), resp(3, { priceMin: 20 })],
      'PRICE',
    );
    expect(out.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('RATING → highest rating first', () => {
    const out = sortResponses(
      [resp(1, { rating: 3.5 }), resp(2, { rating: 4.8 }), resp(3, { rating: 4.1 })],
      'RATING',
    );
    expect(out.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('DISTANCE → nearest first, missing distance sorts last', () => {
    const out = sortResponses(
      [resp(1, { distance: 8 }), resp(2, { distance: undefined }), resp(3, { distance: 2 })],
      'DISTANCE',
    );
    expect(out.map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it('SOONEST → earliest respondedAt first', () => {
    const out = sortResponses(
      [
        resp(1, { respondedAt: '2026-05-29T12:00:00Z' }),
        resp(2, { respondedAt: '2026-05-29T09:00:00Z' }),
        resp(3, { respondedAt: '2026-05-29T10:30:00Z' }),
      ],
      'SOONEST',
    );
    expect(out.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('excludes WITHDRAWN and NOT_SELECTED quotes', () => {
    const out = sortResponses(
      [
        resp(1, { state: 'SUBMITTED', priceMin: 10 }),
        resp(2, { state: 'WITHDRAWN', priceMin: 5 }),
        resp(3, { state: 'NOT_SELECTED', priceMin: 1 }),
        resp(4, { state: 'UPDATED', priceMin: 20 }),
      ],
      'PRICE',
    );
    expect(out.map((r) => r.id)).toEqual([1, 4]);
  });

  it('does not mutate the input array', () => {
    const input = [resp(1, { priceMin: 30 }), resp(2, { priceMin: 10 })];
    const snapshot = input.map((r) => r.id);
    sortResponses(input, 'PRICE');
    expect(input.map((r) => r.id)).toEqual(snapshot);
  });
});
