# Quickstart: Get Quotes — Multi-Center Request & Compare

**Branch**: `009-get-quotes-marketplace`
**Date**: 2026-05-29

---

## Prerequisites

- Customer app builds and runs.
- `006-category-service-booking` in place — a request is anchored to a category, and accepting a quote
  creates a booking on that hierarchy.
- Existing `chatApi` (per-request clarification chat) and the media-upload pattern (attachments).
- Pairs with center `024-quote-requests-inbox` (same backend `quoterequest` domain). End-to-end needs
  centers responding from the center app.

Verify reuse points exist:
```bash
cd ~/MaintenanceCenter/maintenance-customer-app
grep -n "createConversation" store/api/chatApi.ts     # request-scoped chat reuse
grep -n "expo-image-picker" package.json               # attachment uploads
```

---

## New packages

**None.** Reuses `expo-image-picker` (attachments) and `chatApi` (clarification chat).

---

## Environment Setup

No new env vars.
```bash
# .env (already configured)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

---

## Backend Requirements

| Endpoint | Status | Required for |
|----------|--------|--------------|
| `POST /quote-requests` | **Not yet implemented** | Compose + broadcast |
| `GET /quote-requests` | **Not yet implemented** | My requests list |
| `GET /quote-requests/{id}` | **Not yet implemented** | Responses + compare |
| `POST /quote-requests/{id}/accept` | **Not yet implemented** | Accept → booking |
| `POST /quote-requests/{id}/cancel` | **Not yet implemented** | Cancel |
| `POST /quote-requests/{id}/chat` | **Not yet implemented** | Request-scoped chat |
| Matching + expiry (server) | **Not yet implemented** | Reach count, auto-expire |

See `contracts/quote-requests-api.md` for exact shapes.

**Develop without the backend (MSW mock):** `POST /quote-requests` → `OPEN` with `reachCount: 7`;
`GET /quote-requests/{id}` → start with `responses: []`, then return 2–3 `QuoteResponse`s on subsequent
calls (exercises the poll/refetch and compare/sort); `POST …/accept` → `ACCEPTED` + a fake
`acceptedBookingId`. Test the empty paths with `reachCount: 0` and an EXPIRED state.

---

## Running the App

```bash
npx expo start --web      # fastest for composer + compare UI
npx expo start            # native (a/i)
```

---

## New files to create

```
types/quoteRequests.ts
store/api/quoteRequestsApi.ts
components/quotes/RequestComposer.tsx
components/quotes/QuoteResponseCard.tsx
app/(app)/quote-requests/_layout.tsx
app/(app)/quote-requests/new.tsx
app/(app)/quote-requests/[id].tsx
```

## Files to modify

```
store/index.ts                                   # register quoteRequestsApi
store/api/bookingsApi.ts                          # Booking += originRequestId?
app/(app)/(tabs)/index.tsx                         # "Get Quotes" entry on Home
app/(app)/(tabs)/centers/[id]/book/category.tsx    # alt "Get quotes from multiple centers" CTA
lib/i18n/locales/en.json                           # quoteRequests.* keys
lib/i18n/locales/ar.json                           # mirror
```

---

## Smoke test (happy paths)

1. **Compose + broadcast** — Home → **Get Quotes** → pick a category, describe the problem, attach a
   photo, send → request shows `OPEN` with "sent to N centers".
2. **Receive responses** — from the center app (or mock), submit 2 quotes → the responses screen shows
   them with price/range, rating, trust score, distance, response time.
3. **Compare + accept** — sort by price, compare two, accept one → a booking is created (carries
   `originRequestId`), the request becomes `ACCEPTED`, other quotes show not-selected.
4. **Clarify via chat** — open "Ask a question" on a quote → request-scoped chat thread → exchange
   messages → still able to accept.
5. **No matches** — compose in a category/area with no centers (mock `reachCount: 0`) → offered to widen.
6. **Expiry** — let an OPEN request hit its window (mock EXPIRED) → offered to re-broadcast wider or book
   directly.
7. **Cancel** — cancel an OPEN request → `CANCELLED`; responding centers notified (mock).

---

## Verification checklist

- [ ] Category + description required to send; attachments validated for type/size.
- [ ] Reach count + responses come from the backend (client never computes matching).
- [ ] Prices via the shared KD formatter (3 decimals); fixed price shows once when min == max.
- [ ] Responses list updates without manual refresh (refetch on focus + poll while OPEN).
- [ ] Compare sorts by price / rating / distance / soonest; withdrawn/not-selected excluded.
- [ ] Accept creates a booking and navigates to it; other quotes close.
- [ ] Request-scoped chat reachable while OPEN, under the booking after accept, read-only after expiry.
- [ ] Empty paths (no matches, no responses, expired, cancelled) each offer a next action — never a blank screen.
- [ ] RTL spot-check: composer, response cards, compare, countdown.
- [ ] Offline: composer/responses degrade gracefully (cached + retry), not blank/crash.
