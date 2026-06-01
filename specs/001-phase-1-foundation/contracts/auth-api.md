# API Contract: Auth

**Branch**: `phase-1-foundation`
**Consumer**: React Native customer app (Phase 1)
**Provider**: Spring Boot backend (`/api/v1/auth/**`)
**Date**: 2026-03-29

---

## Endpoints

### `POST /api/v1/auth/register`

Create a new unverified user account and send a 6-digit OTP via email.

**Request**
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstname": "Ahmed",
  "lastname": "Al-Sayed",
  "email": "ahmed@example.com",
  "password": "Secure123!"
}
```

**Response `202 Accepted`** — empty body; OTP sent to email

**Error Responses**
| Code | businessErrorCode | Condition |
|------|-------------------|-----------|
| `400` | — | Validation failure — `validationErrors` array in body |
| `403` | `304` | Email already registered |

**Mobile behaviour**:
- `202` → navigate to OTP verification screen, pass `email` as route param
- `400` → display `validationErrors` inline on form fields
- `403/304` → show "Email already in use" error on email field

---

### `GET /api/v1/auth/activate-account?token={otp}`

Verify the 6-digit OTP and activate the user account.

**Request**
```
GET /api/v1/auth/activate-account?token=123456
(no body, no auth header)
```

**Response `200 OK`** — empty body; account activated

**Error Responses**
| Code | Condition |
|------|-----------|
| `400` | Token expired — backend auto-sends a new OTP |
| `400` | Token invalid (wrong digits) |

**Mobile behaviour**:
- `200` → immediately call `POST /auth/authenticate` with stored credentials (auto-login) → navigate to `/(app)/`
- `400` (expired) → show "A new code has been sent to your email" banner; clear OTP input
- `400` (invalid) → show "Incorrect code, please try again" inline error; keep OTP input focused

---

### `POST /api/v1/auth/authenticate`

Authenticate a user and receive a JWT.

**Request**
```
POST /api/v1/auth/authenticate
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "Secure123!"
}
```

**Response `200 OK`**
```json
{
  "token": "<JWT string>"
}
```

**Error Responses**
| Code | businessErrorCode | Condition |
|------|-------------------|-----------|
| `403` | `304` | Bad credentials |
| `403` | `302` | Account locked |
| `403` | `303` | Account not verified (OTP not completed) |

**Mobile behaviour**:
- `200` → decode JWT → `setJwt(token)` in SecureStore → `dispatch(setSession({ token }))` → navigate to `/(app)/`
- `403/303` → redirect to OTP verification screen (account not yet activated)
- `403/302` → show "Your account has been locked. Please contact support." dialog
- `403/304` → show "Incorrect email or password." inline error

---

## JWT Structure

The JWT contains the following claims (decoded client-side via `atob`, never signature-verified):

```json
{
  "sub": "ahmed@example.com",
  "fullName": "Ahmed Al-Sayed",
  "authorities": [{ "authority": "ROLE_USER" }],
  "iat": 1711700000,
  "exp": 1711786400
}
```

**Expiry**: `exp - iat` = 86 400 s (2.4 hours per backend config)
**Client usage**:
- Extract `fullName` for display in profile tab
- Extract `exp` to set `authSlice.exp` and detect session expiry

---

## Authentication Header (Phase 2+)

All protected endpoints require:
```
Authorization: Bearer <JWT>
```

RTK Query `prepareHeaders` in each API slice attaches this automatically from `authSlice.token`.

---

## RTK Query Endpoint Definitions (Mobile)

```typescript
// store/api/authApi.ts
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    register: builder.mutation<void, RegistrationRequest>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (body) => ({ url: 'auth/authenticate', method: 'POST', body }),
    }),
    activateAccount: builder.mutation<void, string>({
      query: (token) => ({ url: `auth/activate-account?token=${token}`, method: 'GET' }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useActivateAccountMutation } = authApi;
```

---

## Error Handling Matrix

| HTTP Status | businessErrorCode | Mobile Action |
|-------------|-------------------|---------------|
| `202` | — | Navigate to OTP screen |
| `200` (login) | — | Store JWT, navigate to home |
| `400` | — | Show `validationErrors` on form |
| `403` | `302` | "Account locked" dialog |
| `403` | `303` | Redirect to OTP verify screen |
| `403` | `304` | "Incorrect email or password" inline error |
| `5xx` | — | "Server error, please try again" toast |
| Network error | — | "No internet connection" banner (via `useNetworkStatus`) |
