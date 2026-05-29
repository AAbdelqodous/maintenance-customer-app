# Feature Specification: Get Quotes — Multi-Center Request & Compare (Reverse Marketplace)

**Feature Branch:** `009-get-quotes-marketplace`
**Status:** Draft
**Created:** 2026-05-29
**Phase:** specify (next: plan → tasks → implement)
**Input:** Competitive trust+price feature — let a customer describe a problem once (with photos/video and category), broadcast it to multiple matching centers, receive competing **quotes**, compare them side by side, and convert the chosen quote into a booking. The reverse of today's "pick one center, then book."

> **Spec Kit reminder:** This describes WHAT and WHY. Tables, endpoints, and matching/ranking implementation belong in `plan.md`.

---

## Dependencies (read before this spec)

- **Requires** `specs/006-category-service-booking` — a quote request is anchored to a category (and optionally a service); accepting a quote creates a booking on that hierarchy.
- **Requires** `specs/002-phase-2-core-screens` — reuses center cards, ratings, and the chat/notification surfaces.
- **Pairs with** center app `specs/024-quote-requests-inbox` — the owner side where centers see requests and respond.
- **Relates to** `specs/004-phase-4-deep-trust` (quote object & trust score), `specs/007-payments-wallet-escrow` (the accepted quote becomes the payable invoice), and `specs/008-pickup-and-mobile-service` (the resulting booking may use any fulfillment mode).

---

## 1. Summary

Today a customer must pick a single center and commit to a booking before learning the price. That
preserves exactly the trust+price asymmetry the roadmap identifies as the core problem (78% distrust,
only 17% feel fairly charged). This feature flips the flow:

1. The customer **describes the problem once** — category, free text ("AC not cold, started last
   week"), and optional **photos/video** — and chooses to send it to multiple centers.
2. Matching centers (right category, in area, accepting requests) receive the request and reply with a
   **quote**: price (or range), estimated duration, what's included, and an optional message.
3. The customer **compares** the responses side by side — price, rating, trust score, distance,
   response time — and **accepts one**, which converts that quote into a confirmed booking.

This is a marketplace where centers compete for the job, which structurally pushes prices toward fair
and gives the customer leverage and transparency before any commitment.

---

## 2. Why Now

- It is the most direct possible answer to "only 17% feel fairly charged": let the market quote the
  price before the customer is locked in. Nothing else in the roadmap attacks the price problem this
  directly.
- It is a powerful **acquisition hook for centers** (the other app): "free qualified leads land in
  your inbox" is the single best reason for an owner to sign up and stay active.
- The pieces it needs already exist or are being built — categories, the quote object (deep-trust),
  chat, ratings, trust score, and payments. This feature mostly *recombines* them into a new entry flow.
- It increases customer engagement frequency: even customers who don't book today will "just check
  what it'd cost," which seeds the funnel.

---

## 3. Scope

### In scope

- A **"Get Quotes"** entry point (home + category screens) distinct from "book a specific center."
- A request composer: category (required), optional service, free-text description, optional
  **photo/video** attachments, optional vehicle/appliance detail, preferred area, and preferred
  fulfillment mode hint.
- **Broadcast** to matching centers, with a customer-visible count of how many centers it reached.
- A **request detail / responses** screen that lists incoming quotes as they arrive, each showing
  center name, rating, trust score, distance, quoted price (or range), estimated duration, what's
  included, response time, and an optional message.
- **Compare view** to sort/filter responses (by price, rating, distance, soonest availability).
- **Accept** one quote → creates a booking pre-filled from the request and the quote; **decline**
  others (optionally auto-declined on accept).
- **Per-request chat** so the customer can clarify with a responding center before accepting.
- **Request lifecycle**: `OPEN → (quotes arriving) → ACCEPTED | EXPIRED | CANCELLED`. A request expires
  after a configurable window (assumption: 48h) if not accepted.
- Notifications: new quote received, request expiring soon, quote withdrawn/updated by a center.

### Out of scope (explicitly deferred)

- **Anonymous/blind bidding** (hiding customer identity from centers until accept). v1 shares the
  request; identity-minimization is a later privacy enhancement.
- **Automatic ranking by an algorithm that picks "the best" quote.** v1 presents and sorts; the human chooses.
- **AI-generated price estimate** for the request before centers respond (roadmap 5.0.1 AI Price
  Estimator) — complementary but a separate spec.
- **Negotiation/counter-offer threads** beyond free-text chat. v1 has chat + accept/decline, not a
  structured haggling protocol.
- **Reverse auction with live decreasing prices / deadlines visible to competitors.** Centers do not
  see each other's quotes.
- **Cross-category bundled requests** ("fix my AC and my brakes") — v1 is one category per request.

---

## 4. Glossary

| Term | Meaning in this spec |
|---|---|
| **Quote Request** | A customer-authored description of a problem broadcast to multiple centers, soliciting quotes. |
| **Quote (response)** | A center's reply to a request: price/range, duration, inclusions, optional message. |
| **Broadcast** | Sending one request to all matching centers (category + area + accepting-requests). |
| **Match** | A center eligible to receive a request (covers the category, in the area, opted in). |
| **Accept** | Choosing one quote, which converts it into a confirmed booking and closes the request. |
| **Request window** | The time a request stays OPEN before auto-expiring if not accepted. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Quotes and Receive Responses (Priority: P1)

A customer taps **Get Quotes**, picks a category, describes the problem, attaches a photo, and sends.
Matching centers receive it and reply; the customer sees quotes arriving on the request detail screen.

**Why this priority**: This is the core marketplace loop — without request → responses, there is no feature.

**Independent Test**: Create a request in a category covered by ≥ 2 test centers; have those centers respond from the center app; verify both quotes appear on the customer's request detail with price, rating, and distance.

**Acceptance Scenarios**:

1. **Given** the customer is on the Get Quotes composer, **When** they choose a category, write a description, and send, **Then** a request is created in `OPEN` state and the customer sees how many centers it reached.
2. **Given** an open request, **When** a matching center submits a quote, **Then** it appears on the request detail (price/range, duration, center rating + trust score, distance) and the customer is notified.
3. **Given** the request reached zero matching centers, **When** it is created, **Then** the customer is told no centers matched and offered to widen the area/category.
4. **Given** an attached photo, **When** the request is created, **Then** the photo is visible to responding centers and on the customer's own request detail.

---

### User Story 2 - Compare Quotes and Accept One (Priority: P1)

The customer sorts the responses by price and rating, opens two to compare what's included, accepts
one, and a confirmed booking is created from that quote; the other requests are closed.

**Why this priority**: Accepting is what converts the marketplace into revenue and a booking; comparison is the trust payoff.

**Independent Test**: With ≥ 2 quotes on a request, sort by price, accept one, and verify a booking is created pre-filled from the request + accepted quote, the request becomes `ACCEPTED`, and other centers see their quote as not selected.

**Acceptance Scenarios**:

1. **Given** multiple quotes on a request, **When** the customer sorts by price (or rating/distance), **Then** the list reorders accordingly.
2. **Given** two quotes, **When** the customer compares them, **Then** price, duration, inclusions, rating, and trust score are shown side by side.
3. **Given** a chosen quote, **When** the customer accepts it, **Then** a confirmed booking is created carrying the request's category/service/description and the quote's price, the request moves to `ACCEPTED`, and the chosen center is notified.
4. **Given** a request is accepted, **When** other centers had open quotes, **Then** those quotes are marked not selected and those centers are notified.

---

### User Story 3 - Clarify via Chat Before Accepting (Priority: P2)

Before accepting, the customer asks a responding center a question in a per-request chat and gets an
answer, then accepts.

**Why this priority**: Clarification materially raises accept confidence and conversion, but the core loop works without it.

**Acceptance Scenarios**:

1. **Given** a quote on an open request, **When** the customer opens chat with that center, **Then** a conversation scoped to the request is created and messages exchange in real time.
2. **Given** a request-scoped chat, **When** the request is accepted or expires, **Then** the chat remains accessible from the resulting booking (if accepted) or read-only (if expired).

---

### User Story 4 - Request Expiry and Cancellation (Priority: P3)

A customer's request expires after the window with no accept, or the customer cancels it manually;
responding centers are informed.

**Why this priority**: Lifecycle hygiene; prevents stale requests and wasted center effort, but not core to the first demo.

**Acceptance Scenarios**:

1. **Given** an open request that reaches its window with no acceptance, **When** the window elapses, **Then** it moves to `EXPIRED` and responding centers are notified.
2. **Given** an open request, **When** the customer cancels it, **Then** it moves to `CANCELLED` and responding centers are notified.

### Edge Cases

- All centers decline / none respond before expiry → customer is offered to re-broadcast wider or book a center directly.
- A center withdraws or edits its quote before acceptance → the customer's view updates and they are notified; an accepted quote cannot be unilaterally withdrawn by the center.
- Customer accepts a quote whose center just went inactive → acceptance fails gracefully with a clear message and the quote is removed.
- Duplicate spam requests by the same customer → rate-limited (assumption: a sane cap per hour).
- Photo/video attachment too large or unsupported type → rejected at compose with guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Customers MUST be able to create a quote request with a required category, free-text description, and optional service, photos/video, vehicle/appliance detail, area, and fulfillment-mode hint.
- **FR-002**: The system MUST broadcast a request to all matching centers (category coverage + area + accepting-requests) and show the customer how many it reached.
- **FR-003**: The request detail MUST list incoming quotes in real time, each showing center name, rating, trust score, distance, quoted price/range, estimated duration, inclusions, response time, and optional message.
- **FR-004**: Customers MUST be able to sort/filter responses by price, rating, distance, and soonest availability, and compare quotes side by side.
- **FR-005**: Accepting a quote MUST create a confirmed booking pre-filled from the request and the quote, move the request to `ACCEPTED`, and notify the chosen center.
- **FR-006**: On acceptance, all other open quotes MUST be marked not selected and those centers notified.
- **FR-007**: The system MUST provide a per-request chat between the customer and any responding center, accessible before acceptance.
- **FR-008**: A request MUST auto-expire after a configurable window if not accepted, with notification to the customer and responding centers.
- **FR-009**: Customers MUST be able to cancel an open request, notifying responding centers.
- **FR-010**: The system MUST notify the customer on: new quote received, quote updated/withdrawn, request expiring soon, and request expired.
- **FR-011**: The system MUST handle "no matching centers" and "no responses before expiry" with an offer to widen scope or book directly.
- **FR-012**: All prices MUST be KD (3 decimals), localized (AR/EN), and shown as the same value the resulting booking will carry.
- **FR-013**: Attachments MUST be validated for type/size and be visible to responding centers and the requesting customer.

### Key Entities

- **Quote Request**: customer, category, optional service, description, attachments, area, fulfillment hint, state (`OPEN/ACCEPTED/EXPIRED/CANCELLED`), reach count, window/expiry, timestamps.
- **Quote (response)**: request reference, center, price or range, estimated duration, inclusions, message, response state (`SUBMITTED/UPDATED/WITHDRAWN/SELECTED/NOT_SELECTED`), submitted-at.
- **Request Chat**: conversation scoped to (request, center, customer); reuses chat infrastructure.
- **Match set** (derived): the centers a request was broadcast to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can compose and send a quote request in under 90 seconds.
- **SC-002**: ≥ 70% of broadcast requests receive at least one quote within 2 hours.
- **SC-003**: ≥ 35% of requests that receive ≥ 2 quotes convert to an accepted booking.
- **SC-004**: Median price spread between the lowest and highest quote on a request is visible to the customer (transparency is demonstrably delivered).
- **SC-005**: Centers report quote requests as a meaningful lead source (≥ 20% of bookings at active centers originate from requests within 6 months).

## Assumptions

- Centers opt in to receiving quote requests and declare their covered categories and service area in the center app (`024-quote-requests-inbox`).
- The matching rule (category + area + opted-in + active) is sufficient for v1; smarter ranking/relevance is a later enhancement.
- The request window default (48h) is platform-configurable.
- Accepted quotes feed the payment flow (`007`) as the payable invoice and may use any fulfillment mode (`008`).
- A reasonable per-customer request rate limit prevents spam; exact value decided in plan.
