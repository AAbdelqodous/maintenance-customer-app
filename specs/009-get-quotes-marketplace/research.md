# Research: Get Quotes — Multi-Center Request & Compare

**Feature**: 009-get-quotes-marketplace
**Date**: 2026-05-29

> Phase 0 decision records. Each is a standalone decision with rationale and rejected alternatives.

---

## R1 — Shared backend `quoterequest` domain with center 024

**Decision**: 009 (customer) and `maintenance-center-app/specs/024` (owner) operate on the **same**
backend `quoterequest`/`quote_response` records. The customer authors, broadcasts, compares, and
accepts; centers receive and respond. No parallel model per app.

**Rationale**: A request and its quotes are one shared object viewed from two sides. Duplicating would
guarantee divergence (a customer seeing a quote a center never sent, or vice versa).

**Alternatives considered**: Per-app request copies synced by events — rejected: two sources of truth
for one negotiation.

---

## R2 — Matching is server-side; the client sends intent, not a center list

**Decision**: The composer sends category (required), optional service, free-text, attachments, area,
and a fulfillment-mode hint. The **backend** computes the match set (covered category + service area +
opted-in + active) and returns only a **reach count** ("sent to N centers"), not the centers.

**Rationale**: Matching rules (area polygons, opt-in, active status) live server-side and will evolve;
the client must not reimplement them. A reach count is enough for the customer's mental model and
avoids leaking which specific centers were targeted before they respond.

**Alternatives considered**: Client picks centers from a list to broadcast to — rejected: that is just
multi-select booking, not a marketplace; it also burdens the customer with relevance decisions the
backend makes better.

---

## R3 — Responses arrive over time → refetch on focus + light poll

**Decision**: The responses screen (`[id].tsx`) refetches `GET /quote-requests/{id}` on focus and on a
light interval while `OPEN`; a "new quote" push notification also triggers a refetch. (If the existing
chat WebSocket is convenient, responses MAY ride the same socket — optional optimization.)

**Rationale**: Quotes trickle in asynchronously; the customer expects the list to grow without manual
refresh. Polling while OPEN is simple and bounded; it stops once `ACCEPTED/EXPIRED/CANCELLED`.

**Alternatives considered**: Pure push-only updates — rejected: a missed/denied push would leave the
list stale; refetch-on-focus is the reliable floor.

---

## R4 — Accept converts to a booking server-side

**Decision**: `POST /quote-requests/{id}/accept { quoteId }` is performed **server-side**: it creates a
confirmed booking from the request (category/service/description) + the accepted quote (price), marks
the request `ACCEPTED`, auto-marks the other quotes not-selected, notifies all centers, and returns the
new `bookingId`. The client then navigates to the booking.

**Rationale**: Booking creation, cross-quote closure, and notifications must be atomic; doing them
client-side would risk partial states (accepted but no booking, or other centers not told).

**Alternatives considered**: Client creates the booking then PATCHes the request — rejected:
non-atomic, racy, and duplicates booking-creation logic.

---

## R5 — Sealed responses (no competitor visibility)

**Decision**: The customer sees every responding center's quote; **centers never see each other's
quotes or the count** (enforced backend). The customer client simply never has data the center side
shouldn't, and the center client (`024`) is given only its own quote.

**Rationale**: Spec out-of-scope explicitly rules out a visible reverse-auction. Sealed responses keep
the market honest without a race-to-the-bottom spectacle and protect centers' pricing.

**Alternatives considered**: Open auction with visible lowest bid — rejected by the spec.

---

## R6 — Per-request chat reuses `chatApi`

**Decision**: A request-scoped conversation is created on demand via `POST /quote-requests/{id}/chat`
(which delegates to the chat domain), then messaging uses the existing `chatApi`
(`getMessages`/`sendMessage`). After accept, the conversation continues under the resulting booking;
after expiry it is read-only.

**Rationale**: The app already has a full chat stack (`chatApi`, message screens, WebSocket). Building a
second messaging surface for clarifications would be wasteful and inconsistent.

**Alternatives considered**: A bespoke request-only messaging widget — rejected: duplicates chat infra.

---

## R7 — Attachments reuse the existing media-upload pattern

**Decision**: Photo/video attachments use the same `expo-image-picker` + upload pattern already used for
reviews/progress media, validated for type and size at compose time; the request carries attachment
references the responding centers can view.

**Rationale**: Reuse the proven media path; avoid a new uploader. Validation at compose prevents
oversized/unsupported files from failing late.

**Alternatives considered**: A new dedicated uploader for requests — rejected: duplication.

---

## R8 — Lifecycle, expiry, and empty states

**Decision**: `OPEN → ACCEPTED | EXPIRED | CANCELLED`. Expiry after a **server-configurable window
(default 48h)**; the client shows a countdown while OPEN. Two empty paths are handled explicitly:
**no matching centers** at creation (offer to widen area/category) and **no responses before expiry**
(offer to re-broadcast wider or book a center directly).

**Rationale**: Spec US4 + edge cases. Dead-end requests erode trust; every terminal/empty state must
offer a next action rather than a blank screen.

**Alternatives considered**: Indefinitely open requests — rejected: stale requests waste center effort
and confuse customers; a bounded window with clear exits is healthier.
