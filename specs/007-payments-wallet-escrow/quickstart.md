# Quickstart: In-App Payments, Wallet & Escrow Protection

**Branch**: `007-payments-wallet-escrow`
**Date**: 2026-05-29

---

## Prerequisites

- Customer app dependencies installed and the app runs (Phase 1/2 working).
- `004-phase-4-deep-trust` quote flow in place — payments act on an **APPROVED** quote
  (`quoteApi.QuoteStatus.APPROVED`).
- **`003-phase-3-production` (HTTPS/WSS, EAS build, cert pinning) should be complete before enabling
  *real* payments.** Gateway checkout requires HTTPS and a **dev/preview build** (the WebView is not
  available in stock Expo Go for all configs).

Verify the existing setup:
```bash
cd ~/MaintenanceCenter/maintenance-customer-app
grep '"expo-linking"' package.json     # present (used for the return deep link)
grep '"expo-crypto"' package.json       # if present, use randomUUID for idempotency keys
```

---

## New packages

```bash
npx expo install react-native-webview   # gateway-hosted checkout (native)
npx expo install expo-web-browser        # gateway checkout on web target
# uuid: prefer expo-crypto.randomUUID(); only add a uuid lib if expo-crypto is absent
```

> `react-native-webview` requires a **dev/preview build** (`npx expo prebuild` + EAS), not Expo Go.

---

## Environment Setup

No new client env vars. The existing API base URL is sufficient; gateway credentials live on the
**backend**, never in the app.

```bash
# .env (already configured)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

`app.json` gains a deep-link scheme for the gateway return (R4):
```jsonc
{ "expo": { "scheme": "mcc" } }   // enables mcc://payment-return
```

---

## Backend Requirements

The following endpoints must exist before end-to-end testing. Until then, use the MSW mock (below).

| Endpoint | Status | Required for |
|----------|--------|--------------|
| `GET /bookings/{id}/invoice` | **Not yet implemented** | `pay.tsx`, booking payment section |
| `POST /payments` | **Not yet implemented** | Initiate payment (idempotent) |
| `GET /payments/{paymentId}` | **Not yet implemented** | Result-screen polling |
| `POST /bookings/{id}/release` | **Not yet implemented** | Confirm & Release escrow |
| `POST /bookings/{id}/dispute` | **Not yet implemented** | Report a problem |
| `GET /payments/methods`, `DELETE /payments/methods/{id}` | **Not yet implemented** | Saved cards |
| `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/topup` | **Not yet implemented** | Wallet |
| Gateway webhook (server↔gateway) | **Not yet implemented** | Makes status authoritative |

See `contracts/payments-api.md` and `contracts/wallet-api.md` for exact shapes.

**Develop without the backend (MSW mock):**
- `GET /bookings/{id}/invoice` → return a fixed `BookingInvoice` (PENDING, `availableMethods` you want to test).
- `POST /payments` → return `{ paymentId, status: "PENDING", checkoutUrl: "<your test page>", returnUrlPrefix }`.
- `GET /payments/{paymentId}` → return `PENDING` for the first 1–2 calls, then `HELD` (exercises the poll).
- For the **wallet-covers-full** path, return `POST /payments` with `status: "HELD", checkoutUrl: null`.
- `releaseEligible: false` then `true` lets you exercise the disabled→enabled Release CTA.

---

## Running the App

```bash
# Web (fastest for invoice/wallet UI; checkout uses expo-web-browser)
npx expo start --web

# Native dev build (required to exercise the WebView checkout)
npx expo prebuild        # once
npx expo run:android     # or run:ios
```

---

## New files to create

```
store/api/paymentsApi.ts
store/api/walletApi.ts
lib/money.ts
components/payments/InvoiceLines.tsx
components/payments/MethodPicker.tsx
components/payments/PaymentStatusBadge.tsx
components/payments/WalletBalanceCard.tsx
app/(app)/(tabs)/bookings/pay.tsx
app/(app)/(tabs)/bookings/payment-webview.tsx
app/(app)/(tabs)/bookings/payment-result.tsx
app/(app)/(tabs)/wallet/_layout.tsx
app/(app)/(tabs)/wallet/index.tsx
app/(app)/(tabs)/wallet/topup.tsx
app/(app)/settings/payment-methods.tsx
```

## Files to modify

```
store/index.ts                       # register paymentsApi + walletApi
store/api/bookingsApi.ts             # widen PaymentStatus; add paidAmount; import enums from paymentsApi
app/(app)/(tabs)/bookings/_layout.tsx# register pay / payment-webview / payment-result routes
app/(app)/(tabs)/bookings/[id].tsx   # Pay / Release / Report-a-problem / receipt section
lib/i18n/locales/en.json             # payments.* + wallet.* keys
lib/i18n/locales/ar.json             # payments.* + wallet.* keys
app.json                             # scheme: "mcc"
```

---

## Smoke test (happy paths)

1. **Pay an approved quote (KNET, escrow)**
   - Open a booking whose quote is `APPROVED` and `paymentStatus === PENDING` → tap **Pay**.
   - Review the itemized invoice (lines sum to total) → choose KNET → **Pay Now**.
   - Complete the gateway test page → return → result screen polls → shows **Secured (in escrow)**.
   - Booking detail now shows `HELD` + disabled **Confirm & Release** (center hasn't completed).

2. **Release escrow**
   - With the mock returning `releaseEligible: true`, open the `HELD` booking → **Confirm & Release**
     → status becomes `RELEASED/PAID` → **View receipt** appears.

3. **Wallet-only payment (no WebView)**
   - Top up the wallet to ≥ the invoice total → on `pay.tsx` enable **Use wallet balance** → remainder
     shows `0.000` → **Pay Now** goes straight to the result screen showing `HELD/PAID` (no gateway page).

4. **Wallet + KNET split**
   - Wallet < total → enable wallet → remainder > 0 → choose KNET → pay the remainder via the gateway.

5. **Interrupted flow (no double-charge)**
   - During the WebView step, background/kill the app, reopen → result screen reconciles from
     `GET /payments/{id}` → no duplicate charge; status reflects the backend.

6. **Top-up + refund visibility**
   - Top up via KNET → balance increases + a `TOPUP` row appears.
   - (Mock) issue a refund → `REFUND` row appears and balance increases.

---

## Verification checklist

- [ ] All amounts rendered via `formatKD` (3 decimals, locale-aware) — no `toFixed(2)`, no hardcoded `KD`.
- [ ] `sum(lines) === total` check shows `payments.mismatch` when the mock returns a deliberately wrong total.
- [ ] Idempotency key generated once per attempt; retry tap reuses it (inspect the request body).
- [ ] Result screen **never** shows success from a cancelled/failed gateway return — only from polled status.
- [ ] **Confirm & Release** disabled until `releaseEligible: true`.
- [ ] Apple/Google Pay shown only when `availableMethods` includes them.
- [ ] Saved methods show masked labels only; removing one calls `DELETE /payments/methods/{id}`.
- [ ] RTL spot-check: KD suffix placement (`١٢٫٥٠٠ د.ك`), method picker, invoice rows, wallet list.
- [ ] Offline: Pay/Top-up disabled with a banner, not a crash.
- [ ] No gateway payloads, tokens, or card data in console logs (Constitution VI).
- [ ] Web target: checkout opens via `expo-web-browser` and returns to the result screen.
