# Feature Specification: Phase 1 — Foundation

**Feature Branch**: `phase-1-foundation`
**Created**: 2026-03-29
**Status**: Draft
**Phase**: 1 of 7

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — First Launch & Onboarding (Priority: P1)

A brand-new user opens the app for the first time. They are greeted by a short onboarding flow (3 slides) that explains the platform's value: find maintenance centers, book services, track repairs. They can skip at any point. After completing or skipping onboarding, they land on a "Get Started" screen with options to sign in or register.

**Why this priority**: Every user must pass through this path exactly once. It is the entry gate to all other functionality. Without it, the app has no starting point.

**Independent Test**: Install a fresh build, open the app, swipe through onboarding, tap Skip — should arrive at auth entry screen.

**Acceptance Scenarios**:

1. **Given** a fresh install with no prior session, **When** the app launches, **Then** the onboarding slides appear automatically.
2. **Given** the user is on slide 2 of 3, **When** they tap "Skip", **Then** they are taken directly to the auth entry screen.
3. **Given** the user has already completed onboarding, **When** they relaunch the app, **Then** onboarding is NOT shown again.
4. **Given** the onboarding flow, **When** displayed in Arabic locale, **Then** all text is in Arabic and the layout is right-to-left.

---

### User Story 2 — User Registration (Priority: P1)

A new user taps "Create Account". They enter their first name, last name, email, and password. The system sends a 6-digit OTP to their email. They enter the OTP on a verification screen. Upon successful verification, their account is activated and they are logged in automatically.

**Why this priority**: Registration is the prerequisite for all authenticated features (booking, reviews, favorites). Without a working registration flow, no other phase can be user-tested end-to-end.

**Independent Test**: Complete registration with a real email, receive OTP in MailDev, enter it — session should be active with a valid JWT.

**Acceptance Scenarios**:

1. **Given** the registration form, **When** the user submits valid details, **Then** a success message appears and an OTP is sent to their email.
2. **Given** the OTP verification screen, **When** the user enters the correct 6-digit code, **Then** the account is activated and the user is navigated to the home screen.
3. **Given** the OTP verification screen, **When** the user enters an incorrect code, **Then** an error message is shown and they can retry.
4. **Given** an expired OTP, **When** the user submits it, **Then** the system automatically resends a new OTP and informs the user.
5. **Given** registration with an already-registered email, **When** submitted, **Then** a clear error is shown ("Email already in use").
6. **Given** the registration form in Arabic, **When** rendered, **Then** all labels, placeholders, and error messages appear in Arabic with RTL layout.

---

### User Story 3 — User Login (Priority: P1)

A returning user taps "Sign In". They enter their email and password. The system validates credentials and returns a JWT. The user is navigated to the home screen. The session persists across app restarts.

**Why this priority**: Returning users need to authenticate to access all protected features.

**Independent Test**: Log in with a verified account, close and reopen the app — should land directly on the home screen without re-authenticating.

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** the user submits the login form, **Then** they are navigated to the home screen with an active session.
2. **Given** incorrect credentials, **When** submitted, **Then** an error message is shown ("Username and/or password is incorrect").
3. **Given** a locked account, **When** login is attempted, **Then** a message explains the account is locked.
4. **Given** a non-verified account (OTP not completed), **When** login is attempted, **Then** the user is redirected to the OTP verification screen.
5. **Given** an active session stored on device, **When** the app is relaunched, **Then** the user is navigated directly to the home screen without seeing the login screen.

---

### User Story 4 — Language Selection (Priority: P2)

A user can switch the app language between Arabic and English. The selected language persists across sessions. All screens immediately re-render in the chosen language and layout direction (RTL for Arabic, LTR for English).

**Why this priority**: Bilingual support is a constitution-level requirement. It must work from Phase 1 so all future screens are built with it baked in.

**Independent Test**: Switch language to Arabic, navigate to login screen — all labels appear in Arabic with RTL layout.

**Acceptance Scenarios**:

1. **Given** the app in English, **When** the user switches to Arabic, **Then** all visible text changes to Arabic and the layout flips to RTL.
2. **Given** the app in Arabic, **When** the user restarts the app, **Then** Arabic remains the active language.
3. **Given** the app in Arabic, **When** the user switches to English, **Then** all text changes to English and the layout switches to LTR.

---

### User Story 5 — Session Expiry & Logout (Priority: P2)

When a user's JWT expires (after 2.4 hours of inactivity), any attempt to access a protected screen should automatically redirect them to the login screen. Users can also manually log out from any authenticated screen.

**Why this priority**: Security baseline. Required before any protected screens are built in Phase 2+.

**Independent Test**: Manually expire a token, navigate to a protected screen — should redirect to login.

**Acceptance Scenarios**:

1. **Given** an expired JWT, **When** a protected screen is navigated to, **Then** the user is redirected to the login screen with a message ("Your session has expired, please sign in again").
2. **Given** an authenticated user, **When** they tap "Log Out", **Then** the JWT is cleared from secure storage and they are navigated to the auth entry screen.

---

### Edge Cases

- What happens when the device has no internet on first launch? → Onboarding still shows (it is local), but registration/login forms show a "No internet connection" message when submitted.
- What happens when the OTP email fails to send? → Show a "Failed to send verification email, please try again" message with a resend button.
- What happens when the user force-closes the app mid-registration before OTP entry? → On next open, if no active session, start from the auth entry screen (no partial state retained).
- What happens if the user enters the OTP with extra spaces or lowercase? → The input should be sanitized (trimmed, uppercased if alpha) before submission.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display an onboarding flow of 3 slides to first-time users only.
- **FR-002**: The app MUST allow users to skip onboarding at any point.
- **FR-003**: The app MUST persist the "onboarding seen" state so it is not shown again after completion or skip.
- **FR-004**: The app MUST provide a registration form collecting: first name, last name, email, password.
- **FR-005**: The app MUST validate all registration fields before submission (required fields, valid email format, password minimum length of 8 characters).
- **FR-006**: The app MUST display inline validation errors in the active language.
- **FR-007**: The app MUST provide an OTP verification screen that accepts a 6-digit numeric code.
- **FR-008**: The app MUST provide a login form accepting email and password.
- **FR-009**: The app MUST store the JWT in encrypted secure storage after login.
- **FR-010**: The app MUST restore the session from secure storage on launch and navigate accordingly.
- **FR-011**: The app MUST support language switching between Arabic (RTL) and English (LTR) at any time.
- **FR-012**: The selected language MUST persist across app restarts.
- **FR-013**: The app MUST handle expired JWTs by clearing the session and redirecting to the login screen.
- **FR-014**: The app MUST provide a logout action that clears all session data.
- **FR-015**: All user-facing strings MUST be delivered via i18n keys — no hardcoded display text.

### Key Entities

- **User**: First name, last name, email address, account enabled status, active session (JWT).
- **Session**: JWT token, expiry timestamp — stored in encrypted secure storage.
- **Language Preference**: Selected locale (`ar` or `en`) — stored in persistent local storage.
- **Onboarding State**: Boolean flag indicating whether onboarding has been seen — stored in persistent local storage.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration (form → OTP → home screen) in under 2 minutes on a mid-range Android device.
- **SC-002**: A returning user can log in and reach the home screen in under 30 seconds.
- **SC-003**: Language switching takes effect immediately (under 300ms) with no screen reload required.
- **SC-004**: 100% of user-facing strings are translated — zero hardcoded display text present in any screen.
- **SC-005**: The app session survives 3 consecutive app restarts without requiring re-login (within JWT expiry window).
- **SC-006**: All 5 screens in this phase (Onboarding, Auth Entry, Register, OTP Verify, Login) render correctly in both Arabic (RTL) and English (LTR).

---

## Assumptions

- The Spring Boot backend is running and reachable at the configured API base URL during testing.
- Email delivery is handled by MailDev in development; production email config is out of scope for this phase.
- Password reset / forgot password flow is out of scope for Phase 1 (planned for Phase 5 — User Profile).
- Social login (Google, Apple) is out of scope for all phases unless explicitly added to a future spec.
- The app targets iOS and Android; web support via Expo is not a requirement.
- Biometric login (Face ID / fingerprint) is out of scope for Phase 1 but the secure storage setup MUST not prevent its addition later.
- The OTP input is numeric-only (6 digits), matching the backend's 6-digit numeric token format.
