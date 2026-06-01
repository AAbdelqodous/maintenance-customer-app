# Research: Phase 2 — Core Screens

**Branch**: `001-phase-2-core-screens`
**Date**: 2026-04-15
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: API Slice Strategy — Per-Resource vs. Monolithic

**Decision**: One RTK Query `createApi` slice per resource (8 slices: centersApi, bookingsApi, chatApi, reviewsApi, favoritesApi, notificationsApi, complaintsApi, profileApi)
**Rationale**: Per-resource slices match the project convention established by `authApi` in Phase 1. Each slice has its own cache, tag invalidation, and reducerPath. Mixing unrelated resources in a single slice makes cache invalidation coarse (invalidating `Centers` cache when a booking is cancelled makes no sense).
**Alternatives considered**:
- Single `coreApi` slice — rejected: one `invalidateTags` call would wipe unrelated caches; debugging cache behaviour becomes harder.

---

## Decision 2: WebSocket Chat — STOMP vs. Raw WebSocket vs. Socket.IO

**Decision**: STOMP over WebSocket via `@stomp/stompjs`
**Rationale**: The Spring Boot backend uses Spring WebSocket with STOMP broker. The client must speak STOMP to connect to `/ws` and subscribe to `/topic/conversation/{id}`. Raw WebSocket would require implementing the STOMP framing protocol manually. Socket.IO was rejected because the backend is not Socket.IO — it uses the STOMP sub-protocol.
**Alternatives considered**:
- Raw WebSocket — rejected: requires manual STOMP frame encoding/decoding
- Socket.IO (`socket.io-client`) — rejected: backend uses Spring STOMP, not Socket.IO
- Server-Sent Events — rejected: unidirectional; customers also need to send messages

---

## Decision 3: Chat State Management — RTK Query vs. Redux Slice

**Decision**: Initial messages loaded via `chatApi` (RTK Query). Real-time incoming messages appended to `chatSlice` (Redux). Outgoing messages sent via STOMP; on STOMP ACK the full message is appended to Redux state.
**Rationale**: RTK Query's cache is not designed for real-time message streams (cache invalidation on every incoming message is wasteful). A Redux slice holding `messages: Message[]` per conversation is the right model for streaming data. RTK Query handles the REST calls (conversation list, initial message load, send via HTTP fallback).
**Alternatives considered**:
- RTK Query streaming updates (`onCacheEntryAdded`) — possible but complex; STOMP events are not standard RTK Query streaming data
- Redux only (no RTK Query for messages) — rejected: initial load and conversation list are standard REST endpoints that benefit from RTK Query caching

---

## Decision 4: Center Search — Debounce Strategy

**Decision**: `useDebounce` custom hook with 400 ms delay; pass debounced value to `useGetCentersQuery`
**Rationale**: Prevents a network request on every keystroke. 400 ms matches the spec requirement (SC-001: "within 400ms"). RTK Query automatically cancels in-flight requests when the query arg changes.
**Implementation**: `const debouncedQuery = useDebounce(searchQuery, 400)` → passed as query arg to RTK Query; RTK Query skips the request when `debouncedQuery` is empty (using `skip: !debouncedQuery && !activeFilter`).
**Alternatives considered**:
- `setTimeout` + `useRef` — valid but repetitive to implement per screen; a `useDebounce` hook is reusable
- React Query's `keepPreviousData` — not applicable (using RTK Query, not React Query)

---

## Decision 5: Booking Form — Single Screen Multi-Step vs. Navigation-Based

**Decision**: Single screen with step state (`useState<1|2|3|4>(1)`); conditional rendering of each step's fields; one React Hook Form instance for the entire form
**Rationale**: Navigation-based multi-step would require passing form state between screens (via params or Redux), adding complexity. A single-screen approach keeps all form state in one `useForm` instance, validates the full schema on final submit, and allows animated step transitions without route changes.
**Alternatives considered**:
- Separate routes per step — rejected: form state sharing across routes is error-prone; back-navigation loses state without extra Redux wiring
- Wizard library (e.g., `react-native-step-indicator`) — rejected: unnecessary dependency for a 4-step form

---

## Decision 6: Profile Photo Upload — Multipart vs. Base64

**Decision**: Multipart `FormData` upload via `expo-image-picker` → `profileApi.uploadImage`
**Rationale**: Base64 encoding inflates payload size by ~33%. Multipart is the standard HTTP method for file upload. The Spring Boot backend expects `multipart/form-data`. `expo-image-picker` returns a local `uri` that can be converted to a `FormData` blob via `{ uri, type: 'image/jpeg', name: 'photo.jpg' }`.
**RTK Query note**: `fetchBaseQuery` with `Content-Type: multipart/form-data` must NOT set the Content-Type header manually — the browser/native layer adds the boundary automatically.
**Alternatives considered**:
- Base64 in JSON body — rejected: 33% size inflation; backend expects multipart
- Direct upload to S3 with presigned URL — rejected: backend does not expose presigned URLs in this phase

---

## Decision 7: Favorites — Optimistic Update vs. Server Round-Trip

**Decision**: No optimistic update; wait for server response before updating UI
**Rationale**: Favorites are a simple add/remove toggle. The round-trip is fast (<500 ms on LAN). Optimistic updates add complexity (rollback on error). The `favoritesApi` slice invalidates the `Favorites` tag on mutation so the FlatList refreshes automatically via RTK Query's cache invalidation.
**Alternatives considered**:
- Optimistic update with `onQueryStarted` — possible but overkill for a simple toggle; deferred if performance becomes an issue

---

## Decision 8: Notifications — Mark Read Strategy

**Decision**: `PATCH /notifications/{id}/read` for individual; `PATCH /notifications/read-all` for bulk. RTK Query invalidates `Notifications` tag after each. Unread count stored in `notificationsSlice.unreadCount`, updated on list fetch.
**Rationale**: Backend tracks read state. The mobile app reflects it. The unread count badge on the Profile tab is driven by the Redux slice, not a separate API call on every render.
**Alternatives considered**:
- Local-only read state (no server round-trip) — rejected: read state must persist across devices/reinstalls

---

## Decision 9: Cancel Booking — Confirmation Dialog

**Decision**: `Alert.alert` with two buttons (Cancel / Confirm) on iOS/Android; `window.confirm` on web (behind `Platform.OS === 'web'` guard)
**Rationale**: `Alert.alert` with multiple buttons is not supported on web. The `Platform.OS === 'web'` guard is already established project convention from CLAUDE.md. Cancel is a destructive action — a confirmation dialog is required per spec (US3 acceptance scenario 3).
**Alternatives considered**:
- Custom modal component — overkill for a two-button confirmation; `Alert.alert` is idiomatic for RN

---

## Decision 10: Chat — Reconnection Strategy

**Decision**: STOMP client reconnects automatically with `reconnectDelay: 5000` (5 s). A connection state enum (`CONNECTING | CONNECTED | DISCONNECTED`) is exposed from `useWebSocketChat`. The chat screen shows a "Reconnecting..." banner when state is not `CONNECTED`.
**Rationale**: `@stomp/stompjs` has built-in reconnection support via `reconnectDelay`. No custom reconnection loop needed. The UI banner keeps the user informed without blocking message input.
**Alternatives considered**:
- Manual exponential backoff — rejected: `@stomp/stompjs` provides this; reimplementing is unnecessary

---

## Decision 11: Reviews — Entry Point

**Decision**: Review form accessible from two places: (a) completed booking detail screen (`bookings/[id].tsx` → "Write Review" button), (b) My Reviews list screen (`reviews/index.tsx` → header "Write Review" button). Both pass `centerId` and optionally `bookingId` as route params.
**Rationale**: Spec US8 mentions reviews after completed bookings. Providing access from both booking detail and a standalone reviews list maximises discoverability. The review form (`reviews/new.tsx`) accepts both params; `bookingId` is optional (some reviews may not be linked to a specific booking).
**Alternatives considered**:
- Review only accessible from booking detail — rejected: reduces discoverability; some users navigate directly to My Reviews

---

## Decision 12: Offline Detection

**Decision**: `useNetworkStatus` hook (wrapping `@react-native-community/netinfo`) used on every form screen. Shows a non-dismissible yellow banner at the top: "No internet connection — changes cannot be saved."
**Rationale**: Forms that perform API mutations are the primary offline risk. List/detail screens degrade naturally (show cached RTK Query data). The banner is visible but doesn't block reading — only the submit button is disabled when offline.
**Alternatives considered**:
- Global offline modal — rejected: too disruptive for read-only screens that work fine offline
- Individual `try/catch` error handling only — rejected: user would not know they're offline until after attempting to submit
