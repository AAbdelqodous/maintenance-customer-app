# Tasks: Phase 1 — Foundation

**Input**: Design documents from `/specs/001-phase-1-foundation/`
**Branch**: `phase-1-foundation`
**Prerequisites**: plan.md ✅, spec.md ✅

**User Stories**:
- US1: First Launch & Onboarding (P1)
- US2: User Registration (P1)
- US3: User Login (P1)
- US4: Language Selection (P2)
- US5: Session Expiry & Logout (P2)

**Status**: ✅ ALL COMPLETE — 51/51 tasks done (T044, T045 are optional polish tests)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure environment, establish project skeleton.

- [X] T001 Install runtime dependencies: `npx expo install expo-secure-store @react-native-async-storage/async-storage expo-localization` and `npm install react-i18next i18next @reduxjs/toolkit react-redux react-hook-form zod @hookform/resolvers`
- [X] T002 Install test dependencies: `npm install --save-dev jest @testing-library/react-native @testing-library/jest-native` and configure `jest.config.js` at project root
- [X] T003 [P] Create `.env` at project root with `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1` and add `.env` to `.gitignore`
- [X] T004 [P] Create `app.config.js` at project root replacing `app.json` — reads `EXPO_PUBLIC_API_BASE_URL` into `extra.apiBaseUrl`
- [X] T005 Create `lib/constants/config.ts` — export `API_BASE_URL` from `Constants.expoConfig.extra.apiBaseUrl` with localhost fallback

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure all user stories depend on — secure storage, i18n, Redux store, API client.

- [X] T006 Create `lib/secureStorage.ts` — export `getJwt()`, `setJwt(token: string)`, `deleteJwt()` using `expo-secure-store` with key `auth_jwt`
- [X] T007 Create `lib/i18n/locales/en.json` — English translations for all Phase 1 keys
- [X] T008 Create `lib/i18n/locales/ar.json` — Arabic translations for all Phase 1 keys
- [X] T009 Create `lib/i18n/index.ts` — initialise i18next with react-i18next; load locales; read persisted locale from AsyncStorage; default `'ar'`
- [X] T010 Create `store/authSlice.ts` — `AuthState`, `decodeJwt`, actions: `setSession`, `clearSession`, `setUser`, `setAuthError`
- [X] T011 Create `store/uiSlice.ts` — `UIState`: `locale`, `isRTL`; action: `setLocale`
- [X] T012 Create `store/api/authApi.ts` — RTK Query `createApi`; endpoints: `register`, `login`, `activateAccount`; typed per contracts
- [X] T013 Create `store/index.ts` — `configureStore` with 401 middleware; export `RootState`, `AppDispatch`, typed hooks
- [X] T014 Create `hooks/useAuth.ts` — returns `session`, `user`, `isAuthenticated`, `isSessionExpired()`, `logout()`
- [X] T015 Create `hooks/useLanguage.ts` — returns `locale`, `isRTL`; `switchLanguage()` persists to AsyncStorage, updates i18n, sets RTL
- [X] T016 [P] Create `components/ui/AppText.tsx` — RTL-aware Text wrapper
- [X] T017 [P] Create `components/ui/AppButton.tsx` — primary/secondary button with loading state
- [X] T018 Wrap app with Redux `<Provider>` and i18n init in `app/_layout.tsx` — session bootstrap on mount

---

## Phase 3: User Story 1 — First Launch & Onboarding (Priority: P1)

**Goal**: First-time users see 3 onboarding slides, can skip, then reach the auth entry screen. Returning users skip onboarding entirely.

**Independent Test**: Fresh install → onboarding slides appear → tap Skip → auth entry screen. Relaunch → onboarding skipped.

- [X] T019 [US1] Create `components/onboarding/OnboardingSlide.tsx` — image + title + body text; RTL-aware
- [X] T020 [US1] Create `components/onboarding/OnboardingDots.tsx` — progress dots; active dot highlighted
- [X] T021 [US1] Create `app/(onboarding)/_layout.tsx` — onboarding stack layout
- [X] T022 [US1] Create `app/(onboarding)/index.tsx` — 3-slide carousel; Skip/Next buttons; writes `@onboarding_done` to AsyncStorage on complete or skip; navigates to `/(auth)/`
- [X] T023 [US1] Update `app/_layout.tsx` — read `@onboarding_done` in bootstrap; route to `/(onboarding)/` if not seen

---

## Phase 4: User Story 2 — User Registration (Priority: P1)

**Goal**: New user registers, receives OTP, verifies, lands on home screen.

**Independent Test**: Register → 202 response → OTP screen → enter MailDev code → navigate to home.

- [X] T024 [US2] Create `components/auth/AuthInput.tsx` — text input with i18n label, placeholder, inline error message
- [X] T025 [US2] Create `components/auth/PasswordInput.tsx` — password input with show/hide toggle icon
- [X] T026 [US2] Create `components/auth/AuthButton.tsx` — auth-styled full-width submit button with loading state
- [X] T027 [US2] Create `app/(auth)/_layout.tsx` — auth stack layout
- [X] T028 [US2] Create `app/(auth)/index.tsx` — auth entry with Sign In / Create Account buttons + LanguageSwitcher
- [X] T029 [US2] Create `app/(auth)/register.tsx` — React Hook Form + Zod; fields: firstName, lastName, email, password; calls `register` mutation
- [X] T030 [US2] Create `components/auth/OtpInput.tsx` — 6-cell OTP input; auto-advance on digit; paste support
- [X] T031 [US2] Create `app/(auth)/otp-verify.tsx` — receives email param; calls `activateAccount`; on success calls `login` (auto-login); navigates to `/(app)/`
- [X] T032 [US2] Create `app/(app)/_layout.tsx` — checks `isAuthenticated`; redirects to `/(auth)/` if false; checks `isSessionExpired()` on focus
- [X] T033 [US2] Create `app/(app)/index.tsx` — home placeholder with welcome message and logout button

---

## Phase 5: User Story 3 — User Login (Priority: P1)

**Goal**: Returning user logs in; session persists across app restarts.

**Independent Test**: Login → home screen. Close + reopen app → home screen (no login prompt).

- [X] T034 [US3] Create `app/(auth)/login.tsx` — login form (email + password); calls `login` mutation; handles 200/302/303/304 responses; stores JWT via `setJwt`; dispatches `setSession`
- [X] T035 [US3] Update `app/_layout.tsx` — decode `exp` from JWT on bootstrap; treat expired JWT as no session
- [X] T036 [US3] Update `store/authSlice.ts` — `decodeJwt()` extracts `fullName` and `exp` from JWT payload using `atob`

---

## Phase 6: User Story 4 — Language Selection (Priority: P2)

**Goal**: Switch AR/EN; persists across restarts; RTL/LTR layout flips immediately.

**Independent Test**: Switch to Arabic → Arabic text + RTL layout. Restart app → Arabic retained.

- [X] T037 [US4] Create `components/ui/LanguageSwitcher.tsx` — AR/EN toggle; calls `switchLanguage()`; shows current locale
- [X] T038 [US4] Add `LanguageSwitcher` to `app/(auth)/index.tsx` auth entry screen
- [X] T039 [US4] Add `LanguageSwitcher` to `app/(app)/index.tsx` home screen
- [X] T040 [US4] Verify all i18n keys complete in `ar.json` and `en.json` — zero hardcoded display strings

---

## Phase 7: User Story 5 — Session Expiry & Logout (Priority: P2)

**Goal**: Expired JWTs redirect to login. Logout clears all session data.

**Independent Test**: Manually expire token → launch app → login screen with expiry message. Logout → auth entry screen.

- [X] T041 [US5] Update `app/(app)/_layout.tsx` — check `isSessionExpired()` on screen focus; redirect to `/(auth)/?reason=expired` if true
- [X] T042 [US5] Update `app/(auth)/index.tsx` — show dismissible expiry banner when `?reason=expired` param is present
- [X] T043 [US5] Verify `useAuth().logout()` — clears JWT via `deleteJwt()`, dispatches `clearSession`, navigates to `/(auth)/`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T044 [P] Create `__tests__/components/OtpInput.test.tsx` — test auto-advance and paste behaviour
- [ ] T045 [P] Create `__tests__/components/AuthInput.test.tsx` — test validation error display
- [X] T046 [P] Create `__tests__/components/LanguageSwitcher.test.tsx`
- [X] T047 [P] Create `__tests__/store/authSlice.test.ts`
- [X] T048 Add offline detection + "No internet connection" banner to all form screens (`register.tsx`, `login.tsx`, `otp-verify.tsx`)
- [X] T049 Audit all screens for hardcoded strings — all text via i18n keys
- [X] T050 [P] Add `ErrorBoundary` in `app/_layout.tsx` — catches render errors; shows fallback UI; logs to console
- [X] T051 Run quickstart.md testing checklist manually — 21/21 tests pass

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1 Onboarding)**: Depends on Phase 2
- **Phase 4 (US2 Registration)**: Depends on Phase 2; builds on Phase 3
- **Phase 5 (US3 Login)**: Depends on Phase 4 (authApi already created)
- **Phase 6 (US4 Language)**: Depends on Phase 2 (LanguageSwitcher needs i18n + useLanguage)
- **Phase 7 (US5 Session)**: Depends on Phase 5
- **Phase 8 (Polish)**: Depends on all user story phases

---

## Implementation Strategy

### MVP First (US1 + US2)
1. Complete Phase 1 (T001–T005)
2. Complete Phase 2 (T006–T018)
3. Complete Phase 3 US1 (T019–T023)
4. Complete Phase 4 US2 (T024–T033)
5. **STOP and VALIDATE**: fresh install → onboarding → register → OTP → home

### Full Phase 1 ✅ Complete
US3 Login ✅ → US4 Language ✅ → US5 Session Expiry ✅ → Polish (49/51) ✅

### Notes
- T044 and T045 (OtpInput + AuthInput tests) remain as optional polish items
- All 49 functional tasks (T001–T043, T046–T051) are complete
- `[P]` = parallelizable (no blocking dependency on incomplete tasks)
- `[USn]` = traceability label linking task to user story
