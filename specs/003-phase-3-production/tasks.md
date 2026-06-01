# Tasks: Phase 3 — Production Readiness

**Input**: Design documents from `/specs/003-phase-3-production/`
**Branch**: `002-phase-3-production`
**Prerequisites**: Phase 2 complete ✅, plan.md ✅, spec.md ✅, research.md ✅, contracts/ ✅

**User Stories**:
- US1: Push Notifications (P1)
- US2: EAS Build Distribution (P1)
- US3: Automatic Session Refresh (P2)
- US4: Crash Reporting & Monitoring (P2)
- US5: Secure API Communication (P1)

**Status**: ⬜ NOT STARTED — 0/30 tasks complete

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Install dependencies: `npx expo install expo-notifications expo-device` and `npm install async-mutex @sentry/expo`
- [ ] T002 [P] Add Phase 3 English i18n keys to `lib/i18n/locales/en.json` (notifications.*, errors.*, auth.refreshFailed)
- [ ] T003 [P] Add Phase 3 Arabic i18n keys to `lib/i18n/locales/ar.json`
- [ ] T004 [P] Add `EXPO_PUBLIC_SENTRY_DSN` to `.env` and add `sentryDsn` to `app.config.js` `extra` block

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T005 Update `lib/secureStorage.ts` — add `getRefreshToken()`, `setRefreshToken(token: string)`, `deleteRefreshToken()` using key `auth_refresh_token`
- [ ] T006 Update `lib/constants/config.ts` — add `SENTRY_DSN` from `Constants.expoConfig.extra.sentryDsn`; fix `WS_BASE_URL` derivation to handle both `http://→ws://` AND `https://→wss://`; add `IS_PRODUCTION` constant (`!__DEV__`)
- [ ] T007 Update `store/authSlice.ts` — add `refreshToken: string | null` and `isRefreshing: boolean` to `AuthState`; add `setRefreshToken` and `setIsRefreshing` actions; update `clearSession` to also clear `refreshToken`
- [ ] T008 Create `store/api/baseQuery.ts` — `baseQueryWithReauth` using `async-mutex`; on 401: acquire mutex → call `POST auth/refresh` → store new tokens → retry original request → on refresh failure: `clearSession` (see contracts/production-api.md for full implementation)

---

## Phase 3: User Story 5 — Secure API Communication (Priority: P1)

**Goal**: All API calls use HTTPS and WebSocket connections use WSS in production.

**Independent Test**: Set `EXPO_PUBLIC_API_BASE_URL` to an HTTPS URL → inspect network calls → zero plain HTTP requests.

- [ ] T009 [P] [US5] Update `app.json` — add `ios.bundleIdentifier: "kw.maintenancecenters.customer"` and `android.package: "kw.maintenancecenters.customer"`
- [ ] T010 [US5] Update all RTK Query slices to use `baseQueryWithReauth` instead of `fetchBaseQuery`: `centersApi.ts`, `bookingsApi.ts`, `chatApi.ts`, `reviewsApi.ts`, `favoritesApi.ts`, `notificationsApi.ts`, `complaintsApi.ts`, `profileApi.ts`, `pricingApi.ts` (if exists), `authApi.ts`
- [ ] T011 [US5] Remove the 401 Redux middleware from `store/index.ts` — `baseQueryWithReauth` now handles 401 centrally; double-handling would cause duplicate `clearSession` dispatches

---

## Phase 4: User Story 2 — EAS Build Distribution (Priority: P1)

**Goal**: Valid EAS config with bundle identifiers and project ID. Production build succeeds.

**Independent Test**: `eas build --profile preview --platform android` completes successfully → APK installs and authenticates.

- [ ] T012 [P] [US2] Create `eas.json` at project root with development / preview / production profiles (see contracts/production-api.md for content)
- [ ] T013 [US2] Run `eas init` to create EAS project and obtain `projectId` — add to `app.json` at `extra.eas.projectId`
- [ ] T014 [US2] Add `expo-notifications` to `app.json` plugins array: `["expo-notifications", { "icon": "./assets/images/notification-icon.png", "color": "#1A73E8" }]`
- [ ] T015 [US2] Verify `eas build --profile preview --platform android` completes without errors

---

## Phase 5: User Story 3 — Automatic Session Refresh (Priority: P2)

**Goal**: Expired JWTs are silently refreshed. User never sees a forced re-login during normal usage.

**Independent Test**: Simulate JWT expiry → make any API call → token refreshes silently → user stays on current screen. Two parallel calls during refresh → only one refresh request sent.

- [ ] T016 [US3] Update `store/api/authApi.ts` — add `refreshToken` mutation (`POST auth/refresh`) and `logoutServer` mutation (`POST auth/logout`) per contracts/production-api.md
- [ ] T017 [US3] Update `store/api/profileApi.ts` — add `registerPushToken` mutation (`PUT users/me/push-token`) per contracts/production-api.md
- [ ] T018 [US3] Update login flow — after successful login, extract `refreshToken` from response body; call `setRefreshToken` action + `secureStorage.setRefreshToken()`
- [ ] T019 [US3] Update `useAuth().logout()` — call `logoutServer` mutation (best-effort, ignore error) before `deleteJwt()` + `deleteRefreshToken()` + `dispatch(clearSession())`

---

## Phase 6: User Story 1 — Push Notifications (Priority: P1)

**Goal**: App receives push notifications, navigates on tap, shows in-app banner when foregrounded.

**Independent Test**: Physical device → home tab loads → permission dialog appears (first time) → grant → test push arrives within 30 s → tap → navigates to correct screen. App foregrounded + notification arrives → in-app banner shown.

- [ ] T020 [US1] Create `hooks/usePushNotifications.ts`:
  - Check `@push_permission_asked` AsyncStorage flag before prompting
  - Request permission via `Notifications.requestPermissionsAsync()` (physical device only — `Device.isDevice` guard)
  - Get push token via `Notifications.getExpoPushTokenAsync({ projectId })`
  - Call `registerPushToken` mutation after permission granted
  - Set `@push_permission_asked` flag after first prompt
  - Add `addNotificationReceivedListener` — dispatch `uiSlice.showNotificationBanner({ title, body })`
  - Add `addNotificationResponseReceivedListener` — navigate per `data.type` + `data.entityId` (see data-model.md navigation map)
  - `Platform.OS !== 'web'` guard wrapping all notification code
- [ ] T021 [US1] Update `store/uiSlice.ts` — add `notificationBanner: { visible: boolean; title: string; body: string }` state; add `showNotificationBanner` and `hideNotificationBanner` actions
- [ ] T022 [US1] Create `components/ui/NotificationBanner.tsx` — slide-in banner at top of screen; shows title + body; auto-dismisses after 4 s; dismiss on tap; RTL-aware
- [ ] T023 [US1] Update `app/_layout.tsx` — render `<NotificationBanner>` driven by `uiSlice.notificationBanner` state
- [ ] T024 [US1] Update `app/(app)/(tabs)/index.tsx` — call `usePushNotifications()` on home tab mount (first authenticated screen)

---

## Phase 7: User Story 4 — Crash Reporting & Monitoring (Priority: P2)

**Goal**: Unhandled crashes auto-reported to Sentry with no PII. Error boundary shows user-friendly restart screen.

**Independent Test**: Trigger a JS error → Sentry dashboard shows event within 60 s with stack trace, no PII. Error boundary fires → "Something went wrong" screen appears → "Restart App" reloads.

- [ ] T025 [US4] Update `app/_layout.tsx` — initialise Sentry at top of file before any component renders:
  ```typescript
  import * as Sentry from '@sentry/expo';
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    attachScreenshot: true,
  });
  ```
- [ ] T026 [US4] Update `app/_layout.tsx` — set Sentry user context after login (`Sentry.setUser({ id: userId })`); clear on logout (`Sentry.setUser(null)`)
- [ ] T027 [US4] Update `app/_layout.tsx` — wrap `ErrorBoundary` with `Sentry.withErrorBoundary()` and replace the existing console-only fallback with a proper restart UI:
  - Show "Something went wrong" heading (i18n `errors.crashTitle`)
  - Show `errors.crashMessage` body text
  - Show "Restart App" button calling `Updates.reloadAsync()` from `expo-updates`
  - Report error + component stack to Sentry automatically via the HOC

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T028 Verify HTTPS: set `EXPO_PUBLIC_API_BASE_URL` to `https://` URL in a test build → confirm zero plain HTTP requests in network inspector
- [ ] T029 Verify WSS: confirm `WS_BASE_URL` derives `wss://` when base is `https://` — check in `lib/constants/config.ts`
- [ ] T030 Run quickstart.md testing checklist — all items pass before marking Phase 3 complete

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — run all in parallel
- **Phase 2 (Foundational)**: Depends on Phase 1; T008 (`baseQueryWithReauth`) depends on T005 (secureStorage) + T007 (authSlice)
- **Phase 3 (US5 Secure API)**: Depends on T008 (baseQueryWithReauth) — must have the wrapper before swapping all slices
- **Phase 4 (US2 EAS)**: Depends on T009 (app.json); T013 requires Expo account login
- **Phase 5 (US3 Session Refresh)**: Depends on T008 (baseQueryWithReauth) + T016 (authApi mutations)
- **Phase 6 (US1 Push)**: Depends on T017 (profileApi.registerPushToken) + T013 (EAS projectId for token)
- **Phase 7 (US4 Crash)**: Depends on Phase 1 (`@sentry/expo` installed); otherwise independent
- **Phase 8 (Polish)**: Depends on all prior phases

---

## Implementation Strategy

### Recommended Order (dependency-safe)
1. Phase 1 (T001–T004) in parallel
2. Phase 2 (T005–T008) sequentially — foundation for everything
3. Phase 3 US5 (T009–T011) + Phase 4 US2 (T012–T015) — can overlap; both depend on T008
4. Phase 5 US3 (T016–T019) — silent refresh wired in
5. Phase 6 US1 (T020–T024) — push notifications (needs EAS projectId from T013)
6. Phase 7 US4 (T025–T027) — Sentry (independent once packages installed)
7. Phase 8 (T028–T030) — validation

### Notes
- `async-mutex` import: `import { Mutex } from 'async-mutex'`
- `@sentry/expo` wraps `@sentry/react-native` — use `@sentry/expo` for all imports
- `expo-device` required to check `Device.isDevice` before requesting push token (simulators cannot receive tokens)
- EAS project ID requires an Expo account: run `eas login` then `eas init`
- Push notifications are NOT available on web — all `expo-notifications` calls must be inside `Platform.OS !== 'web'` guards
- `Updates.reloadAsync()` requires `expo-updates` (already installed at v29.0.16)
