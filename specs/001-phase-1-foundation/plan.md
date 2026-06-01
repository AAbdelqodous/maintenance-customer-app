# Implementation Plan: Phase 1 — Foundation

**Branch**: `phase-1-foundation` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-phase-1-foundation/spec.md`

---

## Summary

Phase 1 establishes the complete foundation for the React Native customer app: Expo SDK 54 project scaffold, Redux Toolkit store with JWT auth slice and 401 middleware, RTK Query API client, expo-secure-store JWT persistence, react-i18next with Arabic RTL and English LTR, onboarding carousel (3 slides, one-time only), full auth flow (register → OTP verify → login with JWT decode and `exp` check), session expiry detection, and language switching. 51 tasks — all complete.

---

## Technical Context

**Language/Version**: TypeScript 5.x / React Native 0.81.5 + Expo SDK 54
**Primary Dependencies**: Redux Toolkit + RTK Query, React Hook Form + Zod, react-i18next, expo-secure-store, @react-native-async-storage/async-storage
**Storage**: expo-secure-store (JWT key `auth_jwt`), AsyncStorage (`@locale`, `@onboarding_done`)
**Testing**: Jest + @testing-library/react-native
**Target Platform**: iOS + Android (Expo managed workflow)
**Performance Goals**: Login completes in < 30 s; language switch in < 300 ms
**Constraints**: RTL mandatory (Arabic default); JWT required for all protected routes; onboarding shown exactly once

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md complete and approved |
| II. Bilingual First | ✅ Pass | All 5 screens AR/EN; RTL via `i18n.dir()` |
| III. Component-Driven UI | ⚠️ Exception | `StyleSheet.create()` — NativeWind migration is a separate refactor |
| IV. API Contract Adherence | ✅ Pass | RTK Query for all auth endpoints; fully typed |
| V. Offline-Awareness | ✅ Pass | All forms show offline banner; onboarding is local-only |
| VI. Security & Privacy | ✅ Pass | JWT in expo-secure-store; 401 middleware clears session |

**Gate result: PASS with justified exception on Principle III.**

---

## Project Structure

```text
store/
├── index.ts                          [NEW] configureStore + 401 middleware; RootState, AppDispatch
├── authSlice.ts                      [NEW] AuthState, decodeJwt, setSession/clearSession/setUser
├── uiSlice.ts                        [NEW] locale, isRTL; setLocale action
└── api/
    └── authApi.ts                    [NEW] register, login, activateAccount — RTK Query

components/
├── auth/
│   ├── AuthInput.tsx                 [NEW] Reusable text input with i18n label + error
│   ├── PasswordInput.tsx             [NEW] Password input with show/hide toggle
│   ├── AuthButton.tsx                [NEW] Auth-styled submit button with loading state
│   └── OtpInput.tsx                  [NEW] 6-cell OTP with auto-advance and paste support
├── onboarding/
│   ├── OnboardingSlide.tsx           [NEW] Single slide: image + title + body
│   └── OnboardingDots.tsx            [NEW] Progress dots matching current slide index
└── ui/
    ├── AppText.tsx                   [NEW] RTL-aware Text wrapper
    ├── AppButton.tsx                 [NEW] Primary/secondary button with loading state
    └── LanguageSwitcher.tsx          [NEW] AR/EN toggle button

hooks/
├── useAuth.ts                        [NEW] session, isAuthenticated, isSessionExpired(), logout()
└── useLanguage.ts                    [NEW] locale, isRTL, switchLanguage()

lib/
├── constants/config.ts               [NEW] API_BASE_URL from app.config.js extra; localhost fallback
├── secureStorage.ts                  [NEW] getJwt / setJwt / deleteJwt via expo-secure-store
└── i18n/
    ├── index.ts                      [NEW] i18next init; reads @locale from AsyncStorage; default 'ar'
    └── locales/
        ├── en.json                   [NEW] English translations for all Phase 1 keys
        └── ar.json                   [NEW] Arabic translations for all Phase 1 keys

app/
├── _layout.tsx                       [NEW] Root layout: Redux Provider + i18n init + session bootstrap
├── index.tsx                         [NEW] Splash redirect (checks onboarding flag + session)
├── (onboarding)/
│   ├── _layout.tsx                   [NEW] Onboarding stack layout
│   └── index.tsx                     [NEW] 3-slide carousel; skip/next; writes @onboarding_done
├── (auth)/
│   ├── _layout.tsx                   [NEW] Auth stack layout
│   ├── index.tsx                     [NEW] Auth entry: Sign In / Create Account + LanguageSwitcher
│   ├── login.tsx                     [NEW] Login form; handles 200/302/303/304 responses
│   ├── register.tsx                  [NEW] Registration form with Zod validation
│   └── otp-verify.tsx                [NEW] OTP verification + activate + auto-login
└── (app)/
    ├── _layout.tsx                   [NEW] Auth guard + session expiry check on focus
    └── index.tsx                     [NEW] Home placeholder with welcome message + logout
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `StyleSheet.create()` (Constitution §III) | Standard Expo/RN pattern used across all phases. | NativeWind migration is a separate cross-phase refactor. |

---

## Implementation Order

```
Group 1 (no dependencies — all parallel):
  .env + app.config.js
  en.json + ar.json
  lib/secureStorage.ts
  lib/constants/config.ts

Group 2 (depends on Group 1):
  store/authSlice.ts + store/uiSlice.ts + store/api/authApi.ts
  lib/i18n/index.ts
  hooks/useAuth.ts + hooks/useLanguage.ts
  components/ui/AppText.tsx + AppButton.tsx

Group 3 (depends on Group 2):
  store/index.ts (registers all slices + middleware)
  app/_layout.tsx (wraps Provider + i18n init)

Group 4 (depends on Group 3 — all parallel):
  components/auth/* + components/onboarding/*
  app/(onboarding)/*
  app/(auth)/*

Group 5 (depends on Group 4):
  app/(auth)/otp-verify.tsx (depends on register flow)
  app/(app)/_layout.tsx + app/(app)/index.tsx
  Session expiry guard wired in (app)/_layout.tsx
```

---

## Design Decisions

### JWT Decode — No Library
JWT payload decoded inline: `JSON.parse(atob(token.split('.')[1]))`. No external library. Client never verifies signature — only reads `exp` and `fullName` from payload.

### AsyncStorage Keys
- `@onboarding_done` — string `'true'`; checked in `app/index.tsx` splash redirect
- `@locale` — `'ar'` or `'en'`; read on i18n init; defaults to `'ar'`

### 401 Middleware
RTK Query `fetchBaseQuery` with `prepareHeaders` injects the JWT header. A Redux middleware intercepts any RTK Query fulfilled/rejected action with HTTP 401 → dispatches `clearSession` → the `(app)/_layout.tsx` focus listener redirects to `/(auth)/`.

### OTP Auto-Advance
6 individual `TextInput` components with forwarded refs. Each digit typed advances focus to the next cell. Paste detected when input length > 1 in any cell — distributes digits across cells.

### Session Bootstrap Sequence
1. `app/_layout.tsx` mounts → reads JWT from SecureStore
2. If JWT present + not expired → `dispatch(setSession)` → navigate `/(app)/`
3. If JWT present + expired → `dispatch(clearSession)` → navigate `/(auth)/` with `?reason=expired`
4. If no JWT → check `@onboarding_done` → navigate `/(onboarding)/` or `/(auth)/`
