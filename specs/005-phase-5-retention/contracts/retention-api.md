# API Contracts: Phase 4.5 — Retention

**Branch**: `005-phase-4-5-retention`
**Date**: 2026-04-15
**Backend Repo**: `life-experience-app/service-center` (Spring Boot)

All endpoints below are new (not yet implemented).

---

## Loyalty Endpoints

### `GET /loyalty/account`

Fetch the authenticated user's loyalty account.

**Request**
```
GET /api/v1/loyalty/account
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
{
  "totalPoints": 1250,
  "lifetimePoints": 3800,
  "tier": "SILVER",
  "tierMultiplier": 1.25,
  "tierProgress": {
    "currentPoints": 250,
    "requiredPoints": 1000,
    "percent": 25,
    "nextTier": "GOLD"
  },
  "expiringPoints": {
    "points": 200,
    "expiresAt": "2026-04-30"
  }
}
```

**Notes**: `expiringPoints` is `null` if no points expire this month.

---

### `GET /loyalty/rewards`

Fetch available rewards catalog.

**Request**
```
GET /api/v1/loyalty/rewards
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "code": "REWARD_10OFF",
    "nameAr": "خصم 10%",
    "nameEn": "10% Discount",
    "descriptionAr": null,
    "descriptionEn": null,
    "pointsRequired": 500,
    "rewardType": "DISCOUNT_PERCENT",
    "rewardValue": 10,
    "tierRequired": null,
    "canRedeem": true,
    "reasonCannotRedeem": null,
    "validUntil": "2026-12-31"
  },
  {
    "id": 2,
    "code": "REWARD_FREE_OIL",
    "nameAr": "تغيير زيت مجاني",
    "nameEn": "Free Oil Change",
    "pointsRequired": 2000,
    "rewardType": "FREE_SERVICE",
    "rewardValue": 1,
    "tierRequired": "GOLD",
    "canRedeem": false,
    "reasonCannotRedeem": "Requires Gold tier",
    "validUntil": null
  }
]
```

---

### `POST /loyalty/rewards/{rewardId}/redeem`

Redeem a reward.

**Request**
```
POST /api/v1/loyalty/rewards/{rewardId}/redeem
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```

**Response `200 OK`**
```json
{
  "redemptionCode": "REDEEM-ABC12345",
  "expiresAt": "2026-05-15",
  "pointsDeducted": 500,
  "remainingPoints": 750
}
```

**Error Responses**
| Code | Condition |
|------|-----------|
| `400` | Insufficient points or tier not met |
| `401` | Missing/expired JWT |
| `404` | Reward not found |
| `409` | Reward already redeemed by this user |

---

### `GET /loyalty/transactions`

Fetch paginated points transaction history.

**Request**
```
GET /api/v1/loyalty/transactions?page=0&size=20
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`** (standard paginated shape)
```json
{
  "content": [
    {
      "id": 55,
      "description": "Booking #42 completed",
      "pointsDelta": 125,
      "balanceAfter": 1250,
      "createdAt": "2026-04-15T14:30:00Z"
    },
    {
      "id": 54,
      "description": "Reward redeemed: 10% Discount",
      "pointsDelta": -500,
      "balanceAfter": 1125,
      "createdAt": "2026-04-10T09:00:00Z"
    }
  ],
  "totalElements": 24,
  "totalPages": 2,
  "number": 0,
  "size": 20,
  "last": false
}
```

---

## Vehicle Endpoints

### `GET /vehicles`

Fetch the authenticated user's vehicles.

**Request**
```
GET /api/v1/vehicles
Authorization: Bearer <jwt>
```

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "licensePlate": "12345",
    "color": "White",
    "currentMileage": 45000,
    "nickname": "My Daily Driver",
    "isPrimary": true,
    "createdAt": "2026-01-10T08:00:00Z"
  }
]
```

---

### `POST /vehicles`

Create a new vehicle.

**Request**
```
POST /api/v1/vehicles
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "licensePlate": "12345",
  "color": "White",
  "currentMileage": 45000,
  "nickname": "My Daily Driver"
}
```

**Response `201 Created`** — returns the created `UserVehicle` object.

**Error Responses**
| Code | Condition |
|------|-----------|
| `400` | Validation failure (year out of range, required fields missing) |
| `401` | Missing/expired JWT |

---

### `DELETE /vehicles/{vehicleId}`

Delete a vehicle.

**Response `204 No Content`**

---

### `GET /vehicles/{vehicleId}/dashboard`

Fetch vehicle dashboard (composite endpoint).

**Request**
```
GET /api/v1/vehicles/{vehicleId}/dashboard
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
{
  "vehicle": { /* UserVehicle object */ },
  "stats": {
    "totalServices": 3,
    "totalSpentKD": 45.500,
    "lastServiceDate": "2026-03-10"
  },
  "upcomingReminders": [ /* first 3 MaintenanceReminder objects */ ],
  "recentServices": [
    {
      "bookingId": 42,
      "centerNameEn": "Al Salam Auto",
      "centerNameAr": "مركز السلام للسيارات",
      "serviceType": "CAR",
      "completedAt": "2026-03-10T16:00:00Z",
      "amountKD": 18.500
    }
  ]
}
```

---

## Reminder Endpoints

### `GET /vehicles/{vehicleId}/reminders`

Fetch maintenance reminders for a vehicle.

**Request**
```
GET /api/v1/vehicles/{vehicleId}/reminders
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| `status` | `ReminderStatus` | Optional filter by status |
| `includeCompleted` | `boolean` | Default false |

**Response `200 OK`**
```json
[
  {
    "id": 10,
    "vehicleId": 1,
    "name": "Oil Change",
    "dueDate": "2026-04-10",
    "dueMileage": 50000,
    "priority": "HIGH",
    "status": "OVERDUE",
    "daysUntilDue": -5,
    "isCompleted": false
  },
  {
    "id": 11,
    "vehicleId": 1,
    "name": "Tyre Rotation",
    "dueDate": "2026-04-25",
    "dueMileage": null,
    "priority": "NORMAL",
    "status": "DUE_SOON",
    "daysUntilDue": 10,
    "isCompleted": false
  }
]
```

---

### `PATCH /reminders/{reminderId}/complete`

Mark a reminder as completed.

**Request**
```
PATCH /api/v1/reminders/{reminderId}/complete
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```

**Response `204 No Content`**

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing/expired JWT |
| `403` | Reminder belongs to a different user's vehicle |
| `404` | Reminder not found |

---

## Referral Endpoint

### `GET /referral`

Fetch the authenticated user's referral stats.

**Request**
```
GET /api/v1/referral
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
{
  "referralCode": "AHMED123",
  "shareUrl": "https://app.maintenancecenters.kw/join?ref=AHMED123",
  "totalReferrals": 3,
  "pendingReferrals": 1,
  "completedReferrals": 2,
  "totalPointsEarned": 400,
  "referrals": [
    {
      "referredName": "Mohammed",
      "status": "COMPLETED",
      "pointsEarned": 200,
      "referredAt": "2026-03-01"
    },
    {
      "referredName": "Sara",
      "status": "PENDING",
      "pointsEarned": 0,
      "referredAt": "2026-04-10"
    }
  ]
}
```

---

## RTK Query Endpoint Definitions (Mobile)

### `loyaltyApi.ts`

```typescript
getLoyaltyAccount: builder.query<LoyaltyAccount, void>({
  query: () => 'loyalty/account',
  providesTags: ['LoyaltyAccount'],
}),
getLoyaltyRewards: builder.query<LoyaltyReward[], void>({
  query: () => 'loyalty/rewards',
  providesTags: ['LoyaltyRewards'],
}),
redeemReward: builder.mutation<RedemptionResult, number>({
  query: (rewardId) => ({ url: `loyalty/rewards/${rewardId}/redeem`, method: 'POST', body: {} }),
  invalidatesTags: ['LoyaltyAccount', 'LoyaltyRewards'],
}),
getLoyaltyTransactions: builder.query<PaginatedResponse<LoyaltyTransaction>, { page: number; size: number }>({
  query: ({ page, size }) => ({ url: 'loyalty/transactions', params: { page, size } }),
  providesTags: ['LoyaltyTransactions'],
}),
```

### `vehiclesApi.ts`

```typescript
getVehicles: builder.query<UserVehicle[], void>({
  query: () => 'vehicles',
  providesTags: ['Vehicles'],
}),
createVehicle: builder.mutation<UserVehicle, CreateVehicleRequest>({
  query: (body) => ({ url: 'vehicles', method: 'POST', body }),
  invalidatesTags: ['Vehicles'],
}),
deleteVehicle: builder.mutation<void, number>({
  query: (id) => ({ url: `vehicles/${id}`, method: 'DELETE' }),
  invalidatesTags: ['Vehicles'],
}),
getVehicleDashboard: builder.query<VehicleDashboard, number>({
  query: (id) => `vehicles/${id}/dashboard`,
  providesTags: (result, error, id) => [{ type: 'VehicleDashboard', id }],
}),
```

### `remindersApi.ts`

```typescript
getVehicleReminders: builder.query<MaintenanceReminder[], number>({
  query: (vehicleId) => `vehicles/${vehicleId}/reminders`,
  providesTags: (result, error, vehicleId) => [{ type: 'Reminders', id: vehicleId }],
}),
completeReminder: builder.mutation<void, { reminderId: number; vehicleId: number }>({
  query: ({ reminderId }) => ({ url: `reminders/${reminderId}/complete`, method: 'PATCH', body: {} }),
  invalidatesTags: (result, error, { vehicleId }) => [{ type: 'Reminders', id: vehicleId }],
}),
```

### `referralApi.ts`

```typescript
getReferralStats: builder.query<ReferralStats, void>({
  query: () => 'referral',
  providesTags: ['Referral'],
}),
```

---

## Store Registration

```typescript
// store/index.ts — additions only
import { loyaltyApi } from './api/loyaltyApi';
import { vehiclesApi } from './api/vehiclesApi';
import { remindersApi } from './api/remindersApi';
import { referralApi } from './api/referralApi';

// Add to reducer:
[loyaltyApi.reducerPath]: loyaltyApi.reducer,
[vehiclesApi.reducerPath]: vehiclesApi.reducer,
[remindersApi.reducerPath]: remindersApi.reducer,
[referralApi.reducerPath]: referralApi.reducer,

// Add to middleware:
loyaltyApi.middleware,
vehiclesApi.middleware,
remindersApi.middleware,
referralApi.middleware,
```

---

## Shared Type

```typescript
// Used by loyaltyApi — paginated response following existing convention
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
```
