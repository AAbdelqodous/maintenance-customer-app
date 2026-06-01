# Tasks: Pickup & Delivery and At-Home Mobile Service

**Input**: Design documents from `specs/008-pickup-and-mobile-service/`
**Branch**: `008-pickup-and-mobile-service`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Data model**: [data-model.md](./data-model.md) | **Contracts**: [fulfillment-api.md](./contracts/fulfillment-api.md)

**Organization**: Tasks grouped by user story (US1–US3). Phase 2 (Foundation) MUST complete before any US phase.
**Tests**: One targeted test — the fee-display + window-validation helpers (pure). No broad UI suite (none requested).
**Backend note**: T001–T016 build against an **MSW mock** of the contracts. The center **capability** (supported modes/area/fees) is authored center-side (separate dependency); until then the mock supplies it.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no incomplete dependency)
- **[US#]**: User story

---

## Phase 1: Setup

- [ ] T001 Install packages: `npx expo install expo-location react-native-maps` (R5). `react-native-maps` requires a dev/preview build + Android Maps key (production spec); web uses the manual fallback.
- [ ] T002 [P] Create directories `app/(app)/addresses/` and `components/fulfillment/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No US phase begins until T003–T009 are complete.

- [ ] T003 [P] Create `types/fulfillment.ts` — `FulfillmentMode`, `LogisticsState`, `FeeRuleType`, `FeeRule`, `CenterFulfillmentCapability`, `ServiceAddress`, `PickupWindow`, `LogisticsStatus`; copy verbatim from `data-model.md`.
- [ ] T004 [P] Create `store/api/fulfillmentApi.ts` — `createApi({ reducerPath:'fulfillmentApi', tagTypes:['Capability','Logistics'], baseQuery: inline fetchBaseQuery + Bearer })`; endpoints `getCenterFulfillment` (`centers/${centerId}/fulfillment?serviceId=`, providesTags `Capability`), `getBookingLogistics` (`bookings/${id}/logistics`, providesTags `[{type:'Logistics',id}]`), `reChooseFulfillment` (`POST bookings/${id}/fulfillment/re-choose`, invalidates `Logistics`); export hooks.
- [ ] T005 [P] Create `store/api/addressesApi.ts` — `createApi({ reducerPath:'addressesApi', tagTypes:['Address'], … })`; endpoints `getAddresses` (`me/addresses`), `createAddress`/`updateAddress`/`deleteAddress` (invalidate `Address`); export hooks.
- [ ] T006 [P] Modify `store/api/bookingsApi.ts` — add `fulfillmentMode`, `serviceAddressId?`, `serviceAddress?`, `pickupWindow?` to `CreateBookingRequest`; add `fulfillmentMode`, `serviceAddress?`, `pickupWindow?`, `fulfillmentFee?`, `logistics?` to `Booking` (per `data-model.md`). Default mode `DROP_OFF`.
- [ ] T007 Register `fulfillmentApi` + `addressesApi` in `store/index.ts` (depends T004, T005) — reducer map + middleware.
- [ ] T008 [P] Add `fulfillment.*` keys to `lib/i18n/locales/en.json` per `contracts/…#i18n Key Set`.
- [ ] T009 [P] Add the mirrored Arabic keys to `lib/i18n/locales/ar.json`.

**Checkpoint**: `tsc --noEmit` passes; slices registered; i18n loaded. Build the MSW capability/logistics mock.

---

## Phase 3: User Story 1 — Book an At-Home Appliance Repair (Priority: P1) 🎯 MVP

**Goal**: Choose At-Home, pin/select an address + arrival window, see the fee before continuing, and book.

**Independent Test**: For a center supporting At-Home, complete the flow with a pinned address → booking carries `fulfillmentMode: AT_HOME`, the address, window, and the displayed fee.

- [ ] T010 [P] [US1] Create `components/fulfillment/AddressPicker.tsx` — pick a saved address (`getAddresses`), "use current location" (`expo-location` + reverse geocode), interactive pin (`react-native-maps` native; web/denied → area select + manual + optional lat/lng — R5), free-form note. Requests location **only here** (VI).
- [ ] T011 [P] [US1] Create `components/fulfillment/FulfillmentModePicker.tsx` — render only `capability.supportedModes`; per mode show the fee from `feeByMode` via the shared KD formatter (`fee.shownBefore` — FR-003); hide modes clearly outside `serviceAreaGovernorates` for the chosen area (R7).
- [ ] T012 [P] [US1] Create `lib/fulfillmentFee.ts` (pure) — `computeDisplayFee(rule: FeeRule, distanceKm?: number): number` (FLAT → flatAmount; PER_KM → base + perKm×distance; missing distance → base/flat, never an unshown amount) + `validateWindow(window, centerHours): error|null` (not past, within hours — R6).
- [ ] T013 [US1] Modify `app/(app)/(tabs)/bookings/new.tsx` — insert a **fulfillment step** after service selection: call `getCenterFulfillment({centerId, serviceId})`; render `FulfillmentModePicker`; for non-drop-off show `AddressPicker` + a pickup/arrival window (validated via `validateWindow`); block continue until address+window present and the fee is shown; pass `fulfillmentMode`/address/window into the confirm + `createBooking` payload. Drop-off keeps today's behavior (no address/window, fee 0).
- [ ] T014 [test] [US1] `__tests__/fulfillmentFee.test.ts` — FLAT vs PER_KM fee computation (incl. missing-distance fallback) and `validateWindow` (past / outside-hours / valid).

**Checkpoint US1**: At-home booking with address + window + shown fee works end-to-end. MVP.

---

## Phase 4: User Story 2 — Book Pickup & Delivery for a Car (Priority: P1)

**Goal**: Choose Pickup & Delivery, set pickup address/window, see the round-trip fee, then track logistics on the booking detail.

**Independent Test**: Book a car service with Pickup & Delivery → both legs render as discrete states on the detail; each center-driven change pushes a notification.

- [ ] T015 [P] [US2] Create `components/fulfillment/LogisticsTimeline.tsx` — given a `LogisticsStatus`, render the ordered states for the mode (Pickup&Delivery six legs / At-Home five), highlight `currentState`, show `etaText`; display-only (R3).
- [ ] T016 [US2] Modify `app/(app)/(tabs)/bookings/[id].tsx` — for non-drop-off bookings, fetch `getBookingLogistics(id)` (refetch on focus + push) and render `LogisticsTimeline`; show the fulfillment mode, address, window, and fee on the detail. (Pickup & Delivery selection itself reuses the same step from T013.)

**Checkpoint US2**: Pickup & Delivery selectable; both logistics legs tracked on the detail. US1+US2 = both P1 stories.

---

## Phase 5: User Story 3 — Center Declines an Out-of-Area Request (Priority: P2)

**Goal**: A center declines a requested mode; the customer re-chooses drop-off or cancels without penalty.

**Independent Test**: Mock `logistics.declined:true` → booking paused → switch to Drop-off (if supported) or cancel.

- [ ] T017 [US3] Extend `app/(app)/(tabs)/bookings/[id].tsx` — when `logistics.declined`, surface the reason + actions: **Switch to Drop-off** (if supported) / **Cancel** → `reChooseFulfillment({ id, fulfillmentMode })` or `{ cancel:true }`; reflect the updated booking. Also ensure the picker (T011) hides clearly out-of-area modes up front to minimize declines (R7).

**Checkpoint US3**: No dead-end bookings; declines handled gracefully.

---

## Phase 6: Saved Addresses Management

- [ ] T018 [P] Create `app/(app)/addresses/_layout.tsx` (Stack) + `app/(app)/addresses/index.tsx` — list saved addresses (`getAddresses`), add/edit/delete (label Home/Work/Other, governorate/area, pin, note); reachable from `AddressPicker` ("manage addresses") and Profile.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T019 [P] RTL spot-check (Arabic): mode picker (fee placement), address picker, window picker, logistics timeline.
- [ ] T020 [P] Accessibility: mode options + Continue/Switch/Cancel buttons labeled; map has a manual-entry alternative; touch targets ≥ 44pt.
- [ ] T021 [P] Offline & permission states: capability fetch failure → default to Drop-off + retry; location denied → manual entry; logistics shows cached + retry; never blank/crash.
- [ ] T022 [US2] Web target verification: the map degrades to area select + manual address + optional lat/lng; booking completes on web without `react-native-maps`.
- [ ] T023 End-to-end smoke (mock or live): at-home book (fee shown) → pickup&delivery book → logistics advances + notifies → out-of-area hidden → decline → re-choose → drop-off unchanged → saved addresses reused. Confirm the fee renders via the shared KD formatter and lands as an invoice line (`007`).

**Checkpoint Final**: All three stories pass; RTL + a11y + offline + web verified; no coordinates logged.

---

## Dependencies & Execution Order

- **Phase 1 Setup**: immediate.
- **Phase 2 Foundation**: T003, T004, T005, T006, T008, T009 parallel; **T007 after T004+T005**. BLOCKS US phases.
- **US1**: T010, T011, T012 parallel → **T013 (after T010–T012)**; T014 alongside T012.
- **US2**: T015 (parallel) → **T016 (after T013 + T015)**.
- **US3**: after US2 (extends `[id].tsx`).
- **Addresses**: T018 after T005 (parallel with US1/US2).
- **Polish**: after US phases; T019–T022 parallel.

### Parallel opportunities

| Group | Tasks |
|-------|-------|
| Foundation | T003, T004, T005, T006, T008, T009 |
| US1 components/helper | T010, T011, T012, T014 |
| US2 component | T015 |
| Polish | T019, T020, T021, T022 |

---

## Implementation Strategy

### MVP first (US1 + US2 — both P1)
Setup → Foundation (MSW mock) → US1 (at-home + address + fee in the step) → US2 (pickup&delivery +
logistics timeline) → **validate** at-home + pickup bookings with shown fees and tracked legs → ship.

### Incremental delivery
Foundation → US1 → US2 → US3 (decline) → Addresses → Polish.

### Backend coordination
| Task group | Backend needed? |
|------------|-----------------|
| T001–T009 (Setup + Foundation) | No — mockable |
| US1–US3 screens | Mock sufficient; live needs the capability + logistics + center authoring |
| T023 (e2e) | Stub or live |

---

## Notes

- **Capability-driven** (R1): the client offers only `supportedModes`; center authoring of modes/area/fees is a separate center-side dependency.
- **Never an unshown fee** (FR-003/R2): the fee is displayed before confirming the mode and lands as a `FULFILLMENT_FEE` invoice line (`007`); KD via the shared formatter.
- **Logistics is display-only** (R3): the client renders states + ETA and refetches; it never advances a leg.
- **Location only at the address step** (R5/VI); denial → manual entry; coordinates never logged. `react-native-maps` needs a dev build; web uses the manual fallback.
- **Window ≠ appointment slot** (R6): pickup/arrival window is separate, validated against center hours and not in the past.
- **Out-of-area hidden up front; decline as fallback** (R7) — minimize dead-end bookings.
- Accepted/booked fulfillment flows into the normal booking + payment (`007`) pipeline.
