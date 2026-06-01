# Research: Phase 3 — Production Readiness

**Branch**: `002-phase-3-production`
**Date**: 2026-04-16

---

## Decision 1: Push Notification Library

**Decision**: Use `expo-notifications` (Expo managed workflow SDK)
**Rationale**: The app is in Expo managed workflow. `expo-notifications` is the standard library for this configuration, handles FCM (Android) and APNs (iOS) behind the scenes, provides `getExpoPushTokenAsync` for Expo Push Service, and is compatible with bare/managed workflows. `@notifee/react-native` would require ejecting to bare workflow.
**Alternatives considered**:
- `@notifee/react-native` — more powerful but requires bare workflow + native module linking; rejected.
- `react-native-push-notification` — unmaintained, not Expo-compatible; rejected.
**Additional dependency**: `expo-device` (required by `expo-notifications` to check if running on physical device before requesting token — simulators cannot receive push tokens).

---

## Decision 2: Push Token — Expo Push Service vs. FCM Direct

**Decision**: Use Expo Push Service token (`getExpoPushTokenAsync`) for development/staging; direct FCM token (`getDevicePushTokenAsync`) for production store builds
**Rationale**: Expo Push Service abstracts the FCM/APNs difference and simplifies backend integration during development. The backend (`PUT /users/me/push-token`) stores the token string — switching from Expo token to raw FCM token is a backend-side concern once EAS project ID is configured.
**Alternatives considered**:
- FCM direct from day one — requires native Google Services JSON / GoogleService-Info.plist in EAS build config; deferred to production build phase.

---

## Decision 3: EAS Build Configuration

**Decision**: Add `eas.json` with three profiles: `development` (internal distribution), `preview` (APK for QA), `production` (store submission)
**Rationale**: Standard EAS multi-profile pattern. `development` profile uses `developmentClient: true` for hot reload. `preview` builds an unsigned APK. `production` builds a signed AAB for Play Store / IPA for App Store.
**Alternatives considered**:
- Classic Expo build (`expo build:android`) — deprecated; rejected.

---

## Decision 4: Bundle Identifiers

**Decision**:
- iOS bundle identifier: `kw.maintenancecenters.customer`
- Android package: `kw.maintenancecenters.customer`
- EAS project ID: to be created via `eas init` (not yet assigned)
**Rationale**: Reverse-domain convention with `.kw` TLD matching the Kuwait market. Consistent across iOS/Android for predictable deep-link scheme matching.
**Alternatives considered**:
- `com.lifeexperience.maintenancecustomer` — rejected; `lifeexperiencern` scheme in app.json suggests the company brand, but the product brand is `maintenancecenters.kw`.

---

## Decision 5: Refresh Token Storage

**Decision**: Store refresh token in `expo-secure-store` under key `auth_refresh_token`
**Rationale**: Refresh token is sensitive (long-lived). Must be stored in encrypted secure storage alongside the JWT — never in AsyncStorage. Same store that holds the JWT (`auth_jwt`).
**Alternatives considered**:
- AsyncStorage — unencrypted; rejected per Constitution §VI.
- In-memory Redux state — lost on app restart; defeats the purpose; rejected.

---

## Decision 6: Token Refresh — Interceptor vs. Middleware

**Decision**: Implement refresh in RTK Query `baseQuery` wrapper using `re-auth` pattern with mutex lock
**Rationale**: RTK Query provides a documented pattern: wrap `fetchBaseQuery` in a `baseQueryWithReauth` function. When a 401 is received: (1) acquire mutex, (2) call refresh endpoint, (3) update stored JWT, (4) retry original request. The mutex prevents parallel requests from each triggering their own refresh.
**Alternatives considered**:
- Redux middleware — intercepts at Redux level but cannot retry the original network request; rejected.
- Axios interceptors — not used in this project (RTK Query uses fetch); rejected.
**Library**: `async-mutex` for mutex lock (`npm install async-mutex`)

---

## Decision 7: Crash Reporting — Sentry vs. Firebase Crashlytics

**Decision**: Use Sentry (`@sentry/react-native` via `@sentry/expo` wrapper)
**Rationale**: Sentry has first-class Expo managed workflow support via `@sentry/expo`. Provides source map upload, React Native error boundary integration, performance tracing, and a generous free tier. Firebase Crashlytics requires native module configuration that is more complex in managed workflow.
**Alternatives considered**:
- Firebase Crashlytics — requires `@react-native-firebase/crashlytics`; adds significant bundle size; native config required; rejected.
- Bugsnag — viable but less community adoption in Expo ecosystem; rejected.
**Package**: `@sentry/expo` (wraps `@sentry/react-native`)

---

## Decision 8: No PII in Crash Reports

**Decision**: Call `Sentry.setUser({ id: userId })` only — never set `email`, `username`, or `name` in Sentry context
**Rationale**: Constitution §VI prohibits PII in logs. Using only an opaque numeric `id` satisfies Constitution while still allowing per-user crash analysis.
**Implementation**: Set Sentry user context after login using Redux `userId` field from decoded JWT. Clear on logout.

---

## Decision 9: HTTPS Enforcement

**Decision**: Validate `EXPO_PUBLIC_API_BASE_URL` starts with `https://` at app startup in production builds; derive WSS from HTTPS by replacing `https://` with `wss://`
**Rationale**: In development, `http://10.0.2.2:8080` is acceptable (local backend). In production EAS builds, the URL must be HTTPS. A startup assertion catches misconfiguration early. The existing `WS_BASE_URL` derivation in `lib/constants/config.ts` already converts `http://` → `ws://` — needs to also handle `https://` → `wss://`.
**Alternatives considered**:
- Certificate pinning — deferred post-launch per spec assumption; out of scope for Phase 3.

---

## Decision 10: In-App Notification Banners

**Decision**: Use `expo-notifications` `setNotificationHandler` to display custom in-app banners when the app is foregrounded
**Rationale**: `expo-notifications` fires a JS event when a notification arrives in the foreground. The `usePushNotifications` hook listens to this event and dispatches to a Redux `notificationsSlice` action that triggers a temporary banner component in the root layout.
**Alternatives considered**:
- Native system notification in foreground — shows as system overlay (OS-specific); not ideal for in-app UX.

---

## Decision 11: Deep Link Navigation from Notification Tap

**Decision**: Use `expo-notifications` `addNotificationResponseReceivedListener`; parse `data.type` and `data.entityId` from notification payload; navigate via `router.push`
**Rationale**: The existing navigation map from CLAUDE.md defines the target screens. Notification data from the backend includes `type` (matching `NotificationType`) and `entityId`. The hook maps type → route.
**Navigation map**:
| NotificationType | Target Route |
|------------------|-------------|
| `BOOKING_UPDATE` | `/bookings/{entityId}` |
| `NEW_MESSAGE` | `/chat/{entityId}` |
| `REVIEW_REPLY` | `/reviews` |
| `COMPLAINT_UPDATE` | `/complaints/{entityId}` |

---

## Decision 12: Push Notification Permission Flow

**Decision**: Request permission on first authenticated screen load (home tab), not on app launch
**Rationale**: Requesting permission immediately on cold launch is a pattern that reduces grant rates. Showing it after the user is authenticated and has seen the home screen provides better context. One-time request only — guard with `AsyncStorage` flag `@push_permission_asked`.
**Alternatives considered**:
- On app launch before onboarding — too early; rejected.
- On each booking creation — too late and disruptive; rejected.
