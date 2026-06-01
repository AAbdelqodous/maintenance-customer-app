# Tasks: In-App Payments, Wallet & Escrow Protection

**Input**: Design documents from `specs/007-payments-wallet-escrow/`
**Branch**: `007-payments-wallet-escrow`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Data model**: [data-model.md](./data-model.md) | **Contracts**: [payments-api.md](./contracts/payments-api.md), [wallet-api.md](./contracts/wallet-api.md)

**Organization**: Tasks grouped by user story. Phase 2 (Foundation) MUST complete before any US phase begins.
**Tests**: Targeted tests **are** included — `plan.md` Task Ordering #8 and **SC-002 (zero double-charges)** require the `lib/money.ts` formatting and the reconciliation/idempotency logic to be verified. No broad UI test suite is generated.
**Backend note**: Tasks T001–T021 (Foundation + US1 UI) can be built and exercised against an **MSW mock** of the contracts before the backend `payment`/`wallet` packages ship (see `quickstart.md`). Real-payment testing additionally requires `003-phase-3-production` (HTTPS/WSS + dev/preview build — the WebView is not available in stock Expo Go).

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — different files, no incomplete dependencies
- **[US#]**: User story this task belongs to
- **[test]**: A test task

---

## Phase 1: Setup

**Purpose**: Install the one new dependency, create new directories, and register the deep-link scheme.

- [ ] T001 Install packages (per `research.md` R9 / `quickstart.md`): run `npx expo install react-native-webview expo-web-browser`. If `expo-crypto` is **not** already a dependency, also `npx expo install expo-crypto` (used for `randomUUID()` idempotency keys). Do **not** add any card/PCI SDK.
- [ ] T002 [P] Create new directories: `components/payments/`, `app/(app)/wallet/` (top-level app stack — **not** under `(tabs)/`, to avoid registering an unintended 6th bottom tab; this refines the plan's path for correctness — see Notes).
- [ ] T003 [P] Add the deep-link scheme to `app.json`: under `expo`, set `"scheme": "mcc"` (enables `mcc://payment-return` for gateway returns that leave the WebView — `research.md` R4). Leave iOS `associatedDomains` / Android `intentFilters` for the production spec.

**Checkpoint**: `react-native-webview` resolves, new directories exist, `app.json` has the scheme.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Money util, the two RTK Query slices, the `Booking` payment-field widening, store registration, i18n keys, and the shared payment components. Every user story depends on these.

**⚠️ CRITICAL**: No user story implementation can begin until T004–T015 are complete.

- [ ] T004 [P] Create `lib/money.ts` exactly per `plan.md`:
  - `export function formatKD(amount: number, locale: 'ar' | 'en'): string` — formats with `minimumFractionDigits: 3, maximumFractionDigits: 3` via `toLocaleString('ar-KW' | 'en-KW')`; returns `` `${value} د.ك` `` for `ar`, `` `KD ${value}` `` for `en`.
  - `export function sumLinesFils(amounts: number[]): number` — `amounts.reduce((acc,a)=>acc+Math.round(a*1000),0)/1000` (fils-safe sum for the FR-002 reconcile check only).
  - No other exports; pure functions (no React).

- [ ] T005 [P] Create `store/api/paymentsApi.ts` per `data-model.md` + `contracts/payments-api.md`:
  - Enums: `PaymentStatus` (`PENDING | HELD | RELEASED | PAID | REFUNDED | FAILED`), `PaymentMethod` (`KNET | CARD | APPLE_PAY | GOOGLE_PAY | WALLET`).
  - Interfaces: `InvoiceLine`, `BookingInvoice`, `InitiatePaymentRequest`, `InitiatePaymentResponse`, `SavedMethod` (exact fields per data-model).
  - `createApi({ reducerPath: 'paymentsApi', tagTypes: ['Invoice','SavedMethods'], baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, prepareHeaders … Bearer token from (getState() as RootState).auth.session?.token }) })` — same inline base-query pattern as every existing slice (`research`-style consistency; no shared helper).
  - Endpoints: `getBookingInvoice` (query, `bookings/${id}/invoice`, providesTags `[{type:'Invoice',id}]`), `initiatePayment` (mutation `POST payments`, invalidates `[{type:'Invoice',id:bookingId}]`), `getPaymentStatus` (query `payments/${paymentId}`), `releaseEscrow` (mutation `POST bookings/${id}/release`, invalidates Invoice), `raiseProblem` (mutation `POST bookings/${id}/dispute`, invalidates Invoice), `getSavedMethods` (query `payments/methods`, providesTags `['SavedMethods']`), `deleteSavedMethod` (mutation `DELETE payments/methods/${id}`, invalidates `['SavedMethods']`).
  - Export hooks incl. **`useLazyGetPaymentStatusQuery`** (for polling).

- [ ] T006 [P] Create `store/api/walletApi.ts` per `data-model.md` + `contracts/wallet-api.md`:
  - Interfaces: `Wallet`, `WalletTransaction`, `TopUpRequest`.
  - `createApi({ reducerPath: 'walletApi', tagTypes: ['Wallet','WalletTx'], baseQuery … })` (same Bearer pattern).
  - Endpoints: `getWallet` (`wallet`, providesTags `['Wallet']`), `getWalletTransactions` (`wallet/transactions`, providesTags `['WalletTx']`), `topUp` (`POST wallet/topup`, invalidates `['Wallet','WalletTx']`).
  - Export hooks.

- [ ] T007 [P] Modify `store/api/bookingsApi.ts` — consolidate payment enums and widen `Booking` (per `data-model.md` "Modified type"):
  - Import `PaymentStatus`, `PaymentMethod` from `./paymentsApi` (the single source of truth). **Remove** any local `PaymentMethod`/`PaymentStatus` definition in `bookingsApi.ts`.
  - On `Booking`: ensure `paymentStatus: PaymentStatus` (full enum) and ADD `paidAmount?: number`.
  - Transition mapping: if legacy rows/requests use `CREDIT_CARD`/`CASH`, keep a compatibility note/mapping where `BookingRequest.paymentMethod` is built — do **not** break existing booking creation. (See Notes.)
  - `npx tsc --noEmit` must pass after this consolidation (fix any now-dangling enum references in screens that imported from `bookingsApi`).

- [ ] T008 Register both slices in `store/index.ts` (depends on T005, T006):
  - Imports: `import { paymentsApi } from './api/paymentsApi';` and `import { walletApi } from './api/walletApi';`
  - `reducer` map: `[paymentsApi.reducerPath]: paymentsApi.reducer,` and `[walletApi.reducerPath]: walletApi.reducer,`
  - `middleware` chain: `paymentsApi.middleware,` and `walletApi.middleware,`

- [ ] T009 [P] Add i18n keys to `lib/i18n/locales/en.json` under new `"payments"` and `"wallet"` top-level keys exactly as listed in `plan.md` (status labels, method labels, release/dispute, result strings, receipt, mismatch; wallet title/balance/topUp/amount/tx/savedMethods/remove/empty). Do not remove existing keys.

- [ ] T010 [P] Add the mirrored Arabic keys to `lib/i18n/locales/ar.json` (same key paths; KD suffix is produced by `formatKD`, so amount strings are not duplicated here).

- [ ] T011 [P] Create `components/payments/InvoiceLines.tsx` — props `{ lines: InvoiceLine[]; total: number }`. Renders each line bilingually (`isRTL ? labelAr : labelEn`) with `formatKD(amount, locale)`; negative amounts (discount/loyalty) styled as credits; a divider; then a bold **Total** row `formatKD(total, locale)`. Pure presentational (no fetching).

- [ ] T012 [P] Create `components/payments/MethodPicker.tsx` — props `{ available: PaymentMethod[]; saved: SavedMethod[]; selected; onSelect; }`. Renders only methods present in `available` (so Apple/Google Pay appear **only** when the gateway flags them — `research.md` R5); lists `saved` cards by `maskedLabel` + brand; selectable rows with an accessible label. No raw card input anywhere.

- [ ] T013 [P] Create `components/payments/PaymentStatusBadge.tsx` — props `{ status: PaymentStatus }`. Renders a colored chip using the `payments.status.*` i18n key (pending/held/released/paid/refunded/failed). Pure presentational.

- [ ] T014 [P] [test] Create `__tests__/money.test.ts` — unit tests for `lib/money.ts`: `formatKD(12.5,'en') === 'KD 12.500'`; `formatKD(12.5,'ar')` ends with `' د.ك'` and shows 3 decimals; `sumLinesFils([18.0,12.5,5.0,-2.0]) === 33.5` exactly (no float drift); `sumLinesFils` of a deliberately off set ≠ a wrong total (guards the FR-002 reconcile check).

- [ ] T015 Verify foundation: `npx tsc --noEmit` passes; both slices appear in the store; `__tests__/money.test.ts` is green; i18n keys load in both locales.

**Checkpoint**: Foundation ready — types compile, slices registered, money util tested, components + i18n in place. Build the MSW mock now (per `quickstart.md`) so US phases can run without the backend.

---

## Phase 3: User Story 1 — Pay an Approved Quote, Held in Escrow (Priority: P1) 🎯 MVP

**Goal**: A customer with an APPROVED quote opens the booking, reviews the itemized invoice, pays via an external method (KNET/card/Apple/Google Pay), and returns to see the payment **Held (in escrow)**. Status is reconciled from the backend, never the WebView.

**Independent Test**: With the MSW mock returning a PENDING `BookingInvoice` and `POST /payments` returning a `checkoutUrl`, then `GET /payments/{id}` returning `PENDING` then `HELD`: tap **Pay** → complete the gateway test page → the result screen polls and shows **Secured (in escrow)**; the booking detail shows `HELD`.

> Wallet toggle and saved-card selection are intentionally **deferred to US3/US4** so US1 is a clean external-payment MVP.

- [ ] T016 [P] [US1] Create `app/(app)/(tabs)/bookings/pay.tsx` (external-method MVP):
  - Params `{ bookingId }` via `useLocalSearchParams`.
  - Hooks: `useGetBookingInvoiceQuery(Number(bookingId))`, `useGetSavedMethodsQuery()` (display only in US4), `useInitiatePaymentMutation()`, `useTranslation()`, `useRouter()`.
  - Generate `idempotencyKey` **once** with `useRef(Crypto.randomUUID())` on mount (reused across retries — `data-model.md` Validation; `research.md` R3).
  - Render loading / error+retry / loaded.
  - On loaded: `<InvoiceLines lines={invoice.lines} total={invoice.total} />`; verify `sumLinesFils(lines.map(l=>l.amount)) === invoice.total` else show `payments.mismatch` + Refresh and **disable Pay** (FR-002).
  - `<MethodPicker available={invoice.availableMethods} saved={[]} … />` (external methods for US1).
  - **Pay Now** → `initiatePayment({ bookingId, method, useWalletBalance:false, idempotencyKey })`:
    - if `response.checkoutUrl` → `router.push({ pathname:'/(app)/(tabs)/bookings/payment-webview', params:{ url:checkoutUrl, returnUrlPrefix, paymentId:String(paymentId), bookingId } })`
    - else (already HELD/PAID) → `router.replace({ pathname:'/(app)/(tabs)/bookings/payment-result', params:{ paymentId:String(paymentId), bookingId } })`
  - Offline (via `useNetworkStatus`): disable Pay with a banner, do not crash (Constitution V).

- [ ] T017 [P] [US1] Create `app/(app)/(tabs)/bookings/payment-webview.tsx`:
  - Params `{ url, returnUrlPrefix, paymentId, bookingId }`.
  - **Native**: `<WebView source={{ uri: url }} onNavigationStateChange={(nav)=>{ if (nav.url.startsWith(returnUrlPrefix)) router.replace({ pathname:'/(app)/(tabs)/bookings/payment-result', params:{ paymentId, bookingId } }); }} />` + a header **Cancel** that also routes to `payment-result` (it still reconciles — never assumes cancelled).
  - **Web** (`Platform.OS === 'web'`): do not render a WebView; instead call `WebBrowser.openAuthSessionAsync(url, returnUrlPrefix)` then route to `payment-result`.
  - MUST NOT read success/failure from the WebView body (`research.md` R3).

- [ ] T018 [US1] Create `app/(app)/(tabs)/bookings/payment-result.tsx` — the reconciliation screen (depends on T005):
  - Params `{ paymentId, bookingId }`; hook `useLazyGetPaymentStatusQuery()`.
  - Poll every ~2s up to ~30 attempts; **stop** on `HELD/PAID/RELEASED/FAILED/REFUNDED`.
  - Render: `HELD` → success "Payment secured in escrow" (`payments.result.securedTitle/Body`) + Back to booking; `PAID` → "Paid"; `FAILED` → `payments.result.failedTitle` + **Retry** (→ `pay.tsx`); still `PENDING` at timeout → `payments.result.processing` + Done.
  - On a terminal success/held, invalidate `Invoice` + `Booking` tags (so `[id].tsx` reflects it) and refetch `getWallet` (in case wallet was applied — relevant once US3 lands).
  - 404 from `getPaymentStatus` is treated as still-processing within the attempt budget (webhook may lag — `contracts/payments-api.md`).

- [ ] T019 [US1] Register the three routes in `app/(app)/(tabs)/bookings/_layout.tsx` — add `Stack.Screen` entries for `pay`, `payment-webview`, `payment-result` (titles from i18n; `payment-webview` and `payment-result` may use `headerBackVisible:false` to force the in-screen flow).

- [ ] T020 [US1] Modify `app/(app)/(tabs)/bookings/[id].tsx` — add the **Payment section** (Pay path only; release added in US2). Depends on T005, T013:
  - Hooks: `useGetBookingQuoteQuery(bookingId)` (already used) + `useGetBookingInvoiceQuery(bookingId)`.
  - When `quote?.status === QuoteStatus.APPROVED` (or booking completed) **and** `booking.paymentStatus === PaymentStatus.PENDING`: render a **Pay** button → `router.push({ pathname:'/(app)/(tabs)/bookings/pay', params:{ bookingId:String(booking.id) } })`.
  - For any non-PENDING status: render `<PaymentStatusBadge status={booking.paymentStatus} />` (US2 fills in the actions).
  - Keep all existing sections intact.

- [ ] T021 [test] [US1] Add `__tests__/payment-reconcile.test.tsx` (SC-002 / FR-011): with the mock, simulate (a) a `checkoutUrl` flow where `getPaymentStatus` returns `PENDING` twice then `HELD` → result shows secured; (b) a **re-invoked** `initiatePayment` with the **same** `idempotencyKey` returns the same `paymentId` (assert the request body carries the stable key and no second session is created); (c) a cancelled/failed return never renders success — only the polled status decides.

**Checkpoint US1**: A customer can pay an approved quote externally and land on `HELD`, reconciled from the backend. No double-charge across re-tap/interrupted flows. This is the shippable MVP.

---

## Phase 4: User Story 2 — Confirm Completion to Release Escrow (Priority: P1)

**Goal**: After the center marks work complete, the customer releases the held funds (or auto-release fires); a dissatisfied customer can report a problem instead, pausing auto-release.

**Independent Test**: From a `HELD` booking with mock `releaseEligible:false` → Release is disabled with a hint. Flip the mock to `releaseEligible:true` → Release enabled → tap → status becomes `RELEASED/PAID` and a receipt link appears. Separately, "Report a problem" sets a dispute and keeps the funds held.

- [ ] T022 [US2] Extend the Payment section in `app/(app)/(tabs)/bookings/[id].tsx` (depends on T020):
  - When `booking.paymentStatus === HELD`:
    - `<PaymentStatusBadge status={HELD} />`
    - **Confirm & Release** button — enabled only when `invoice.releaseEligible === true`; otherwise disabled with hint `payments.releaseHint`. onPress → `releaseEscrow(booking.id)` (mutation) → toast + refetch invoice/booking.
    - **Report a problem** — prompt for a reason (Alert on native / `window.prompt` or a small modal on web) → `raiseProblem({ bookingId, reason })`.
    - If `invoice.autoReleaseAt` present, show `payments.autoRelease` with the formatted date (countdown text).
  - When `RELEASED`/`PAID`: badge + **View receipt** (`payments.receipt`) opening `invoice.receiptUrl` (via `Linking`/`WebBrowser`).
  - When `REFUNDED`: badge + refunded `paidAmount` via `formatKD`.
  - When `FAILED`: badge + **Retry** → `pay.tsx`.

**Checkpoint US2**: The full escrow lifecycle is operable from the booking detail — Pay → Held → (center completes) → Release/Dispute → Released/Paid → receipt. US1 + US2 together satisfy the spec's two P1 stories.

---

## Phase 5: User Story 3 — Wallet Top-Up, Refunds & Combined Payment (Priority: P2)

**Goal**: A customer tops up the wallet, sees refunds credited, views history, and pays using wallet balance plus an external method (wallet first, remainder external).

**Independent Test**: Top up KD 10 via the mock → balance shows `10.000` + a TOPUP row. On a KD 15 invoice, enable **Use wallet balance** → remainder shows `5.000` → pay the remainder via KNET. A mock REFUND row increases the balance.

- [ ] T023 [P] [US3] Create `components/payments/WalletBalanceCard.tsx` — props `{ balance: number }` (+ optional Top-Up CTA). Renders `formatKD(balance, locale)` and a Top-Up button.

- [ ] T024 [P] [US3] Create `app/(app)/wallet/_layout.tsx` — a `Stack` for the wallet routes (index + topup); titles from i18n.

- [ ] T025 [US3] Create `app/(app)/wallet/index.tsx` — `useGetWalletQuery()` + `useGetWalletTransactionsQuery()`; render `<WalletBalanceCard>` + a **virtualized** `FlatList` of `WalletTransaction` (signed amounts via `formatKD`; bilingual `descriptionAr/En`; `wallet.empty` when none). Top-Up CTA → `router.push('/(app)/wallet/topup')`.

- [ ] T026 [US3] Create `app/(app)/wallet/topup.tsx` — amount input (KD) + `MethodPicker` (external only) + `idempotencyKey` via `useRef(Crypto.randomUUID())`; **Top Up** → `topUp({ amount, method, idempotencyKey })` → reuse the `payment-webview` → `payment-result` flow (same `checkoutUrl` contract). On success the `Wallet`/`WalletTx` tags invalidate and the balance refreshes.

- [ ] T027 [US3] Add wallet entry point: a row/link in `app/(app)/(tabs)/profile/index.tsx` (and/or a `WalletBalanceCard` on the home dashboard) navigating to `/(app)/wallet`. Add the i18n label.

- [ ] T028 [US3] Extend `app/(app)/(tabs)/bookings/pay.tsx` with the wallet split (depends on T016, T006 — `research.md` R6):
  - `useGetWalletQuery()`; when `invoice.walletApplicable`, show a **Use wallet balance** toggle + a computed **remainder** (display only, via `formatKD`).
  - When toggled, send `useWalletBalance: true` on `initiatePayment`. If the wallet covers the full amount, the response has **no `checkoutUrl`** → `router.replace('payment-result', …)` directly (skip the WebView).
  - When remainder > 0, a method must be selected for the remainder; otherwise block Pay with a prompt (FR-008 / US3 #4).

**Checkpoint US3**: Wallet view, top-up, refund visibility, and wallet+external split payments all work; wallet-only payments complete without a gateway round trip.

---

## Phase 6: User Story 4 — Save and Reuse a Card (Priority: P3)

**Goal**: A customer saves a card on payment and reuses it (one-tap) next time; can remove it later.

**Independent Test**: Pay with a card + "Save this card" checked → the mock returns it under `GET /payments/methods` → on the next payment the masked card is selectable. Removing it calls `DELETE /payments/methods/{id}` and it disappears.

- [ ] T029 [P] [US4] Create `app/(app)/settings/payment-methods.tsx` — `useGetSavedMethodsQuery()` → list `maskedLabel` + brand + `expiry`; **Remove** with confirm (`Alert` native / `window.confirm` web) → `useDeleteSavedMethodMutation()`. Add a link to this screen from settings/profile + i18n label.

- [ ] T030 [US4] Extend `app/(app)/(tabs)/bookings/pay.tsx` (depends on T016): pass real `saved={savedMethods}` into `MethodPicker`; add a **"Save this card"** checkbox shown only when `method === CARD` → send `saveCard: true`; allow selecting a `savedMethodId` (sends it instead of a fresh method). Never display anything beyond `maskedLabel` (FR-010).

**Checkpoint US4**: Saved cards selectable for one-tap payment and removable; no PAN ever shown or stored.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: RTL, accessibility, offline, web-target checkout, and the end-to-end smoke + safety tests. After all US phases.

- [ ] T031 [P] RTL spot-check (Arabic locale): KD suffix placement (`١٢٫٥٠٠ د.ك`) in `InvoiceLines`, `WalletBalanceCard`, transaction rows; `MethodPicker` rows mirrored; `pay.tsx`, `payment-result.tsx`, `wallet/index.tsx`, booking payment section all mirror correctly. Fix issues before completing.
- [ ] T032 [P] Accessibility audit: Pay / Confirm & Release / Report a problem / Top Up buttons have `accessibilityRole="button"` + localized `accessibilityLabel`; method rows are individually labeled; touch targets ≥ 44pt; result-screen status is announced.
- [ ] T033 [P] Offline & error states: `pay.tsx`, `topup.tsx`, `wallet/index.tsx`, and the booking payment section all degrade gracefully (cached data / disabled actions / retry), never blank or crash (Constitution V).
- [ ] T034 [US3] Web target verification: confirm checkout on web uses `WebBrowser.openAuthSessionAsync` (not a WebView) and returns to `payment-result` which reconciles correctly.
- [ ] T035 [test] Interrupted-flow / no-double-charge end-to-end (SC-002): background/kill during the WebView step, reopen → `payment-result` reconciles from `GET /payments/{id}`; assert exactly one charge/session for the attempt's idempotency key.
- [ ] T036 End-to-end smoke test (mock or live backend), covering `quickstart.md` paths: (1) pay approved quote via KNET → HELD; (2) release once `releaseEligible` → RELEASED/PAID + receipt; (3) wallet-only payment → no WebView; (4) wallet + KNET split; (5) interrupted flow → no double charge; (6) top-up + refund visibility; (7) save + reuse + remove a card. Verify every amount renders via `formatKD` (no `toFixed(2)`/hardcoded `KD`), and no gateway payloads/tokens/card data appear in logs (Constitution VI).

**Checkpoint Final**: All four user stories pass their independent tests; RTL + a11y + offline verified; no-double-charge proven; no card data logged.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: start immediately.
- **Phase 2 (Foundation)**: depends on Phase 1 — **BLOCKS all US phases**. T004, T005, T006, T009, T010, T011, T012, T013, T014 are parallel; **T007 depends on T005**; **T008 depends on T005+T006**; T015 gates the phase.
- **Phase 3 (US1, P1)**: depends on Phase 2. T016 + T017 parallel; **T018 → T019 → T020**; T021 after T018/T020.
- **Phase 4 (US2, P1)**: depends on T020 (extends the same payment section). Logically follows US1.
- **Phase 5 (US3, P2)**: depends on Phase 2; T023–T027 largely independent of US1/US2; **T028 depends on T016**.
- **Phase 6 (US4, P3)**: depends on Phase 2; **T030 depends on T016**.
- **Phase 7 (Polish)**: after the US phases; T031–T034 parallel.

### User story independence

- **US1 (P1)** — the MVP. Buildable/testable alone against the mock.
- **US2 (P1)** — extends US1's payment section (shared file `[id].tsx`); sequence after US1.
- **US3 (P2)** — wallet area is independent screens; only the `pay.tsx` split toggle (T028) touches US1's file.
- **US4 (P3)** — saved-methods screen is independent; only T030 touches `pay.tsx`.

### Parallel opportunities

| Group | Tasks | Condition |
|-------|-------|-----------|
| Foundation batch A | T004, T005, T006, T009, T010, T011, T012, T013, T014 | after T001–T003 |
| Foundation batch B | T007 (after T005), T008 (after T005+T006) | — |
| US1 screens | T016, T017 | after Foundation |
| US3 components/screens | T023, T024, T025, T026 | after Foundation, parallel with US1/US2 |
| Polish | T031, T032, T033, T034 | after US phases |

---

## Implementation Strategy

### MVP first (US1 + US2 — both P1)

1. Phase 1 Setup → Phase 2 Foundation (build the MSW mock at the checkpoint).
2. US1 (T016–T021): pay → webview → result reconciliation → booking Pay CTA.
3. US2 (T022): release / dispute / receipt on the booking detail.
4. **STOP & VALIDATE**: smoke pay→held→release→paid; prove no double-charge (T021/T035).
5. Ship behind a feature flag until the backend `payment` package + gateway webhook are live and `003-phase-3-production` is done.

### Incremental delivery

Foundation → US1 → US2 (escrow complete) → US3 (wallet) → US4 (saved cards) → Polish. Each US is a deployable increment.

### Backend coordination

| Task group | Backend needed? |
|------------|-----------------|
| T001–T015 (Setup + Foundation) | No — pure client + mockable |
| T016–T021 (US1) | Mock (MSW) sufficient to build/test; real gateway for live runs |
| T022 (US2) | Mock sufficient; live needs release endpoint + center "mark complete" |
| T023–T028 (US3) | Mock sufficient; live needs `wallet/*` + top-up |
| T029–T030 (US4) | Mock sufficient; live needs tokenization + `payments/methods` |
| T035–T036 (safety + e2e) | Live or fully-mocked backend incl. the gateway webhook |

---

## Notes

- **No double-charge is the headline guarantee (SC-002/FR-011)**: the idempotency key is generated **once per attempt** and reused on retries; `payment-result` trusts only the polled backend status, never the WebView outcome. T021 and T035 exist specifically to prove this.
- **No PAN, ever (FR-010)**: gateway-hosted checkout means no card fields in the app; the client only ever sees `SavedMethod.maskedLabel`. Do not log gateway payloads or tokens.
- **KD everywhere**: every amount renders through `formatKD` (3 decimals, locale-aware); totals come from the backend invoice — the client only verifies `sumLinesFils(lines) === total` (T011/T014).
- **Enum consolidation (T007)**: `PaymentStatus`/`PaymentMethod` live in `paymentsApi.ts`; `bookingsApi.ts` imports them. Watch for screens that imported a payment enum from `bookingsApi` and update those imports so `tsc` stays clean.
- **Wallet path deviation**: wallet screens live at `app/(app)/wallet/` (top-level app stack), not `(tabs)/wallet/`, to avoid Expo Router registering an unintended 6th bottom tab. `pay/payment-webview/payment-result` stay under `bookings/` (registered in that stack, not as tabs).
- **Apple/Google Pay** render only when `invoice.availableMethods` includes them (gateway/device capability) — no native pay sheets in v1 (`research.md` R5).
- **Gate real payments** behind `003-phase-3-production` (HTTPS/WSS, EAS dev/preview build). `react-native-webview` is not available in stock Expo Go.
