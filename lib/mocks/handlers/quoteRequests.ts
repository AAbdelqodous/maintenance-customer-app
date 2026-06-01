// MSW handlers for spec 009 — Get Quotes (reverse marketplace).
// In-memory mock backend for the `quoterequest` domain, used in jest and the RN dev runtime
// until the real backend ships. Matching + accept are simulated server-side here.
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../constants/config';
import type {
  CreateQuoteRequest,
  QuoteRequest,
  QuoteResponse,
  QuoteRequestSummary,
} from '../../../types/quoteRequests';

const BASE = API_BASE_URL.replace(/\/$/, '');

// ── In-memory state ───────────────────────────────────────────────────────────
let nextRequestId = 900;
let nextResponseId = 5000;
let nextBookingId = 7000;
let nextConversationId = 770;

const requests = new Map<number, QuoteRequest>();

/** Reset state between tests (called from the jest global setup). */
export function __resetQuoteRequestsMock() {
  requests.clear();
  nextRequestId = 900;
  nextResponseId = 5000;
  nextBookingId = 7000;
  nextConversationId = 770;
}

const SEED_CENTERS = [
  { centerId: 10, centerNameEn: 'Gulf Auto Center', centerNameAr: 'مركز الخليج للسيارات', rating: 4.6, trustScore: 88, distance: 3.2, priceMin: 15, priceMax: 25, estimatedDurationMinutes: 90, inclusionsEn: 'Gas refill + leak check', inclusionsAr: 'تعبئة الغاز + فحص التسريب' },
  { centerId: 22, centerNameEn: 'Salmiya Service Hub', centerNameAr: 'صالة السالمية للصيانة', rating: 4.3, trustScore: 79, distance: 5.8, priceMin: 18, priceMax: 18, estimatedDurationMinutes: 60, inclusionsEn: 'Fixed-price diagnosis + repair', inclusionsAr: 'تشخيص وإصلاح بسعر ثابت' },
  { centerId: 31, centerNameEn: 'Capital Care Workshop', centerNameAr: 'ورشة العاصمة', rating: 4.8, trustScore: 92, distance: 8.1, priceMin: 20, priceMax: 30, estimatedDurationMinutes: 120, inclusionsEn: 'Premium parts + 6-month warranty', inclusionsAr: 'قطع أصلية + ضمان 6 أشهر' },
];

function seedResponses(): QuoteResponse[] {
  const now = Date.now();
  return SEED_CENTERS.map((c, i) => ({
    id: nextResponseId++,
    centerId: c.centerId,
    centerNameAr: c.centerNameAr,
    centerNameEn: c.centerNameEn,
    rating: c.rating,
    trustScore: c.trustScore,
    distance: c.distance,
    priceMin: c.priceMin,
    priceMax: c.priceMax,
    estimatedDurationMinutes: c.estimatedDurationMinutes,
    inclusions: c.inclusionsEn,
    message: undefined,
    state: 'SUBMITTED' as const,
    // staggered slightly so the list has a natural order; all already "arrived"
    respondedAt: new Date(now - (SEED_CENTERS.length - i) * 1000).toISOString(),
  }));
}

function toSummary(r: QuoteRequest): QuoteRequestSummary {
  return {
    id: r.id,
    categoryNameAr: r.categoryNameAr,
    categoryNameEn: r.categoryNameEn,
    state: r.state,
    reachCount: r.reachCount,
    responseCount: r.responses.filter((q) => q.state === 'SUBMITTED' || q.state === 'UPDATED').length,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
  };
}

export const quoteRequestsHandlers = [
  // Create + broadcast a request
  http.post(`${BASE}/quote-requests`, async ({ request }) => {
    const body = (await request.json()) as CreateQuoteRequest;
    const now = Date.now();
    const id = nextRequestId++;
    const reachCount = 3;
    const created: QuoteRequest = {
      id,
      categoryId: body.categoryId,
      categoryNameEn: 'AC',
      categoryNameAr: 'تكييف',
      serviceId: body.serviceId,
      description: body.description,
      attachmentUrls: (body.attachmentIds ?? []).map((a) => `https://mock.local/attachments/${a}.jpg`),
      areaGovernorate: body.areaGovernorate,
      fulfillmentHint: body.fulfillmentHint,
      state: 'OPEN',
      reachCount,
      responses: seedResponses(),
      expiresAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      acceptedBookingId: undefined,
      createdAt: new Date(now).toISOString(),
    };
    requests.set(id, created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // My requests (list summaries, newest first)
  http.get(`${BASE}/quote-requests`, () => {
    const list = [...requests.values()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(toSummary);
    return HttpResponse.json(list, { status: 200 });
  }),

  // Full request + responses
  http.get(`${BASE}/quote-requests/:id`, ({ params }) => {
    const r = requests.get(Number(params.id));
    if (!r) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(r, { status: 200 });
  }),

  // Accept a quote → create booking, close request, mark others not-selected
  http.post(`${BASE}/quote-requests/:id/accept`, async ({ params, request }) => {
    const r = requests.get(Number(params.id));
    if (!r) return new HttpResponse(null, { status: 404 });
    if (r.state !== 'OPEN') return new HttpResponse(null, { status: 409 });
    const { quoteId } = (await request.json()) as { quoteId: number };
    const chosen = r.responses.find((q) => q.id === quoteId);
    if (!chosen || chosen.state === 'WITHDRAWN') return new HttpResponse(null, { status: 409 });
    r.responses.forEach((q) => {
      q.state = q.id === quoteId ? 'SELECTED' : 'NOT_SELECTED';
    });
    r.state = 'ACCEPTED';
    r.acceptedBookingId = nextBookingId++;
    return HttpResponse.json(
      { requestId: r.id, state: 'ACCEPTED', acceptedBookingId: r.acceptedBookingId },
      { status: 200 },
    );
  }),

  // Cancel an open request
  http.post(`${BASE}/quote-requests/:id/cancel`, ({ params }) => {
    const r = requests.get(Number(params.id));
    if (!r) return new HttpResponse(null, { status: 404 });
    r.state = 'CANCELLED';
    return HttpResponse.json({ requestId: r.id, state: 'CANCELLED' }, { status: 200 });
  }),

  // Start a request-scoped chat with a responding center
  http.post(`${BASE}/quote-requests/:id/chat`, () => {
    return HttpResponse.json({ conversationId: nextConversationId++ }, { status: 200 });
  }),
];
