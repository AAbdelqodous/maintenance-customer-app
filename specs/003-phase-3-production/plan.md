# Implementation Plan: Phase 3 — Production Readiness

**Branch**: `002-phase-3-production` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-phase-3-production/spec.md`

---

## Summary

Phase 3 makes the app production-ready across five areas: push notifications via `expo-notifications` (FCM/APNs with deep-link tap handling and in-app banners), EAS Build configuration with valid bundle identifiers and a registered project ID, silent JWT refresh using a `baseQueryWithReauth` wrapper with `async-mutex`, crash reporting via `@sentry/expo` with PII-free user context, and HTTPS/WSS enforcement with a startup URL validation. No new screens are introduced — all work is infrastructure, configuration, and modifications to existing files.

---

## Technical Context

**Language/Version**: TypeScript 5.x / React Native 0.81.5 + Expo SDK 54
**New Dependencies**: `expo-notifications`, `expo-device`, `@sentry/expo`, `async-mutex`
**Modified Files**: All RTK Query slices (swap `fetchBaseQuery` → `baseQueryWithReauth`), `authSlice.ts`, `secureStorage.ts`, `lib/constants/config.ts`, `app/_layout.tsx`, `app/(app)/(tabs)/index.tsx`, `app.json`
**New Files**: `store/api/baseQuery.ts`, `hooks/usePushNotifications.ts`, `eas.json`
**Storage**: `auth_refresh_token` added to expo-secure-store; `@push_permission_asked` added to AsyncStorage
**Testing**: Jest + @testing-library/react-native (existing); manual EAS build testing
**Target Platform**: iOS + Android; push notifications not available on web (`Platform.OS === 'web'` guard)
**Performance Goals**: Token refresh completes in < 2 s; Sentry event appears within 60 s of crash
**Constraints**: No PII in Sentry; refresh token in SecureStore; push permission request after first authenticated screen

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md complete and approved |
| II. Bilingual First | ✅ Pass | Permission dialog + error boundary strings in AR/EN i18n keys |
| III. Component-Driven UI | ⚠️ Exception | `StyleSheet.create()` — same justified exception as all prior phases |
| IV. API Contract Adherence | ✅ Pass | RTK Query for refresh + push token endpoints; typed |
| V. Offline-Awareness | ✅ Pass | Refresh fails gracefully; Sentry sends queued events when back online |
| VI. Security & Privacy | ✅ Pass | Refresh token in SecureStore; no PII in Sentry; HTTPS enforced |

**Gate result: PASS with justified exception on Principle III.**

---

## Project Structure

```text
store/
├── authSlice.ts                            [MOD] Add refreshToken, isRefreshing fields; setRefreshToken action
└── api/
    ├── baseQuery.ts                        [NEW] baseQueryWithReauth with async-mutex
    ├── authApi.ts                          [MOD] Add refreshToken + logoutServer mutations
    ├── profileApi.ts                       [MOD] Add registerPushToken mutation
    ├── centersApi.ts                       [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── bookingsApi.ts                      [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── chatApi.ts                          [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── reviewsApi.ts                       [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── favoritesApi.ts                     [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── notificationsApi.ts                 [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    ├── complaintsApi.ts                    [MOD] Replace fetchBaseQuery → baseQueryWithReauth
    └── pricingApi.ts                       [MOD] Replace fetchBaseQuery → baseQueryWithReauth (if exists)

hooks/
└── usePushNotifications.ts                 [NEW] Permission request, token registration, listeners

lib/
├── secureStorage.ts                        [MOD] Add getRefreshToken / setRefreshToken / deleteRefreshToken
└── constants/config.ts                     [MOD] Add SENTRY_DSN; add HTTPS/WSS derivation for WS_BASE_URL

app/
├── _layout.tsx                             [MOD] Init Sentry; update ErrorBoundary to report + show restart UI
└── (app)/
    └── (tabs)/
        └── index.tsx                       [MOD] Call usePushNotifications on home tab mount

app.json                                    [MOD] bundleIdentifier, android.package, extra.eas.projectId,
                                                  expo-notifications plugin

eas.json                                    [NEW] development / preview / production build profiles

lib/i18n/locales/
├── en.json                                 [MOD] Add notifications.*, errors.*, auth.refreshFailed keys
└── ar.json                                 [MOD] Add Arabic translations for new keys
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `StyleSheet.create()` (Constitution §III) | Consistent with all prior phases. | NativeWind migration is a separate cross-phase refactor. |
| `async-mutex` dependency | Required for the RTK Query reauth pattern. | Without a mutex, parallel 401 responses each trigger their own refresh — backend rejects all but the first (single-use tokens). |
| Replacing `fetchBaseQuery` in all slices | All slices need refresh capability for seamless UX. | Partial migration (only some slices) would cause inconsistent session handling. |

---

## Implementation Order

```
Group 1 (no dependencies — all parallel):
  expo-notifications + expo-device + @sentry/expo + async-mutex install
  app.json — add bundleIdentifier, package, projectId, expo-notifications plugin
  eas.json — new file
  en.json + ar.json — add notifications.*, errors.*, auth.* keys

Group 2 (depends on Group 1):
  lib/secureStorage.ts — add refresh token helpers
  lib/constants/config.ts — add SENTRY_DSN + WSS derivation
  store/authSlice.ts — add refreshToken field + actions
  store/api/baseQuery.ts — implement baseQueryWithReauth (depends on secureStorage + authSlice)

Group 3 (depends on Group 2):
  store/api/authApi.ts — add refreshToken + logoutServer mutations
  store/api/profileApi.ts — add registerPushToken mutation
  All other API slices — swap fetchBaseQuery → baseQueryWithReauth

Group 4 (depends on Group 3):
  hooks/usePushNotifications.ts — permission, token, listeners (depends on profileApi)
  app/_layout.tsx — Sentry init + updated ErrorBoundary

Group 5 (depends on Group 4):
  app/(app)/(tabs)/index.tsx — usePushNotifications hook call
  useAuth().logout() update — call logoutServer + deleteRefreshToken
```

---

## Design Decisions

### `baseQueryWithReauth` — Single Shared Utility
All RTK Query slices import `baseQueryWithReauth` from `store/api/baseQuery.ts` and use it as their `baseQuery`. This ensures every slice benefits from automatic token refresh and 401 → session-clear behaviour. The existing 401 Redux middleware in `store/index.ts` is removed once `baseQueryWithReauth` handles it — two 401 handlers would double-dispatch `clearSession`.

### Refresh Token Rotation
The backend issues a new refresh token on every refresh call (single-use). Both the new `accessToken` and `refreshToken` are written to SecureStore atomically before releasing the mutex. If writing the new refresh token fails, the old one is already invalidated — the user will need to re-login (acceptable failure mode).

### Sentry Initialisation
`Sentry.init()` is called at the top of `app/_layout.tsx` before any component renders. The DSN is read from `Constants.expoConfig.extra.sentryDsn`. In development (`__DEV__ === true`) Sentry is initialised but `debug: true` is set — events appear in the console but are also sent to Sentry.

### Error Boundary — Sentry Integration
The existing `ErrorBoundary` in `app/_layout.tsx` is wrapped with `Sentry.withErrorBoundary()`. This provides automatic error capture with component tree context. The fallback UI renders a "Something went wrong" screen with a "Restart App" button (`Updates.reloadAsync()` from `expo-updates`).

### HTTPS / WSS Enforcement
`lib/constants/config.ts` derives `WS_BASE_URL` by replacing `https://` with `wss://` (and `http://` with `ws://`). In non-dev builds (`!__DEV__`), a console warning is logged if the API base URL is not HTTPS — it does not crash the app, allowing `preview` builds to still use HTTP for QA against a staging server without HTTPS.

### Push Permission — One-Time Request
`usePushNotifications.ts` reads `@push_permission_asked` from AsyncStorage before showing the permission dialog. Once the user responds (allow or deny), the flag is set and the dialog is never shown again. On subsequent launches the hook reads the current permission status without prompting.

### In-App Notification Banner
When the app is foregrounded and a notification arrives, `expo-notifications` fires the `addNotificationReceivedListener` callback. The hook dispatches a Redux action `uiSlice.showNotificationBanner({ title, body })`. The root layout renders a `NotificationBanner` component that auto-dismisses after 4 seconds.
