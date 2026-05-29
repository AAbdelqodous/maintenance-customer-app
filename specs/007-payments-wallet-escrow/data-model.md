# Data Model: In-App Payments, Wallet & Escrow Protection

**Feature**: 007-payments-wallet-escrow
**Date**: 2026-05-29

> Client-side TypeScript shapes (RTK Query). All monetary values are **KD, 3 decimal places**.
> The backend is authoritative for every amount and status; the client formats and reconciles.

---

## New enums (`store/api/paymentsApi.ts`)

### `PaymentStatus`

The escrow state machine the client reads and renders.

| Value | Meaning | Client UI |
|-------|---------|-----------|
| `PENDING` | No successful capture yet | Show **Pay** CTA |
| `HELD` | Captured, held in escrow, awaiting release | Show **Confirm & Release** (if eligible) + Report a problem + auto-release countdown |
| `RELEASED` | Customer/auto released; settling to center | Show released badge + receipt link |
| `PAID` | Fully settled (or wallet-covered) | Show paid badge + receipt link |
| `REFUNDED` | Full/partial refund issued | Show refunded badge + amount |
| `FAILED` | Capture failed; **no funds taken** | Show failed badge + Retry |

### `PaymentMethod`

| Value | Notes |
|-------|-------|
| `KNET` | Primary Kuwait rail; via hosted page |
| `CARD` | Visa/Mastercard; tokenizable |
| `APPLE_PAY` | Only when `availableMethods` includes it (R5) |
| `GOOGLE_PAY` | Only when `availableMethods` includes it (R5) |
| `WALLET` | Wallet-only payment (no external step) |

---

## New types (`store/api/paymentsApi.ts`)

### `InvoiceLine`

One itemized row of the chargeable invoice. Rendered bilingually (FR-002).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `labelEn` | `string` | ✅ | English line label |
| `labelAr` | `string` | ✅ | Arabic line label |
| `amount` | `number` | ✅ | KD, 3 decimals; **negative** for discounts/loyalty |
| `kind` | `'SERVICE' \| 'PART' \| 'DIAGNOSTIC_FEE' \| 'FULFILLMENT_FEE' \| 'DISCOUNT' \| 'LOYALTY'` | ✅ | Drives icon/grouping |

### `BookingInvoice`

Returned by `GET /bookings/{id}/invoice`. The single source for the Pay screen and the booking-detail payment section.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bookingId` | `number` | ✅ | |
| `lines` | `InvoiceLine[]` | ✅ | Itemized; render in order |
| `total` | `number` | ✅ | **Authoritative** chargeable total (KD) |
| `currency` | `'KWD'` | ✅ | Constant for v1 |
| `paymentStatus` | `PaymentStatus` | ✅ | Current state |
| `paidAmount` | `number` | optional | Set once captured |
| `walletApplicable` | `boolean` | ✅ | Show wallet toggle when true |
| `availableMethods` | `PaymentMethod[]` | ✅ | Per device/gateway capability (R5) |
| `releaseEligible` | `boolean` | ✅ | True once center marked work complete (US2 #2) |
| `autoReleaseAt` | `string` (ISO) | optional | When held funds auto-release |
| `receiptUrl` | `string` | optional | Present once `RELEASED/PAID` |

### `InitiatePaymentRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bookingId` | `number` | ✅ | |
| `method` | `PaymentMethod` | ✅ | External method, or `WALLET` for wallet-only |
| `useWalletBalance` | `boolean` | ✅ | Apply wallet first, remainder external (R6) |
| `saveCard` | `boolean` | optional | Tokenize on success (US4) |
| `savedMethodId` | `number` | optional | Pay with an existing token |
| `idempotencyKey` | `string` (uuid) | ✅ | One per attempt; prevents double-charge (R3) |

### `InitiatePaymentResponse`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `paymentId` | `number` | ✅ | Polled on the result screen |
| `status` | `PaymentStatus` | ✅ | May already be `HELD/PAID` if wallet covered the full amount |
| `checkoutUrl` | `string` | optional | Present **only** when an external gateway step is needed |
| `returnUrlPrefix` | `string` | ✅ | WebView interception target (R4) |

### `SavedMethod`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✅ | Server token id |
| `brand` | `string` | ✅ | e.g. `visa` |
| `maskedLabel` | `string` | ✅ | e.g. `•••• 4242` — **never** full PAN (FR-010) |
| `expiry` | `string` | ✅ | `MM/YY` |

---

## New types (`store/api/walletApi.ts`)

### `Wallet`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `balance` | `number` | ✅ | KD, 3 decimals |
| `currency` | `'KWD'` | ✅ | |

### `WalletTransaction`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✅ | |
| `type` | `'TOPUP' \| 'PAYMENT' \| 'REFUND' \| 'LOYALTY_CREDIT'` | ✅ | |
| `amount` | `number` | ✅ | **Signed** KD (credits +, debits −) |
| `bookingId` | `number` | optional | Set for payment/refund tied to a booking |
| `createdAt` | `string` (ISO) | ✅ | |
| `descriptionEn` / `descriptionAr` | `string` | ✅ | Bilingual row label |

### `TopUpRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `amount` | `number` | ✅ | KD |
| `method` | `KNET \| CARD \| APPLE_PAY \| GOOGLE_PAY` | ✅ | Wallet cannot top up wallet |
| `idempotencyKey` | `string` (uuid) | ✅ | Same guarantee as payments (R3) |

---

## Modified type (`store/api/bookingsApi.ts`)

### `Booking`

Two payment fields become canonical for display. All existing fields unchanged.

| Field | Change |
|-------|--------|
| `paymentStatus` | **Widened** to the full `PaymentStatus` enum (was a `PENDING/PAID` stub) |
| `paidAmount` | NEW optional `number` (KD) |

> `PaymentStatus` and `PaymentMethod` are **defined in `paymentsApi.ts`** and imported by `bookingsApi.ts`
> to avoid a duplicate/contradictory enum. (`bookingsApi` previously carried a local `PaymentMethod` —
> consolidate to the payments-domain enum; keep the old members `CASH`/`KNET`/`CREDIT_CARD` mapped during
> transition if any legacy rows rely on them — see Validation Rules.)

---

## State transitions

### Payment / escrow lifecycle (client view)

```
quote APPROVED + paymentStatus PENDING
   └─ pay.tsx → initiatePayment(idempotencyKey)
        ├─ wallet covers full → status HELD/PAID (no checkoutUrl) ─┐
        └─ checkoutUrl → payment-webview → (return) ───────────────┤
                                                                    ↓
                                            payment-result.tsx polls GET /payments/{id}
                                                                    ↓
                  ┌─────────────────────┬───────────────────┬──────────────┐
                HELD                   PAID               FAILED          PENDING(timeout)
                  │                      │                   │                │
   "Confirm & Release" (if          receipt link         Retry          "we'll notify you"
    releaseEligible) + dispute
                  ↓
   releaseEscrow(bookingId)  ── or auto-release at autoReleaseAt ──►  RELEASED → PAID
                  │
   raiseProblem(bookingId)  ──►  auto-release paused (dispute flag)
```

### Release eligibility gate (US2)

```
invoice.releaseEligible?
  YES (center marked work complete) → "Confirm & Release" enabled
  NO                                → disabled + hint "Available once the center marks the work complete"
```

### Wallet balance flow

```
TOPUP   (+amount) ─┐
REFUND  (+amount) ─┼─► Wallet.balance
LOYALTY (+amount) ─┘
PAYMENT (−amount) ──► debits balance (wallet-first split, R6)
```

---

## Validation rules

- `idempotencyKey` MUST be generated **once per attempt** (on `pay.tsx` / `topup.tsx` mount) and reused
  across retries of that same attempt — never regenerated on a retry tap (R3).
- The Pay action MUST be blocked when **no method is selected** and the wallet does not cover the full
  amount (FR-008 / US3 #4).
- The client MUST verify `sumLinesFils(lines) === total` (fils-safe) and, on mismatch, show
  `payments.mismatch` + a refresh action rather than letting the user pay an unverified amount (FR-002).
- `releaseEscrow` MUST be callable only when `invoice.releaseEligible === true` (US2 #2); the UI disables
  it otherwise (defense-in-depth — backend also enforces).
- `availableMethods` is authoritative for which methods render; Apple/Google Pay MUST be hidden when
  absent (R5).
- All amounts displayed MUST pass through `formatKD` (3 decimals, locale-aware) — no raw `toFixed(2)` or
  hardcoded `KD` strings (Constitution II + R7).
- `SavedMethod.maskedLabel` is display-only; the client MUST NOT store, log, or transmit any fuller card
  representation (FR-010).
- On `initiatePayment` error, the client MUST treat the attempt as **not charged** and allow retry with
  the **same** idempotency key; it MUST NOT show success on a failed/cancelled gateway return — only the
  polled backend status decides (R3).
