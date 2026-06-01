# Quickstart: Phase 2 — Core Screens

**Branch**: `001-phase-2-core-screens`
**Date**: 2026-04-15

---

## Prerequisites

Phase 1 (Foundation) must be 100% complete. Verify:
```bash
cd ~/MaintenanceCenters/maintenance-customer-app
cat package.json | grep '"@reduxjs/toolkit"'     # Must exist
cat package.json | grep '"react-hook-form"'       # Must exist
cat package.json | grep '"expo-secure-store"'     # Must exist
```

---

## New Dependencies to Install

```bash
# Expo-managed packages
npx expo install expo-image expo-image-picker react-native-reanimated react-native-gesture-handler

# Community packages
npm install @react-native-community/netinfo @stomp/stompjs
```

---

## Environment Setup

No new environment variables needed beyond Phase 1. Ensure `.env` has:
```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

`WS_BASE_URL` is derived from `API_BASE_URL` in `lib/constants/config.ts`:
```typescript
export const WS_BASE_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api/v1', '');
```

---

## Backend Requirements

| Endpoint Group | Required For |
|----------------|-------------|
| `GET /centers`, `GET /centers/{id}`, `GET /centers/{id}/reviews` | US1 Centers |
| `POST /bookings`, `GET /bookings`, `GET /bookings/{id}`, `DELETE /bookings/{id}` | US2+US3 Bookings |
| `GET /conversations`, `GET /conversations/{id}/messages`, `POST /conversations`, WebSocket `/ws` | US4 Chat |
| `POST /favorites/{id}`, `DELETE /favorites/{id}`, `GET /favorites` | US5 Favorites |
| `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | US6 Notifications |
| `GET /users/me`, `PUT /users/me`, `PATCH /users/me/password`, `POST /users/me/profile-image` | US7 Profile |
| `POST /reviews`, `GET /reviews/my` | US8 Reviews |
| `POST /complaints`, `GET /complaints`, `GET /complaints/{id}` | US9 Complaints |

---

## Running the App

```bash
npx expo start --web    # Fastest for UI development
npx expo start          # Native dev client
```

**Note for WebSocket testing**: WebSocket requires the native client or a browser. `npx expo start --web` in a browser supports WebSocket.

---

## Key Implementation Notes

### Locked Field Names (DO NOT RENAME — per CLAUDE.md)
| Field | Correct | Wrong |
|-------|---------|-------|
| Booking status | `bookingStatus` | `status` |
| Booking date | `bookingDate` | `scheduledDate` |
| Booking time | `bookingTime` | `scheduledTime` |
| Notification read | `isRead` | `read` |
| Notification type | `notificationType` | `type` |
| Review count | `totalReviews` | `reviewCount` |
| Center active | `isActive` | `isOpen` |
| Center names | `nameAr` / `nameEn` | `name` |

### Platform Guards Required
```typescript
// Cancel booking / destructive confirmations
if (Platform.OS === 'web') {
  if (!window.confirm(t('bookings.cancelConfirm'))) return;
} else {
  Alert.alert(t('bookings.cancelTitle'), t('bookings.cancelConfirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.confirm'), onPress: doCancel },
  ]);
}
```

### Profile Image Upload
```typescript
const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
if (!result.canceled) {
  const formData = new FormData();
  formData.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
  await uploadProfileImage(formData).unwrap();
}
```

### RTL Pattern (consistent across all screens)
```typescript
const { i18n } = useTranslation();
const isRTL = i18n.dir() === 'rtl';
// Apply to container:
flexDirection: isRTL ? 'row-reverse' : 'row'
textAlign: isRTL ? 'right' : 'left'
```

---

## Testing Checklist

### US1 — Browse & Search Centers
- [ ] Centers list loads with name, rating, category icons
- [ ] Type 2+ chars in search bar → list filters within 400 ms
- [ ] Tap category filter → list shows only matching centers
- [ ] Tap center → detail screen with all fields
- [ ] Tap Favourite on detail → center appears in Favorites tab
- [ ] No internet → "No connection" banner; cached list shown

### US2 — Create a Booking
- [ ] Tap "Book" from center detail → booking form opens
- [ ] Complete all 4 steps → confirmation screen shows summary
- [ ] Tap "Confirm Booking" → success screen shown; booking in My Bookings
- [ ] Select a past date → validation error; submit blocked
- [ ] Navigate back mid-form → "Discard changes?" dialog

### US3 — Manage Bookings
- [ ] My Bookings loads all bookings; filter by status tab works
- [ ] Tap PENDING booking → detail with "Cancel" button visible
- [ ] Tap COMPLETED booking → detail with no "Cancel" button
- [ ] Tap Cancel → confirmation dialog → status changes to "Cancelled"

### US4 — Real-Time Chat
- [ ] Conversations list shows center name, last message, unread badge
- [ ] Open conversation → messages loaded; oldest at top
- [ ] Send message → appears immediately in thread
- [ ] Center replies → appears in thread without manual refresh
- [ ] Disconnect network → "Reconnecting..." banner shown

### US5 — Favorites
- [ ] Favourite a center → appears in Favorites tab
- [ ] Remove from Favorites tab → disappears immediately
- [ ] Close + reopen app → favourites still present

### US6 — Notifications
- [ ] Unread notifications have a visual indicator
- [ ] Tap BOOKING_UPDATE notification → opens booking detail
- [ ] Tap NEW_MESSAGE notification → opens chat conversation
- [ ] "Mark all read" → all indicators clear

### US7 — Profile Management
- [ ] Profile screen shows name, email, avatar
- [ ] Edit name → save → updated name shown
- [ ] Upload photo → new photo displayed
- [ ] Change password with correct current password → success
- [ ] Log out → auth entry screen

### US8 — Reviews
- [ ] Tap "Write Review" from completed booking → review form opens
- [ ] Submit with star rating → review appears in My Reviews
- [ ] Submit without rating → validation error; submit blocked
- [ ] Center owner reply visible on ReviewCard

### US9 — Complaints
- [ ] Create complaint linked to a booking → appears in Complaints list with "Open" status
- [ ] Tap complaint → detail with type, description, status
- [ ] Switch to Arabic → all labels and content in Arabic with RTL layout
