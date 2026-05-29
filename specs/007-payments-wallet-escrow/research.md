# Research: In-App Payments, Wallet & Escrow Protection

**Feature**: 007-payments-wallet-escrow
**Date**: 2026-05-29

> These records expand the Phase 0 decisions in `plan.md`. Each is a standalone decision with
> rationale and rejected alternatives so the choice survives review and onboarding.

---

## R1 — Gateway integration model: hosted checkout vs. native SDK

**Decision**: Backend creates a payment session with the gateway (MyFatoorah / Tap) and returns a
**hosted `checkoutUrl`**. The client opens it in a WebView (native) or via `expo-web-browser` (web).
The client never renders card fields.

**Rationale**: A gateway-hosted page keeps the app **out of PCI-DSS scope** — no PAN, CVV, or expiry
ever touches our code, satisfying FR-010 and Constitution VI. The hosted page renders KNET, card, and
the platform pay buttons uniformly, so we get every method from one integration. It also avoids
bundling a native gateway SDK, which would enlarge the binary and require per-platform merchant
provisioning before anything works.

**Alternatives considered**:
- *Native gateway SDK with in-app card form* — rejected: pulls the app into PCI scope, needs custom
  card UI + validation, and still cannot avoid a web step for KNET in Kuwait.
- *Stripe Payment Sheet* — rejected at the spec level: weak/indirect KNET support, which is the
  dominant rail in Kuwait.

---

## R2 — Escrow hold/release is server-side; the client only consumes state

**Decision**: The client models escrow purely as **payment-status transitions it reads**
(`PENDING → HELD → RELEASED/PAID`, plus `FAILED/REFUNDED`) and **one action it triggers**
(`releaseEscrow(bookingId)`). It never computes, holds, or settles funds.

**Rationale**: The spec's Assumptions allow the backend to implement escrow either via native
auth-then-capture **or** by capturing into a platform-held balance and releasing via payout. That
ambiguity is entirely a backend concern. As long as the client has the status machine + a release
endpoint, it is correct regardless of which mechanism the backend ships.

**Alternatives considered**:
- *Client orchestrates capture-on-release* — rejected: would require the client to hold gateway
  capture references and re-enter the gateway, re-introducing PCI scope and double-charge risk.

---

## R3 — Reconciliation & idempotency (the no-double-charge guarantee)

**Decision**: Three mechanisms together:
1. `initiatePayment` carries a **client-generated `idempotencyKey`** (a `uuid` created once per attempt
   and held in route params). Re-invoking with the same key returns the same session/charge.
2. On **any** return from the gateway — success, cancel, or OS-killed WebView — `payment-result.tsx`
   **ignores the WebView outcome** and **polls `GET /payments/{paymentId}`** until a terminal/held
   state or a bounded timeout.
3. The booking's `paymentStatus` (from `bookingsApi` / the invoice) is the canonical display value
   everywhere outside the immediate result screen.

**Rationale**: Directly satisfies FR-011 and SC-002 (zero double-charges across interrupted flows).
The WebView can be backgrounded or terminated by the OS mid-flow; only the backend (updated by the
gateway webhook) knows the true outcome. Trusting the WebView return is the classic source of both
false-success and duplicate-charge bugs.

**Poll shape**: every 2s, up to ~30 attempts (~60s ceiling). If still `PENDING` at timeout, show
"Still processing — we'll notify you" and defer to a push notification rather than guessing.

**Alternatives considered**:
- *Trust the gateway redirect query params* (`?status=success`) — rejected: spoofable, and races
  ahead of the webhook that actually moves our state.
- *Server-Sent Events / WebSocket for status* — deferred: polling is simpler, bounded, and adequate
  for a one-shot result screen; can be revisited if latency matters.

---

## R4 — WebView return-URL interception & deep linking

**Decision**: The backend registers a `returnUrl` (e.g. `https://<app-domain>/payment-return?session=…`).
- **In-app (WebView)**: `onNavigationStateChange` detects the `returnUrlPrefix`, stops the WebView, and
  routes to `payment-result.tsx` with the `paymentId`.
- **External browser (Apple/Google Pay flows that leave the WebView)**: a registered deep-link scheme
  `mcc://payment-return` brings the user back, converging on the same result screen.

**Rationale**: WebView interception covers the common in-app card/KNET case; the deep link covers the
case where the gateway escalates to the system browser or a wallet app. Both funnel into one
reconciliation screen, so there is a single source of result-handling logic.

**Impact / coordination**: `app.json` gains `scheme: "mcc"`. iOS `associatedDomains` and Android
`intentFilters` for true universal links are finalized in the production/EAS spec
(`003-phase-3-production`) — not required for the scheme-based return to work in dev/preview builds.

**Alternatives considered**:
- *Polling without any return signal* — rejected: the user would be stranded in the WebView with no
  automatic hand-back.

---

## R5 — Apple Pay / Google Pay scope for v1

**Decision**: Offer Apple Pay / Google Pay **through the gateway hosted page** (the gateway renders the
platform pay button where the device supports it). Do **not** integrate native `PaymentRequest` /
platform pay sheets in v1. `MethodPicker` shows these methods only when the invoice/session response
flags them available (`availableMethods`).

**Rationale**: Hosted support ships the methods with zero extra native config or merchant-id
provisioning. Native pay sheets are a conversion/polish improvement that can come later without
changing the data model.

**Alternatives considered**:
- *Native `@stripe/stripe-react-native` / `react-native-payments` sheets now* — rejected for v1:
  per-platform merchant setup + entitlements + more native surface for marginal first-launch value.

---

## R6 — Wallet + external split payment

**Decision**: A single payment may apply **wallet first, remainder external** (FR-008). The client
sends `useWalletBalance: true` plus the chosen external method; the **backend** computes the split,
debits the wallet, and creates a gateway session only for the remainder. If the wallet covers the full
amount, `initiatePayment` returns `status: HELD` (or `PAID`) with **no `checkoutUrl`**, and the client
skips the WebView entirely.

**Rationale**: Keeps split arithmetic server-side where it is authoritative and fils-safe, and lets a
wallet-only payment complete in a single round trip. The client only displays a computed remainder for
transparency (using `lib/money.ts`), never as the basis for a charge.

**Alternatives considered**:
- *Client computes the split and charges the remainder* — rejected: float drift at the fils, and it
  would require the client to know wallet rules (minimums, holds) that belong to the backend.

---

## R7 — KD money handling (fils-safe)

**Decision**: Display amounts via `lib/money.ts → formatKD(amount, locale)`, always exactly **3 decimal
places** (`KD 12.500` / `12.500 د.ك`). Any summing for the FR-002 reconcile check uses **integer fils**
(`Math.round(a * 1000)`). The chargeable **total is always the backend invoice value** — the client
formats and verifies, it does not compute the total.

**Rationale**: KD has 3 decimal places; naïve floating-point addition drifts at the fils and would make
the displayed total disagree with the captured amount. Using the backend total as truth and integer
fils only for a verification sum eliminates the drift.

**Alternatives considered**:
- *Client-side total computation from lines* — rejected: discounts/loyalty/fees ordering and rounding
  policy live on the backend; recomputing risks a visible mismatch with what is actually charged.

---

## R8 — Where the Pay action lives & when it appears

**Decision**: The Pay CTA renders on the existing `bookings/[id].tsx` when
`quote.status === APPROVED` (or the booking is completed) **and** `booking.paymentStatus === PENDING`.
After payment, the same screen shows state-appropriate actions: `HELD` → "Confirm & Release" (enabled
only when `invoice.releaseEligible`) + "Report a problem" + auto-release countdown; `RELEASED/PAID` →
receipt link; `REFUNDED`/`FAILED` → status + retry.

**Rationale**: Reuses the existing approved-quote signal from `quoteApi` (`QuoteStatus.APPROVED`) and the
booking detail surface customers already use — no new entry point or navigation concept. Mirrors spec
US1 (pay) and US2 (release).

**Alternatives considered**:
- *A dedicated "Payments" tab* — rejected: payment is contextual to a booking; a separate tab would
  fragment the flow and duplicate booking context.

---

## R9 — New dependency vetting

**Decision**: Add **`react-native-webview`** (Expo SDK 54 compatible, no custom config plugin). Reuse
the already-present `expo-linking`; add **`expo-web-browser`** (Expo-managed) for the web target's
checkout. Add a small `uuid` generator (or `expo-crypto.randomUUID`) for idempotency keys — no new dep
if `expo-crypto` is already present.

**Rationale**: The Constitution favors minimal dependencies. The WebView is the single unavoidable
addition for hosted checkout and is the Expo-recommended package. No PCI/card-handling library is added.

**Impact**: Requires a **dev/preview build** (WebView is not available in stock Expo Go for all
configs) — gate real-payment testing behind the production/EAS spec. Document in `quickstart.md`.

**Alternatives considered**:
- *`expo-web-browser` for the native case too* — rejected: an external browser tab for every payment
  is a worse UX than an in-app WebView and complicates return handling on native.

---

## R10 — Saved cards: tokens are server-side only

**Decision**: "Save this card" sets `saveCard: true` on `initiatePayment`; the **gateway tokenizes** and
the **backend stores the token**. The client only ever receives a `SavedMethod` with a `maskedLabel`
(e.g. `•••• 4242`), brand, and expiry. Removing a method calls `DELETE /payments/methods/{id}` which
revokes the token server-side.

**Rationale**: Storing any card reference on-device or reconstructing a PAN is out of the question
(FR-010, Constitution VI). The gateway owns the token; we hold an opaque id + a display label.

**Alternatives considered**:
- *Persist masked labels in AsyncStorage for offline display* — rejected: saved methods are account
  state best fetched fresh; caching them on device adds a sync/eviction problem for no real benefit.
