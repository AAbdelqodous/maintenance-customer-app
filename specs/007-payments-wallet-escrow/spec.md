# Feature Specification: In-App Payments, Wallet & Escrow Protection

**Feature Branch:** `007-payments-wallet-escrow`
**Status:** Draft
**Created:** 2026-05-29
**Phase:** specify (next: plan → tasks → implement)
**Input:** Competitive feature — let customers pay for repairs inside the app via KNET / cards / Apple Pay / Google Pay, hold funds in escrow until the customer confirms the work is done, and keep a top-up wallet for refunds, deposits, and loyalty redemption.

> **Spec Kit reminder:** This document describes WHAT the system must do and WHY, not HOW.
> Implementation details (tables, endpoints, gateway SDK choices) belong in `plan.md`.

---

## Dependencies (read before this spec)

- **Requires** backend `booking.PaymentMethod` / `booking.PaymentStatus` enums (already present as stubs) to be promoted into a real payment domain.
- **Requires** `specs/004-phase-4-deep-trust` — the quote-approval flow defines the approved amount that becomes the charge basis.
- **Requires** `specs/006-category-service-booking` — payment is attached to a booking that already carries category + service.
- **Pairs with** center app `specs/023-payments-earnings-payouts` — the owner side that receives the settled funds and triggers escrow release confirmation.
- **Integrates with** `specs/005-phase-5-retention` — loyalty points may be redeemed against an invoice, and refunds may land in the wallet.

---

## 1. Summary

Today the customer app records a `paymentMethod` label (`CASH | KNET | CREDIT_CARD`) on a booking
but no money ever moves through the platform. Every transaction settles in cash or off-app card
machines at the center. This blocks the platform's core trust promise and removes the strongest
reason for both sides to stay inside the app.

This feature introduces three capabilities:

1. **In-app payment** for an approved quote or completed booking, using payment methods Kuwaitis
   actually use — **KNET** (primary), Visa/Mastercard, **Apple Pay**, and **Google Pay**.
2. **Escrow protection (hold-and-release):** the customer's money is captured/authorized when work
   is approved and held by the platform until the customer confirms the work is complete (or an
   auto-release / dispute window elapses). This directly answers the "I paid and the job was bad"
   fear that keeps customers in cash.
3. **A customer wallet:** a stored balance used for refunds, partial deposits, diagnostic-fee
   prepayment, and loyalty redemption, topped up via the same payment methods.

---

## 2. Why Now

- The roadmap's research shows **only 17% of drivers feel fairly charged**; cash payment hides the
  charge until the end and gives the customer no recourse. Escrow + in-app receipts make the price
  visible and reversible.
- Competing super-apps and delivery apps in Kuwait have trained users to expect KNET/Apple Pay at
  checkout. A marketplace that still says "pay cash at the shop" feels a decade behind.
- The platform cannot earn commission, offer money-back guarantees, or build a wallet/loyalty loop
  while no money flows through it. Payments are the keystone the retention and growth phases assume.
- Centers told us their biggest friction is no-shows and disputed final bills. A held deposit and an
  agreed, app-recorded amount remove both.

---

## 3. Scope

### In scope

- Pay an **approved quote** or a **completed booking** in full from the booking detail screen.
- Pay a **deposit** at booking time when a center requires one (deposit amount comes from the center
  / service configuration; see center app pricing specs).
- Payment methods: **KNET, credit/debit card, Apple Pay, Google Pay, and Wallet balance.** A single
  payment may combine wallet balance + one external method (wallet first, remainder external).
- **Escrow hold + release:** funds are held after capture; the customer releases them by confirming
  completion. Auto-release after a configurable window (default assumption: 72h after the center
  marks the work complete) if the customer takes no action.
- **Wallet:** view balance, transaction history, top up, see refunds credited.
- **Refunds:** full or partial refund back to original method or to wallet (per platform policy);
  customer sees refund status.
- **Receipts/invoices:** an itemized, bilingual (AR/EN) receipt per paid booking, downloadable/shareable.
- **Saved payment methods:** tokenized cards stored for one-tap reuse (no raw PAN ever stored on device or in our DB).
- **Loyalty redemption** applied as a discount line before payment (value defined by `005-phase-5-retention`).

### Out of scope (explicitly deferred)

- **Installments / buy-now-pay-later.** v1 is single-charge or wallet.
- **Subscription / maintenance-plan billing** (roadmap 5.0.3) — separate spec.
- **Multi-currency.** v1 is KD only, 3 decimal places.
- **Tipping technicians.**
- **Dispute adjudication UI** beyond raising a dispute that pauses auto-release; the resolution
  workflow (admin-mediated) is a separate spec. v1 only needs to *hold* the release when disputed.
- **Owner-side payout management** — lives in center app `023-payments-earnings-payouts`.
- **Cash payment removal.** Cash remains a valid offline method; this spec adds digital payment, it
  does not forbid cash.

---

## 4. Glossary

| Term | Meaning in this spec |
|---|---|
| **Escrow / Hold** | Customer funds captured by the platform and not yet settled to the center. Held until release. |
| **Release** | The action (customer-confirmed or auto) that authorizes settling held funds to the center. |
| **Wallet** | A per-customer stored KD balance on the platform, usable for payment, fed by top-ups and refunds. |
| **Deposit** | A partial up-front amount required by a center to confirm a booking, applied against the final invoice. |
| **Invoice** | The itemized amount owed for a booking: approved quote lines + diagnostic fee + parts − loyalty/offer discounts. |
| **Saved method** | A tokenized reference to a card returned by the payment gateway; never the raw card number. |
| **Auto-release window** | The time after the center marks work complete before held funds release automatically without customer action. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pay an Approved Quote with KNET, Held in Escrow (Priority: P1)

A customer whose quote has been approved opens the booking, reviews the itemized invoice, taps
**Pay**, chooses KNET, completes the gateway flow, and returns to the app showing the payment as
**Held (in escrow)**. The center is notified that funds are secured but not yet released.

**Why this priority**: This is the core money-movement path and the trust differentiator. Without it nothing else in the spec has value.

**Independent Test**: With an approved quote, complete a KNET payment in the gateway sandbox and verify the booking shows `paymentStatus = HELD`, an itemized receipt exists, and the center receives a "funds secured" notification.

**Acceptance Scenarios**:

1. **Given** a booking with an approved quote and `paymentStatus = PENDING`, **When** the customer taps Pay and selects KNET, **Then** they are taken through the KNET flow and on success the booking shows `HELD` with the captured amount and a receipt.
2. **Given** the gateway flow is cancelled or fails, **When** the customer returns to the app, **Then** the booking remains `PENDING`, no funds are captured, and a clear retry option is shown.
3. **Given** the invoice includes a loyalty discount and a diagnostic fee, **When** the receipt renders, **Then** every line (service, parts, diagnostic fee, discount, total) is itemized in the customer's locale (AR/EN) and the total matches the captured amount.
4. **Given** payment succeeded, **When** the customer reopens the booking, **Then** the held amount, method (masked), and a "Confirm work complete to release payment" call-to-action are visible.

---

### User Story 2 - Confirm Completion to Release Escrow (Priority: P1)

After the center marks the work complete and the customer is satisfied, the customer taps **Confirm
& Release** on the booking; the held funds become eligible for settlement to the center and the
booking moves to `PAID`. If the customer does nothing, the funds auto-release after the configured window.

**Why this priority**: Escrow with no release path traps customer money and is worse than cash. Release is what makes the hold safe to use.

**Independent Test**: From a `HELD` booking that the center has marked complete, tap Confirm & Release and verify the booking becomes `RELEASED/PAID`, the center is notified, and a separate test confirms auto-release fires after the window with no customer action.

**Acceptance Scenarios**:

1. **Given** a `HELD` booking the center has marked complete, **When** the customer taps Confirm & Release, **Then** the booking moves to `RELEASED` and the center is notified funds are settling.
2. **Given** a `HELD` booking the center has **not** yet marked complete, **When** the customer opens it, **Then** the Release action is disabled with an explanation ("waiting for the center to finish").
3. **Given** a `HELD` booking the center marked complete and the auto-release window has elapsed, **When** the window passes with no customer action, **Then** funds auto-release and both parties are notified.
4. **Given** the customer is not satisfied, **When** they tap "Report a problem" instead of releasing, **Then** auto-release is paused and a dispute flag is raised (resolution handled outside this spec).

---

### User Story 3 - Wallet Top-Up, Refunds, and Combined Payment (Priority: P2)

A customer tops up their wallet, sees a refund from a cancelled booking land in the wallet, and on a
later payment uses the wallet balance plus KNET to cover the remainder.

**Why this priority**: The wallet is what turns refunds and loyalty into retention rather than a one-off. It is valuable but the platform can launch escrow without it.

**Independent Test**: Top up KD 10 via KNET, cancel a deposit-paid booking to receive a refund to wallet, then pay a KD 15 invoice using wallet (10) + KNET (5) and verify the split is recorded.

**Acceptance Scenarios**:

1. **Given** a wallet balance of 0, **When** the customer tops up KD 10 via KNET, **Then** the balance shows 10.000 KD and a top-up transaction appears in history.
2. **Given** a refund is issued to wallet, **When** it settles, **Then** the balance increases, a refund transaction appears, and the customer is notified.
3. **Given** a wallet balance of KD 10 and an invoice of KD 15, **When** the customer pays, **Then** wallet is debited 10, the external method is charged 5, and the receipt shows both lines.
4. **Given** insufficient wallet balance and no external method selected, **When** the customer taps Pay, **Then** payment is blocked with a clear prompt to add a method or top up.

---

### User Story 4 - Save and Reuse a Card (Priority: P3)

A customer pays once with a card, opts to save it, and on the next payment selects the saved card for one-tap checkout.

**Why this priority**: Convenience that lifts repeat-payment conversion; not required for first launch.

**Acceptance Scenarios**:

1. **Given** a successful card payment with "save this card" checked, **When** the customer next pays, **Then** the saved card (masked, e.g. •••• 4242) appears as a selectable method.
2. **Given** a saved card, **When** the customer removes it in payment settings, **Then** it no longer appears and its token is revoked.

### Edge Cases

- Gateway timeout / app backgrounded mid-payment: the app reconciles status on return and never double-charges; the booking reflects the gateway's authoritative status.
- Partial refund larger than captured amount must be rejected.
- Customer attempts to release funds before the center marks completion → blocked (US2 #2).
- Network loss after gateway success but before the app records it: status is reconciled from the backend, which is the source of truth.
- Booking cancelled after a deposit was paid → deposit refunded per cancellation policy.
- KD rounding: all amounts are 3-decimal KD; the displayed total must equal the captured amount to the fils.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Customers MUST be able to pay an approved-quote or completed-booking invoice from the booking detail screen using KNET, card, Apple Pay, Google Pay, or Wallet.
- **FR-002**: The system MUST itemize every invoice (service lines, parts, diagnostic fee, discounts, total) bilingually and show a total equal to the amount charged.
- **FR-003**: Captured funds MUST be held in escrow and MUST NOT settle to the center until released by customer confirmation or auto-release.
- **FR-004**: Customers MUST be able to release held funds only after the center has marked the work complete.
- **FR-005**: The system MUST auto-release held funds after a configurable window following center completion if the customer takes no action.
- **FR-006**: Customers MUST be able to raise a problem that pauses auto-release and flags a dispute.
- **FR-007**: The system MUST maintain a per-customer wallet with balance, transaction history, top-up, and refund credit.
- **FR-008**: A single payment MUST be able to combine wallet balance with one external method (wallet first).
- **FR-009**: The system MUST support full and partial refunds to original method or wallet and reflect refund status to the customer.
- **FR-010**: The system MUST never store raw card numbers on device or in the platform database; only gateway-issued tokens may be persisted.
- **FR-011**: The system MUST be resilient to interrupted gateway flows and MUST treat the backend/gateway status as authoritative, preventing double charges.
- **FR-012**: Every paid booking MUST produce a downloadable/shareable receipt.
- **FR-013**: Loyalty redemption and active offers MUST be applied as discount lines before the chargeable total is computed.
- **FR-014**: All monetary values MUST be KD with 3 decimal places.
- **FR-015**: Payment, hold, release, refund, and dispute events MUST each generate the appropriate customer notification and emit the corresponding event for the center app.

### Key Entities

- **Payment**: a money-movement attempt against a booking — amount, currency (KD), method, status (`PENDING → AUTHORIZED/HELD → RELEASED/PAID`, or `FAILED/REFUNDED`), gateway reference, timestamps.
- **Escrow Hold**: links a captured Payment to the release state — held amount, held-at, release-eligible-at (auto-release), released-at, dispute flag.
- **Wallet**: per-customer balance in KD.
- **Wallet Transaction**: top-up, payment debit, refund credit, loyalty credit — signed amount, type, related payment/booking, timestamp.
- **Saved Method**: tokenized card reference — masked label, brand, expiry, gateway token (never raw PAN).
- **Invoice (view)**: itemized derivation of the chargeable total for a booking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete a KNET payment on an approved quote in under 60 seconds from tapping Pay to seeing `HELD`.
- **SC-002**: Zero double-charges across interrupted/timed-out payment flows in testing (100% reconciliation correctness).
- **SC-003**: ≥ 40% of completed bookings are paid in-app within 3 months of launch (vs. 0% today).
- **SC-004**: ≥ 60% of in-app payments use escrow release (customer-confirmed) rather than auto-release, indicating active trust in the flow.
- **SC-005**: Refunds are visible to the customer within 1 minute of being issued and credited to wallet instantly.
- **SC-006**: 100% of paid bookings have a retrievable itemized bilingual receipt.

## Assumptions

- **Target gateway: MyFatoorah or Tap (Kuwait)** — chosen for strong KNET + Apple Pay coverage and merchant settlement. `plan.md` must spike whether the chosen provider supports true hold/capture (auth-then-capture) for escrow and a payout/settlement API; if native hold isn't available, escrow is emulated by capturing into a platform-held balance and releasing via payout (decided in plan). Card tokenization is required.
- The center marks work complete (center app); the customer release acts on that signal.
- The platform takes a commission at settlement; commission accounting is detailed in the center payout spec, not here.
- Cash remains available; choosing cash skips this digital flow and is settled at the center as today.
- The auto-release default window (72h) is platform-configurable and may be revised by policy.
- HTTPS/WSS and the production-hardening items in `specs/003-phase-3-production` are in place before real payments go live.
