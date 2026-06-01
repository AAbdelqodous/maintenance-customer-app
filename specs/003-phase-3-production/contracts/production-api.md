# API Contracts: Phase 3 — Production Readiness

**Branch**: `002-phase-3-production`
**Date**: 2026-04-16
**Backend Repo**: `life-experience-app/service-center` (Spring Boot)

Phase 3 adds two backend interactions: push token registration (extends existing `profileApi`) and JWT refresh (extends existing `authApi`). All other Phase 3 work is client-side only (EAS config, Sentry, HTTPS enforcement).

---

## Auth Endpoints (extensions to existing `authApi.ts`)

### `POST /auth/refresh`

Silently refresh an expired JWT using the stored refresh token.

**Request**
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<stored-refresh-token>"
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIG5ldyByZWZyZXNoIHRva2Vu..."
}
```

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Refresh token expired or invalid |
| `404` | Refresh token not found (already used / rotated) |

**Notes**: Refresh token is single-use — backend rotates on each call. Both the new `accessToken` and `refreshToken` must be stored.

---

### `POST /auth/logout` *(optional — invalidate refresh token server-side)*

Invalidate the refresh token on logout.

**Request**
```
POST /api/v1/auth/logout
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "refreshToken": "<current-refresh-token>"
}
```

**Response `204 No Content`**

**Notes**: Best-effort — even if this call fails, the client must clear local tokens. Call before `deleteJwt()` + `deleteRefreshToken()`.

---

## Profile Endpoints (extensions to existing `profileApi.ts`)

### `PUT /users/me/push-token`

Register a device push token for the authenticated user.

**Request**
```
PUT /api/v1/users/me/push-token
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android"
}
```

**Response `204 No Content`**

**Error Responses**
| Code | Condition |
|------|-----------|
| `400` | Invalid token format |
| `401` | Missing/expired JWT |

**Notes**: Idempotent — sending the same token again is safe. Called once after push permission is granted.

---

## RTK Query Extensions

### `authApi.ts` — Add `refreshToken` mutation

```typescript
refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
  query: (body) => ({
    url: 'auth/refresh',
    method: 'POST',
    body,
  }),
}),
logoutServer: builder.mutation<void, { refreshToken: string }>({
  query: (body) => ({
    url: 'auth/logout',
    method: 'POST',
    body,
  }),
}),
```

### `profileApi.ts` — Add `registerPushToken` mutation

```typescript
registerPushToken: builder.mutation<void, RegisterPushTokenRequest>({
  query: (body) => ({
    url: 'users/me/push-token',
    method: 'PUT',
    body,
  }),
}),
```

---

## `baseQueryWithReauth` — Token Refresh Wrapper

This replaces the plain `fetchBaseQuery` in **all** RTK Query slices via a shared `store/api/baseQuery.ts` utility.

```typescript
// store/api/baseQuery.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { getJwt, setJwt, deleteJwt } from '../../lib/secureStorage';
import { getRefreshToken, setRefreshToken, deleteRefreshToken } from '../../lib/secureStorage';
import { clearSession, setSession } from '../authSlice';
import { API_BASE_URL } from '../../lib/constants/config';

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    const token = await getJwt();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const refreshResult = await rawBaseQuery(
            { url: 'auth/refresh', method: 'POST', body: { refreshToken } },
            api,
            extraOptions
          );
          if (refreshResult.data) {
            const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as RefreshTokenResponse;
            await setJwt(accessToken);
            await setRefreshToken(newRefreshToken);
            api.dispatch(setSession({ token: accessToken }));
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            await deleteJwt();
            await deleteRefreshToken();
            api.dispatch(clearSession());
          }
        } else {
          api.dispatch(clearSession());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }
  return result;
};
```

---

## EAS Build Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```
