# API Contracts: Payments & Escrow

**Feature**: 007-payments-wallet-escrow
**Date**: 2026-05-29
**Backend base**: `GET|POST|DELETE /api/v1/...`
**Auth**: All endpoints require `Authorization: Bearer <jwt>`
**Money**: All amounts are **KD (`KWD`), 3 decimal places**.

> **Status: BACKEND NOT YET IMPLEMENTED.** These endpoints belong to a new backend `payment` package
> (+ gateway integration with MyFatoorah / Tap and a webhook). The client is blocked on them; build
> against an MSW mock of these shapes. The escrow mechanism (native hold/capture vs. platform-held
> balance) is invisible to the client — only the documented status machine matters.

---

## GET /bookings/{id}/invoice

**Consumer**: `pay.tsx`, `bookings/[id].tsx` via `useGetBookingInvoiceQuery(bookingId)`
**Purpose**: The itemized chargeable invoice + current payment/escrow state for a booking.

### Request
```
GET /api/v1/bookings/{id}/invoice
Authorization: Bearer <jwt>
```

### Response — 200 OK
```json
{
  "bookingId": 123,
  "lines": [
    { "labelEn": "Brake pad replacement", "labelAr": "تغيير تيل الفرامل", "amount": 18.000, "kind": "SERVICE" },
    { "labelEn": "Brake pads (front)", "labelAr": "تيل فرامل أمامي", "amount": 12.500, "kind": "PART" },
    { "labelEn": "Diagnostic fee", "labelAr": "رسوم الفحص", "amount": 5.000, "kind": "DIAGNOSTIC_FEE" },
    { "labelEn": "Loyalty discount", "labelAr": "خصم الولاء", "amount": -2.000, "kind": "LOYALTY" }
  ],
  "total": 33.500,
  "currency": "KWD",
  "paymentStatus": "PENDING",
  "paidAmount": null,
  "walletApplicable": true,
  "availableMethods": ["KNET", "CARD", "APPLE_PAY", "WALLET"],
  "releaseEligible": false,
  "autoReleaseAt": null,
  "receiptUrl": null
}
```

**Reconcile rule**: client checks `sum(lines.amount) == total` (fils-safe). On mismatch → show
`payments.mismatch` + refresh (FR-002), do not allow payment.

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 404 | Generic error + retry (booking/invoice not found) |
| 409 | Invoice not ready (quote not approved) → hide Pay, show "awaiting quote" |
| 5xx / network | Generic error + retry |

---

## POST /payments

**Consumer**: `pay.tsx` via `useInitiatePaymentMutation()`
**Purpose**: Start a payment. Returns a hosted `checkoutUrl`, **or** completes immediately if the wallet covers the full amount.

### Request body
```json
{
  "bookingId": 123,
  "method": "KNET",
  "useWalletBalance": true,
  "saveCard": false,
  "savedMethodId": null,
  "idempotencyKey": "b1f2e3a4-...-uuid"
}
```

### Response — 201 Created (external step needed)
```json
{
  "paymentId": 9001,
  "status": "PENDING",
  "checkoutUrl": "https://gateway.example.com/pay/sess_abc123",
  "returnUrlPrefix": "https://app.maintenance.example/payment-return"
}
```

### Response — 201 Created (wallet covered full amount; no gateway step)
```json
{
  "paymentId": 9002,
  "status": "HELD",
  "checkoutUrl": null,
  "returnUrlPrefix": "https://app.maintenance.example/payment-return"
}
```

**Idempotency**: re-POSTing with the same `idempotencyKey` MUST return the **same** `paymentId`/session
and MUST NOT create a second charge (FR-011, SC-002).

### Error responses
| Status | Client behavior |
|--------|----------------|
| 400 | Validation (e.g. no method + wallet insufficient) → inline message, **no charge** |
| 401 | Redux middleware → redirect to auth |
| 402 | Wallet insufficient / card declined at init → message + retry, **no charge** |
| 409 | Already paid / not in payable state → refetch invoice, hide Pay |
| 5xx / network | Generic error + retry with the **same** idempotency key |

---

## GET /payments/{paymentId}

**Consumer**: `payment-result.tsx` via `useLazyGetPaymentStatusQuery()` (polled, R3)
**Purpose**: Authoritative payment status after the gateway return. The client never trusts the WebView outcome.

### Request
```
GET /api/v1/payments/{paymentId}
Authorization: Bearer <jwt>
```

### Response — 200 OK
```json
{ "paymentId": 9001, "status": "HELD", "bookingId": 123 }
```

`status` ∈ `PENDING | HELD | RELEASED | PAID | REFUNDED | FAILED`.

**Poll contract**: client polls every ~2s up to ~30 attempts. Terminal/stop states: `HELD`, `PAID`,
`RELEASED`, `FAILED`, `REFUNDED`. Still `PENDING` at timeout → "Still processing — we'll notify you".

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 404 | Treat as still-processing until timeout (webhook may not have created the record yet) |
| 5xx / network | Continue polling within the attempt budget |

---

## POST /bookings/{id}/release

**Consumer**: `bookings/[id].tsx` via `useReleaseEscrowMutation()`
**Purpose**: Customer releases held escrow once satisfied (US2). Allowed only when `releaseEligible`.

### Request
```
POST /api/v1/bookings/{id}/release
Authorization: Bearer <jwt>
Body: {}
```

### Response — 200 OK
```json
{ "bookingId": 123, "paymentStatus": "RELEASED" }
```

> Auto-release after `autoReleaseAt` is performed **server-side**; the client does not schedule it.

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 409 | Not release-eligible (center hasn't marked complete) / already released → refetch invoice |
| 5xx / network | Generic error + retry |

---

## POST /bookings/{id}/dispute

**Consumer**: `bookings/[id].tsx` via `useRaiseProblemMutation()`
**Purpose**: Customer reports a problem instead of releasing → pauses auto-release, flags a dispute (US2 #4).

### Request
```json
{ "reason": "Work not finished as agreed" }
```

### Response — 200 OK
```json
{ "bookingId": 123, "paymentStatus": "HELD", "disputed": true }
```

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 409 | Already released / already disputed → refetch invoice |
| 5xx / network | Generic error + retry |

---

## GET /payments/methods

**Consumer**: `settings/payment-methods.tsx`, `pay.tsx` via `useGetSavedMethodsQuery()`
**Purpose**: List the customer's saved (tokenized) cards. **Masked only — never PAN** (FR-010).

### Response — 200 OK
```json
[
  { "id": 5, "brand": "visa", "maskedLabel": "•••• 4242", "expiry": "08/27" }
]
```
Empty `[]` → no saved cards; picker shows only fresh-method options.

---

## DELETE /payments/methods/{id}

**Consumer**: `settings/payment-methods.tsx` via `useDeleteSavedMethodMutation()`
**Purpose**: Remove a saved card; backend **revokes the gateway token** (US4 #2).

### Response — 204 No Content

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 404 | Already removed → refetch list |
| 5xx / network | Generic error + retry |

---

## Gateway webhook (server ↔ gateway — NOT a client endpoint)

Documented here for completeness: the gateway calls a backend webhook on payment/refund events. This is
**what makes `GET /payments/{id}` authoritative** and updates `Booking.paymentStatus`. The client never
calls or trusts the gateway directly (R1, R3).

---

## Status field matrix (booking payment section)

| `paymentStatus` | `releaseEligible` | Client renders on `[id].tsx` |
|-----------------|-------------------|------------------------------|
| `PENDING` | — | **Pay** CTA (if quote APPROVED) |
| `HELD` | `false` | Badge + disabled "Confirm & Release" + hint + "Report a problem" + auto-release countdown |
| `HELD` | `true` | Badge + enabled "Confirm & Release" + "Report a problem" |
| `RELEASED` / `PAID` | — | Paid/released badge + "View receipt" |
| `REFUNDED` | — | Refunded badge + amount |
| `FAILED` | — | Failed badge + **Retry** (→ `pay.tsx`) |
