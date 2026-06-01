# Data Model: Phase 3 — Production Readiness

**Branch**: `002-phase-3-production`
**Date**: 2026-04-16

---

## Entity Definitions

### 1. PushToken (New — authApi.ts extension)

```typescript
// Sent to backend after permission granted
export interface RegisterPushTokenRequest {
  token: string;           // Expo push token or FCM device token
  platform: 'ios' | 'android' | 'web';
}
```

**Notes**: Backend stores one token per user per device session. Sending the same token again is idempotent. Token is cleared when the user logs out (optional — backend may handle expiry).

---

### 2. RefreshTokenRequest / RefreshTokenResponse (New — authApi.ts extension)

```typescript
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;     // New short-lived JWT
  refreshToken: string;    // New refresh token (rotation)
}
```

**Notes**: Backend rotates the refresh token on each use (single-use refresh tokens). The old refresh token is invalidated after use.

---

### 3. AuthState — Extended (Existing `store/authSlice.ts`)

Current shape:
```typescript
interface AuthState {
  token: string | null;
  exp: number | null;
  fullName: string | null;
  userId: number | null;
}
```

Extended with:
```typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;     // NEW — stored in SecureStore + Redux
  exp: number | null;
  fullName: string | null;
  userId: number | null;
  isRefreshing: boolean;           // NEW — prevents UI flickering during refresh
}
```

New actions:
- `setRefreshToken(token: string)` — stores refresh token in Redux
- `setIsRefreshing(value: boolean)` — flag during silent refresh

---

### 4. CrashEvent (Conceptual — Sentry-managed)

No TypeScript type needed — Sentry SDK captures automatically. The app controls:
- **User context**: `{ id: userId }` only (no PII)
- **Tags**: `appVersion`, `buildProfile` (development/preview/production)
- **Breadcrumbs**: Navigation events, Redux action names (no payload)

---

### 5. EASConfig (app.json additions)

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "kw.maintenancecenters.customer",
      "supportsTablet": true
    },
    "android": {
      "package": "kw.maintenancecenters.customer",
      "adaptiveIcon": { ... }
    },
    "extra": {
      "eas": {
        "projectId": "<to-be-assigned-via-eas-init>"
      }
    },
    "plugins": [
      "expo-notifications",
      ...
    ]
  }
}
```

---

### 6. NotificationData (Push payload shape — from backend)

```typescript
// Carried in notification.request.content.data
export interface PushNotificationData {
  type: NotificationType;    // Existing enum from notificationsSlice
  entityId?: number;         // bookingId, conversationId, complaintId, etc.
}
```

---

## SecureStore Keys (additions)

| Key | Value | Description |
|-----|-------|-------------|
| `auth_refresh_token` | string | Long-lived refresh token |

---

## i18n Key Additions

### `en.json` additions
```json
{
  "auth": {
    "sessionExpiredRefresh": "Your session was refreshed automatically.",
    "refreshFailed": "Your session has expired. Please sign in again."
  },
  "notifications": {
    "permissionTitle": "Stay Updated",
    "permissionMessage": "Allow notifications to get booking updates and messages.",
    "permissionAllow": "Allow",
    "permissionDeny": "Not Now",
    "systemSettingsPrompt": "Enable notifications in your device settings."
  },
  "errors": {
    "crashTitle": "Something went wrong",
    "crashMessage": "The app encountered an unexpected error. Please restart.",
    "crashRetry": "Restart App"
  }
}
```

### `ar.json` additions
```json
{
  "auth": {
    "sessionExpiredRefresh": "تم تجديد جلستك تلقائياً.",
    "refreshFailed": "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى."
  },
  "notifications": {
    "permissionTitle": "ابق على اطلاع",
    "permissionMessage": "اسمح بالإشعارات لتلقي تحديثات الحجوزات والرسائل.",
    "permissionAllow": "السماح",
    "permissionDeny": "ليس الآن",
    "systemSettingsPrompt": "قم بتفعيل الإشعارات في إعدادات جهازك."
  },
  "errors": {
    "crashTitle": "حدث خطأ ما",
    "crashMessage": "واجه التطبيق خطأ غير متوقع. يرجى إعادة التشغيل.",
    "crashRetry": "إعادة تشغيل التطبيق"
  }
}
```
