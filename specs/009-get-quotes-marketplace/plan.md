# Implementation Plan: Get Quotes — Multi-Center Request & Compare

**Branch**: `009-get-quotes-marketplace` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-get-quotes-marketplace/spec.md`

---

## Summary

Add a **reverse-marketplace** flow to the customer app: the customer describes a problem once (category,
free text, optional photos/video), **broadcasts** it to matching centers, receives competing **quotes**,
**compares** them (price, rating, trust score, distance, response time), and **accepts** one — which
converts that quote into a confirmed booking. This flips today's "pick one center, then book" into
"describe once, let centers compete," directly attacking the price-trust deficit.

This is the **customer side** of the reverse marketplace; the owner side is
`maintenance-center-app/specs/024-quote-requests-inbox`. Both read/write the **same** backend
`quoterequest` domain — the customer authors and accepts, centers respond. The feature mostly
*recombines* existing pieces: categories (`006`), the quote object + trust score (`004`), chat, ratings,
and (on accept) booking creation.

**Repo scope**: customer React Native app. This plan covers the **client**; the backend `quoterequest`
package (broadcast/matching, quote responses, expiry, accept→booking) is a hard dependency captured in
**Contracts** and shared with center `024`.

**Files to add (client)**: 7 — `types/quoteRequests.ts`, `store/api/quoteRequestsApi.ts`,
`app/(app)/quote-requests/_layout.tsx`, `.../quote-requests/new.tsx`, `.../quote-requests/[id].tsx`
(responses + compare), `components/quotes/QuoteResponseCard.tsx`, `components/quotes/RequestComposer.tsx`.
**Files to modify (client)**: 6 — `app/(app)/(tabs)/index.tsx` (Get Quotes entry),
`app/(app)/(tabs)/centers/[id]/book/category.tsx` (Get-Quotes alt CTA), `store/index.ts`,
`store/api/bookingsApi.ts` (accept→booking origin tag), `lib/i18n/locales/en.json`, `ar.json`.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React Native 0.81.5, Expo SDK 54, Expo Router v3, Redux Toolkit + RTK Query, react-i18next, `expo-image-picker` (already present — photo/video attach), existing `chatApi`
**Storage**: No new on-device persistence; RTK Query cache. Attachments uploaded via the existing media pattern.
**Testing**: Jest + React Native Testing Library (existing); pure comparison/sort helpers unit-tested.
**Target Platform**: iOS, Android, Web (react-native-web)
**Project Type**: mobile-app (client of a Spring Boot API)
**Performance Goals**: Compose+send a request < 90s (SC-001); responses list updates in near real-time (poll/refetch); compare view sorts ≤ ~20 quotes without jank.
**Constraints**: All strings bilingual + RTL; KD 3 decimals; JWT from secure store; attachments validated for type/size; no hardcoded URLs.
**Scale/Scope**: A request typically reaches a handful to dozens of centers; responses commonly < 10. 2 new screens + a composer.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md approved before plan |
| II. Bilingual First | ✅ Pass | All strings via i18n; quote/price localized; RTL on composer + responses + compare |
| III. Component-Driven UI | ✅ Pass | `RequestComposer`, `QuoteResponseCard` reusable; screens compose them + existing center/rating components |
| IV. API Contract Adherence | ✅ Pass | RTK Query typed endpoints; JWT; base URL from config |
| V. Offline-Awareness & Performance | ✅ Pass | Responses list shows cached data + retry; compose preserved on error; lists virtualized |
| VI. Security & Privacy | ✅ Pass | JWT from SecureStore; attachments validated; no plaintext logging. (v1 shares request identity with centers — anonymity is a documented out-of-scope enhancement) |

No new pattern required. No Complexity Tracking section needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-get-quotes-marketplace/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── quote-requests-api.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (client repo)

```text
types/
└── quoteRequests.ts                  NEW — request, quote response, lifecycle types

store/api/
└── quoteRequestsApi.ts               NEW — create/list/get request, accept/decline, request chat passthrough

store/
└── index.ts                          MODIFIED — register quoteRequestsApi

store/api/
└── bookingsApi.ts                    MODIFIED — Booking gains optional originRequestId (accept→booking origin)

app/(app)/quote-requests/             NEW — top-level app stack (NOT a bottom tab)
├── _layout.tsx                       Stack
├── new.tsx                           RequestComposer screen (category + description + attachments + area)
└── [id].tsx                          Responses list + compare + accept; per-request chat entry

components/quotes/
├── RequestComposer.tsx               NEW — composer form (category required, desc, photos, area, fulfillment hint)
└── QuoteResponseCard.tsx             NEW — center name, rating, trust score, distance, price/range, duration, inclusions, response time

app/(app)/(tabs)/
├── index.tsx                         MODIFIED — "Get Quotes" entry (home)
└── centers/[id]/book/category.tsx    MODIFIED — alt "Get quotes from multiple centers" CTA

lib/i18n/locales/
├── en.json                           MODIFIED — quoteRequests.* keys
└── ar.json                           MODIFIED — quoteRequests.* keys
```

**Structure Decision**: Quote-request screens live at `app/(app)/quote-requests/` (top-level app stack,
reachable from Home and the category screen) — **not** a new bottom tab, to avoid bloating the tab bar
(same rationale as the wallet placement in `007`). Per-request chat reuses the existing `chatApi`
conversation infrastructure, scoped by a request context.

---

## Phase 0: Research

> Full records in `research.md`. Summary:

- **R1 — Shared backend `quoterequest` domain** with center `024`. The customer authors/broadcasts/
  accepts; centers respond. One request, one set of sealed responses.
- **R2 — Matching is server-side.** The client sends category + area + fulfillment hint; the backend
  decides which centers match (covered category + service area + opted-in + active) and returns a
  *reach count*, not a center list.
- **R3 — Responses arrive over time → refetch/poll.** The responses screen refetches on focus + a light
  poll (or WebSocket if the chat socket is reused); new-quote notifications also prompt a refetch.
- **R4 — Accept converts to a booking server-side.** `POST …/accept` creates the booking from the
  request + accepted quote and returns the booking id; the client navigates to it. Other quotes are
  auto-marked not-selected by the backend.
- **R5 — Sealed responses.** A customer sees all responding centers; centers never see each other's
  quotes (enforced backend; the client simply never has competitors' data on the center side).
- **R6 — Per-request chat reuses `chatApi`.** A request-scoped conversation is created on demand; after
  accept it lives under the resulting booking, after expiry it is read-only.
- **R7 — Attachments reuse the existing media-upload pattern**, validated for type/size at compose.
- **R8 — Lifecycle + expiry.** `OPEN → ACCEPTED | EXPIRED | CANCELLED`; expiry after a configurable
  window (default 48h) is server-driven; the client shows countdown + handles the "no matches / no
  responses" empty states with a widen/book-directly offer.

---

## Phase 1: Design & Contracts

### Data model (`data-model.md`)

`types/quoteRequests.ts` — `QuoteRequest`, `QuoteRequestState`, `QuoteResponse`, `QuoteResponseState`,
`CreateQuoteRequest`, `RequestSortKey`. `bookingsApi.Booking` gains optional `originRequestId`. Full
field tables + transitions in `data-model.md`.

### Contracts (`contracts/quote-requests-api.md`)

Customer endpoints (all `Authorization: Bearer <jwt>`):

| Method & Path | Consumer |
|---|---|
| `POST /quote-requests` | composer (`new.tsx`) — returns request + reach count |
| `GET /quote-requests` | "my requests" list (entry from home) |
| `GET /quote-requests/{id}` | responses screen (`[id].tsx`) — request + quotes |
| `POST /quote-requests/{id}/accept` | accept a quote → returns created `bookingId` |
| `POST /quote-requests/{id}/cancel` | cancel an open request |
| `POST /quote-requests/{id}/chat` | start/get request-scoped conversation (delegates to chat) |

> Webhook/notification events (new quote, quote updated/withdrawn, expiring, expired) drive client refetch.

### RTK Query slice

`store/api/quoteRequestsApi.ts` (tagTypes `['QuoteRequest','QuoteRequestList']`), inline `fetchBaseQuery`
+ Bearer `prepareHeaders` (same as the other 17 slices). `accept`/`cancel` invalidate the request +
list; `createConversation` reuses `chatApi`.

### Agent context update

```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```
