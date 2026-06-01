# Data Model: Phase 4.0 — Deep Trust

**Branch**: `004-phase-4-deep-trust`
**Date**: 2026-04-15

---

## Entity Changes & Additions

### 1. BookingStatus (Extended)

Extends the existing `BookingStatus` enum in `store/api/bookingsApi.ts`.

```typescript
export enum BookingStatus {
  // Existing values (do not rename)
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',

  // Phase 4.0 addition
  QUOTE_READY = 'QUOTE_READY',  // Diagnosis done; center has prepared a quote; awaiting customer approval
}
```

**State Transition**:
```
PENDING → CONFIRMED → QUOTE_READY → IN_PROGRESS → COMPLETED
                            ↓              ↓
                        CANCELLED      CANCELLED / REJECTED
```

---

### 2. WorkStage (New Enum — in progressApi.ts)

Granular work stages returned by `GET /bookings/:id/progress`. Independent of `BookingStatus`.

```typescript
export enum WorkStage {
  RECEIVED = 'RECEIVED',
  DIAGNOSING = 'DIAGNOSING',
  PARTS_ORDERED = 'PARTS_ORDERED',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
}
```

---

### 3. WorkProgressItem (New — in progressApi.ts)

A single timeline entry in the work progress response.

```typescript
export interface WorkProgressItem {
  stage: WorkStage;
  stageDisplayName: string;    // Localised by backend per Accept-Language
  notes?: string;              // Optional technician note
  photoUrl?: string;           // Optional photo for this stage (may be null)
  timestamp: string;           // ISO-8601 datetime
  isCompleted: boolean;        // true = this stage is done
  isCurrent: boolean;          // true = this is the active stage
}
```

---

### 4. WorkProgressResponse (New — in progressApi.ts)

Full response from `GET /bookings/:id/progress`.

```typescript
export interface WorkProgressResponse {
  bookingId: number;
  currentStage: WorkStage;
  currentStageDescription: string;   // Localised by backend
  progressPercentage: number;        // 0–100 integer
  estimatedCompletionDate?: string;  // ISO-8601 date, optional
  isDelayed: boolean;                // true if estimatedCompletionDate has passed
  timeline: WorkProgressItem[];      // All stages; completed first, then current, then future
  nextExpectedStage?: WorkStage;     // Optional
}
```

**Validation Rules**:
- `progressPercentage` is in range [0, 100] — do not clamp on client
- `timeline` may be empty → show "No progress updates yet" empty state
- `photoUrl` in a `WorkProgressItem` may be null → render item without thumbnail

---

### 5. MediaCategory (New Enum — in mediaApi.ts)

```typescript
export enum MediaCategory {
  DIAGNOSTICS = 'DIAGNOSTICS',
  PARTS = 'PARTS',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
```

---

### 6. BookingMedia (New — in mediaApi.ts)

```typescript
export interface BookingMedia {
  id: number;
  url: string;                        // Full URL to the media file
  category: MediaCategory;
  categoryDisplayNameAr: string;      // Localised Arabic category name
  categoryDisplayNameEn: string;      // Localised English category name
  caption?: string;                   // Optional photo caption (already in user's language)
  createdAt: string;                  // ISO-8601 datetime
}
```

---

### 7. QuoteStatus (New Enum — in quoteApi.ts)

```typescript
export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
}
```

---

### 8. QuoteLineItem (New — in quoteApi.ts)

```typescript
export interface QuoteLineItem {
  id: number;
  descriptionEn: string;
  descriptionAr: string;
  partsCost: number;    // KD, 3 decimal precision
  labourCost: number;   // KD, 3 decimal precision
}
```

---

### 9. BookingQuote (New — in quoteApi.ts)

```typescript
export interface BookingQuote {
  id: number;
  bookingId: number;
  version: number;                  // Quote revision number (starts at 1)
  lineItems: QuoteLineItem[];
  subtotal: number;                 // KD
  discount: number;                 // KD (0 if none)
  tax: number;                      // KD (0 if none)
  total: number;                    // KD = subtotal - discount + tax
  estimatedDurationMinutes?: number;
  estimatedDuration?: string;       // Pre-formatted, e.g. "2-3 hours"
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}
```

**Validation Rules**:
- All amounts are in Kuwaiti Dinar (KD), 3 decimal places. Display as `KD X.XXX`.
- `total` is always backend-computed — never recalculate on the client.
- `lineItems` may be empty → show "No items" row.

---

### 10. TrustBadge (New — in centersApi.ts)

```typescript
export enum TrustBadgeType {
  VERIFIED_BUSINESS = 'VERIFIED_BUSINESS',
  YEARS_EXPERIENCE = 'YEARS_EXPERIENCE',
  CERTIFIED_TECHNICIANS = 'CERTIFIED_TECHNICIANS',
  SATISFACTION_GUARANTEE = 'SATISFACTION_GUARANTEE',
  LICENSED = 'LICENSED',
}

export interface TrustBadge {
  badgeType: TrustBadgeType;
  labelAr: string;         // Arabic badge label (e.g. "نشاط تجاري موثق")
  labelEn: string;         // English badge label (e.g. "Verified Business")
  iconName: string;        // Ionicons icon name (e.g. "shield-checkmark")
  awardedAt: string;       // ISO-8601 date
  metadata?: Record<string, string>;  // e.g. { "years": "5" } for YEARS_EXPERIENCE
}
```

---

## Component Props Summary

### `WorkProgressTimeline`
```typescript
interface Props {
  data: WorkProgressResponse;
  isRTL: boolean;
}
```

### `WorkProgressStep`
```typescript
interface Props {
  item: WorkProgressItem;
  isLast: boolean;
  isRTL: boolean;
}
```

### `QuoteCard`
```typescript
interface Props {
  quote: BookingQuote;
  quoteId: number;
  isRTL: boolean;
  onApproved: () => void;   // called after successful approval
  onRejected: () => void;   // called after successful rejection
}
```

### `PhotoGrid`
```typescript
interface Props {
  media: BookingMedia[];
  isRTL: boolean;
}
```

### `TrustBadgeList`
```typescript
interface Props {
  badges: TrustBadge[];
  isRTL: boolean;
}
```

---

## i18n Key–Value Mapping

### `en.json` additions
```json
{
  "booking": {
    "trackProgress": "Track Progress",
    "workPhotos": "Work Photos",
    "quoteReady": "Quote Ready",
    "progress": {
      "title": "Work Progress",
      "noUpdates": "No progress updates yet",
      "estimatedCompletion": "Est. completion",
      "delayed": "Delayed",
      "stages": {
        "RECEIVED": "Received",
        "DIAGNOSING": "Diagnosing",
        "PARTS_ORDERED": "Parts Ordered",
        "WORK_IN_PROGRESS": "Work in Progress",
        "QUALITY_CHECK": "Quality Check",
        "READY_FOR_PICKUP": "Ready for Pickup",
        "PICKED_UP": "Picked Up"
      }
    },
    "photos": {
      "title": "Work Photos",
      "noPhotos": "No photos yet",
      "categories": {
        "DIAGNOSTICS": "Diagnostics",
        "PARTS": "Parts",
        "WORK_IN_PROGRESS": "Work in Progress",
        "COMPLETED": "Completed"
      }
    },
    "quote": {
      "title": "Service Quote",
      "description": "Description",
      "parts": "Parts",
      "labour": "Labour",
      "subtotal": "Subtotal",
      "discount": "Discount",
      "tax": "Tax",
      "total": "Total",
      "estimatedDuration": "Estimated Duration",
      "approve": "Approve Quote",
      "reject": "Reject Quote",
      "confirmApprove": "Approve this quote and allow work to begin?",
      "confirmReject": "Reject this quote?",
      "rejectReasonPlaceholder": "Reason for rejection (optional)",
      "approved": "Quote Approved",
      "rejected": "Quote Rejected",
      "noItems": "No items"
    }
  },
  "center": {
    "trustBadges": "Trust & Certifications",
    "badges": {
      "VERIFIED_BUSINESS": "Verified Business",
      "YEARS_EXPERIENCE": "{{years}} Years Experience",
      "CERTIFIED_TECHNICIANS": "Certified Technicians",
      "SATISFACTION_GUARANTEE": "Satisfaction Guarantee",
      "LICENSED": "Licensed"
    }
  }
}
```

### `ar.json` additions
```json
{
  "booking": {
    "trackProgress": "تتبع التقدم",
    "workPhotos": "صور الأعمال",
    "quoteReady": "عرض السعر جاهز",
    "progress": {
      "title": "تقدم الأعمال",
      "noUpdates": "لا توجد تحديثات بعد",
      "estimatedCompletion": "الانتهاء المتوقع",
      "delayed": "متأخر",
      "stages": {
        "RECEIVED": "تم الاستلام",
        "DIAGNOSING": "قيد التشخيص",
        "PARTS_ORDERED": "تم طلب قطع الغيار",
        "WORK_IN_PROGRESS": "العمل جارٍ",
        "QUALITY_CHECK": "فحص الجودة",
        "READY_FOR_PICKUP": "جاهز للاستلام",
        "PICKED_UP": "تم الاستلام"
      }
    },
    "photos": {
      "title": "صور الأعمال",
      "noPhotos": "لا توجد صور بعد",
      "categories": {
        "DIAGNOSTICS": "التشخيص",
        "PARTS": "قطع الغيار",
        "WORK_IN_PROGRESS": "أثناء العمل",
        "COMPLETED": "بعد الانتهاء"
      }
    },
    "quote": {
      "title": "عرض السعر",
      "description": "الوصف",
      "parts": "قطع الغيار",
      "labour": "العمالة",
      "subtotal": "المجموع الفرعي",
      "discount": "الخصم",
      "tax": "الضريبة",
      "total": "الإجمالي",
      "estimatedDuration": "المدة المتوقعة",
      "approve": "قبول عرض السعر",
      "reject": "رفض عرض السعر",
      "confirmApprove": "قبول عرض السعر والسماح ببدء العمل؟",
      "confirmReject": "رفض عرض السعر؟",
      "rejectReasonPlaceholder": "سبب الرفض (اختياري)",
      "approved": "تم قبول عرض السعر",
      "rejected": "تم رفض عرض السعر",
      "noItems": "لا توجد بنود"
    }
  },
  "center": {
    "trustBadges": "الثقة والشهادات",
    "badges": {
      "VERIFIED_BUSINESS": "نشاط تجاري موثق",
      "YEARS_EXPERIENCE": "{{years}} سنوات خبرة",
      "CERTIFIED_TECHNICIANS": "فنيون معتمدون",
      "SATISFACTION_GUARANTEE": "ضمان الرضا",
      "LICENSED": "مرخص"
    }
  }
}
```
