# Implementation Plan: In-App Payments, Wallet & Escrow Protection

**Branch**: `007-payments-wallet-escrow` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/007-payments-wallet-escrow/spec.md`

---

## Summary

Add an in-app payment surface to the customer app so a customer can pay an **approved-quote** or
**completed-booking** invoice via **KNET / card / Apple Pay / Google Pay / wallet**, with funds held
in **escrow** until the customer confirms the work is complete (or an auto-release window elapses), plus
a **wallet** (balance, top-up, refunds, history) and **saved (tokenized) cards**.

The customer app integrates with a **gateway-hosted checkout** (MyFatoorah / Tap, per spec decision):
the backend creates a payment session and returns a hosted payment URL; the app opens it in a WebView,
the customer completes payment on the gateway's PCI-compliant page, and on return the app **reconciles
status from the backend, which is the source of truth** (never from the WebView result alone). Escrow
hold/release, refunds, wallet, and saved-method tokens are all backend concerns the app *consumes*; the
app never handles raw card data and stores no payment secrets on device.

**Repo scope**: this is the customer React Native app. This plan covers the **client** (screens, RTK
Query slices, types, i18n, deep-link config). The **backend** (`payment`, `wallet` packages, gateway
integration, escrow ledger, payout webhook) is a hard dependency captured in **Contracts** and must be
delivered in the backend repo + its own plan; the center side is `maintenance-center-app/specs/023`.

**Files to add (client)**: 9 — `paymentsApi.ts`, `walletApi.ts`, `lib/money.ts`,
`app/(app)/(tabs)/bookings/pay.tsx`, `.../bookings/payment-webview.tsx`, `.../bookings/payment-result.tsx`,
`app/(app)/(tabs)/wallet/index.tsx`, `.../wallet/topup.tsx`, `app/(app)/settings/payment-methods.tsx`.
**Files to modify (client)**: 7 — `bookings/[id].tsx`, `bookings/_layout.tsx`, `wallet/_layout.tsx` (new layout),
`store/index.ts`, `store/api/bookingsApi.ts` (paymentStatus type), `lib/i18n/locales/en.json`, `ar.json`,
`app.json` (deep-link scheme).

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React Native 0.81.5, Expo SDK 54, Expo Router v3, Redux Toolkit + RTK Query, react-i18next. **New**: `react-native-webview` (gateway hosted checkout), `expo-linking` (already transitive — used for return deep link), `expo-web-browser` (fallback for web target).
**Storage**: No new on-device persistence of payment data. JWT continues via `expo-secure-store`. Saved-method **tokens live server-side**; the client only displays masked labels returned by the API.
**Testing**: Jest + React Native Testing Library (existing). Reconciliation logic and `lib/money.ts` are pure-function unit tested; payment flow integration tested against an MSW mock of the backend contract.
**Target Platform**: iOS, Android, Web (react-native-web). On web, gateway checkout opens via `expo-web-browser` / redirect rather than an in-app WebView.
**Project Type**: mobile-app (client of a Spring Boot API)
**Performance Goals**: Pay → `HELD` round trip under 60s (SC-001); status reconciliation poll resolves within 2s of backend confirmation; invoice/receipt render is local (no perceptible delay).
**Constraints**: HTTPS only (gateway requires it; Constitution VI). **Zero raw PAN** on device or in client logs. Idempotent payment initiation (no double-charge on retry/backgrounding — FR-011). All money is **KD, 3 decimals**.
**Scale/Scope**: 9 new + 7 modified client files. Feature spans the booking-detail payment path, a new wallet area, and payment settings.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md approved before this plan |
| II. Bilingual First | ✅ Pass | All new strings via i18n keys in en.json + ar.json; itemized receipt lines bilingual; KD formatting locale-aware |
| III. Component-Driven UI | ✅ Pass | Reuses `AppText`, `AppButton`; new `InvoiceLines`, `MethodPicker`, `WalletBalanceCard`, `PaymentStatusBadge` are small + testable |
| IV. API Contract Adherence | ✅ Pass | All access via typed RTK Query slices; JWT from store; base URL from `config.ts`; no hardcoded URLs |
| V. Offline-Awareness & Performance | ✅ Pass | Invoice/wallet show cached data + retry on error; payment initiation blocked (not crashed) when offline; lists virtualized |
| VI. Security & Privacy | ⚠️ Gated | Gateway-hosted checkout keeps the app **out of PCI scope** (no PAN handling). Must enforce HTTPS, never log gateway payloads/tokens, and treat the backend as the authoritative status source. See Complexity Tracking. |

The Principle VI item is a **constraint to satisfy**, not a violation requiring a new pattern — recorded in Complexity Tracking for visibility.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-payments-wallet-escrow/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output (payments-api.md, wallet-api.md)
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (client repo)

```text
store/api/
├── paymentsApi.ts                    NEW — invoice, initiate, status, release, dispute, refunds, receipt, saved methods
└── walletApi.ts                      NEW — balance, transactions, top-up initiate

store/
└── index.ts                          MODIFIED — register paymentsApi + walletApi (reducer + middleware)

store/api/
└── bookingsApi.ts                    MODIFIED — widen PaymentStatus enum (PENDING/HELD/RELEASED/PAID/REFUNDED/FAILED); add paymentStatus + paidAmount to Booking

lib/
└── money.ts                          NEW — formatKD(amount, locale), parseKD, sumLines (3-decimal, fils-safe)

app/(app)/(tabs)/bookings/
├── _layout.tsx                       MODIFIED — register pay / payment-webview / payment-result routes
├── [id].tsx                          MODIFIED — Pay CTA, Confirm & Release CTA, Report a problem, payment status badge
├── pay.tsx                           NEW — invoice review + method picker (wallet + external) + Pay action
├── payment-webview.tsx               NEW — gateway hosted checkout WebView + return-URL interception
└── payment-result.tsx                NEW — reconcile status from backend (poll), success/held/failed states

app/(app)/(tabs)/wallet/
├── _layout.tsx                       NEW — wallet stack
├── index.tsx                         NEW — balance + transaction history
└── topup.tsx                         NEW — choose amount + method → gateway checkout (reuses payment-webview)

app/(app)/settings/
└── payment-methods.tsx               NEW — list masked saved cards, remove (revoke token)

components/payments/                  NEW — feature components
├── InvoiceLines.tsx                  itemized bilingual invoice rows + total
├── MethodPicker.tsx                  KNET / card / Apple Pay / Google Pay / saved / wallet selection
├── PaymentStatusBadge.tsx            PENDING / HELD / RELEASED / PAID / REFUNDED / FAILED chip
└── WalletBalanceCard.tsx             balance + top-up CTA

lib/i18n/locales/
├── en.json                           MODIFIED — payments.* + wallet.* keys
└── ar.json                           MODIFIED — payments.* + wallet.* keys

app.json                              MODIFIED — add deep-link scheme for gateway return (e.g. mcc://payment-return)
```

**Structure Decision**: Mobile-app client structure (the project's existing convention). Payment access goes through two new RTK Query slices alongside the existing 17 slices; new screens live under the existing `bookings/` stack plus a new `wallet/` stack and a `settings/payment-methods.tsx`. No new global state library — RTK Query owns server state; a tiny in-memory param object carries the gateway session id between `pay → payment-webview → payment-result`.

---

## Phase 0: Research

### R1 — Gateway integration model: hosted checkout vs. native SDK

**Decision**: **Backend-created session + gateway-hosted checkout in a WebView** (web: redirect via `expo-web-browser`). The backend calls MyFatoorah/Tap, returns `{ paymentSessionId, checkoutUrl, returnUrl }`; the app loads `checkoutUrl`.
**Rationale**: Keeps the client **out of PCI scope** (no card fields), works uniformly for KNET + card + Apple/Google Pay on the hosted page, and avoids bundling a native gateway SDK (smaller app, fewer EAS config headaches). Matches the spec's "never store raw PAN" (FR-010) and the production-hardening posture.
**Impact**: Add `react-native-webview`. The client needs only the session/return contract, not gateway credentials. Native Apple Pay / Google Pay *sheets* are deferred to a follow-up (R5).

### R2 — Escrow hold/release is server-side; client consumes state

**Decision**: The client treats escrow as **payment status transitions** it reads and acts on: `PENDING → HELD → RELEASED/PAID` (plus `FAILED/REFUNDED`). The client never computes hold/release; it calls `releaseEscrow(bookingId)` and re-fetches.
**Rationale**: Spec §Assumptions: provider may not support native auth-then-capture, so escrow may be emulated by capturing into a platform-held balance and releasing via payout. That ambiguity is **entirely backend**; the client only needs the status machine and the release action.
**Impact**: `paymentsApi.ts` exposes `getBookingInvoice`, `initiatePayment`, `getPaymentStatus`, `releaseEscrow`, `raiseProblem`. The client is unaffected by which escrow mechanism the backend chooses.

### R3 — Reconciliation & idempotency (no double-charge)

**Decision**: (a) `initiatePayment` carries a **client-generated idempotency key** (`uuid`) per booking-payment attempt, persisted in the route params for the session; retrying with the same key returns the same session. (b) On return from the WebView — **success, cancel, OR app-backgrounded** — `payment-result.tsx` **ignores the WebView result and polls `getPaymentStatus`** until a terminal/held state or timeout. (c) The booking's `paymentStatus` (from `bookingsApi`) is the canonical display value everywhere else.
**Rationale**: Directly satisfies FR-011 + SC-002 (zero double-charge across interrupted flows). The WebView can be killed by the OS; only the backend knows truth.
**Impact**: `payment-result.tsx` implements a bounded poll (e.g. every 2s up to ~60s) with a "still processing — we'll notify you" terminal state that defers to a push notification.

### R4 — WebView return-URL interception & deep linking

**Decision**: The gateway redirects to a `returnUrl` the backend registers, of the form `https://<app-domain>/payment-return?session=...`. The WebView's `onNavigationStateChange` detects this URL prefix, stops the WebView, and routes to `payment-result.tsx` with the session id. A **deep-link scheme** (`mcc://payment-return`) is also registered in `app.json` for the case where the gateway opens the system browser (Apple/Google Pay flows) and returns out-of-app.
**Rationale**: WebView interception covers the in-app case; the deep link covers external-browser returns. Both converge on `payment-result.tsx`.
**Impact**: `app.json` gains the scheme + (later) associated-domains/intent-filters for universal links — flagged for the production/EAS spec.

### R5 — Apple Pay / Google Pay scope for v1

**Decision**: Offer Apple Pay / Google Pay **through the gateway hosted page** (the gateway renders the platform pay button where supported); **do not** integrate native `PaymentRequest`/`expo-payments` sheets in v1.
**Rationale**: Hosted support gets the methods live with zero extra native config; native sheets are a polish/conversion follow-up that needs merchant-id provisioning per platform.
**Impact**: `MethodPicker` lists Apple/Google Pay only when the gateway capability flag (returned by the invoice/session) says they're available on this device/platform; otherwise hidden.

### R6 — Wallet + external split payment

**Decision**: A single payment may apply **wallet first, remainder external** (FR-008). The client sends `useWalletBalance: true` + the chosen external method to `initiatePayment`; the **backend** computes the split, debits wallet, and creates a gateway session only for the remainder (skipping the WebView entirely if wallet covers the full amount).
**Rationale**: Keeps split arithmetic server-side (authoritative, fils-safe) and lets a wallet-only payment complete without a gateway round trip.
**Impact**: `pay.tsx` shows a wallet toggle + computed remainder (display only, using `lib/money.ts`); if remainder is 0, Pay calls `initiatePayment` and goes straight to `payment-result` (no WebView).

### R7 — KD money handling (fils-safe)

**Decision**: Represent amounts as **integer fils** internally where summing/splitting, or as numbers formatted with exactly 3 decimals via `lib/money.ts` (`formatKD`). Never use floating display math for totals — totals come from the backend invoice; the client only formats and verifies the displayed total equals the captured amount (FR-002).
**Rationale**: KD has 3 decimal places; naive float math drifts at the fils. The invoice total is backend-authoritative; the client formats and reconciles.
**Impact**: `lib/money.ts` provides `formatKD(amount, locale)` → e.g. `12.500 د.ك` / `KD 12.500`; used by `InvoiceLines`, receipts, wallet.

### R8 — Where the Pay action lives & when it appears

**Decision**: Pay CTA renders on `bookings/[id].tsx` when `quote.status === APPROVED` (or booking completed) **and** `booking.paymentStatus === PENDING`. After payment: `HELD` shows "Confirm & Release" (enabled only when the center marked work complete) + "Report a problem"; `RELEASED/PAID` shows a receipt link; `REFUNDED/FAILED` shows status + retry where applicable.
**Rationale**: Reuses the existing approved-quote signal from `quoteApi`; no new entry point needed. Mirrors spec US1/US2.
**Impact**: `bookings/[id].tsx` adds a payment section driven by `useGetBookingQuoteQuery` + `useGetBookingInvoiceQuery` + `booking.paymentStatus`.

### R9 — New dependency vetting

**Decision**: Add **`react-native-webview`** (Expo SDK 54 compatible, config-plugin-free). Reuse already-present `expo-linking`; add `expo-web-browser` (Expo-managed) for the web target. No raw-card or PCI SDK is added.
**Rationale**: Constitution favors minimal deps; webview is the single unavoidable addition for hosted checkout and is the Expo-recommended package.
**Impact**: One prod dependency; documented in quickstart; requires a dev/preview build (not just Expo Go) — note for the EAS/production spec.

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md` — see sibling file)

#### New types — `store/api/paymentsApi.ts`

```typescript
export enum PaymentStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',          // captured, in escrow, awaiting release
  RELEASED = 'RELEASED',  // released, settling to center
  PAID = 'PAID',          // fully settled
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  KNET = 'KNET',
  CARD = 'CARD',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  WALLET = 'WALLET',
}

export interface InvoiceLine {
  labelEn: string;
  labelAr: string;
  amount: number;          // KD, 3 decimals; negative for discounts
  kind: 'SERVICE' | 'PART' | 'DIAGNOSTIC_FEE' | 'FULFILLMENT_FEE' | 'DISCOUNT' | 'LOYALTY';
}

export interface BookingInvoice {
  bookingId: number;
  lines: InvoiceLine[];
  total: number;           // backend-authoritative chargeable total (KD)
  currency: 'KWD';
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  walletApplicable: boolean;
  availableMethods: PaymentMethod[];   // gateway capability per device/platform (R5)
  releaseEligible: boolean;            // true once center marked work complete (US2)
  autoReleaseAt?: string;              // ISO; when held funds auto-release
  receiptUrl?: string;
}

export interface InitiatePaymentRequest {
  bookingId: number;
  method: PaymentMethod;               // external method (or WALLET for wallet-only)
  useWalletBalance: boolean;           // apply wallet first, remainder external (R6)
  saveCard?: boolean;                  // tokenize on success (US4)
  savedMethodId?: number;              // pay with an existing token
  idempotencyKey: string;              // client uuid per attempt (R3)
}

export interface InitiatePaymentResponse {
  paymentId: number;
  status: PaymentStatus;               // may be HELD already if wallet covered full amount
  checkoutUrl?: string;                // present when an external gateway step is needed
  returnUrlPrefix: string;             // WebView interception target (R4)
}

export interface SavedMethod {
  id: number;
  brand: string;                       // e.g. 'visa'
  maskedLabel: string;                 // e.g. '•••• 4242' — NEVER full PAN
  expiry: string;                      // 'MM/YY'
}
```

#### New types — `store/api/walletApi.ts`

```typescript
export interface Wallet {
  balance: number;                     // KD, 3 decimals
  currency: 'KWD';
}

export interface WalletTransaction {
  id: number;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'LOYALTY_CREDIT';
  amount: number;                      // signed KD
  bookingId?: number;
  createdAt: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface TopUpRequest {
  amount: number;                      // KD
  method: PaymentMethod.KNET | PaymentMethod.CARD | PaymentMethod.APPLE_PAY | PaymentMethod.GOOGLE_PAY;
  idempotencyKey: string;
}
```

#### Modified type — `store/api/bookingsApi.ts`

```typescript
// Booking gains canonical payment fields (read-only; source of truth for display)
export interface Booking {
  // ... existing fields unchanged ...
  paymentStatus: PaymentStatus;        // widened from any prior PENDING/PAID stub
  paidAmount?: number;                 // KD
}
```

---

### RTK Query slice — `store/api/paymentsApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';
import type {
  BookingInvoice, InitiatePaymentRequest, InitiatePaymentResponse, SavedMethod,
} from './paymentsApi';

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  tagTypes: ['Invoice', 'SavedMethods'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getBookingInvoice: builder.query<BookingInvoice, number>({
      query: (bookingId) => `bookings/${bookingId}/invoice`,
      providesTags: (_r, _e, id) => [{ type: 'Invoice', id }],
    }),
    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({ url: `payments`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Invoice', id: bookingId }],
    }),
    // Polled after gateway return — backend is the source of truth (R3)
    getPaymentStatus: builder.query<{ paymentId: number; status: string; bookingId: number }, number>({
      query: (paymentId) => `payments/${paymentId}`,
    }),
    releaseEscrow: builder.mutation<void, number>({
      query: (bookingId) => ({ url: `bookings/${bookingId}/release`, method: 'POST', body: {} }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Invoice', id }],
    }),
    raiseProblem: builder.mutation<void, { bookingId: number; reason: string }>({
      query: ({ bookingId, reason }) => ({ url: `bookings/${bookingId}/dispute`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Invoice', id: bookingId }],
    }),
    getSavedMethods: builder.query<SavedMethod[], void>({
      query: () => `payments/methods`,
      providesTags: ['SavedMethods'],
    }),
    deleteSavedMethod: builder.mutation<void, number>({
      query: (id) => ({ url: `payments/methods/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SavedMethods'],
    }),
  }),
});

export const {
  useGetBookingInvoiceQuery, useInitiatePaymentMutation, useLazyGetPaymentStatusQuery,
  useReleaseEscrowMutation, useRaiseProblemMutation,
  useGetSavedMethodsQuery, useDeleteSavedMethodMutation,
} = paymentsApi;
```

### RTK Query slice — `store/api/walletApi.ts`

```typescript
// Same fetchBaseQuery + prepareHeaders pattern as above.
endpoints: (builder) => ({
  getWallet: builder.query<Wallet, void>({ query: () => `wallet`, providesTags: ['Wallet'] }),
  getWalletTransactions: builder.query<WalletTransaction[], void>({
    query: () => `wallet/transactions`, providesTags: ['WalletTx'],
  }),
  topUp: builder.mutation<InitiatePaymentResponse, TopUpRequest>({
    query: (body) => ({ url: `wallet/topup`, method: 'POST', body }),
    invalidatesTags: ['Wallet', 'WalletTx'],
  }),
}),
// tagTypes: ['Wallet', 'WalletTx']
```

### Store registration — `store/index.ts`

```typescript
// reducer map
[paymentsApi.reducerPath]: paymentsApi.reducer,
[walletApi.reducerPath]: walletApi.reducer,
// middleware chain
paymentsApi.middleware,
walletApi.middleware,
```

---

### `lib/money.ts`

```typescript
// KD has 3 decimal places (fils). Format only; totals are backend-authoritative.
export function formatKD(amount: number, locale: 'ar' | 'en'): string {
  const value = amount.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-KW', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });
  return locale === 'ar' ? `${value} د.ك` : `KD ${value}`;
}
// Fils-safe sum for display verification only (FR-002 reconcile check)
export function sumLinesFils(amounts: number[]): number {
  return amounts.reduce((acc, a) => acc + Math.round(a * 1000), 0) / 1000;
}
```

---

### Screen designs

#### `app/(app)/(tabs)/bookings/pay.tsx` (NEW)

```
Params: { bookingId }
Hooks: useGetBookingInvoiceQuery(bookingId), useGetWalletQuery(), useGetSavedMethodsQuery(),
       useInitiatePaymentMutation(), useTranslation(), useRouter()
Render:
  - loading / error+retry / loaded
  - <InvoiceLines lines total /> (bilingual, formatKD); assert sumLinesFils(lines)==total else show mismatch warning
  - Wallet toggle (if invoice.walletApplicable): show wallet balance + computed remainder
  - <MethodPicker available={invoice.availableMethods} saved={savedMethods} /> (hidden methods per R5 flag)
  - "Save this card" checkbox when method===CARD
  - Pay button:
      idempotencyKey = useRef(uuid()) generated once on mount
      call initiatePayment({ bookingId, method, useWalletBalance, saveCard, savedMethodId, idempotencyKey })
      if response.checkoutUrl → router.push('payment-webview', { url, returnUrlPrefix, paymentId, bookingId })
      else (wallet covered full) → router.replace('payment-result', { paymentId, bookingId })
Offline: Pay disabled with banner (Constitution V)
```

#### `app/(app)/(tabs)/bookings/payment-webview.tsx` (NEW)

```
Params: { url, returnUrlPrefix, paymentId, bookingId }
Native: <WebView source={{uri:url}} onNavigationStateChange={nav => {
          if (nav.url.startsWith(returnUrlPrefix)) → router.replace('payment-result', {paymentId, bookingId});
        }} />  + a Cancel header button → router.replace('payment-result', {...}) (still reconciles, never assumes cancel)
Web: not rendered — pay.tsx uses expo-web-browser.openAuthSessionAsync(url, returnUrlPrefix) then routes to result
Never reads success/failure from the WebView body (R3).
```

#### `app/(app)/(tabs)/bookings/payment-result.tsx` (NEW)

```
Params: { paymentId, bookingId }
Hook: useLazyGetPaymentStatusQuery()
Effect: poll every 2s up to ~30 tries; stop on terminal/held status
States:
  HELD     → success ✓ "Payment secured in escrow" + "Back to booking" (CTA to release later)
  PAID     → "Paid" (wallet-covered or auto-settled)
  FAILED   → "Payment not completed" + Retry (→ pay.tsx) — no charge made
  PENDING after timeout → "Still processing — we'll notify you" + Done
On success/held → invalidates Invoice + Booking tags so [id].tsx reflects new status
```

#### `app/(app)/(tabs)/bookings/[id].tsx` (MODIFIED)

```
Add a Payment section driven by quote status + invoice + booking.paymentStatus:
  quote APPROVED & paymentStatus PENDING → <Button "Pay"> → router.push('pay', {bookingId})
  paymentStatus HELD:
     <PaymentStatusBadge HELD/>
     "Confirm & Release" → enabled only if invoice.releaseEligible; else disabled w/ hint
        onPress → releaseEscrow(bookingId) → toast + refetch
     "Report a problem" → prompt reason → raiseProblem(bookingId, reason)
     show autoReleaseAt countdown text if present
  paymentStatus RELEASED/PAID → <PaymentStatusBadge/> + "View receipt" (invoice.receiptUrl)
  paymentStatus REFUNDED → badge + refunded amount
  paymentStatus FAILED → badge + Retry
```

#### `app/(app)/(tabs)/wallet/index.tsx` + `topup.tsx` (NEW)

```
index: <WalletBalanceCard balance/> + Top Up CTA + FlatList<WalletTransaction> (virtualized)
topup: amount input (KD) + method picker → topUp() → same checkoutUrl flow → payment-webview → payment-result
```

#### `app/(app)/settings/payment-methods.tsx` (NEW)

```
useGetSavedMethodsQuery → list maskedLabel + brand + expiry
Remove → confirm (window.confirm on web / Alert on native) → deleteSavedMethod(id) → revokes token
```

---

### i18n keys (both `en.json` + `ar.json`, namespaced `payments` / `wallet`)

```jsonc
// en.json (ar.json mirrors with Arabic + KD suffix handled by formatKD)
"payments": {
  "pay": "Pay", "total": "Total", "payNow": "Pay Now",
  "method": { "knet": "KNET", "card": "Card", "applePay": "Apple Pay", "googlePay": "Google Pay", "wallet": "Wallet" },
  "useWallet": "Use wallet balance", "remainder": "Remaining to pay",
  "saveCard": "Save this card for next time",
  "status": { "pending": "Awaiting payment", "held": "Secured (in escrow)", "released": "Released", "paid": "Paid", "refunded": "Refunded", "failed": "Payment failed" },
  "release": "Confirm & Release", "releaseHint": "Available once the center marks the work complete",
  "reportProblem": "Report a problem", "autoRelease": "Auto-releases on {{date}}",
  "result": { "securedTitle": "Payment secured", "securedBody": "Held safely until you confirm the work is done.", "failedTitle": "Payment not completed", "processing": "Still processing — we'll notify you", "retry": "Try Again" },
  "receipt": "View receipt", "mismatch": "Amount mismatch — please refresh"
},
"wallet": {
  "title": "Wallet", "balance": "Balance", "topUp": "Top Up", "amount": "Amount",
  "tx": { "topup": "Top-up", "payment": "Payment", "refund": "Refund", "loyalty": "Loyalty credit" },
  "savedMethods": "Saved cards", "remove": "Remove", "empty": "No transactions yet"
}
```

---

### Deep-link config — `app.json`

```jsonc
{ "expo": { "scheme": "mcc",   // enables mcc://payment-return (R4)
  "ios": { "associatedDomains": ["applinks:<app-domain>"] },     // universal link — finalize in production spec
  "android": { "intentFilters": [/* https <app-domain>/payment-return */] } } }
```

---

### Agent context update

```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

---

## Contracts (`contracts/payments-api.md`, `contracts/wallet-api.md`)

> **All endpoints below are a BACKEND dependency** (new `payment` + `wallet` packages). The client is
> blocked on them; develop against an MSW mock of these shapes. Backend escrow mechanism (native
> hold/capture vs. platform-held balance) is invisible to the client per R2.

| Method & Path | Consumer | Notes |
|---|---|---|
| `GET /bookings/{id}/invoice` | `pay.tsx`, `[id].tsx` | Returns `BookingInvoice`; `total` is authoritative; `availableMethods` reflects device/gateway capability; `releaseEligible` true once center marked complete |
| `POST /payments` | `pay.tsx` | Body `InitiatePaymentRequest` incl. **idempotencyKey**; returns `checkoutUrl` (or `status=HELD` if wallet covered full). Idempotent on the key (FR-011) |
| `GET /payments/{paymentId}` | `payment-result.tsx` (polled) | Authoritative status; client never trusts WebView result (R3) |
| `POST /bookings/{id}/release` | `[id].tsx` | Customer releases escrow; allowed only when `releaseEligible` (US2 #2). Auto-release handled server-side after `autoReleaseAt` |
| `POST /bookings/{id}/dispute` | `[id].tsx` | Pauses auto-release, flags dispute (US2 #4) |
| `GET /payments/methods` / `DELETE /payments/methods/{id}` | `payment-methods.tsx` | Masked tokens only; never PAN (FR-010) |
| `GET /wallet` | `wallet/index.tsx`, `pay.tsx` | Balance in KD |
| `GET /wallet/transactions` | `wallet/index.tsx` | Signed KD history |
| `POST /wallet/topup` | `wallet/topup.tsx` | Same `checkoutUrl` flow as a payment |
| **Gateway webhook** (server↔gateway) | backend only | Backend updates payment/escrow state on gateway callback — this is what makes `GET /payments/{id}` authoritative |

**Auth**: all client endpoints require `Authorization: Bearer <jwt>`.
**Money**: all amounts KD (`KWD`), 3 decimals.
**Errors**: backend `{ businessErrorCode, businessErrorDescription }`; client maps 4xx to specific messages, 5xx/network to generic + retry; a failed `initiatePayment` MUST NOT leave a charge.

---

## Task Ordering (for `/speckit.tasks`)

1. **Foundation (mockable, no UI)**: `lib/money.ts` (+ unit tests), widen `PaymentStatus`/`Booking` in `bookingsApi.ts`, `paymentsApi.ts`, `walletApi.ts`, `store/index.ts` registration, i18n keys (both locales), `app.json` scheme. Add `react-native-webview` + `expo-web-browser`.
2. **Components**: `InvoiceLines`, `MethodPicker`, `PaymentStatusBadge`, `WalletBalanceCard`.
3. **Pay flow**: `pay.tsx` → `payment-webview.tsx` → `payment-result.tsx` (with idempotency + poll reconciliation); register routes in `bookings/_layout.tsx`.
4. **Booking detail integration**: `[id].tsx` Pay / Release / Report-a-problem / receipt section.
5. **Wallet**: `wallet/_layout.tsx`, `wallet/index.tsx`, `wallet/topup.tsx` (reuse pay flow).
6. **Saved methods**: `settings/payment-methods.tsx`.
7. **Polish**: offline/empty/error audit, RTL spot-check (KD suffix placement), accessibility labels on method picker + Pay, reconciliation timeout UX, web-target checkout via `expo-web-browser`.
8. **Verification**: MSW mock of all contracts; double-charge/interrupted-flow test (SC-002); KD formatting tests; smoke test pay → HELD → release → PAID and wallet-only → PAID.

Tasks 1–2 ship before the backend. Tasks 3–8 need the backend contract or its MSW mock. **Do not enable real payments until** `specs/003-phase-3-production` (HTTPS/WSS, EAS build, cert pinning) is complete — payments require a dev/preview build (WebView), not Expo Go.

---

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|-----------|--------------------------------------|
| New dependency `react-native-webview` | Gateway-hosted checkout requires rendering the provider's PCI page in-app | Native gateway SDK would bundle more, need per-platform merchant provisioning, and still not avoid a web step for KNET |
| Status polling/reconciliation loop | OS can kill the WebView; only the backend knows the true outcome (FR-011, SC-002) | Trusting the WebView return result risks double-charges and false success/failure |
| Principle VI gated (HTTPS, no PAN, backend-authoritative) | Handling money mandates these as hard constraints | None — these are requirements, satisfied by hosted checkout + HTTPS + no client-side card fields |
