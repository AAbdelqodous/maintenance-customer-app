# Feature Specification: Phase 3 — Production Readiness

**Feature Branch**: `002-phase-3-production`
**Created**: 2026-04-15
**Status**: In Progress
**Phase**: 3 of 7

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Receive Push Notifications (Priority: P1)

A customer who has granted notification permission receives push notifications when: a booking status changes, a new chat message arrives, a review reply is posted, or a complaint status is updated. Tapping a notification opens the relevant screen directly. On first launch after upgrade, the app requests notification permission.

**Why this priority**: Push notifications are the primary re-engagement mechanism. Without them, customers miss critical booking updates and must manually check the app.

**Independent Test**: Trigger a booking status update from the backend → customer's device receives a push notification → tap it → booking detail screen opens.

**Acceptance Scenarios**:

1. **Given** the app is launched for the first time with FCM support, **When** the home screen loads, **Then** a system permission dialog asks the user to allow notifications.
2. **Given** notification permission is granted, **When** a booking status changes on the backend, **Then** a push notification arrives on the device within 30 seconds.
3. **Given** a push notification, **When** the user taps it, **Then** the app navigates to the relevant screen (booking, chat, review, or complaint).
4. **Given** the app is in the foreground, **When** a push notification arrives, **Then** an in-app alert or banner is shown instead of a system notification.
5. **Given** the user has denied notification permission, **When** they attempt to enable it in settings, **Then** the app directs them to the device system settings.

---

### User Story 2 — App Store Distribution via EAS Build (Priority: P1)

The app can be built and distributed through Apple App Store and Google Play Store using Expo Application Services (EAS). The app has valid bundle identifiers, a unique scheme, and a registered EAS project ID. The build configuration produces signed release builds suitable for store submission.

**Why this priority**: Without valid EAS and store configuration, the app cannot be distributed to real users.

**Independent Test**: Run an EAS production build for Android → download the APK/AAB → install on a physical device → app opens and authenticates successfully.

**Acceptance Scenarios**:

1. **Given** the EAS project configuration, **When** a production build is triggered, **Then** the build succeeds without errors.
2. **Given** a production build installed on a device, **When** the user authenticates, **Then** all API calls succeed over HTTPS.
3. **Given** the app config, **When** inspected, **Then** `ios.bundleIdentifier`, `android.package`, and `extra.eas.projectId` are all populated with valid, unique values.

---

### User Story 3 — Automatic Session Refresh (Priority: P2)

A customer who has been using the app for more than 2.4 hours is not forced to re-login. The app silently refreshes the JWT using a refresh token before it expires. If the refresh fails (e.g., refresh token expired), the user is redirected to login with a clear message.

**Why this priority**: The current 2.4-hour JWT expiry forces re-login during normal usage sessions, degrading user experience.

**Independent Test**: Set up a session close to expiry → continue using the app → a new JWT is obtained silently → user remains on the current screen without interruption.

**Acceptance Scenarios**:

1. **Given** a JWT within 5 minutes of expiry, **When** the user performs any authenticated action, **Then** the token is silently refreshed and the action succeeds.
2. **Given** a refresh token that has expired, **When** the app attempts to refresh, **Then** the session is cleared and the user is redirected to login with a "Session expired" message.
3. **Given** a valid refresh token stored on the device, **When** the app is relaunched with an expired JWT, **Then** the session is restored automatically without showing the login screen.

---

### User Story 4 — Crash Reporting & Monitoring (Priority: P2)

When the app crashes or encounters an unhandled error, the crash is automatically reported to a monitoring service with enough context (stack trace, device info, user session state) to diagnose and reproduce the issue. No PII is included in crash reports.

**Why this priority**: Without crash reporting, production bugs are invisible. The team cannot prioritize fixes without data on what is actually failing.

**Independent Test**: Trigger a controlled crash in a test build → Sentry (or equivalent) dashboard shows the event with stack trace within 60 seconds.

**Acceptance Scenarios**:

1. **Given** the app encounters an unhandled error, **When** the crash occurs, **Then** a crash event is sent to the monitoring service automatically.
2. **Given** a crash report, **When** viewed in the monitoring dashboard, **Then** it includes: error message, stack trace, app version, OS version, and device model.
3. **Given** a crash report, **When** inspected, **Then** no PII (name, email, JWT, phone number) is present in the payload.
4. **Given** the app error boundary catches a render error, **When** it fires, **Then** a user-friendly error screen is shown and the error is reported.

---

### User Story 5 — Secure API Communication (Priority: P1)

All communication between the app and the backend uses HTTPS and WSS. There are no plain HTTP or WS connections in production builds.

**Why this priority**: Plain HTTP exposes user credentials and JWT tokens to network eavesdropping. This is a mandatory security baseline for store approval and user trust.

**Independent Test**: Inspect all network calls in a production build using a proxy tool → zero HTTP (non-TLS) requests should appear.

**Acceptance Scenarios**:

1. **Given** a production build, **When** any API call is made, **Then** the request uses HTTPS.
2. **Given** a production build, **When** a WebSocket connection is opened, **Then** it uses WSS.
3. **Given** the app config, **When** `EXPO_PUBLIC_API_BASE_URL` is set to an HTTPS URL, **Then** the WebSocket URL is derived as WSS automatically.

---

### Edge Cases

- What if the device has no EAS project ID configured? → The push notification registration call should fail gracefully with a logged warning, not a crash.
- What if a push notification arrives for a deleted booking? → The app should navigate to the bookings list rather than crashing on a not-found booking detail.
- What if the refresh token endpoint is unreachable (network error)? → Treat it the same as an expired refresh token — redirect to login rather than looping retries.
- What if the user revokes notification permission after granting it? → The app continues to function; notifications simply do not appear. No error is thrown.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST request push notification permission on first launch.
- **FR-002**: The app MUST register the device FCM token with the backend after permission is granted.
- **FR-003**: The app MUST handle incoming push notifications and navigate to the correct screen on tap.
- **FR-004**: The app MUST display in-app banners for notifications received while the app is in the foreground.
- **FR-005**: The app MUST have valid `ios.bundleIdentifier`, `android.package`, and `extra.eas.projectId` in the app config.
- **FR-006**: The app MUST use HTTPS for all API calls in production builds.
- **FR-007**: The app MUST use WSS for all WebSocket connections in production builds.
- **FR-008**: The app MUST silently refresh the JWT before expiry using a refresh token.
- **FR-009**: The app MUST redirect to login when the refresh token is expired or invalid.
- **FR-010**: The app MUST report unhandled crashes and errors to a monitoring service.
- **FR-011**: Crash reports MUST NOT contain PII.
- **FR-012**: The app MUST display a user-friendly error screen when the error boundary catches a render error.

### Key Entities

- **PushToken**: Expo push token string registered per device per user session.
- **RefreshToken**: Long-lived token stored in encrypted secure storage alongside the JWT.
- **CrashEvent**: Automatically captured error event with stack trace, device metadata, and app version (no PII).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Push notifications are delivered to the device within 30 seconds of the triggering backend event.
- **SC-002**: A production EAS build completes successfully for both Android and iOS targets.
- **SC-003**: 100% of API calls in production use HTTPS; 0 plain HTTP requests.
- **SC-004**: Users with an active refresh token are never forced to re-login during a continuous usage session.
- **SC-005**: Crash events appear in the monitoring dashboard within 60 seconds of occurrence.
- **SC-006**: Zero PII fields present in any crash report payload.

---

## Assumptions

- The backend provides a `/auth/refresh` endpoint accepting a refresh token and returning a new JWT + refresh token pair.
- The backend already implements `PUT /users/me/push-token` per the existing API contract.
- Sentry is the chosen crash monitoring service; the DSN is stored as an environment variable.
- EAS build profiles (development, preview, production) are configured in `eas.json`.
- Certificate pinning is deferred to a post-launch hardening phase and is out of scope for Phase 3.
- The app scheme (`lifeexperiencern`) will be updated to match the final bundle identifiers before store submission.
- Push notification deep-link targets are the same as defined in the Phase 3.5 `usePushNotifications` hook navigation map.
