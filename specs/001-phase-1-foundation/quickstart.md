# Quickstart: Phase 1 — Foundation

**Branch**: `phase-1-foundation`
**Date**: 2026-03-29

---

## Prerequisites

Fresh Expo SDK 54 project with no prior dependencies. Verify:
```bash
cd ~/MaintenanceCenters/maintenance-customer-app
cat app.json | grep '"expo"'   # Must be Expo SDK 54
node --version                  # 18+ required
```

---

## Environment Setup

Create `.env` at project root (add to `.gitignore`):
```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

Update `app.config.js` to read the env var:
```javascript
extra: {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
}
```

---

## Dependencies to Install

```bash
# Expo-managed packages (use npx expo install to get compatible versions)
npx expo install expo-secure-store @react-native-async-storage/async-storage expo-localization

# npm packages
npm install react-i18next i18next
npm install @reduxjs/toolkit react-redux
npm install react-hook-form zod @hookform/resolvers

# Dev / testing
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

---

## Backend Requirements

| Endpoint | Required For |
|----------|-------------|
| `POST /auth/register` | User Registration (US2) |
| `GET /auth/activate-account?token=` | OTP Verification (US2) |
| `POST /auth/authenticate` | User Login (US3) |

**Backend available at**: `http://10.0.2.2:8080` (Android emulator) or `http://localhost:8080` (web / iOS simulator)
**Email delivery in dev**: MailDev running at `http://localhost:1080` — OTPs appear here

---

## Running the App

```bash
npx expo start --web    # Fastest for UI development (no emulator needed)
npx expo start          # Native (Android: press 'a', iOS: press 'i')
```

---

## New Files to Create

In implementation order (to avoid import errors):

```
lib/constants/config.ts              # API_BASE_URL from app.config.js
lib/secureStorage.ts                 # getJwt / setJwt / deleteJwt
lib/i18n/locales/en.json             # English translations
lib/i18n/locales/ar.json             # Arabic translations
lib/i18n/index.ts                    # i18next init + async locale load
store/authSlice.ts                   # Auth state + JWT decode
store/uiSlice.ts                     # locale + isRTL
store/api/authApi.ts                 # register + login + activateAccount
store/index.ts                       # configureStore + 401 middleware
hooks/useAuth.ts                     # session helpers + logout
hooks/useLanguage.ts                 # locale + switchLanguage
components/ui/AppText.tsx            # RTL-aware Text wrapper
components/ui/AppButton.tsx          # Primary/secondary button
components/ui/LanguageSwitcher.tsx   # AR/EN toggle
components/auth/AuthInput.tsx        # Text input with label + error
components/auth/PasswordInput.tsx    # Password input with show/hide
components/auth/AuthButton.tsx       # Auth-styled submit button
components/auth/OtpInput.tsx         # 6-cell OTP input
components/onboarding/OnboardingSlide.tsx
components/onboarding/OnboardingDots.tsx
app/_layout.tsx                      # Root layout: Provider + i18n + session bootstrap
app/index.tsx                        # Splash redirect
app/(onboarding)/_layout.tsx
app/(onboarding)/index.tsx           # 3-slide carousel
app/(auth)/_layout.tsx
app/(auth)/index.tsx                 # Auth entry: Sign In / Create Account
app/(auth)/register.tsx              # Registration form
app/(auth)/otp-verify.tsx            # OTP verification + auto-login
app/(auth)/login.tsx                 # Login form
app/(app)/_layout.tsx                # Auth guard + expiry check
app/(app)/index.tsx                  # Home placeholder
```

---

## Key Implementation Patterns

### OTP Auto-Advance
```tsx
// 6 TextInput cells, each with a ref
// On digit entry: advance focus to next cell
// On backspace: focus previous cell
// On paste: distribute 6 digits across all cells
<TextInput
  ref={refs[i]}
  keyboardType="numeric"
  maxLength={1}
  onChangeText={(val) => { if (val) refs[i + 1]?.current?.focus(); }}
/>
```

### Session Bootstrap
```tsx
// app/_layout.tsx — runs before any screen renders
useEffect(() => {
  (async () => {
    const token = await getJwt();
    if (token) {
      const { exp } = decodeJwt(token);
      if (exp * 1000 > Date.now()) {
        dispatch(setSession({ token }));
        router.replace('/(app)/');
        return;
      }
      await deleteJwt();
    }
    const seen = await AsyncStorage.getItem('@onboarding_done');
    router.replace(seen ? '/(auth)/' : '/(onboarding)/');
  })();
}, []);
```

### Language Switch + Reload
```typescript
// hooks/useLanguage.ts
const switchLanguage = async (locale: Locale) => {
  await AsyncStorage.setItem('@locale', locale);
  await i18n.changeLanguage(locale);
  I18nManager.forceRTL(locale === 'ar');
  await Updates.reloadAsync(); // Full reload for RTL engine to take effect
};
```

---

## Testing Checklist

### User Story 1 — Onboarding
- [ ] Fresh install → 3 onboarding slides appear automatically
- [ ] Tap "Skip" on slide 2 → auth entry screen (not slide 3)
- [ ] Complete all 3 slides → auth entry screen
- [ ] Relaunch app → onboarding NOT shown again
- [ ] Switch to Arabic → onboarding slides in Arabic with RTL layout

### User Story 2 — Registration
- [ ] Complete registration form with valid data → "Check your email" + OTP screen
- [ ] Enter correct OTP from MailDev → account activated → home screen
- [ ] Enter wrong OTP → "Incorrect code" error shown
- [ ] Enter expired OTP → "New code sent to your email" banner + OTP input cleared
- [ ] Register with existing email → "Email already in use" error

### User Story 3 — Login
- [ ] Login with valid credentials → home screen
- [ ] Login with wrong credentials → "Incorrect email or password" error
- [ ] Login with locked account → "Account locked" dialog
- [ ] Login with unverified account → redirect to OTP screen
- [ ] Close app after login → reopen → straight to home (session persisted)

### User Story 4 — Language
- [ ] Tap AR → all text in Arabic, layout switches to RTL
- [ ] Tap EN → all text in English, layout switches to LTR
- [ ] Restart after switching to Arabic → Arabic still active

### User Story 5 — Session Expiry & Logout
- [ ] Manually expire token → reopen app → login screen with "session expired" message
- [ ] Tap "Log Out" → auth entry screen; JWT cleared from SecureStore
- [ ] Navigate to protected screen after logout → redirected to auth (not crash)
