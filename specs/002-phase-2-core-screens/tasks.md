# Tasks: Phase 2 — Core Screens

**Input**: Design documents from `/specs/002-phase-2-core-screens/`
**Branch**: `001-phase-2-core-screens`
**Prerequisites**: Phase 1 complete ✅, plan.md ✅, spec.md ✅

**User Stories**:
- US1: Browse & Search Centers (P1)
- US2: Create a Booking (P1)
- US3: Manage Bookings (P1)
- US4: Real-Time Chat (P2)
- US5: Favorites (P2)
- US6: Notifications (P2)
- US7: Profile Management (P2)
- US8: Reviews (P2)
- US9: Complaints (P3)

**Status**: ~95% complete — chat WebSocket thread + settings/notifications stub remaining

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [P] Add Phase 2 English i18n keys to `lib/i18n/locales/en.json` (centers, bookings, chat, notifications, profile, reviews, complaints)
- [X] T002 [P] Add Phase 2 Arabic i18n keys to `lib/i18n/locales/ar.json`
- [X] T003 [P] Install new dependencies: `npx expo install expo-image expo-image-picker react-native-reanimated react-native-gesture-handler @react-native-community/netinfo`
- [X] T004 [P] Install chat dependency: `npm install @stomp/stompjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T005 [P] Create `store/centersSlice.ts` — filters, recent searches, active category
- [X] T006 [P] Create `store/bookingsSlice.ts` — booking status filter tab
- [X] T007 [P] Create `store/chatSlice.ts` — conversations list, active messages
- [X] T008 [P] Create `store/favoritesSlice.ts` — local set of favorited center IDs
- [X] T009 [P] Create `store/notificationsSlice.ts` — unread count badge
- [X] T010 [P] Create `store/api/centersApi.ts` — getCenters (paginated + search + filter), getCenterById, getCenterReviews, getCategories
- [X] T011 [P] Create `store/api/bookingsApi.ts` — createBooking, getBookings (paginated), getBookingById, cancelBooking
- [X] T012 [P] Create `store/api/chatApi.ts` — getConversations, getMessages (paginated), startConversation, sendMessage
- [X] T013 [P] Create `store/api/reviewsApi.ts` — createReview, getMyReviews, getReviewsByCenterId
- [X] T014 [P] Create `store/api/favoritesApi.ts` — addFavorite, removeFavorite, checkFavorite, getFavorites
- [X] T015 [P] Create `store/api/notificationsApi.ts` — getNotifications, markNotificationRead, markAllRead, deleteNotification
- [X] T016 [P] Create `store/api/complaintsApi.ts` — createComplaint, getComplaints, getComplaintById
- [X] T017 [P] Create `store/api/profileApi.ts` — getMe, updateProfile, changePassword, uploadProfileImage
- [X] T018 Update `store/index.ts` — register all 8 new API slices + 5 new Redux slices
- [X] T019 Create `hooks/useNetworkStatus.ts` — returns `isOnline` boolean via `@react-native-community/netinfo`
- [X] T020 Create `app/(app)/(tabs)/_layout.tsx` — bottom tab navigator: Home, Centers, Bookings, Chat, Profile; 5 tabs with icons

---

## Phase 3: User Story 1 — Browse & Search Centers (Priority: P1)

**Goal**: Customer browses, searches, and filters centers. Taps a center to see details. Can favourite, book, or chat from the detail page.

**Independent Test**: Browse list → search "car" → results filter → tap center → favourite → appears in Favorites tab.

- [X] T021 [P] [US1] Create `components/ui/SearchBar.tsx` — debounced text input with clear button; RTL-aware
- [X] T022 [P] [US1] Create `components/ui/FilterModal.tsx` — bottom-sheet panel with category + service type filters
- [X] T023 [P] [US1] Create `components/ui/RatingStars.tsx` — read-only and interactive star rating (1–5)
- [X] T024 [P] [US1] Create `components/listings/CenterCard.tsx` — center name (AR/EN), category icons, star rating, distance
- [X] T025 [US1] Create `app/(app)/(tabs)/centers/_layout.tsx` — Centers stack layout
- [X] T026 [US1] Create `app/(app)/(tabs)/centers/index.tsx` — FlatList of CenterCards; SearchBar + FilterModal; `useGetCentersQuery` with debounced query; empty state
- [X] T027 [US1] Create `app/(app)/(tabs)/centers/[id].tsx` — center detail: header image, name, description, service types, rating, address, Favourite/Book/Chat buttons
- [X] T028 [US1] Create `app/(app)/(tabs)/centers/reviews.tsx` — paginated reviews list for a center; `useGetCenterReviewsQuery`; empty state

---

## Phase 4: User Story 2 — Create a Booking (Priority: P1)

**Goal**: Customer selects a center and completes a multi-step booking form. Sees confirmation screen then success screen.

**Independent Test**: Complete booking form → confirmation screen → submit → success screen → booking appears in My Bookings with status "Pending".

- [X] T029 [US2] Create `app/(app)/(tabs)/bookings/_layout.tsx` — bookings stack layout
- [X] T030 [US2] Create `app/(app)/(tabs)/bookings/new.tsx` — multi-step form (service type → date/time → notes → payment); React Hook Form + Zod; date validation (no past dates); offline banner; `useCreateBookingMutation`
- [X] T031 [US2] Create `app/(app)/(tabs)/bookings/confirmation.tsx` — booking summary: center name, service type, date/time, payment; "Confirm Booking" button
- [X] T032 [US2] Create `app/(app)/(tabs)/bookings/success.tsx` — post-submit success screen with booking ID; "View My Bookings" + "Go Home" buttons

---

## Phase 5: User Story 3 — Manage Bookings (Priority: P1)

**Goal**: Customer views all bookings filterable by status. Views booking detail, can cancel pending/confirmed bookings.

**Independent Test**: View bookings list → filter by "Pending" → tap booking → see detail → cancel → status updates to "Cancelled".

- [X] T033 [P] [US3] Create `components/listings/BookingCard.tsx` — booking with status badge (color per `bookingStatus`), center name, date/time
- [X] T034 [US3] Create `app/(app)/(tabs)/bookings/index.tsx` — My Bookings list; status tab filter; `useGetBookingsQuery`; empty state per status; offline banner
- [X] T035 [US3] Create `app/(app)/(tabs)/bookings/[id].tsx` — booking detail: all fields including `bookingStatus`, `bookingDate`, `bookingTime`, payment method; cancel button (visible for PENDING/CONFIRMED only); Platform-aware confirmation dialog

---

## Phase 6: User Story 4 — Real-Time Chat (Priority: P2)

**Goal**: Customer opens chat with a center. Conversations list shows unread counts. Chat thread updates in real time via WebSocket.

**Independent Test**: Open chat with center → send "Hello" → message appears immediately → center reply appears without refresh.

- [X] T036 [US4] Create `app/(app)/(tabs)/chat/_layout.tsx` — chat stack layout
- [X] T037 [US4] Create `app/(app)/(tabs)/chat/index.tsx` — conversations list; `useGetConversationsQuery`; unread badge per conversation; "Start Chat" from center detail navigates here
- [ ] T038 [US4] Create `hooks/useWebSocketChat.ts` — STOMP client over WebSocket; subscribe to `/topic/conversation/{id}`; send messages; reconnect with backoff; `Platform.OS === 'web'` guard (WebSocket not available in static web export)
- [ ] T039 [US4] Create `app/(app)/(tabs)/chat/[id].tsx` — chat thread; `useGetMessagesQuery` for initial load; `useWebSocketChat` for real-time updates; message input with send button; RTL-aware message bubbles (sent right, received left); auto-scroll to bottom on new message

---

## Phase 7: User Story 5 — Favorites (Priority: P2)

**Goal**: Customer saves centers, views and removes them from the Favorites tab. Persists across sessions.

**Independent Test**: Favourite two centers → close + reopen app → both appear in Favorites tab → remove one → list updates.

- [X] T040 [US5] Create `app/(app)/(tabs)/favorites/index.tsx` — saved centers list using `useGetFavoritesQuery`; unfavorite swipe/button; empty state with "Browse Centers" CTA; favorites persisted via RTK Query cache + backend

---

## Phase 8: User Story 6 — Notifications (Priority: P2)

**Goal**: Customer sees in-app notifications list. Unread highlighted. Tap navigates to relevant screen. Mark all read.

**Independent Test**: Notification appears with unread badge → tab badge count shown → tap → navigates to booking → mark all read → badges clear.

- [X] T041 [P] [US6] Create `components/listings/NotificationItem.tsx` — notification row: icon per `notificationType`, title, body, timestamp; unread indicator dot
- [X] T042 [US6] Create `app/(app)/(tabs)/notifications/index.tsx` — `useGetNotificationsQuery`; "Mark all read" button; tap-to-navigate per `notificationType`; unread count dispatched to `notificationsSlice`; empty state

---

## Phase 9: User Story 7 — Profile Management (Priority: P2)

**Goal**: Customer views and edits name, uploads photo, changes password, logs out.

**Independent Test**: Update first name → navigate away → return → updated name shown. Upload photo → photo visible. Logout → auth entry screen.

- [X] T043 [US7] Create `app/(app)/(tabs)/profile/index.tsx` — profile view with avatar, name, email; edit form (React Hook Form); photo upload via `expo-image-picker` + `uploadProfileImage` mutation; change password section; logout button; navigation rows (language, about, help, privacy, terms)

---

## Phase 10: User Story 8 — Reviews (Priority: P2)

**Goal**: Customer submits a star-rated review after a completed booking. Sees all their reviews in My Reviews list.

**Independent Test**: Submit review from completed booking → appears in My Reviews and on center's reviews page.

- [X] T044 [P] [US8] Create `components/listings/ReviewCard.tsx` — review with star rating, comment, date, optional owner reply
- [X] T045 [US8] Create `app/(app)/reviews/_layout.tsx` — reviews stack layout
- [X] T046 [US8] Create `app/(app)/reviews/index.tsx` — My reviews list; `useGetMyReviewsQuery`; ReviewCard; empty state
- [X] T047 [US8] Create `app/(app)/reviews/new.tsx` — review form: `RatingStars` (interactive), comment textarea; `useCreateReviewMutation`; centerId passed as param; blocks submission if no rating

---

## Phase 11: User Story 9 — Complaints (Priority: P3)

**Goal**: Customer files a complaint linked to a booking, views complaints list and individual complaint detail with status.

**Independent Test**: Submit complaint → appears in Complaints list with status "Open". Center updates status → detail shows updated status.

- [X] T048 [US9] Create `app/(app)/complaints/_layout.tsx` — complaints stack layout
- [X] T049 [US9] Create `app/(app)/complaints/index.tsx` — My complaints list; `useGetComplaintsQuery`; status badge; empty state
- [X] T050 [US9] Create `app/(app)/complaints/new.tsx` — complaint form: complaint type dropdown, description textarea, linked bookingId param; `useCreateComplaintMutation`; offline banner
- [X] T051 [US9] Create `app/(app)/complaints/[id].tsx` — complaint detail: type, description, status, submission date, status history if available

---

## Phase 12: Polish & Cross-Cutting Concerns

- [X] T052 Create `app/(app)/search.tsx` — global search screen with `SearchBar`; navigates to center detail on result tap
- [X] T053 [P] Create `app/(app)/about.tsx` — static About page
- [X] T054 [P] Create `app/(app)/help.tsx` — Help/FAQ static content
- [X] T055 [P] Create `app/(app)/privacy.tsx` — Privacy policy static content
- [X] T056 [P] Create `app/(app)/terms.tsx` — Terms of service static content
- [X] T057 Create `app/(app)/settings/language.tsx` — language switcher screen (full page; delegates to `useLanguage`)
- [ ] T058 Create `app/(app)/settings/notifications.tsx` — notification preferences; AsyncStorage toggles per `NotificationType`; currently a stub with placeholder UI
- [X] T059 Update `app/(app)/(tabs)/index.tsx` — home/dashboard tab with recent bookings, quick-access centers
- [X] T060 Audit all Phase 2 screens for hardcoded strings — all text via i18n keys
- [X] T061 Verify offline banner present on all form screens (bookings/new, reviews/new, complaints/new, profile edit, chat send)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — run immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1 Centers)**: Depends on Phase 2; T026 depends on T024 (CenterCard)
- **Phase 4 (US2 Booking)**: Depends on Phase 2 + US1 (centerId from center detail)
- **Phase 5 (US3 Manage)**: Depends on Phase 2; T035 depends on T033 (BookingCard)
- **Phase 6 (US4 Chat)**: Depends on Phase 2; T039 depends on T038 (useWebSocketChat)
- **Phase 7–11 (US5–US9)**: All depend on Phase 2; mostly independent of each other
- **Phase 12 (Polish)**: Depends on all user story phases

---

## Implementation Strategy

### Remaining Work (5%)
1. **T038** `hooks/useWebSocketChat.ts` — STOMP connection, reconnection logic, heartbeat
2. **T039** `app/(app)/(tabs)/chat/[id].tsx` — full real-time thread (depends on T038)
3. **T058** `app/(app)/settings/notifications.tsx` — replace stub with AsyncStorage toggle UI

### Notes
- `bookingStatus` NOT `status`; `bookingDate`/`bookingTime` NOT `scheduledDate`/`scheduledTime` — locked field names per CLAUDE.md
- `Platform.OS === 'web'` guard for `Alert.alert` multi-button → `window.confirm` on web
- All KD amounts: `.toFixed(3)` — 3 decimal places
- `[P]` = parallelizable; `[USn]` = user story traceability label
