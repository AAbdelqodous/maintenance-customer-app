# Data Model: Phase 2 — Core Screens

**Branch**: `001-phase-2-core-screens`
**Date**: 2026-04-15

---

## Entity Definitions

### 1. ServiceCenter

```typescript
interface ServiceCenter {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  categories: ServiceType[];        // e.g. ['CAR', 'ELECTRONICS']
  rating: number;                   // 0.0–5.0
  totalReviews: number;             // NOT reviewCount
  isActive: boolean;                // NOT isOpen
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}
```

---

### 2. ServiceType (Existing Enum — extended usage)

```typescript
// Already defined in bookingsApi — used for center filtering too
type ServiceType = 'CAR' | 'ELECTRONICS' | 'HOME_APPLIANCE' | 'EMERGENCY' | 'INSTALLATION' | 'REPAIR';
```

---

### 3. BookingStatus (Existing Enum)

```typescript
type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'QUOTE_READY';  // Added in Phase 4.0

// Status badge colors
const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING:      '#FF9800',  // Amber
  CONFIRMED:    '#2196F3',  // Blue
  IN_PROGRESS:  '#9C27B0',  // Purple
  COMPLETED:    '#4CAF50',  // Green
  CANCELLED:    '#F44336',  // Red
  QUOTE_READY:  '#FF6F00',  // Deep orange (Phase 4.0)
};
```

---

### 4. Booking

```typescript
interface Booking {
  id: number;
  centerId: number;
  centerNameAr: string;
  centerNameEn: string;
  serviceType: ServiceType;
  bookingDate: string;          // 'YYYY-MM-DD' — NOT scheduledDate
  bookingTime: string;          // 'HH:mm:ss' — NOT scheduledTime
  notes?: string;
  paymentMethod: PaymentMethod;
  bookingStatus: BookingStatus; // NOT status
  cancelledBy?: CancelledBy;
  createdAt: string;            // ISO-8601 datetime
}

type PaymentMethod = 'CASH' | 'KNET' | 'CREDIT_CARD';
type CancelledBy = 'CUSTOMER' | 'CENTER' | 'SYSTEM';
```

**Cancellable when**: `bookingStatus` is `'PENDING'` or `'CONFIRMED'` only.

---

### 5. BookingFormData (React Hook Form schema)

```typescript
interface BookingFormData {
  serviceType: ServiceType;
  bookingDate: string;          // Validated: must not be in the past
  bookingTime: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

// Zod schema
const bookingSchema = z.object({
  serviceType: z.enum(['CAR', 'ELECTRONICS', 'HOME_APPLIANCE', 'EMERGENCY', 'INSTALLATION', 'REPAIR']),
  bookingDate: z.string().refine((d) => new Date(d) >= new Date(), { message: 'bookings.datePastError' }),
  bookingTime: z.string().min(1),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['CASH', 'KNET', 'CREDIT_CARD']),
});
```

---

### 6. Conversation

```typescript
interface Conversation {
  id: number;
  centerId: number;
  centerNameAr: string;
  centerNameEn: string;
  centerImageUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;       // ISO-8601 datetime
  unreadCount: number;
}
```

---

### 7. Message

```typescript
interface Message {
  id: number;
  conversationId: number;
  content: string;
  senderType: SenderType;       // 'CUSTOMER' | 'CENTER'
  messageType: MessageType;     // 'TEXT' | 'IMAGE' | 'SYSTEM'
  isRead: boolean;              // NOT read
  createdAt: string;            // ISO-8601 datetime
}

type SenderType = 'CUSTOMER' | 'CENTER';
type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
```

---

### 8. Notification

```typescript
interface Notification {
  id: number;
  notificationType: NotificationType;    // NOT type
  notificationPriority: NotificationPriority;
  title: string;
  body: string;
  isRead: boolean;               // NOT read
  relatedEntityId?: number;      // bookingId, conversationId, etc.
  createdAt: string;
}

type NotificationType = 'BOOKING_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_REPLY' | 'COMPLAINT_UPDATE' | 'PROMOTIONAL' | 'SYSTEM';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
```

---

### 9. Review

```typescript
interface Review {
  id: number;
  centerId: number;
  centerNameAr: string;
  centerNameEn: string;
  bookingId?: number;
  rating: number;                // 1–5 integer
  comment?: string;
  ownerReply?: string;
  ownerReplyAt?: string;         // ISO-8601 datetime
  createdAt: string;
}
```

---

### 10. Complaint

```typescript
interface Complaint {
  id: number;
  bookingId: number;
  complaintType: ComplaintType;
  description: string;
  complaintStatus: ComplaintStatus;
  complaintPriority: ComplaintPriority;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

type ComplaintType = 'SERVICE_QUALITY' | 'BILLING' | 'STAFF_BEHAVIOR' | 'DELAY' | 'DAMAGE' | 'OTHER';
type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
type ComplaintPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
```

---

### 11. UserProfile

```typescript
interface UserProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  userType: UserType;            // Always 'CUSTOMER' in this app
  language: Language;            // 'ARABIC' | 'ENGLISH'
  createdAt: string;
}

type UserType = 'CUSTOMER' | 'CENTER_OWNER' | 'ADMIN';
type Language = 'ARABIC' | 'ENGLISH';
```

---

## Redux State Shape (Phase 2 additions)

```typescript
// store/centersSlice.ts
interface CentersState {
  searchQuery: string;
  activeCategory: ServiceType | null;
  recentSearches: string[];
}

// store/bookingsSlice.ts
interface BookingsState {
  statusFilter: BookingStatus | 'ALL';
}

// store/chatSlice.ts
interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<number, Message[]>;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
}

// store/favoritesSlice.ts
interface FavoritesState {
  favoritedIds: number[];    // Local cache of favorited center IDs for instant toggle feedback
}

// store/notificationsSlice.ts
interface NotificationsState {
  unreadCount: number;
}
```

---

## Component Props Summary

### `CenterCard`
```typescript
interface Props {
  center: ServiceCenter;
  isFavorited: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
  isRTL: boolean;
}
```

### `BookingCard`
```typescript
interface Props {
  booking: Booking;
  onPress: () => void;
  isRTL: boolean;
}
```

### `ReviewCard`
```typescript
interface Props {
  review: Review;
  isRTL: boolean;
}
```

### `NotificationItem`
```typescript
interface Props {
  notification: Notification;
  onPress: () => void;
  isRTL: boolean;
}
```

### `RatingStars`
```typescript
interface Props {
  rating: number;             // 0–5
  interactive?: boolean;      // default false
  onRatingChange?: (r: number) => void;
  size?: 'small' | 'medium' | 'large';
}
```
