# Implementation Plan: Phase 2 — Core Screens

**Branch**: `001-phase-2-core-screens` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-phase-2-core-screens/spec.md`

---

## Summary

Phase 2 builds all nine core customer-facing feature areas on top of the Phase 1 foundation: Centers browse/search/filter/detail, full booking flow (create → confirm → success → manage → cancel), real-time chat via WebSocket/STOMP, favorites, notifications, profile management with photo upload, reviews, complaints, and support screens. Eight new RTK Query API slices are introduced. Fourteen new screen files and eight new component files are created. The bottom tab navigator is established with five tabs.

---

## Technical Context

**Language/Version**: TypeScript 5.x / React Native 0.81.5 + Expo SDK 54
**Primary Dependencies**: RTK Query (existing), react-i18next (existing), React Hook Form + Zod (existing), expo-image + expo-image-picker (new), react-native-reanimated + react-native-gesture-handler (new), @react-native-community/netinfo (new), STOMP over WebSocket (via `@stomp/stompjs`)
**Storage**: Redux in-memory (no new persistent storage beyond Phase 1)
**Target Platform**: iOS + Android (Expo managed workflow); web via react-native-web
**Performance Goals**: Centers list loads in < 1 s; search debounced at 400 ms; chat messages appear within 2 s
**Constraints**: RTL mandatory; offline banner on all form screens; JWT injected in all requests; bottom tab count = 5

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md complete |
| II. Bilingual First | ✅ Pass | All screens AR/EN; `nameAr`/`nameEn` pair always used |
| III. Component-Driven UI | ⚠️ Exception | `StyleSheet.create()` — same justified exception as Phase 1 |
| IV. API Contract Adherence | ✅ Pass | RTK Query for all 8 new API slices; typed |
| V. Offline-Awareness | ✅ Pass | All list screens show empty/error state; forms show offline banner |
| VI. Security & Privacy | ✅ Pass | JWT in all requests; profile photo multipart; no PII in local state |

**Gate result: PASS with justified exception on Principle III.**

---

## Project Structure

```text
store/
├── centersSlice.ts                           [NEW] filters, recent searches
├── bookingsSlice.ts                          [NEW] booking status filter
├── chatSlice.ts                              [NEW] messages, conversations
├── favoritesSlice.ts                         [NEW] favorited center IDs
├── notificationsSlice.ts                     [NEW] unread count
└── api/
    ├── centersApi.ts                         [NEW] search, filter, getById, reviews, categories
    ├── bookingsApi.ts                        [NEW] create, list, getById, cancel
    ├── chatApi.ts                            [NEW] conversations, messages, startConversation
    ├── reviewsApi.ts                         [NEW] create, list, getByCenterId
    ├── favoritesApi.ts                       [NEW] add, remove, check, list
    ├── notificationsApi.ts                   [NEW] list, markRead, delete
    ├── complaintsApi.ts                      [NEW] create, list, getById
    └── profileApi.ts                         [NEW] getMe, update, changePassword, uploadImage

components/
├── listings/
│   ├── CenterCard.tsx                        [NEW] Center in list with rating + category icons
│   ├── BookingCard.tsx                       [NEW] Booking in list with status badge
│   ├── ReviewCard.tsx                        [NEW] Review with star rating + optional owner reply
│   └── NotificationItem.tsx                  [NEW] Notification row with unread indicator
└── ui/
    ├── SearchBar.tsx                         [NEW] Debounced text input with clear button
    ├── FilterModal.tsx                       [NEW] Bottom-sheet filter panel (categories, service types)
    └── RatingStars.tsx                       [NEW] Read-only + interactive star rating display

hooks/
├── useNetworkStatus.ts                       [NEW] Online/offline detection via netinfo
└── useWebSocketChat.ts                       [NEW] STOMP WebSocket client (placeholder → partial)

app/(app)/
├── (tabs)/
│   ├── _layout.tsx                           [NEW] Bottom tab navigator: Home, Centers, Bookings, Chat, Profile
│   ├── index.tsx                             [NEW] Home/dashboard tab
│   ├── centers/
│   │   ├── _layout.tsx                       [NEW] Centers stack layout
│   │   ├── index.tsx                         [NEW] Centers list with search + filter
│   │   ├── [id].tsx                          [NEW] Center detail: info, rating, services, book/chat/favorite
│   │   └── reviews.tsx                       [NEW] Center reviews paginated list
│   ├── bookings/
│   │   ├── _layout.tsx                       [NEW] Bookings stack layout
│   │   ├── index.tsx                         [NEW] My bookings list with status tabs
│   │   ├── new.tsx                           [NEW] Multi-step booking form (service + date/time + notes + payment)
│   │   ├── [id].tsx                          [NEW] Booking detail with cancel button
│   │   ├── confirmation.tsx                  [NEW] Booking summary before submit
│   │   └── success.tsx                       [NEW] Post-submit success screen
│   ├── chat/
│   │   ├── _layout.tsx                       [NEW] Chat stack layout
│   │   ├── index.tsx                         [NEW] Conversations list with unread badges
│   │   └── [id].tsx                          [NEW] Chat thread with WebSocket (partial — reconnection pending)
│   ├── favorites/
│   │   └── index.tsx                         [NEW] Saved centers list
│   ├── notifications/
│   │   └── index.tsx                         [NEW] Notifications list with mark-all-read
│   └── profile/
│       └── index.tsx                         [NEW] Profile view/edit/photo/logout
├── complaints/
│   ├── _layout.tsx                           [NEW] Complaints stack layout
│   ├── index.tsx                             [NEW] My complaints list
│   ├── new.tsx                               [NEW] Create complaint form
│   └── [id].tsx                              [NEW] Complaint detail with status history
├── reviews/
│   ├── _layout.tsx                           [NEW] Reviews stack layout
│   ├── index.tsx                             [NEW] My reviews list
│   └── new.tsx                               [NEW] Write review: star rating + comment
├── search.tsx                                [NEW] Global debounced search screen
├── about.tsx                                 [NEW] About page
├── help.tsx                                  [NEW] Help/FAQ (static content)
├── privacy.tsx                               [NEW] Privacy policy (static content)
└── terms.tsx                                 [NEW] Terms of service (static content)

app/(app)/settings/
├── language.tsx                              [NEW] Language switcher screen
└── notifications.tsx                         [NEW] Notification preferences (stub — AsyncStorage toggles)

lib/i18n/locales/
├── en.json                                   [MOD] Add Phase 2 keys (centers, bookings, chat, etc.)
└── ar.json                                   [MOD] Add Phase 2 Arabic keys

store/index.ts                                [MOD] Register 8 new API slices + 5 new Redux slices
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `StyleSheet.create()` (Constitution §III) | All Phase 1 screens use it; consistency matters. | NativeWind migration is a separate refactor. |
| 8 separate API slices | Per-resource pattern is already established (authApi). | A monolithic slice mixes unrelated caches and makes tag invalidation coarse. |
| WebSocket/STOMP integration | Real-time chat is a P2 requirement (FR-012). | Polling would require constant background requests; STOMP is the backend's protocol. |

---

## Implementation Order

```
Group 1 (no dependencies — all parallel):
  en.json + ar.json Phase 2 keys
  centersApi.ts + bookingsApi.ts + chatApi.ts + reviewsApi.ts
  favoritesApi.ts + notificationsApi.ts + complaintsApi.ts + profileApi.ts
  centersSlice.ts + bookingsSlice.ts + chatSlice.ts + favoritesSlice.ts + notificationsSlice.ts
  useNetworkStatus.ts

Group 2 (depends on Group 1):
  store/index.ts (register all new slices)
  components/listings/* + components/ui/SearchBar + FilterModal + RatingStars
  app/(app)/(tabs)/_layout.tsx

Group 3 (depends on Group 2 — mostly parallel per user story):
  US1: centers/* screens
  US2+US3: bookings/* screens
  US4: chat/* screens + useWebSocketChat.ts
  US5: favorites/index.tsx
  US6: notifications/index.tsx
  US7: profile/index.tsx
  US8: reviews/*
  US9: complaints/*
  Support: search.tsx, about.tsx, help.tsx, privacy.tsx, terms.tsx, settings/*
```

---

## Design Decisions

### Bottom Tab Navigator
Five tabs: Home (grid), Centers (storefront), Bookings (calendar), Chat (chatbubbles), Profile (person). Tab bar hidden on detail screens via layout options. Unread notification badge on profile tab driven by `notificationsSlice.unreadCount`.

### Centers Search — Debounced RTK Query
Search bar maintains local `query` state. A `useDebounce(query, 400)` value is passed to `useGetCentersQuery`. Debounce prevents a query per keystroke.

### Booking Form — Multi-Step State
Single-screen multi-step form managed with `useState<1|2|3|4>(1)`. No navigation between steps — just conditional rendering. Form data accumulated in a single `useForm<BookingFormData>`. `bookingDate` and `bookingTime` stored as `YYYY-MM-DD` and `HH:mm:ss` strings.

### Chat WebSocket — STOMP via `@stomp/stompjs`
`useWebSocketChat.ts` holds a single `stompClient` ref per conversation. Subscribes to `/topic/conversation/{id}`. On disconnect, attempts automatic reconnect with exponential backoff. Hook is a placeholder — full reconnection and heartbeat logic is pending.

### Profile Photo — Multipart Upload
`expo-image-picker` opens camera roll. Selected asset is read as a `FormData` blob. `profileApi.uploadImage` uses `fetchBaseQuery` with `Content-Type: multipart/form-data`.

### Bookings Field Names
Backend uses `bookingStatus` (not `status`), `bookingDate`/`bookingTime` (not `scheduledDate`/`scheduledTime`). These field names are locked per the CLAUDE.md contract — never renamed.

### Cancel Booking — Platform Dialog
`Alert.alert` for iOS/Android; `window.confirm` guard on web (`Platform.OS === 'web'`). This pattern is used for all destructive confirmations.
