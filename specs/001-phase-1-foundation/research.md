# Research: Phase 1 — Foundation

**Branch**: `phase-1-foundation`
**Date**: 2026-03-29
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: JWT Secure Storage

**Decision**: `expo-secure-store`
**Rationale**: Native encrypted storage backed by Keychain (iOS) and Android Keystore. Available in Expo managed workflow without ejecting. Synchronous API is acceptable for auth bootstrap. 2048-byte value limit is sufficient for JWTs.
**Alternatives considered**:
- `AsyncStorage` — rejected: plaintext, not suitable for tokens (Constitution §VI)
- `react-native-keychain` — rejected: requires bare workflow / native module linking
- `mmkv` with encryption — rejected: overkill, adds a native dependency not needed in managed workflow

---

## Decision 2: i18n Library

**Decision**: `react-i18next` + `i18next`
**Rationale**: Most mature i18n library for React/RN; supports namespaces, lazy loading, RTL detection hooks. Works natively with React 19. `expo-localization` provides device locale for initial language detection.
**Alternatives considered**:
- `react-native-i18n` — rejected: unmaintained
- `lingui` — rejected: less community support in React Native ecosystem
- Manual translation objects — rejected: doesn't scale past ~20 keys, no pluralisation

---

## Decision 3: RTL Layout Strategy

**Decision**: React Native built-in `I18nManager.forceRTL()` combined with a `useLanguage` hook that propagates `isRTL` to all screen components
**Rationale**: React Native's Yoga layout engine has native RTL support. A root `useLanguage` hook wraps `I18nManager.forceRTL()` and propagates the direction boolean to every screen. An app reload is required for `forceRTL` to take effect on Android — this is triggered via `expo-updates` `Updates.reloadAsync()` on language switch.
**Alternatives considered**:
- CSS `direction: rtl` only — rejected: doesn't flip RN layout engine (Yoga)
- Separate AR/EN component trees — rejected: violates DRY, doubles maintenance burden

---

## Decision 4: OTP Input Component

**Decision**: Custom `OtpInput` — 6 individual `TextInput` cells, auto-advance on digit entry, paste support
**Rationale**: No well-maintained library covers all RN versions + Expo managed workflow. A 6-cell custom component is ~80 lines, fully testable, and exactly matches the backend's 6-digit numeric token format.
**Alternatives considered**:
- `react-native-otp-entry` — evaluated: OK but adds a dependency, harder to style
- Single `TextInput` with `maxLength=6` — rejected: poor UX, hard to display as individual cells

---

## Decision 5: Session Bootstrap (App Launch Routing)

**Decision**: Root `app/_layout.tsx` reads SecureStore on mount → dispatches to Redux → Expo Router redirects based on `authSlice` state
**Rationale**: Expo Router's `<Redirect>` + `router.replace()` provide clean declarative redirects. Reading from SecureStore in the root layout (before any screen renders) prevents a flash of the wrong screen.
**Bootstrap sequence**:
```
App launches
  → root _layout reads SecureStore for JWT
  → if JWT present & not expired → redirect to /(app)/
  → if no JWT → check AsyncStorage for @onboarding_done
      → if not seen → redirect to /(onboarding)/
      → if seen → redirect to /(auth)/
```
**Alternatives considered**:
- Context-based auth provider — rejected: adds indirection; Redux slice is already required for API state
- Checking JWT expiry server-side only — rejected: would require an unnecessary API round-trip on every launch

---

## Decision 6: API Base URL Configuration

**Decision**: `.env` file read into `app.config.js` `extra` field, accessed via `expo-constants`
**Rationale**: Expo's `extra` field in `app.config.js` injects env vars at build time, accessible via `Constants.expoConfig.extra`. No native module required. Works in Expo Go and production builds.
**Values**:
- Dev (iOS Simulator / web): `http://localhost:8080/api/v1`
- Dev (Android Emulator): `http://10.0.2.2:8080/api/v1`
**Alternatives considered**:
- `react-native-config` — rejected: requires bare workflow
- Hardcoding — rejected: violates Constitution §VI and prevents environment swapping

---

## Decision 7: Form Validation

**Decision**: `react-hook-form` + `zod` schemas via `@hookform/resolvers/zod`
**Rationale**: react-hook-form is the de-facto standard for RN forms; minimal re-renders; zod provides type-safe schema validation aligned with TypeScript. Both lightweight and well-maintained.
**Zod validation for registration**:
- `firstname`, `lastname`: `z.string().min(1)`
- `email`: `z.string().email()`
- `password`: `z.string().min(8)`
**Alternatives considered**:
- `formik` — rejected: more verbose, slower re-render model
- Manual `useState` validation — rejected: doesn't scale, error-prone

---

## Decision 8: Testing Strategy

**Decision**: Jest + React Native Testing Library (RNTL) for unit and component tests
**Rationale**: Already part of Expo's default test setup. RNTL encourages testing by user behaviour, not implementation. E2E (Detox/Maestro) is deferred — unit coverage is sufficient for Phase 1 validation.
**Coverage targets**: `OtpInput`, `AuthInput`, `LanguageSwitcher` components + `authSlice` reducers
**Alternatives considered**:
- Detox E2E now — deferred: setup overhead too high for Phase 1; overkill for foundation validation
