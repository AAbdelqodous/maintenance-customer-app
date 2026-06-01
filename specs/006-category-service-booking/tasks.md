# Tasks: Category → Service Booking Flow

**Input**: Design documents from `specs/006-category-service-booking/`  
**Branch**: `006-category-service-booking`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/api-contracts.md](./contracts/api-contracts.md)

**Organization**: Tasks grouped by user story. Phase 2 (Foundation) MUST complete before any US phase begins.  
**Tests**: Not requested — no test tasks generated.  
**Backend note**: Tasks T001–T009 can be implemented and tested with mock data before the backend Phase 3.6 is deployed. T010–T013 benefit from real endpoints but can be stubbed earlier.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — different files, no incomplete dependencies
- **[US#]**: User story this task belongs to

---

## Phase 1: Setup

**Purpose**: Create the new directory for the CategorySelectScreen. No other project structure changes needed.

- [x] T001 Create directory `app/(app)/(tabs)/centers/[id]/book/` in the repository (Expo Router will treat `[id]/book/category.tsx` as the route `/centers/{id}/book/category`; the directory itself needs to exist before the file is created)

**Checkpoint**: Directory exists at `app/(app)/(tabs)/centers/[id]/book/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, API slice, store registration, and i18n keys. Every user story depends on these. All T002–T005 tasks are parallelizable (different files).

**⚠️ CRITICAL**: No user story implementation can begin until T002–T006 are complete.

- [x] T002 [P] Create `store/api/centerServicesApi.ts` with the following exact content:
  - Export `ServiceCategoryResponse` interface: `{ id: number; nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string; iconUrl?: string }`
  - Export `ServiceDetail` interface: `{ id: number; code: string; nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string; iconUrl?: string }`
  - Export `CenterServiceResponse` interface: `{ id: number; category: ServiceCategoryResponse; service: ServiceDetail; minPrice?: number; maxPrice?: number; typicalDurationMinutes?: number; descriptionAr?: string; descriptionEn?: string; isActive: boolean }`
  - Export `centerServicesApi = createApi({ reducerPath: 'centerServicesApi', tagTypes: ['CenterCategories', 'CenterServices'], baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, prepareHeaders: (headers, { getState }) => { const token = (getState() as RootState).auth.session?.token; if (token) headers.set('Authorization', \`Bearer ${token}\`); return headers; } }) })`
  - Endpoint `getCenterCategories`: `builder.query<ServiceCategoryResponse[], number>`, URL `/centers/${centerId}/categories`, providesTags `[{ type: 'CenterCategories', id: centerId }]`
  - Endpoint `getServicesForCenterCategory`: `builder.query<CenterServiceResponse[], { centerId: number; categoryId: number }>`, URL `/centers/${centerId}/categories/${categoryId}/services`, providesTags `[{ type: 'CenterServices', id: \`${centerId}-${categoryId}\` }]`
  - Export hooks: `useGetCenterCategoriesQuery`, `useGetServicesForCenterCategoryQuery`
  - Imports: `createApi`, `fetchBaseQuery` from `@reduxjs/toolkit/query/react`; `API_BASE_URL` from `../../lib/constants/config`; `RootState` from `../index`

- [x] T003 [P] Modify `store/api/bookingsApi.ts` — add 3 type exports and update 2 existing interfaces:
  - ADD `export interface BookingCategoryRef { id: number; nameAr: string; nameEn: string; }`
  - ADD `export interface BookingServiceRef { id: number; code: string; nameAr: string; nameEn: string; }`
  - MODIFY `Booking` interface — add two optional fields after `serviceType`: `category?: BookingCategoryRef | null;` and `service?: BookingServiceRef | null;`
  - MODIFY `CreateBookingRequest` interface — remove `serviceType: ServiceType;`, add `categoryId: number;` and `serviceId: number;` in its place (keep all other fields unchanged)
  - ADD exported pure function `getBookingServiceLabel(booking: Pick<Booking, 'service' | 'serviceType'>, t: (key: string) => string, isAr: boolean): string` — if `booking.service` is truthy return `isAr ? booking.service.nameAr : booking.service.nameEn`; otherwise return `t(\`booking.serviceType.${booking.serviceType.toLowerCase()}\`)`

- [x] T004 [P] Add i18n keys to `lib/i18n/locales/en.json` — insert under the `"booking"` key the following sub-keys (do not remove or rename any existing keys):
  ```json
  "categorySelect": {
    "title": "Select Category",
    "empty": "This center has no available services at the moment.",
    "error": "Could not load categories. Please try again.",
    "centerUnavailable": "This center is no longer accepting bookings.",
    "retry": "Try Again",
    "back": "Go Back"
  },
  "legacy": {
    "tag": "Legacy",
    "fallbackLabel": "Service"
  },
  "categoryLabel": "Category",
  "serviceLabel": "Service"
  ```

- [x] T005 [P] Add i18n keys to `lib/i18n/locales/ar.json` — insert under the `"booking"` key the following sub-keys (do not remove or rename any existing keys):
  ```json
  "categorySelect": {
    "title": "اختر الفئة",
    "empty": "لا توجد خدمات متاحة في هذا المركز حالياً.",
    "error": "تعذّر تحميل الفئات. يرجى المحاولة مرة أخرى.",
    "centerUnavailable": "هذا المركز لم يعد يقبل الحجوزات.",
    "retry": "إعادة المحاولة",
    "back": "رجوع"
  },
  "legacy": {
    "tag": "قديم",
    "fallbackLabel": "الخدمة"
  },
  "categoryLabel": "الفئة",
  "serviceLabel": "الخدمة"
  ```

- [x] T006 Register `centerServicesApi` in `store/index.ts` (depends on T002):
  - ADD import: `import { centerServicesApi } from './api/centerServicesApi';`
  - ADD to `reducer` map: `[centerServicesApi.reducerPath]: centerServicesApi.reducer,`
  - ADD to `middleware` chain inside `getDefaultMiddleware().concat(...)`: `centerServicesApi.middleware,`

**Checkpoint**: Foundation ready — TypeScript compiles (`npx tsc --noEmit` passes), i18n keys exist in both files, store is registered.

---

## Phase 3: User Story 1 — Complete Booking via Category → Service Flow (Priority: P1) 🎯 MVP

**Goal**: Customer can tap "Book Appointment" on a center, pick a category, pick a service, and complete the booking end-to-end. Booking creation request sends `categoryId` + `serviceId`.

**Independent Test**: Navigate to any center detail → tap "Book Appointment" → CategorySelectScreen appears with the center's categories → pick one → booking form opens with Step 0 showing only that center+category's services → complete all steps → booking appears in Bookings list.

**Can be implemented before backend ships**: Use RTK Query's `skip` option or a mock server response to build and test the UI without live endpoints.

- [x] T007 [P] [US1] Create `app/(app)/(tabs)/centers/[id]/book/category.tsx` — full CategorySelectScreen implementation (depends on T002, T004, T005, T006):
  - Read `id` from `useLocalSearchParams<{ id: string }>()` as `centerId`
  - Call `useGetCenterCategoriesQuery(Number(centerId))`
  - Render: loading → `<ActivityIndicator size="large" color="#2196F3" />`
  - Render: error with `error.status === 404 || error.status === 410` → show `t('booking.categorySelect.centerUnavailable')` + back button (`router.back()`)
  - Render: all other errors → show `t('booking.categorySelect.error')` + retry button (`refetch()`)
  - Render: `data.length === 0` → icon `"construct-outline"` + `t('booking.categorySelect.empty')`
  - Render: populated → `ScrollView` of category cards, one per `ServiceCategoryResponse`
  - Each card: `TouchableOpacity` with `accessibilityRole="button"`, `accessibilityLabel` = category name in current locale
  - Card content: category name `isRTL ? cat.nameAr : cat.nameEn`, trailing `<Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} />`
  - Card `onPress`: `router.push({ pathname: '/(app)/(tabs)/bookings/new', params: { centerId: id, categoryId: String(cat.id) } })`
  - RTL: `flexDirection: isRTL ? 'row-reverse' : 'row'` on each card row; back arrow icon flips
  - Header: back button (left) + `t('booking.categorySelect.title')` (center) — same header pattern as `new.tsx`
  - Styling: match `new.tsx` card style (white card, 12px border-radius, 16px padding, 12px margin-bottom, shadow, 2px border transparent / selected blue)
  - Min touch target: each card must be at least 48pt tall

- [x] T008 [P] [US1] Modify `app/(app)/(tabs)/bookings/new.tsx` — rewire Step 0 to use live service data and update `handleConfirm` (depends on T002, T004, T005):
  - ADD `categoryId` to `useLocalSearchParams`: `const { centerId, categoryId } = useLocalSearchParams<{ centerId: string; categoryId: string }>()`
  - ADD import: `useGetServicesForCenterCategoryQuery` and `CenterServiceResponse` from `store/api/centerServicesApi`
  - ADD hook: `const { data: servicesData, isLoading: servicesLoading, isError: servicesError, refetch: refetchServices } = useGetServicesForCenterCategoryQuery({ centerId: Number(centerId), categoryId: Number(categoryId) }, { skip: !centerId || !categoryId })`
  - REPLACE state: `selectedServiceType → selectedService: CenterServiceResponse | null` initialized to `null`
  - REPLACE the `allServiceTypes`, `CATEGORY_SERVICE_MAP`, and derived `serviceTypes` constant with a render-time read of `servicesData`
  - REMOVE `useGetCentersQuery` and `topCenters` (the no-services recommendation block is no longer needed; empty services are handled on the CategorySelectScreen)
  - REPLACE Step 0 service list render:
    - If `servicesLoading`: `<ActivityIndicator size="large" color="#2196F3" />`
    - If `servicesError`: error text + retry button calling `refetchServices()`
    - If `!servicesData || servicesData.length === 0`: icon + `t('booking.categorySelect.empty')`
    - Otherwise: map `servicesData` to cards using `isRTL ? cs.service.nameAr : cs.service.nameEn` as label; `selectedService?.id === cs.id` drives selected style; `onPress → setSelectedService(cs)`
  - REPLACE `handleNextStep` guard for step 0: check `!selectedService` instead of `!selectedServiceType`
  - REPLACE Step 2 summary row: display `isRTL ? selectedService!.service.nameAr : selectedService!.service.nameEn`
  - REPLACE `handleConfirm` payload:
    ```typescript
    router.push({
      pathname: '/(app)/(tabs)/bookings/confirmation',
      params: {
        centerId: String(centerId),
        categoryId: String(selectedService!.category.id),
        serviceId: String(selectedService!.id),
        categoryNameEn: selectedService!.category.nameEn,
        categoryNameAr: selectedService!.category.nameAr,
        serviceNameEn: selectedService!.service.nameEn,
        serviceNameAr: selectedService!.service.nameAr,
        bookingDate: selectedDate,
        bookingTime: `${selectedTime}:00`,
        paymentMethod: selectedPayment,
        customerPhone: customerPhone.trim(),
        serviceDescription: description || '',
        specialInstructions: notes || '',
      },
    });
    ```

- [x] T009 [US1] Modify `app/(app)/(tabs)/centers/[id].tsx` — update `handleBookNow` to navigate to category screen (depends on T007):
  - REPLACE the existing `handleBookNow` function body:
    ```typescript
    const handleBookNow = () => {
      router.push(`/(app)/(tabs)/centers/${centerId}/book/category`);
    };
    ```
  - No other changes to this file

**Checkpoint US1**: Full booking creation flow works — Center Detail → Category Select → Booking Form (Step 0 data-driven) → Confirm → booking appears in list. Payload contains `categoryId` + `serviceId`, no `serviceType`.

---

## Phase 4: User Story 2 — Bookings List with New and Legacy Service Labels (Priority: P2)

**Goal**: Every row in the Bookings list shows a legible service label regardless of whether the booking was created before or after Phase 3.6 migration. Legacy rows show a "Legacy" tag.

**Independent Test**: Open Bookings list with a test account that has at least one legacy booking (only `serviceType`) and one new booking (`service` object). Both rows display a non-empty, non-raw service label; the legacy row shows the tag.

- [x] T010 [US2] Modify `components/listings/BookingCard.tsx` — dual-path service label + fix `centerName` bug (depends on T003, T004, T005):
  - ADD import: `getBookingServiceLabel` from `../../store/api/bookingsApi`
  - FIX `centerName`: replace `const centerName = booking.centerName;` with `const centerName = isRTL ? booking.centerNameAr : booking.centerNameEn;`
  - ADD `const isLegacy = !booking.service;`
  - ADD `const serviceLabel = getBookingServiceLabel(booking, t, isRTL);`
  - REPLACE the `<AppText style={styles.serviceType}>{getServiceTypeLabel(booking.serviceType)}</AppText>` render with:
    ```tsx
    <View style={styles.serviceLabelRow}>
      <AppText style={styles.serviceType}>{serviceLabel}</AppText>
      {isLegacy && (
        <View style={styles.legacyBadge}>
          <AppText style={styles.legacyBadgeText}>{t('booking.legacy.tag')}</AppText>
        </View>
      )}
    </View>
    ```
  - ADD styles:
    ```typescript
    serviceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    legacyBadge: { backgroundColor: '#F5F5F5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#BDBDBD' },
    legacyBadgeText: { fontSize: 10, color: '#757575', fontStyle: 'italic' },
    ```
  - REMOVE `getServiceTypeLabel` local function (now handled by the imported helper)

**Checkpoint US2**: Bookings list renders all rows — new bookings show `service.nameAr/En`, legacy bookings show `serviceType` label + "Legacy" badge. No crashes or blank labels.

---

## Phase 5: User Story 3 — Booking Detail with New and Legacy Service Labels (Priority: P3)

**Goal**: Booking detail screen shows category name + service name for new bookings; shows legacy `serviceType` + "Legacy" tag for pre-migration bookings.

**Independent Test**: Tap a new-format booking in the list → detail shows category row + service name. Tap a legacy booking → detail shows service type enum label + "Legacy" tag. Neither crashes or shows an empty field.

- [x] T011 [US3] Modify `app/(app)/(tabs)/bookings/[id].tsx` — dual-path service label + add category row (depends on T003, T004, T005):
  - ADD import: `getBookingServiceLabel` from `../../../../store/api/bookingsApi`
  - Inside the render, before the Service Info section, ADD:
    ```typescript
    const serviceLabel = getBookingServiceLabel(booking, t, i18n.language === 'ar');
    const isLegacy = !booking.service;
    ```
  - REPLACE `<AppText style={styles.infoValue}>{getServiceTypeLabel(booking.serviceType)}</AppText>` with:
    ```tsx
    <AppText style={styles.infoValue}>
      {serviceLabel}{isLegacy ? ` (${t('booking.legacy.tag')})` : ''}
    </AppText>
    ```
  - ADD a category row immediately before the existing service-type row (inside the `<View style={styles.infoCard}>`):
    ```tsx
    {booking.category && (
      <>
        <View style={styles.infoRow}>
          <Ionicons name="grid-outline" size={20} color="#2196F3" />
          <AppText style={styles.infoLabel}>{t('booking.categoryLabel')}</AppText>
          <AppText style={styles.infoValue}>
            {i18n.language === 'ar' ? booking.category.nameAr : booking.category.nameEn}
          </AppText>
        </View>
        <View style={styles.divider} />
      </>
    )}
    ```
  - REMOVE the local `getServiceTypeLabel` function (now handled by the imported helper)
  - Keep all other sections (date, time, description, photos, notes, payment, quote, cancel, meta, actions) fully intact

**Checkpoint US3**: Booking detail renders correctly for both row types. New booking shows category + service name. Legacy booking shows `serviceType` label + "(Legacy)" annotation. No empty fields.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: RTL layout, accessibility, and end-to-end smoke test. Can be done after all user story phases are complete.

- [ ] T012 [P] RTL spot-check — set app locale to Arabic and manually verify:
  - CategorySelectScreen: cards are right-aligned, chevrons point left, back arrow points right, text is right-to-left
  - `new.tsx` Step 0: service cards layout is mirrored, Arabic service names display correctly
  - `BookingCard.tsx`: service label row is right-aligned, Legacy badge appears on the correct side
  - `bookings/[id].tsx`: new category row and updated service row display correctly in RTL
  - Document any layout issues found and fix them before marking this task complete

- [ ] T013 [P] Accessibility audit — for the CategorySelectScreen (`category.tsx`):
  - Verify each category card has `accessibilityRole="button"` and `accessibilityLabel` set to the localized category name
  - Verify the retry button has an accessible label (`accessibilityLabel={t('booking.categorySelect.retry')}`)
  - Verify the back button has `accessibilityRole="button"` and `accessibilityLabel={t('booking.categorySelect.back')}`
  - Verify all touch targets are at least 44×44pt (add `minHeight: 48` to card styles if not already set)
  - Fix any issues found before marking complete

- [ ] T014 End-to-end smoke test (requires backend Phase 3.6 deployed or MSW mock):
  - Center Detail → "Book Appointment" → CategorySelectScreen loads categories for that center
  - Select a category → `new.tsx` opens, Step 0 shows only services for that center+category
  - Select a service → complete Step 1 (date/time) + Step 2 (confirm, phone) → submit
  - Confirm the booking creation request body contains `categoryId` and `serviceId` (network inspector) and does NOT contain `serviceType`
  - New booking appears in Bookings list with the service name label (no Legacy tag)
  - Tap the new booking → detail shows category name + service name
  - Tap an old (legacy) booking → detail shows `serviceType` label + "(Legacy)" annotation, no crash
  - Verify empty category state: use a center with no configured services → empty-state screen appears on CategorySelectScreen

**Checkpoint Final**: All user stories pass their independent tests. RTL verified. Accessibility passes. Smoke test green.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 — BLOCKS all user story phases
  - T002, T003, T004, T005 are fully parallel (different files)
  - T006 depends on T002
- **Phase 3 (US1)**: Depends on Phase 2 complete
  - T007 and T008 are parallel (different files)
  - T009 depends on T007
- **Phase 4 (US2)**: Depends on Phase 2 complete; independent of Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 complete; independent of Phases 3–4
- **Phase 6 (Polish)**: Depends on Phases 3–5 complete; T012 and T013 are parallel

### User Story Dependencies

- **US1 (P1)**: Foundation complete → US1 can start. No dependency on US2 or US3.
- **US2 (P2)**: Foundation complete → US2 can start. No dependency on US1 or US3.
- **US3 (P3)**: Foundation complete → US3 can start. No dependency on US1 or US2.

### Parallel Opportunities

| Parallel group | Tasks | Condition |
|---------------|-------|-----------|
| Foundation batch 1 | T002, T003, T004, T005 | Immediately after T001 |
| Foundation batch 2 | T006 | After T002 |
| US1 implementation | T007, T008 | After Foundation complete |
| US2 + US3 | T010, T011 | After Foundation complete (parallel with US1) |
| Polish | T012, T013 | After all US phases complete |

---

## Parallel Execution Examples

### Foundation (fastest path)

```
Session 1: T002 (centerServicesApi.ts)
Session 2: T003 (bookingsApi.ts extensions)
Session 3: T004 (en.json) → T005 (ar.json)
Session 4: Wait for T002 → T006 (store/index.ts)
```

### US1 + US2 + US3 in parallel (after Foundation)

```
Session 1: T007 (category.tsx) → T009 (centers/[id].tsx handleBookNow)
Session 2: T008 (bookings/new.tsx Step 0 rewire)
Session 3: T010 (BookingCard.tsx)
Session 4: T011 (bookings/[id].tsx)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundation (T002–T006) — all parallelizable
3. Phase 3: US1 (T007 + T008 in parallel → T009)
4. **STOP and VALIDATE**: smoke test the full booking creation path
5. Ship US1 if backend is live; otherwise merge behind a feature flag

### Incremental Delivery

1. Foundation → US1 (booking creation path) → validate → deploy
2. US2 (BookingCard label) → validate → deploy
3. US3 (Booking detail) → validate → deploy
4. Polish → final validation → cleanup

### Backend coordination

| Task group | Backend needed? |
|------------|----------------|
| T002–T006 (Foundation) | No — pure TypeScript |
| T007–T009 (US1 screens) | Optional — can mock with `skip` flag |
| T010 (BookingCard) | No — renders from existing booking data |
| T011 (Booking detail) | No — renders from existing booking data |
| T014 (Smoke test) | Yes — needs real or MSW-mocked endpoints |

---

## Notes

- `[P]` tasks operate on different files; no merge conflicts if run concurrently
- `[US#]` label maps each task to its user story for traceability
- Do **not** remove the `ServiceType` enum or any existing fields on `Booking` — legacy rows still need them during the transition window
- The `getBookingServiceLabel` helper must be a pure exported function (not a hook) so it can be used in both `BookingCard` and `bookings/[id].tsx` without React context
- TypeScript must compile cleanly (`npx tsc --noEmit`) after each task before moving to the next
- `serviceId` in `CreateBookingRequest` maps to `CenterServiceResponse.id` (the `center_service` junction record), **not** `ServiceDetail.id`
