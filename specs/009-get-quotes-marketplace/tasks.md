# Tasks: Get Quotes — Multi-Center Request & Compare

**Input**: Design documents from `specs/009-get-quotes-marketplace/`
**Branch**: `009-get-quotes-marketplace`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Data model**: [data-model.md](./data-model.md) | **Contracts**: [quote-requests-api.md](./contracts/quote-requests-api.md)

**Organization**: Tasks grouped by user story (US1–US4). Phase 2 (Foundation) MUST complete before any US phase.
**Tests**: One targeted test — the compare/sort helper (pure, deterministic). No broad UI suite (none requested by the spec).
**Backend note**: T001–T018 build against an **MSW mock** of the contracts (shared backend `quoterequest` package, also consumed by center `024`). End-to-end needs centers responding from the center app.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[US#]**: User story

---

## Phase 1: Setup

- [ ] T001 [P] Create directories `app/(app)/quote-requests/` and (if absent) `components/quotes/`.
- [ ] T002 [P] Confirm reuse points: `chatApi.createConversation` (request chat) and `expo-image-picker` (attachments) are present (per `quickstart.md`). No new packages.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No US phase begins until T003–T008 are complete.

- [ ] T003 [P] Create `types/quoteRequests.ts` — `QuoteRequestState`, `QuoteResponseState`, `RequestSortKey`, `CreateQuoteRequest`, `QuoteResponse`, `QuoteRequest`; copy verbatim from `data-model.md`.
- [ ] T004 [P] Create `store/api/quoteRequestsApi.ts` — `createApi({ reducerPath:'quoteRequestsApi', tagTypes:['QuoteRequest','QuoteRequestList'], baseQuery: inline fetchBaseQuery + Bearer prepareHeaders })`; endpoints `createQuoteRequest` (`POST quote-requests`, invalidates `QuoteRequestList`), `getMyQuoteRequests` (`GET quote-requests`, providesTags `QuoteRequestList`), `getQuoteRequest` (`GET quote-requests/${id}`, providesTags `[{type:'QuoteRequest',id}]`), `acceptQuote` (`POST quote-requests/${id}/accept`, invalidates `QuoteRequest`+`QuoteRequestList`), `cancelRequest` (`POST quote-requests/${id}/cancel`, invalidates both), `startRequestChat` (`POST quote-requests/${id}/chat`); export hooks incl. lazy/poll-friendly query.
- [ ] T005 [P] Modify `store/api/bookingsApi.ts` — add optional `originRequestId?: number` to `Booking` (provenance for accepted-quote bookings). No other change.
- [ ] T006 Register `quoteRequestsApi` in `store/index.ts` (depends T004) — reducer map + middleware, matching the existing slice pattern.
- [ ] T007 [P] Add `quoteRequests.*` keys to `lib/i18n/locales/en.json` per `contracts/…#i18n Key Set`.
- [ ] T008 [P] Add the mirrored Arabic keys to `lib/i18n/locales/ar.json`.

**Checkpoint**: `tsc --noEmit` passes; slice registered; i18n loaded. Build the MSW mock now.

---

## Phase 3: User Story 1 — Request Quotes & Receive Responses (Priority: P1) 🎯 MVP

**Goal**: Compose a request (category + description + photo), broadcast, and watch quotes arrive.

**Independent Test**: Create a request in a category with ≥ 2 mock centers; responses appear with price/rating/distance and the customer is notified.

- [ ] T009 [P] [US1] Create `components/quotes/RequestComposer.tsx` — category picker (required; reuse the `006` category source), description field, attachment picker (`expo-image-picker`, type/size validation), optional service, area, fulfillment hint; submit disabled until category + description present.
- [ ] T010 [US1] Create `app/(app)/quote-requests/_layout.tsx` (Stack) + `app/(app)/quote-requests/new.tsx` — host `RequestComposer`; on submit call `createQuoteRequest` → navigate to `[id]`; show `reachCount` ("sent to N centers") and the `reachCount===0` widen offer (`research.md` R8).
- [ ] T011 [P] [US1] Create `components/quotes/QuoteResponseCard.tsx` — center name (bilingual), logo, rating, trust score, distance, price/range (shared KD formatter; single price when min==max), duration, inclusions, response time, optional message; "Ask a question" + "Accept" actions.
- [ ] T012 [US1] Create `app/(app)/quote-requests/[id].tsx` (responses) — `useGetQuoteRequestQuery(id)` with refetch-on-focus + light poll while `OPEN` (`research.md` R3); render request summary + attachments + a list of `QuoteResponseCard`; countdown to `expiresAt`; loading/empty ("no responses yet")/error states.
- [ ] T013 [US1] Add the **Get Quotes** entry on Home (`app/(app)/(tabs)/index.tsx`) and an alt CTA on `app/(app)/(tabs)/centers/[id]/book/category.tsx` ("Get quotes from multiple centers") → both route to `/(app)/quote-requests/new`.

**Checkpoint US1**: Compose → broadcast → responses arrive and render. Core marketplace loop demoable.

---

## Phase 4: User Story 2 — Compare Quotes & Accept One (Priority: P1)

**Goal**: Sort/compare responses and accept one → a confirmed booking is created; the request closes.

**Independent Test**: With ≥ 2 quotes, sort by price, accept one → booking created (carries `originRequestId`), request `ACCEPTED`, other quotes not-selected.

- [ ] T014 [P] [US2] Create `lib/quoteSort.ts` (pure) — `sortResponses(responses, key: RequestSortKey)`: PRICE→priceMin asc, RATING→rating desc, DISTANCE→distance asc, SOONEST→respondedAt asc; excludes WITHDRAWN/NOT_SELECTED.
- [ ] T015 [US2] Extend `app/(app)/quote-requests/[id].tsx` — sort control (RequestSortKey) using `sortResponses`; a compare affordance (side-by-side price/duration/inclusions/rating/trust); **Accept** → `acceptQuote({ id, quoteId })` → on success navigate to `acceptedBookingId`; handle 409 (quote withdrawn / center inactive) by refetching + removing the quote.
- [ ] T016 [test] [US2] `__tests__/quoteSort.test.ts` — verify each sort key order and that withdrawn/not-selected are excluded.

**Checkpoint US2**: Compare + accept converts the marketplace into a booking. US1+US2 = both P1 stories.

---

## Phase 5: User Story 3 — Clarify via Chat Before Accepting (Priority: P2)

**Goal**: Ask a responding center a question in a request-scoped chat, then accept.

**Independent Test**: Open chat from a quote → conversation created → exchange messages → accept.

- [ ] T017 [US3] Wire "Ask a question" on `QuoteResponseCard` → `startRequestChat({ id, centerId })` → open the existing chat thread (`chatApi.getMessages(conversationId)` / `sendMessage`). After accept the thread continues under the booking; after expiry it opens read-only (`research.md` R6).

**Checkpoint US3**: Pre-accept clarification works through the existing chat stack.

---

## Phase 6: User Story 4 — Expiry & Cancellation (Priority: P3)

**Goal**: Requests expire after the window or are cancelled; responding centers are informed.

**Independent Test**: An OPEN request hits its window → EXPIRED with widen/book-directly offer; cancel → CANCELLED.

- [ ] T018 [US4] Handle terminal states on `[id].tsx` + the "my requests" list: EXPIRED → widen / book-directly offer; **Cancel** action on OPEN → `cancelRequest(id)` → CANCELLED; stop polling on any terminal state; reflect notification events (new quote / expiring / expired) via refetch.

**Checkpoint US4**: Lifecycle hygiene complete; no stale/dead-end requests.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T019 [P] RTL spot-check (Arabic): composer fields, response cards (price/rating placement), compare, countdown, empty states.
- [ ] T020 [P] Accessibility: composer inputs labeled; Accept/Ask/Cancel buttons have roles + localized labels; touch targets ≥ 44pt.
- [ ] T021 [P] Offline & error states: composer preserves input on error; responses show cached + retry; never blank/crash.
- [ ] T022 End-to-end smoke (mock or live + center `024`): compose→broadcast→responses→compare→accept→booking; chat clarify; no-matches; expiry; cancel. Confirm prices via the shared KD formatter and `originRequestId` set on the created booking.

**Checkpoint Final**: All four stories pass independent tests; RTL + a11y + offline verified.

---

## Dependencies & Execution Order

- **Phase 1 Setup**: immediate.
- **Phase 2 Foundation**: T003, T004, T005, T007, T008 parallel; **T006 after T004**. BLOCKS US phases.
- **US1**: T009, T011 parallel → T010, T012 → T013.
- **US2**: T014 (pure) parallel; **T015 after T012**; T016 alongside T014.
- **US3**: after US1 (extends `QuoteResponseCard` + `[id].tsx`).
- **US4**: after US1 (extends `[id].tsx` + list).
- **Polish**: after US phases; T019–T021 parallel.

### Parallel opportunities

| Group | Tasks |
|-------|-------|
| Foundation | T003, T004, T005, T007, T008 |
| US1 components | T009, T011 |
| US2 helper/test | T014, T016 |
| Polish | T019, T020, T021 |

---

## Implementation Strategy

### MVP first (US1 + US2 — both P1)
Setup → Foundation (MSW mock) → US1 (compose + responses) → US2 (compare + accept) → **validate** the
full request→responses→accept→booking loop with center `024` (or mock) → ship.

### Incremental delivery
Foundation → US1 → US2 → US3 (chat) → US4 (lifecycle) → Polish. Each US is a deployable increment.

### Backend coordination
| Task group | Backend needed? |
|------------|-----------------|
| T001–T008 (Setup + Foundation) | No — mockable |
| US1–US4 screens | Mock sufficient to build/test; live needs the `quoterequest` package + matching/expiry |
| T022 (e2e) | Stub or live + center `024` |

---

## Notes

- **Shared `quoterequest` domain** with center `024` — one request, sealed responses; do not fork the model.
- **Matching + accept are server-side** (`research.md` R2/R4): the client sends intent and a `quoteId`, never computes matches or creates the booking itself.
- **Sealed responses**: the customer sees all quotes; cross-center data never reaches the center side (that boundary lives in `024`).
- **Reuse**: chat via `chatApi`, attachments via `expo-image-picker`, category source from `006`, KD via the shared formatter.
- **Wallet-style placement**: quote-request screens live at `app/(app)/quote-requests/` (top-level stack), not a new bottom tab.
- Accepted-quote bookings flow into the normal booking/payment (`007`) pipeline and may use any fulfillment mode (`008`); they carry `originRequestId`.
