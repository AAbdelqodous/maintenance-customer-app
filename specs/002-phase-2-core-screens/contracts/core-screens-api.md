# API Contracts: Phase 2 — Core Screens

**Branch**: `001-phase-2-core-screens`
**Date**: 2026-04-15
**Backend Repo**: `life-experience-app/service-center` (Spring Boot)

All endpoints use `Authorization: Bearer <jwt>` and `Accept-Language: ar | en`.
Paginated responses follow the shape: `{ content, totalElements, totalPages, number, size }`.

---

## Centers API (`store/api/centersApi.ts`)

### `GET /centers`
```
GET /api/v1/centers?page=0&size=10&search=toyota&category=CAR
```
Returns paginated `ServiceCenter[]`. `search` and `category` are optional.

**RTK Query**:
```typescript
getCenters: builder.query<PaginatedResponse<ServiceCenter>, GetCentersParams>({
  query: ({ page = 0, size = 10, search, category }) => ({
    url: 'centers',
    params: { page, size, ...(search && { search }), ...(category && { category }) },
  }),
  providesTags: ['Centers'],
}),
```

### `GET /centers/{id}`
Returns single `ServiceCenter`.
```typescript
getCenterById: builder.query<ServiceCenter, number>({
  query: (id) => `centers/${id}`,
  providesTags: (result, error, id) => [{ type: 'Center', id }],
}),
```

### `GET /centers/{id}/reviews?page=0&size=10`
Returns paginated `Review[]` for a center.
```typescript
getCenterReviews: builder.query<PaginatedResponse<Review>, { centerId: number; page: number }>({
  query: ({ centerId, page }) => ({ url: `centers/${centerId}/reviews`, params: { page, size: 10 } }),
  providesTags: (result, error, { centerId }) => [{ type: 'CenterReviews', id: centerId }],
}),
```

### `GET /centers/categories`
Returns `string[]` of available service categories.

---

## Bookings API (`store/api/bookingsApi.ts`)

### `POST /bookings`
```json
{
  "centerId": 1,
  "serviceType": "CAR",
  "bookingDate": "2026-05-01",
  "bookingTime": "10:00:00",
  "notes": "Bring spare parts",
  "paymentMethod": "CASH"
}
```
Returns `201 Created` with created `Booking` object.
```typescript
createBooking: builder.mutation<Booking, CreateBookingRequest>({
  query: (body) => ({ url: 'bookings', method: 'POST', body }),
  invalidatesTags: ['Bookings'],
}),
```

### `GET /bookings?page=0&size=10&status=PENDING`
Returns paginated `Booking[]`. `status` is optional.
```typescript
getBookings: builder.query<PaginatedResponse<Booking>, GetBookingsParams>({
  query: ({ page = 0, size = 10, status }) => ({
    url: 'bookings',
    params: { page, size, ...(status && status !== 'ALL' && { status }) },
  }),
  providesTags: ['Bookings'],
}),
```

### `GET /bookings/{id}`
Returns single `Booking`.
```typescript
getBookingById: builder.query<Booking, number>({
  query: (id) => `bookings/${id}`,
  providesTags: (result, error, id) => [{ type: 'Booking', id }],
}),
```

### `DELETE /bookings/{id}`
Returns `204 No Content`. Only allowed when `bookingStatus` is `PENDING` or `CONFIRMED`.
```typescript
cancelBooking: builder.mutation<void, number>({
  query: (id) => ({ url: `bookings/${id}`, method: 'DELETE' }),
  invalidatesTags: (result, error, id) => ['Bookings', { type: 'Booking', id }],
}),
```

---

## Chat API (`store/api/chatApi.ts`)

### `GET /conversations`
Returns `Conversation[]`.
```typescript
getConversations: builder.query<Conversation[], void>({
  query: () => 'conversations',
  providesTags: ['Conversations'],
}),
```

### `GET /conversations/{id}/messages?page=0&size=30`
Returns paginated `Message[]`.
```typescript
getMessages: builder.query<PaginatedResponse<Message>, { conversationId: number; page: number }>({
  query: ({ conversationId, page }) => ({
    url: `conversations/${conversationId}/messages`,
    params: { page, size: 30 },
  }),
  providesTags: (result, error, { conversationId }) => [{ type: 'Messages', id: conversationId }],
}),
```

### `POST /conversations`
Start a new conversation with a center.
```json
{ "centerId": 1 }
```
Returns `201 Created` with `Conversation` object.
```typescript
startConversation: builder.mutation<Conversation, { centerId: number }>({
  query: (body) => ({ url: 'conversations', method: 'POST', body }),
  invalidatesTags: ['Conversations'],
}),
```

### WebSocket: STOMP over `/ws`

```typescript
// hooks/useWebSocketChat.ts
const client = new Client({
  brokerURL: `${WS_BASE_URL}/ws`,
  connectHeaders: { Authorization: `Bearer ${jwt}` },
  reconnectDelay: 5000,
  onConnect: () => {
    client.subscribe(`/topic/conversation/${conversationId}`, (frame) => {
      const message: Message = JSON.parse(frame.body);
      dispatch(chatSlice.actions.addMessage({ conversationId, message }));
    });
  },
});
```

**Send message via STOMP**:
```typescript
client.publish({
  destination: `/app/conversation/${conversationId}/send`,
  body: JSON.stringify({ content: text, messageType: 'TEXT' }),
  headers: { Authorization: `Bearer ${jwt}` },
});
```

---

## Reviews API (`store/api/reviewsApi.ts`)

### `POST /reviews`
```json
{ "centerId": 1, "bookingId": 42, "rating": 5, "comment": "Excellent service" }
```
Returns `201 Created` with `Review`.
```typescript
createReview: builder.mutation<Review, CreateReviewRequest>({
  query: (body) => ({ url: 'reviews', method: 'POST', body }),
  invalidatesTags: ['Reviews', 'CenterReviews'],
}),
```

### `GET /reviews/my`
Returns `Review[]` for the authenticated customer.
```typescript
getMyReviews: builder.query<Review[], void>({
  query: () => 'reviews/my',
  providesTags: ['Reviews'],
}),
```

---

## Favorites API (`store/api/favoritesApi.ts`)

### `POST /favorites/{centerId}`
Add a center to favorites. Returns `204 No Content`.

### `DELETE /favorites/{centerId}`
Remove a center from favorites. Returns `204 No Content`.

### `GET /favorites/{centerId}/check`
Returns `{ isFavorited: boolean }`.

### `GET /favorites`
Returns `ServiceCenter[]` — the user's full favorites list.

```typescript
addFavorite: builder.mutation<void, number>({
  query: (centerId) => ({ url: `favorites/${centerId}`, method: 'POST' }),
  invalidatesTags: ['Favorites'],
}),
removeFavorite: builder.mutation<void, number>({
  query: (centerId) => ({ url: `favorites/${centerId}`, method: 'DELETE' }),
  invalidatesTags: ['Favorites'],
}),
getFavorites: builder.query<ServiceCenter[], void>({
  query: () => 'favorites',
  providesTags: ['Favorites'],
}),
```

---

## Notifications API (`store/api/notificationsApi.ts`)

### `GET /notifications?page=0&size=20`
Returns paginated `Notification[]`.

### `PATCH /notifications/{id}/read`
Mark single notification as read. Returns `204 No Content`.

### `PATCH /notifications/read-all`
Mark all notifications as read. Returns `204 No Content`.

### `DELETE /notifications/{id}`
Delete a notification. Returns `204 No Content`.

```typescript
getNotifications: builder.query<PaginatedResponse<Notification>, { page: number }>({
  query: ({ page }) => ({ url: 'notifications', params: { page, size: 20 } }),
  providesTags: ['Notifications'],
}),
markNotificationRead: builder.mutation<void, number>({
  query: (id) => ({ url: `notifications/${id}/read`, method: 'PATCH' }),
  invalidatesTags: ['Notifications'],
}),
markAllRead: builder.mutation<void, void>({
  query: () => ({ url: 'notifications/read-all', method: 'PATCH' }),
  invalidatesTags: ['Notifications'],
}),
```

---

## Complaints API (`store/api/complaintsApi.ts`)

### `POST /complaints`
```json
{ "bookingId": 42, "complaintType": "SERVICE_QUALITY", "description": "Work was incomplete" }
```
Returns `201 Created` with `Complaint`.

### `GET /complaints`
Returns `Complaint[]` for the authenticated customer.

### `GET /complaints/{id}`
Returns single `Complaint`.

```typescript
createComplaint: builder.mutation<Complaint, CreateComplaintRequest>({
  query: (body) => ({ url: 'complaints', method: 'POST', body }),
  invalidatesTags: ['Complaints'],
}),
getComplaints: builder.query<Complaint[], void>({
  query: () => 'complaints',
  providesTags: ['Complaints'],
}),
getComplaintById: builder.query<Complaint, number>({
  query: (id) => `complaints/${id}`,
  providesTags: (result, error, id) => [{ type: 'Complaint', id }],
}),
```

---

## Profile API (`store/api/profileApi.ts`)

### `GET /users/me`
Returns `UserProfile`.

### `PUT /users/me`
Update profile fields.
```json
{ "firstname": "Ahmed", "lastname": "Al-Sayed", "phone": "+96512345678" }
```
Returns updated `UserProfile`.

### `PATCH /users/me/password`
Change password.
```json
{ "currentPassword": "oldPass", "newPassword": "newPass", "confirmationPassword": "newPass" }
```
Returns `204 No Content`.

### `POST /users/me/profile-image`
Upload profile photo. `multipart/form-data` with field `file`.
Returns `{ imageUrl: string }`.

```typescript
getMe: builder.query<UserProfile, void>({
  query: () => 'users/me',
  providesTags: ['Profile'],
}),
updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
  query: (body) => ({ url: 'users/me', method: 'PUT', body }),
  invalidatesTags: ['Profile'],
}),
changePassword: builder.mutation<void, ChangePasswordRequest>({
  query: (body) => ({ url: 'users/me/password', method: 'PATCH', body }),
}),
uploadProfileImage: builder.mutation<{ imageUrl: string }, FormData>({
  query: (formData) => ({ url: 'users/me/profile-image', method: 'POST', body: formData }),
  invalidatesTags: ['Profile'],
}),
```

---

## Shared Type

```typescript
interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;        // current page (0-indexed)
  size: number;
}
```
