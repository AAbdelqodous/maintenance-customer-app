# API Contracts: Wallet

**Feature**: 007-payments-wallet-escrow
**Date**: 2026-05-29
**Backend base**: `GET|POST /api/v1/...`
**Auth**: All endpoints require `Authorization: Bearer <jwt>`
**Money**: All amounts are **KD (`KWD`), 3 decimal places**.

> **Status: BACKEND NOT YET IMPLEMENTED.** New backend `wallet` package. Top-up reuses the same
> gateway-hosted checkout flow as a payment (returns a `checkoutUrl`). Build against an MSW mock.

---

## GET /wallet

**Consumer**: `wallet/index.tsx`, `pay.tsx` via `useGetWalletQuery()`
**Purpose**: Current wallet balance.

### Request
```
GET /api/v1/wallet
Authorization: Bearer <jwt>
```

### Response — 200 OK
```json
{ "balance": 10.000, "currency": "KWD" }
```

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 404 | No wallet yet → treat as balance `0.000` |
| 5xx / network | Show cached balance if present, else generic error + retry |

---

## GET /wallet/transactions

**Consumer**: `wallet/index.tsx` via `useGetWalletTransactionsQuery()`
**Purpose**: Signed transaction history (virtualized list).

### Request
```
GET /api/v1/wallet/transactions
Authorization: Bearer <jwt>
```

### Response — 200 OK
```json
[
  { "id": 301, "type": "TOPUP",   "amount":  10.000, "bookingId": null, "createdAt": "2026-05-29T09:00:00Z", "descriptionEn": "Top-up via KNET",        "descriptionAr": "شحن عبر كي نت" },
  { "id": 302, "type": "PAYMENT", "amount":  -5.000, "bookingId": 123,  "createdAt": "2026-05-29T11:30:00Z", "descriptionEn": "Payment for booking #123","descriptionAr": "دفعة للحجز رقم ١٢٣" },
  { "id": 303, "type": "REFUND",  "amount":   3.000, "bookingId": 118,  "createdAt": "2026-05-28T14:00:00Z", "descriptionEn": "Refund for booking #118", "descriptionAr": "استرداد للحجز رقم ١١٨" }
]
```
`amount` is **signed** (credits +, debits −). Empty `[]` → `wallet.empty` state.

### Error responses
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 5xx / network | Generic error + retry |

---

## POST /wallet/topup

**Consumer**: `wallet/topup.tsx` via `useTopUpMutation()`
**Purpose**: Add funds to the wallet via the gateway. Returns a `checkoutUrl` like a payment.

### Request body
```json
{ "amount": 10.000, "method": "KNET", "idempotencyKey": "c2d3e4f5-...-uuid" }
```

### Response — 201 Created
```json
{
  "paymentId": 9100,
  "status": "PENDING",
  "checkoutUrl": "https://gateway.example.com/pay/sess_topup_xyz",
  "returnUrlPrefix": "https://app.maintenance.example/payment-return"
}
```

Flow: same as a payment — `topup.tsx` → `payment-webview.tsx` → `payment-result.tsx` (polls
`GET /payments/{paymentId}`). On success the backend credits the wallet (a `TOPUP` transaction) and
invalidates `Wallet` + `WalletTx` tags so the balance refreshes.

**Idempotency**: re-POSTing with the same `idempotencyKey` MUST NOT create a second top-up (R3).

### Error responses
| Status | Client behavior |
|--------|----------------|
| 400 | Invalid amount (≤ 0, below minimum) → inline message |
| 401 | Redux middleware → redirect to auth |
| 402 | Gateway declined at init → message + retry, **no credit** |
| 5xx / network | Generic error + retry with the **same** idempotency key |

---

## RTK Query tag invalidation summary

| Mutation | Invalidates |
|----------|-------------|
| `topUp` (on success / reconciled) | `Wallet`, `WalletTx` |
| `initiatePayment` (payments-api) | `Invoice` (id = bookingId) — and indirectly `Wallet` when wallet was applied |
| `releaseEscrow` / `raiseProblem` | `Invoice` (id = bookingId) |

> When a payment applies wallet balance (R6), the backend debits the wallet as part of the payment;
> the client should refetch `GET /wallet` on returning from a successful payment so the balance reflects
> the debit (either via tag invalidation if the payments slice also tags `Wallet`, or an explicit refetch
> on `payment-result` success — finalize in implementation).
