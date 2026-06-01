# Quickstart: Phase 3 — Production Readiness

**Branch**: `002-phase-3-production`
**Date**: 2026-04-16

---

## Prerequisites

All Phase 2 — Core Screens features must be implemented. Verify:
```bash
cd ~/MaintenanceCenters/maintenance-customer-app
cat package.json | grep '"expo-updates"'        # Must exist
cat app.json | grep '"scheme"'                  # Must show "lifeexperiencern"
```

New prerequisites for Phase 3:
```bash
# Install new packages
npx expo install expo-notifications expo-device
npm install async-mutex @sentry/expo

# Create EAS project (requires Expo account)
eas init   # Assigns projectId → copy to app.json extra.eas.projectId

# Set Sentry DSN in .env
echo "EXPO_PUBLIC_SENTRY_DSN=https://xxxx@o0.ingest.sentry.io/xxxx" >> .env
```

---

## Environment Variables

Add to `.env`:
```
EXPO_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1   # dev (HTTP ok)
# Production builds should use: https://api.maintenancecenters.kw/api/v1
```

Add to `app.config.js`:
```js
extra: {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  eas: { projectId: '<your-project-id>' },
}
```

---

## Backend Requirements

| Endpoint | Required For |
|----------|-------------|
| `POST /auth/refresh` | Session Refresh (US3) |
| `POST /auth/logout` | Server-side token invalidation on logout |
| `PUT /users/me/push-token` | Push notification registration (US1) |

**Backend provides a refresh token on login**: The `/auth/login` response must include a `refreshToken` field alongside `accessToken`. Confirm with backend team before implementing US3.

---

## Running the App

```bash
npx expo start --web        # Web (no push notifications — clipboard fallback)
npx expo start              # Native dev client
eas build --profile preview --platform android   # Preview APK
eas build --profile production --platform all    # Store build
```

---

## New Files to Create

In implementation order:
```
lib/secureStorage.ts                    # MOD: add getRefreshToken / setRefreshToken / deleteRefreshToken
store/api/baseQuery.ts                  # NEW: baseQueryWithReauth with async-mutex
store/api/authApi.ts                    # MOD: add refreshToken + logoutServer mutations
store/api/profileApi.ts                 # MOD: add registerPushToken mutation
store/authSlice.ts                      # MOD: add refreshToken, isRefreshing fields + actions
hooks/usePushNotifications.ts           # NEW: permission request, token registration, notification listeners
app/(app)/(tabs)/index.tsx              # MOD: call usePushNotifications on home tab mount
app/_layout.tsx                         # MOD: init Sentry; update error boundary to report to Sentry
lib/constants/config.ts                 # MOD: SENTRY_DSN from extra; HTTPS validation
app.json                                # MOD: bundleIdentifier, package, projectId, expo-notifications plugin
eas.json                                # NEW: build profiles
All existing createApi slices           # MOD: replace fetchBaseQuery with baseQueryWithReauth
```

---

## Testing Checklist

### Push Notifications (US1)
- [ ] First launch after install → notification permission dialog appears (physical device only)
- [ ] Grant permission → no crash; token registered with backend (`PUT /users/me/push-token` returns 204)
- [ ] Deny permission → app continues normally; no error shown
- [ ] Send test push from backend → notification appears on device within 30s
- [ ] Tap notification → navigates to correct screen (booking, chat, complaint, or reviews)
- [ ] App in foreground + notification arrives → in-app banner shown (not system notification)
- [ ] Switch to Arabic → permission dialog in Arabic

### EAS Build (US2)
- [ ] `app.json` has `ios.bundleIdentifier = "kw.maintenancecenters.customer"`
- [ ] `app.json` has `android.package = "kw.maintenancecenters.customer"`
- [ ] `app.json` has `extra.eas.projectId` populated
- [ ] `eas.json` present with development/preview/production profiles
- [ ] `eas build --profile preview --platform android` completes successfully
- [ ] Preview APK installs on physical Android device and authenticates successfully

### Session Refresh (US3)
- [ ] Login with valid credentials → `refreshToken` stored in SecureStore
- [ ] Simulate JWT expiry → next API call silently refreshes → user remains on current screen
- [ ] Backend refresh endpoint returns 401 (expired refresh token) → redirect to login with "session expired" message
- [ ] Two concurrent API calls during refresh → only one refresh request sent (mutex working)
- [ ] Logout → `DELETE /auth/logout` called → both tokens cleared from SecureStore

### Crash Reporting (US4)
- [ ] Sentry initialised on app start → no console errors
- [ ] Trigger a controlled JS throw → Sentry dashboard shows event within 60s
- [ ] Crash report contains: error message, stack trace, app version, OS version, device model
- [ ] Crash report does NOT contain: email, name, JWT, phone number
- [ ] Error boundary catches render error → user-friendly "Something went wrong" screen shown
- [ ] "Restart App" button on error screen reloads the app

### Secure API (US5)
- [ ] `EXPO_PUBLIC_API_BASE_URL` set to `https://` URL → all requests use HTTPS
- [ ] WebSocket URL correctly derived as `wss://` when base URL is `https://`
- [ ] `EXPO_PUBLIC_API_BASE_URL` set to `http://` in a production build → startup assertion logged as warning
