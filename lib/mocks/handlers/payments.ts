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
  kind: 'FULL' | 'DEPOSIT';
}
const payments = new Map<number, MockPayment>();
// Per-booking escrow/invoice state: PENDING → HELD → RELEASED (+ releaseEligible flag).
const invoiceStatus = new Map<number, string>();
const releaseEligible = new Map<number, boolean>();
// Spec 023 — demo deposit: every mock booking requires a 5.000 deposit, captured separately.
const TOTAL = 28.5;
const DEPOSIT_REQUIRED = 5.0;
const depositPaidMap = new Map<number, number>();
const walletTx: any[] = [];

export function __resetPaymentsMock() {
  nextPaymentId = 9000;
  walletBalance = 10.0;
  payments.clear();
  invoiceStatus.clear();
  releaseEligible.clear();
  depositPaidMap.clear();
  walletTx.length = 0;
}

function invoiceFor(bookingId: number) {
  const status = invoiceStatus.get(bookingId) ?? 'PENDING';
  const depositPaid = depositPaidMap.get(bookingId) ?? 0;
  const fullPaid = status !== 'PENDING' ? TOTAL - depositPaid : 0;
  const amountDue = Math.max(0, Math.round((TOTAL - depositPaid - fullPaid) * 1000) / 1000);
  return {
    bookingId,
    lines: [
      { labelEn: 'Service', labelAr: 'الخدمة', amount: 18.0, kind: 'SERVICE' },
      { labelEn: 'Parts', labelAr: 'قطع غيار', amount: 12.5, kind: 'PART' },
      { labelEn: 'Loyalty discount', labelAr: 'خصم الولاء', amount: -2.0, kind: 'LOYALTY' },
    ],
    total: TOTAL,
    currency: 'KWD',
    paymentStatus: status,
    paidAmount: depositPaid + fullPaid > 0 ? depositPaid + fullPaid : undefined,
    walletApplicable: true,
    availableMethods: ['KNET', 'CARD', 'APPLE_PAY', 'WALLET'],
    releaseEligible: releaseEligible.get(bookingId) ?? false,
    autoReleaseAt: status === 'HELD' ? new Date(Date.now() + 72 * 3600_000).toISOString() : undefined,
    receiptUrl: status === 'RELEASED' || status === 'PAID' ? 'https://mock.local/receipt.pdf' : undefined,
    depositRequired: DEPOSIT_REQUIRED,
    depositPaid,
    amountDue,
    depositRefundable: false, // demo: this center's policy retains the deposit on cancellation
  };
}

export const paymentsHandlers = [
  http.get(`${BASE}/bookings/:id/invoice`, ({ params }) =>
    HttpResponse.json(invoiceFor(Number(params.id)), { status: 200 }),
  ),

  http.post(`${BASE}/payments`, async ({ request }) => {
    const body = (await request.json()) as { bookingId: number; useWalletBalance?: boolean };
    const id = nextPaymentId++;
    const balance = Math.max(0, Math.round((TOTAL - (depositPaidMap.get(body.bookingId) ?? 0)) * 1000) / 1000);
    // If wallet covers the balance, settle immediately (no gateway step).
    const walletCovers = !!body.useWalletBalance && walletBalance >= balance;
    const status = walletCovers ? 'HELD' : 'PENDING';
    payments.set(id, { paymentId: id, bookingId: body.bookingId, status, polls: 0, kind: 'FULL' });
    if (walletCovers) {
      walletBalance -= balance;
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

  // Spec 023 — deposit capture (separate from the balance). Credited via depositPaidMap.
  http.post(`${BASE}/payments/deposit`, async ({ request }) => {
    const body = (await request.json()) as { bookingId: number; useWalletBalance?: boolean };
    if ((depositPaidMap.get(body.bookingId) ?? 0) > 0) return new HttpResponse(null, { status: 409 });
    const id = nextPaymentId++;
    const walletCovers = !!body.useWalletBalance && walletBalance >= DEPOSIT_REQUIRED;
    const status = walletCovers ? 'HELD' : 'PENDING';
    payments.set(id, { paymentId: id, bookingId: body.bookingId, status, polls: 0, kind: 'DEPOSIT' });
    if (walletCovers) {
      walletBalance -= DEPOSIT_REQUIRED;
      depositPaidMap.set(body.bookingId, DEPOSIT_REQUIRED);
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

  // Poll: first call PENDING, then HELD (exercises the reconciliation loop). A deposit capture
  // credits depositPaidMap; the full/balance capture moves the invoice into escrow.
  http.get(`${BASE}/payments/:paymentId`, ({ params }) => {
    const p = payments.get(Number(params.paymentId));
    if (!p) return new HttpResponse(null, { status: 404 });
    p.polls += 1;
    if (p.status === 'PENDING' && p.polls >= 2) {
      p.status = 'HELD';
      if (p.kind === 'DEPOSIT') depositPaidMap.set(p.bookingId, DEPOSIT_REQUIRED);
      else invoiceStatus.set(p.bookingId, 'HELD');
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
    payments.set(id, { paymentId: id, bookingId: -1, status: 'PENDING', polls: 0, kind: 'FULL' });
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
