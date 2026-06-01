# Data Model: Phase 1 — Foundation

**Branch**: `phase-1-foundation`
**Date**: 2026-03-29

---

## Client-Side Entities

These are the data shapes the mobile app works with. They map to backend API responses but are not identical — no password fields, no internal backend fields.

---

### 1. AuthUser

Represents the currently logged-in user held in Redux state.

```typescript
interface AuthUser {
  email: string;
  firstname: string;
  lastname: string;
  fullName: string;  // `${firstname} ${lastname}` — derived from JWT claim
}
```

**Source**: Decoded from the JWT `fullName` claim on login. Not stored to disk — reconstructed from JWT on each app boot.

---

### 2. Session

Represents the authentication session held in Redux and persisted to expo-secure-store.

```typescript
interface Session {
  token: string;      // Raw JWT string
  expiresAt: number;  // Unix timestamp (ms) — decoded from JWT `exp` claim
}
```

**Validation rules**:
- `token`: non-empty string
- `expiresAt`: must be > `Date.now()` to be considered valid

**State transitions**:
```
null (no session)
  → ACTIVE  (login / OTP verification + auto-login succeeds)
  → EXPIRED (expiresAt < Date.now() detected on app focus)
  → null    (logout / 401 received / token cleared)
```

---

### 3. LanguagePreference

Persisted to AsyncStorage under key `@locale`.

```typescript
type Locale = 'ar' | 'en';

interface LanguagePreference {
  locale: Locale;   // Default: 'ar'
  isRTL: boolean;   // true when locale === 'ar'
}
```

---

### 4. OnboardingState

Persisted to AsyncStorage under key `@onboarding_done`.

```typescript
interface OnboardingState {
  hasSeenOnboarding: boolean;  // Default: false; set to true on first skip or completion
}
```

---

## Redux State Shape

```typescript
// store/authSlice.ts
interface AuthState {
  token: string | null;
  exp: number | null;       // expiresAt — Unix timestamp ms
  fullName: string | null;  // Decoded from JWT
  userId: number | null;    // Decoded from JWT sub if numeric, else null
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// store/uiSlice.ts
interface UIState {
  locale: Locale;   // 'ar' | 'en'
  isRTL: boolean;
}
```

**Actions — authSlice**:
| Action | Payload | Effect |
|--------|---------|--------|
| `setSession` | `{ token: string }` | Decode JWT, set token + exp + fullName |
| `clearSession` | — | Reset all auth fields to null |
| `setAuthError` | `string` | Set error message |

**Actions — uiSlice**:
| Action | Payload | Effect |
|--------|---------|--------|
| `setLocale` | `Locale` | Update locale + isRTL |

---

## API Request / Response Shapes

Matching the Spring Boot backend DTOs exactly.

### RegistrationRequest
```typescript
interface RegistrationRequest {
  firstname: string;   // required, non-empty
  lastname: string;    // required, non-empty
  email: string;       // required, valid email format
  password: string;    // required, min 8 characters
}
```
**Response**: `202 Accepted` (empty body) — OTP sent via email

---

### AuthRequest (Login)
```typescript
interface AuthRequest {
  email: string;
  password: string;
}
```
**Response**: `200 OK`
```typescript
interface AuthResponse {
  token: string;  // JWT
}
```

---

### ActivateAccountParams
```typescript
// GET /api/v1/auth/activate-account?token=123456
interface ActivateAccountParams {
  token: string;  // 6-digit numeric OTP
}
```
**Response**: `200 OK` (empty body on success)

---

### ErrorResponse
```typescript
interface ErrorResponse {
  businessErrorCode?: number;
  businessErrorDescription?: string;
  error?: string;
  validationErrors?: string[];
  errors?: Record<string, string>;
}
```

---

## Storage Keys

### AsyncStorage
```typescript
const ASYNC_KEYS = {
  LOCALE: '@locale',              // 'ar' | 'en'
  ONBOARDING_DONE: '@onboarding_done',  // 'true' | undefined
} as const;
```

### SecureStore (expo-secure-store)
```typescript
const SECURE_KEYS = {
  JWT: 'auth_jwt',  // Raw JWT string
} as const;
```

---

## Component Props

### `OnboardingSlide`
```typescript
interface Props {
  title: string;      // i18n key
  body: string;       // i18n key
  image: ImageSourcePropType;
}
```

### `AuthInput`
```typescript
interface Props extends TextInputProps {
  label: string;         // i18n key
  error?: string;        // validation error message (i18n key)
  isRTL: boolean;
}
```

### `OtpInput`
```typescript
interface Props {
  length?: number;           // default 6
  onComplete: (otp: string) => void;
  isRTL: boolean;
}
```

### `AppButton`
```typescript
interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  isRTL?: boolean;
}
```

---

## i18n Key Structure (Phase 1)

```json
{
  "common": { "skip": "...", "next": "...", "back": "...", "loading": "..." },
  "auth": {
    "signIn": "...", "createAccount": "...", "emailLabel": "...",
    "passwordLabel": "...", "loginButton": "...", "registerButton": "...",
    "otpTitle": "...", "otpSubtitle": "...", "verifyButton": "...",
    "errors": { "invalidCredentials": "...", "accountLocked": "...", "accountDisabled": "..." }
  },
  "onboarding": {
    "slide1Title": "...", "slide1Body": "...",
    "slide2Title": "...", "slide2Body": "...",
    "slide3Title": "...", "slide3Body": "..."
  },
  "profile": { "logout": "..." },
  "language": { "switchTo": "...", "arabic": "...", "english": "..." },
  "errors": { "noInternet": "...", "serverError": "...", "sessionExpired": "..." }
}
```
