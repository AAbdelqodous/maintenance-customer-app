// MSW handlers for spec 007 — payments, wallet & escrow. In-memory mock backend used in jest
// and the RN dev runtime. Escrow is simulated as a status machine; no real gateway/PAN.
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../constants/config';

const BASE = API_BASE_URL.replace(/\/$/, '');

// ── In-memory state ──────────────────────────────────────────────────────────
let nextPaymentId = 9000;
let walletBalance = 10.0;

interface MockPayment {
  paymentId: number;
  bookingId: number;
  status: string;
  polls: number;
}
const payments = new Map<number, MockPayment>();
// Per-booking escrow/invoice state: PENDING → HELD → RELEASED (+ releaseEligible flag).
const invoiceStatus = new Map<number, string>();
const releaseEligible = new Map<number, boolean>();
const walletTx: any[] = [];

export function __resetPaymentsMock() {
  nextPaymentId = 9000;
  walletBalance = 10.0;
  payments.clear();
  invoiceStatus.clear();
  releaseEligible.clear();
  walletTx.length = 0;
}

function invoiceFor(bookingId: number) {
  const status = invoiceStatus.get(bookingId) ?? 'PENDING';
  return {
    bookingId,
    lines: [
      { labelEn: 'Service', labelAr: 'الخدمة', amount: 18.0, kind: 'SERVICE' },
      { labelEn: 'Parts', labelAr: 'قطع غيار', amount: 12.5, kind: 'PART' },
      { labelEn: 'Loyalty discount', labelAr: 'خصم الولاء', amount: -2.0, kind: 'LOYALTY' },
    ],
    total: 28.5,
    currency: 'KWD',
    paymentStatus: status,
    paidAmount: status === 'PENDING' ? undefined : 28.5,
    walletApplicable: true,
    availableMethods: ['KNET', 'CARD', 'APPLE_PAY', 'WALLET'],
    releaseEligible: releaseEligible.get(bookingId) ?? false,
    autoReleaseAt: status === 'HELD' ? new Date(Date.now() + 72 * 3600_000).toISOString() : undefined,
    receiptUrl: status === 'RELEASED' || status === 'PAID' ? 'https://mock.local/receipt.pdf' : undefined,
  };
}

export const paymentsHandlers = [
  http.get(`${BASE}/bookings/:id/invoice`, ({ params }) =>
    HttpResponse.json(invoiceFor(Number(params.id)), { status: 200 }),
  ),

  http.post(`${BASE}/payments`, async ({ request }) => {
    const body = (await request.json()) as { bookingId: number; useWalletBalance?: boolean };
    const id = nextPaymentId++;
    // If wallet covers the full amount, settle immediately (no gateway step).
    const walletCovers = body.useWalletBalance && walletBalance >= 28.5;
    const status = walletCovers ? 'HELD' : 'PENDING';
    payments.set(id, { paymentId: id, bookingId: body.bookingId, status, polls: 0 });
    if (walletCovers) {
      walletBalance -= 28.5;
      invoiceStatus.set(body.bookingId, 'HELD');
    }
    return HttpResponse.json(
      {
        paymentId: id,
        status,
        checkoutUrl: walletCovers ? undefined : 'https://mock.local/checkout/' + id,
        returnUrlPrefix: 'https://app.maintenance.example/payment-return',
      },
      { status: 201 },
    );
  }),

  // Poll: first call PENDING, then HELD (exercises the reconciliation loop).
  http.get(`${BASE}/payments/:paymentId`, ({ params }) => {
    const p = payments.get(Number(params.paymentId));
    if (!p) return new HttpResponse(null, { status: 404 });
    p.polls += 1;
    if (p.status === 'PENDING' && p.polls >= 2) {
      p.status = 'HELD';
      invoiceStatus.set(p.bookingId, 'HELD');
    }
    return HttpResponse.json({ paymentId: p.paymentId, status: p.status, bookingId: p.bookingId }, { status: 200 });
  }),

  http.post(`${BASE}/bookings/:id/release`, ({ params }) => {
    const bookingId = Number(params.id);
    if (!releaseEligible.get(bookingId)) return new HttpResponse(null, { status: 409 });
    invoiceStatus.set(bookingId, 'RELEASED');
    return HttpResponse.json({ bookingId, paymentStatus: 'RELEASED' }, { status: 200 });
  }),

  http.post(`${BASE}/bookings/:id/dispute`, ({ params }) =>
    HttpResponse.json({ bookingId: Number(params.id), paymentStatus: 'HELD', disputed: true }, { status: 200 }),
  ),

  http.get(`${BASE}/payments/methods`, () =>
    HttpResponse.json([{ id: 5, brand: 'visa', maskedLabel: '•••• 4242', expiry: '08/27' }], { status: 200 }),
  ),
  http.delete(`${BASE}/payments/methods/:id`, () => new HttpResponse(null, { status: 204 })),

  // ── Wallet ──
  http.get(`${BASE}/wallet`, () => HttpResponse.json({ balance: walletBalance, currency: 'KWD' }, { status: 200 })),
  http.get(`${BASE}/wallet/transactions`, () => HttpResponse.json(walletTx, { status: 200 })),
  http.post(`${BASE}/wallet/topup`, async ({ request }) => {
    const body = (await request.json()) as { amount: number };
    const id = nextPaymentId++;
    payments.set(id, { paymentId: id, bookingId: -1, status: 'PENDING', polls: 0 });
    walletTx.unshift({
      id: Date.now(), type: 'TOPUP', amount: body.amount, createdAt: new Date().toISOString(),
      descriptionEn: 'Top-up', descriptionAr: 'شحن',
    });
    walletBalance += body.amount;
    return HttpResponse.json(
      { paymentId: id, status: 'PENDING', checkoutUrl: 'https://mock.local/checkout/' + id, returnUrlPrefix: 'https://app.maintenance.example/payment-return' },
      { status: 201 },
    );
  }),
];

/** Test helper: mark a booking's escrow release-eligible (as if the center marked work complete). */
export function __setReleaseEligible(bookingId: number, eligible: boolean) {
  releaseEligible.set(bookingId, eligible);
}
