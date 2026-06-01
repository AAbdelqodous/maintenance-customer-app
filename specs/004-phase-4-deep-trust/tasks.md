# Tasks: Phase 4.0 — Deep Trust

**Input**: Design documents from `/specs/004-phase-4-deep-trust/`
**Branch**: `004-phase-4-deep-trust`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story. Each phase is independently testable.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: i18n keys and new API slices — no dependencies on each other.

- [ ] T001 [P] Add Phase 4.0 English i18n keys to `lib/i18n/locales/en.json`
- [ ] T002 [P] Add Phase 4.0 Arabic i18n keys to `lib/i18n/locales/ar.json`
- [ ] T003 [P] Create new RTK Query slice `store/api/progressApi.ts`
- [ ] T004 [P] Create new RTK Query slice `store/api/mediaApi.ts`
- [ ] T005 [P] Create new RTK Query slice `store/api/quoteApi.ts`

---

### T001 — Add English i18n keys `lib/i18n/locales/en.json`

In `booking` → `status` object (line 180–187 in current file), add `"quote_ready"` key:

```json
"status": {
  "pending": "Pending",
  "confirmed": "Confirmed",
  "in_progress": "In Progress",
  "completed": "Completed",
  "cancelled": "Cancelled",
  "rejected": "Rejected",
  "quote_ready": "Quote Ready"
},
```

After `"shareBooking": "Share Booking"` (end of `booking` object, before closing `}`), add:

```json
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
```

After `"viewAllReviews": "View all {{count}} reviews"` (end of `center` object, before closing `}`), add:

```json
"trustBadges": "Trust & Certifications",
"badges": {
  "VERIFIED_BUSINESS": "Verified Business",
  "YEARS_EXPERIENCE": "{{years}} Years Experience",
  "CERTIFIED_TECHNICIANS": "Certified Technicians",
  "SATISFACTION_GUARANTEE": "Satisfaction Guarantee",
  "LICENSED": "Licensed"
}
```

---

### T002 — Add Arabic i18n keys `lib/i18n/locales/ar.json`

Apply the same structural changes as T001 but with Arabic values. In `booking.status`, add:

```json
"quote_ready": "عرض السعر جاهز"
```

At end of `booking` object, add:

```json
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
```

At end of `center` object, add:

```json
"trustBadges": "الثقة والشهادات",
"badges": {
  "VERIFIED_BUSINESS": "نشاط تجاري موثق",
  "YEARS_EXPERIENCE": "{{years}} سنوات خبرة",
  "CERTIFIED_TECHNICIANS": "فنيون معتمدون",
  "SATISFACTION_GUARANTEE": "ضمان الرضا",
  "LICENSED": "مرخص"
}
```

---

### T003 — Create `store/api/progressApi.ts`

Create the file with this exact content:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum WorkStage {
  RECEIVED = 'RECEIVED',
  DIAGNOSING = 'DIAGNOSING',
  PARTS_ORDERED = 'PARTS_ORDERED',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
}

export interface WorkProgressItem {
  stage: WorkStage;
  stageDisplayName: string;
  notes?: string;
  photoUrl?: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface WorkProgressResponse {
  bookingId: number;
  currentStage: WorkStage | null;
  currentStageDescription: string | null;
  progressPercentage: number;
  estimatedCompletionDate?: string;
  isDelayed: boolean;
  nextExpectedStage?: WorkStage;
  timeline: WorkProgressItem[];
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const progressApi = createApi({
  reducerPath: 'progressApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Progress'],
  endpoints: (builder) => ({
    getBookingProgress: builder.query<WorkProgressResponse, number>({
      query: (bookingId) => `bookings/${bookingId}/progress`,
      providesTags: (result, error, bookingId) => [{ type: 'Progress', id: bookingId }],
    }),
  }),
});

export const { useGetBookingProgressQuery } = progressApi;
```

---

### T004 — Create `store/api/mediaApi.ts`

Create the file with this exact content:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum MediaCategory {
  DIAGNOSTICS = 'DIAGNOSTICS',
  PARTS = 'PARTS',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface BookingMedia {
  id: number;
  url: string;
  category: MediaCategory;
  categoryDisplayNameAr: string;
  categoryDisplayNameEn: string;
  caption?: string;
  createdAt: string;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Media'],
  endpoints: (builder) => ({
    getBookingMedia: builder.query<BookingMedia[], { bookingId: number; category?: MediaCategory }>({
      query: ({ bookingId, category }) => ({
        url: `bookings/${bookingId}/media`,
        params: category ? { category } : undefined,
      }),
      providesTags: (result, error, { bookingId }) => [{ type: 'Media', id: bookingId }],
    }),
  }),
});

export const { useGetBookingMediaQuery } = mediaApi;
```

---

### T005 — Create `store/api/quoteApi.ts`

Create the file with this exact content:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
}

export interface QuoteLineItem {
  id: number;
  descriptionEn: string;
  descriptionAr: string;
  partsCost: number;
  labourCost: number;
}

export interface BookingQuote {
  id: number;
  bookingId: number;
  version: number;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  estimatedDurationMinutes?: number;
  estimatedDuration?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Quote'],
  endpoints: (builder) => ({
    getBookingQuote: builder.query<BookingQuote, number>({
      query: (bookingId) => `bookings/${bookingId}/quote`,
      providesTags: (result, error, bookingId) => [{ type: 'Quote', id: bookingId }],
    }),
    approveQuote: builder.mutation<void, number>({
      query: (quoteId) => ({ url: `quotes/${quoteId}/approve`, method: 'POST', body: {} }),
      invalidatesTags: ['Quote'],
    }),
    rejectQuote: builder.mutation<void, { quoteId: number; reason?: string }>({
      query: ({ quoteId, reason }) => ({
        url: `quotes/${quoteId}/reject`,
        method: 'POST',
        body: { reason: reason ?? '' },
      }),
      invalidatesTags: ['Quote'],
    }),
  }),
});

export const { useGetBookingQuoteQuery, useApproveQuoteMutation, useRejectQuoteMutation } = quoteApi;
```

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend existing slices and register all new slices in the store. Must complete before any component work.

**⚠️ CRITICAL**: T008 depends on T003, T004, T005 completing first.

- [ ] T006 [P] Extend `store/api/bookingsApi.ts` — add `QUOTE_READY` to `BookingStatus` enum
- [ ] T007 [P] Extend `store/api/centersApi.ts` — add `TrustBadge` types and `getCenterBadges` endpoint
- [ ] T008 Register progressApi, mediaApi, quoteApi in `store/index.ts` (depends on T003–T005)

**Checkpoint**: Store is fully wired — all hooks are importable, TypeScript compiles.

---

### T006 — Extend `store/api/bookingsApi.ts`

In `BookingStatus` enum (lines 7–14), add `QUOTE_READY` after `REJECTED`:

```typescript
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  QUOTE_READY = 'QUOTE_READY',
}
```

No other changes to this file.

---

### T007 — Extend `store/api/centersApi.ts`

**Step 1**: Add new types after the existing `CentersResponse` interface (after line 72, before `// ── API slice`):

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
  labelAr: string;
  labelEn: string;
  iconName: string;
  awardedAt: string;
  metadata?: Record<string, string>;
}
```

**Step 2**: Add `getCenterBadges` endpoint inside the `endpoints` builder, after `searchCenters`:

```typescript
getCenterBadges: builder.query<TrustBadge[], number>({
  query: (centerId) => `centers/${centerId}/badges`,
  providesTags: (result, error, centerId) => [{ type: 'Badges' as const, id: centerId }],
}),
```

**Step 3**: Add `tagTypes: ['Badges'],` to the `createApi` call (add after `reducerPath: 'centersApi',`):

```typescript
export const centersApi = createApi({
  reducerPath: 'centersApi',
  tagTypes: ['Badges'],
  baseQuery: fetchBaseQuery({ ... }),
```

**Step 4**: Add `useGetCenterBadgesQuery` to the exports at the bottom of the file:

```typescript
export const {
  useGetCentersQuery,
  useGetCenterByIdQuery,
  useGetCategoriesQuery,
  useLazySearchCentersQuery,
  useGetCenterBadgesQuery,
} = centersApi;
```

---

### T008 — Register new slices in `store/index.ts`

**Step 1**: Add three imports after the existing `import { profileApi }` line:

```typescript
import { progressApi } from './api/progressApi';
import { mediaApi } from './api/mediaApi';
import { quoteApi } from './api/quoteApi';
```

**Step 2**: Add three reducer entries inside `configureStore` reducer (after `[profileApi.reducerPath]: profileApi.reducer,`):

```typescript
[progressApi.reducerPath]: progressApi.reducer,
[mediaApi.reducerPath]: mediaApi.reducer,
[quoteApi.reducerPath]: quoteApi.reducer,
```

**Step 3**: Add three middleware entries in `.concat(...)` (after `profileApi.middleware,`):

```typescript
progressApi.middleware,
mediaApi.middleware,
quoteApi.middleware,
```

---

## Phase 3: User Story 1 — Live Work Progress Timeline (Priority: P1) 🎯 MVP

**Goal**: Customer can navigate from booking detail to a timeline screen showing real-time work stages.

**Independent Test**: Open a booking with `bookingStatus = IN_PROGRESS` → "Track Progress" button visible → progress screen shows timeline → no crashes in Arabic RTL.

- [ ] T009 [P] [US1] Create `components/bookings/WorkProgressStep.tsx`
- [ ] T010 [US1] Create `components/bookings/WorkProgressTimeline.tsx` (depends on T009)
- [ ] T011 [US1] Create `app/(app)/(tabs)/bookings/progress.tsx` (depends on T010)
- [ ] T012 [US1] Update `app/(app)/(tabs)/bookings/[id].tsx` — add "Track Progress" button (depends on T011)

**Checkpoint**: User Story 1 fully functional — Track Progress button navigates to progress screen.

---

### T009 — Create `components/bookings/WorkProgressStep.tsx`

Create the file with this exact content:

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { WorkProgressItem } from '../../store/api/progressApi';

interface Props {
  item: WorkProgressItem;
  isLast: boolean;
  isRTL: boolean;
}

export default function WorkProgressStep({ item, isLast, isRTL }: Props) {
  const iconName = item.isCurrent
    ? 'radio-button-on'
    : item.isCompleted
    ? 'checkmark-circle'
    : 'ellipse-outline';

  const iconColor = item.isCurrent
    ? '#FF9800'
    : item.isCompleted
    ? '#4CAF50'
    : '#BDBDBD';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Left column: icon + connector */}
      <View style={styles.iconColumn}>
        <Ionicons name={iconName as any} size={22} color={iconColor} />
        {!isLast && <View style={[styles.connector, item.isCompleted && styles.connectorDone]} />}
      </View>

      {/* Right column: content */}
      <View style={styles.content}>
        <AppText
          style={[
            styles.stageName,
            item.isCurrent && styles.stageNameCurrent,
            item.isCompleted && styles.stageNameDone,
          ]}
        >
          {item.stageDisplayName}
        </AppText>
        {item.timestamp && (item.isCompleted || item.isCurrent) && (
          <AppText style={styles.timestamp}>{formatDate(item.timestamp)}</AppText>
        )}
        {item.notes ? (
          <AppText style={styles.notes}>{item.notes}</AppText>
        ) : null}
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 4,
    width: 24,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 32,
  },
  connectorDone: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  stageName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9E9E9E',
    marginBottom: 2,
  },
  stageNameCurrent: {
    color: '#FF9800',
    fontWeight: '700',
  },
  stageNameDone: {
    color: '#1A1A2E',
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: '#424242',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginTop: 8,
  },
});
```

---

### T010 — Create `components/bookings/WorkProgressTimeline.tsx`

Create the file with this exact content:

```typescript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import WorkProgressStep from './WorkProgressStep';
import { WorkProgressResponse } from '../../store/api/progressApi';

interface Props {
  data: WorkProgressResponse;
  isRTL: boolean;
}

export default function WorkProgressTimeline({ data, isRTL }: Props) {
  const { t } = useTranslation();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <AppText style={styles.progressLabel}>{data.progressPercentage}%</AppText>
          {data.estimatedCompletionDate && (
            <AppText style={[styles.estimatedLabel, data.isDelayed && styles.delayedLabel]}>
              {t('booking.progress.estimatedCompletion')}: {formatDate(data.estimatedCompletionDate)}
              {data.isDelayed ? ` (${t('booking.progress.delayed')})` : ''}
            </AppText>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${data.progressPercentage}%` }]} />
        </View>
      </View>

      {/* Timeline */}
      {data.timeline.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={40} color="#BDBDBD" />
          <AppText style={styles.emptyText}>{t('booking.progress.noUpdates')}</AppText>
        </View>
      ) : (
        <View style={styles.timeline}>
          {data.timeline.map((item, index) => (
            <WorkProgressStep
              key={item.stage}
              item={item}
              isLast={index === data.timeline.length - 1}
              isRTL={isRTL}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  estimatedLabel: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  delayedLabel: {
    color: '#F44336',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
  timeline: {
    paddingTop: 8,
  },
});
```

---

### T011 — Create `app/(app)/(tabs)/bookings/progress.tsx`

Create the file with this exact content:

```typescript
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import WorkProgressTimeline from '../../../../components/bookings/WorkProgressTimeline';
import { AppText } from '../../../../components/ui/AppText';
import { useGetBookingProgressQuery } from '../../../../store/api/progressApi';

export default function BookingProgressScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';
  const bookingId = Number(params.id);

  const { data, isLoading, isError } = useGetBookingProgressQuery(bookingId, {
    skip: !bookingId,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('booking.progress.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : isError || !data ? (
          <View style={styles.center}>
            <AppText style={styles.errorText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <WorkProgressTimeline data={data} isRTL={isRTL} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
});
```

---

### T012 — Update `app/(app)/(tabs)/bookings/[id].tsx` — Track Progress button

**Change 1**: Import `useRouter` already imported. Add `BookingStatus.QUOTE_READY` to the switch in `getStatusColor()`. After `case BookingStatus.REJECTED:` block, add:

```typescript
case BookingStatus.QUOTE_READY:
  return '#FF6F00';
```

**Change 2**: In `getStatusColor()`, also add to the `t()` status label call in the status banner. The banner already uses `t(\`booking.status.${booking.bookingStatus.toLowerCase()}\`)` — this will automatically pick up `booking.status.quote_ready` from i18n (T001). No code change needed here.

**Change 3**: In the `{/* Actions */}` section (around line 265), add a "Track Progress" button before the cancel button. The active stages are `CONFIRMED`, `QUOTE_READY`, and `IN_PROGRESS`. Add this block:

```typescript
{(booking.bookingStatus === BookingStatus.CONFIRMED ||
  booking.bookingStatus === BookingStatus.QUOTE_READY ||
  booking.bookingStatus === BookingStatus.IN_PROGRESS) && (
  <AppButton
    title={t('booking.trackProgress')}
    onPress={() =>
      router.push({
        pathname: '/(app)/(tabs)/bookings/progress',
        params: { id: String(bookingId) },
      })
    }
    variant="secondary"
    style={styles.actionButton as any}
  />
)}
```

Place this block **before** the `canCancel` block in the `{/* Actions */}` `<View>`.

---

## Phase 4: User Story 2 — Work Photos Gallery (Priority: P2)

**Goal**: Customer can view all work photos for their booking in a 2-column grid with full-screen tap.

**Independent Test**: Open `bookings/photos.tsx` screen → photos shown in 2-column grid → tap a photo → full-screen modal with caption opens.

- [ ] T013 [P] [US2] Create `components/bookings/PhotoGrid.tsx`
- [ ] T014 [US2] Create `app/(app)/(tabs)/bookings/photos.tsx` (depends on T013)
- [ ] T015 [US2] Update `app/(app)/(tabs)/bookings/[id].tsx` — add "Work Photos" button (depends on T014)

**Checkpoint**: "Work Photos" button on booking detail navigates to photos screen; empty state when no photos.

---

### T013 — Create `components/bookings/PhotoGrid.tsx`

Create the file with this exact content:

```typescript
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { BookingMedia, MediaCategory } from '../../store/api/mediaApi';

interface Props {
  media: BookingMedia[];
  isRTL: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 2;

const CATEGORIES = [null, ...Object.values(MediaCategory)] as (MediaCategory | null)[];

export default function PhotoGrid({ media, isRTL }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | null>(null);
  const [modalMedia, setModalMedia] = useState<BookingMedia | null>(null);

  const filtered = selectedCategory
    ? media.filter((m) => m.category === selectedCategory)
    : media;

  const getCategoryLabel = (cat: MediaCategory | null) => {
    if (!cat) return isRTL ? 'الكل' : 'All';
    return t(`booking.photos.categories.${cat}`);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (media.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={48} color="#BDBDBD" />
        <AppText style={styles.emptyText}>{t('booking.photos.noPhotos')}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat ?? 'all'}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
            ]}
          >
            <AppText
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {getCategoryLabel(cat)}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setModalMedia(item)} activeOpacity={0.85}>
            <Image
              source={{ uri: item.url }}
              style={styles.photo}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />

      {/* Full-screen Modal */}
      <Modal
        visible={!!modalMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMedia(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalMedia(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {modalMedia && (
            <>
              <Image
                source={{ uri: modalMedia.url }}
                style={styles.modalImage}
                contentFit="contain"
              />
              <View style={styles.modalCaption}>
                {modalMedia.caption ? (
                  <AppText style={styles.captionText}>{modalMedia.caption}</AppText>
                ) : null}
                <AppText style={styles.dateText}>{formatDate(modalMedia.createdAt)}</AppText>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 13,
    color: '#757575',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  modalCaption: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
});
```

---

### T014 — Create `app/(app)/(tabs)/bookings/photos.tsx`

Create the file with this exact content:

```typescript
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import PhotoGrid from '../../../../components/bookings/PhotoGrid';
import { AppText } from '../../../../components/ui/AppText';
import { useGetBookingMediaQuery } from '../../../../store/api/mediaApi';

export default function BookingPhotosScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';
  const bookingId = Number(params.id);

  const { data, isLoading, isError } = useGetBookingMediaQuery(
    { bookingId },
    { skip: !bookingId }
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('booking.photos.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <AppText style={styles.errorText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <PhotoGrid media={data ?? []} isRTL={isRTL} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
});
```

---

### T015 — Update `app/(app)/(tabs)/bookings/[id].tsx` — Work Photos button

In the `{/* Actions */}` section, add the "Work Photos" button after the "Track Progress" button added in T012:

```typescript
<AppButton
  title={t('booking.workPhotos')}
  onPress={() =>
    router.push({
      pathname: '/(app)/(tabs)/bookings/photos',
      params: { id: String(bookingId) },
    })
  }
  variant="secondary"
  style={styles.actionButton as any}
/>
```

Place this immediately after the "Track Progress" block from T012 and before `canCancel`.

---

## Phase 5: User Story 3 — Quote Review & Approval (Priority: P1)

**Goal**: Customer sees a QuoteCard when booking is `QUOTE_READY` and can approve or reject with optional reason.

**Independent Test**: Booking with `bookingStatus = QUOTE_READY` → QuoteCard visible with line items and totals → "Approve Quote" + "Reject Quote" buttons present → offline → buttons disabled with banner.

- [ ] T016 [P] [US3] Create `components/bookings/QuoteCard.tsx`
- [ ] T017 [US3] Update `app/(app)/(tabs)/bookings/[id].tsx` — add QuoteCard, quote query, quote status color (depends on T016)

**Checkpoint**: QuoteCard visible on QUOTE_READY booking; approve/reject works; offline guard active.

---

### T016 — Create `components/bookings/QuoteCard.tsx`

Create the file with this exact content:

```typescript
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { BookingQuote } from '../../store/api/quoteApi';
import { useApproveQuoteMutation, useRejectQuoteMutation } from '../../store/api/quoteApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface Props {
  quote: BookingQuote;
  isRTL: boolean;
  onApproved: () => void;
  onRejected: () => void;
}

export default function QuoteCard({ quote, isRTL, onApproved, onRejected }: Props) {
  const { t, i18n } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const [approveQuote, { isLoading: approving }] = useApproveQuoteMutation();
  const [rejectQuote, { isLoading: rejecting }] = useRejectQuoteMutation();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fmtKD = (amount: number) => `KD ${amount.toFixed(3)}`;

  const handleApprove = () => {
    if (!isConnected) return;
    const confirm = () =>
      approveQuote(quote.id)
        .unwrap()
        .then(() => {
          onApproved();
        })
        .catch(() => Alert.alert(t('common.error'), t('common.retry')));

    if (Platform.OS === 'web') {
      if (window.confirm(t('booking.quote.confirmApprove'))) confirm();
    } else {
      Alert.alert(t('booking.quote.title'), t('booking.quote.confirmApprove'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: confirm },
      ]);
    }
  };

  const handleRejectConfirm = () => {
    if (!isConnected) return;
    rejectQuote({ quoteId: quote.id, reason: rejectReason.trim() || undefined })
      .unwrap()
      .then(() => {
        setShowRejectInput(false);
        setRejectReason('');
        onRejected();
      })
      .catch(() => Alert.alert(t('common.error'), t('common.retry')));
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <Ionicons name="document-text-outline" size={20} color="#2196F3" />
        <AppText style={styles.title}>{t('booking.quote.title')}</AppText>
        {quote.estimatedDuration && (
          <AppText style={styles.duration}>
            {t('booking.quote.estimatedDuration')}: {quote.estimatedDuration}
          </AppText>
        )}
      </View>

      {/* Offline banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={14} color="#fff" />
          <AppText style={styles.offlineText}>{t('errors.noInternet')}</AppText>
        </View>
      )}

      {/* Line items */}
      <View style={styles.tableHeader}>
        <AppText style={[styles.colDesc, isRTL && styles.textRight]}>{t('booking.quote.description')}</AppText>
        <AppText style={styles.colAmount}>{t('booking.quote.parts')}</AppText>
        <AppText style={styles.colAmount}>{t('booking.quote.labour')}</AppText>
      </View>
      <View style={styles.divider} />

      {quote.lineItems.length === 0 ? (
        <AppText style={styles.noItems}>{t('booking.quote.noItems')}</AppText>
      ) : (
        quote.lineItems.map((item) => (
          <View key={item.id} style={[styles.lineItem, isRTL && styles.rowReverse]}>
            <AppText style={[styles.colDesc, isRTL && styles.textRight]}>
              {i18n.language === 'ar' ? item.descriptionAr : item.descriptionEn}
            </AppText>
            <AppText style={styles.colAmount}>{fmtKD(item.partsCost)}</AppText>
            <AppText style={styles.colAmount}>{fmtKD(item.labourCost)}</AppText>
          </View>
        ))
      )}

      {/* Totals */}
      <View style={styles.divider} />
      {[
        { label: t('booking.quote.subtotal'), value: quote.subtotal },
        ...(quote.discount > 0 ? [{ label: t('booking.quote.discount'), value: -quote.discount }] : []),
        ...(quote.tax > 0 ? [{ label: t('booking.quote.tax'), value: quote.tax }] : []),
      ].map(({ label, value }) => (
        <View key={label} style={[styles.totalRow, isRTL && styles.rowReverse]}>
          <AppText style={styles.totalLabel}>{label}</AppText>
          <AppText style={[styles.totalValue, value < 0 && styles.discount]}>
            {value < 0 ? `-KD ${Math.abs(value).toFixed(3)}` : fmtKD(value)}
          </AppText>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={[styles.totalRow, isRTL && styles.rowReverse]}>
        <AppText style={styles.grandTotalLabel}>{t('booking.quote.total')}</AppText>
        <AppText style={styles.grandTotalValue}>{fmtKD(quote.total)}</AppText>
      </View>

      {/* Actions */}
      <View style={[styles.actions, isRTL && styles.rowReverse]}>
        <AppButton
          title={t('booking.quote.approve')}
          onPress={handleApprove}
          style={styles.approveBtn as any}
          disabled={!isConnected || approving || rejecting}
        />
        <AppButton
          title={t('booking.quote.reject')}
          onPress={() => setShowRejectInput((v) => !v)}
          variant="secondary"
          style={[styles.rejectBtn, !isConnected && styles.disabledBtn] as any}
          disabled={!isConnected || approving || rejecting}
        />
      </View>

      {/* Reject reason (inline) */}
      {showRejectInput && (
        <View style={styles.rejectSection}>
          <TextInput
            style={styles.reasonInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder={t('booking.quote.rejectReasonPlaceholder')}
            multiline
            numberOfLines={3}
          />
          <AppButton
            title={t('booking.quote.confirmReject')}
            onPress={handleRejectConfirm}
            style={styles.confirmRejectBtn as any}
            disabled={rejecting}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: '#757575',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    gap: 6,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  colDesc: {
    flex: 2,
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  colAmount: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  noItems: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 8,
  },
  lineItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  textRight: {
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 13,
    color: '#757575',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  discount: {
    color: '#4CAF50',
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  approveBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  rejectSection: {
    marginTop: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1A1A2E',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  confirmRejectBtn: {},
});
```

---

### T017 — Update `app/(app)/(tabs)/bookings/[id].tsx` — QuoteCard integration

**Change 1**: Add import at the top of the file (after existing imports):

```typescript
import QuoteCard from '../../../../components/bookings/QuoteCard';
import { useGetBookingQuoteQuery } from '../../../../store/api/quoteApi';
```

**Change 2**: Add the quote query hook inside `BookingDetailScreen`, after the existing `useGetBookingByIdQuery` call:

```typescript
const { data: quote, refetch: refetchQuote } = useGetBookingQuoteQuery(bookingId, {
  skip: booking?.bookingStatus !== BookingStatus.QUOTE_READY,
});
```

**Change 3**: Inside the `<ScrollView>` JSX, add the QuoteCard section **after** the `{/* Payment Info */}` section and **before** the `{/* Cancellation Info */}` section:

```typescript
{/* Quote */}
{booking.bookingStatus === BookingStatus.QUOTE_READY && quote && (
  <View style={styles.section}>
    <AppText style={styles.sectionTitle}>{t('booking.quote.title')}</AppText>
    <QuoteCard
      quote={quote}
      isRTL={isRTL}
      onApproved={() => refetchQuote()}
      onRejected={() => refetchQuote()}
    />
  </View>
)}
```

**Change 4**: Add `isRTL` derivation at top of the component (after `const params = useLocalSearchParams();`):

```typescript
const isRTL = i18n.dir() === 'rtl';
```

Note: `i18n` is already destructured from `useTranslation()` at line 2.

---

## Phase 6: User Story 4 — Trust Badges on Center Detail (Priority: P2)

**Goal**: Trust badges section appears on center detail when the center has badges; hidden when empty.

**Independent Test**: Open center with badges → "Trust & Certifications" section renders icons and labels → open center with no badges → section absent.

- [ ] T018 [P] [US4] Create `components/centers/TrustBadgeList.tsx`
- [ ] T019 [US4] Update `app/(app)/(tabs)/centers/[id].tsx` — add TrustBadgeList section (depends on T018)

**Checkpoint**: Trust badges section conditionally visible on center detail.

---

### T018 — Create `components/centers/TrustBadgeList.tsx`

Create the file with this exact content:

```typescript
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { TrustBadge } from '../../store/api/centersApi';

interface Props {
  badges: TrustBadge[];
  isRTL: boolean;
}

export default function TrustBadgeList({ badges, isRTL }: Props) {
  const { i18n } = useTranslation();

  if (badges.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, isRTL && styles.rowReverse]}
    >
      {badges.map((badge) => (
        <View key={badge.badgeType} style={styles.badge}>
          <Ionicons name={badge.iconName as any} size={18} color="#2196F3" />
          <AppText style={styles.label}>
            {i18n.language === 'ar' ? badge.labelAr : badge.labelEn}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  label: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '600',
  },
});
```

---

### T019 — Update `app/(app)/(tabs)/centers/[id].tsx` — Trust badges section

**Change 1**: Add imports at top of file (after existing `useGetCenterByIdQuery` import):

```typescript
import TrustBadgeList from '../../../../components/centers/TrustBadgeList';
import { useGetCenterBadgesQuery } from '../../../../store/api/centersApi';
```

**Change 2**: Add the badges query hook inside `CenterDetailScreen`, after the `useGetCenterByIdQuery` call (around line 25):

```typescript
const { data: badges } = useGetCenterBadgesQuery(centerId);
```

**Change 3**: In the JSX, add the Trust Badges section **after** the `{/* Actions */}` section (after line 222, before `{/* Reviews */}`):

```typescript
{/* Trust Badges */}
{badges && badges.length > 0 && (
  <View style={styles.section}>
    <AppText style={styles.sectionTitle}>{t('center.trustBadges')}</AppText>
    <TrustBadgeList badges={badges} isRTL={isRTL} />
  </View>
)}
```

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final audit, RTL verification, empty-state checks.

- [ ] T020 Audit `booking.status.quote_ready` i18n key used in status banner in `app/(app)/(tabs)/bookings/[id].tsx` — verify `t(\`booking.status.${booking.bookingStatus.toLowerCase()}\`)` resolves correctly for `QUOTE_READY` → `booking.status.quote_ready`
- [ ] T021 Verify `getStatusColor()` covers all `BookingStatus` values including `QUOTE_READY` in `app/(app)/(tabs)/bookings/[id].tsx`
- [ ] T022 Run quickstart.md testing checklist — verify all 20 checklist items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001–T005)**: No dependencies — all parallelizable
- **Foundational (Phase 2, T006–T008)**: T006 and T007 parallelizable; T008 depends on T003 + T004 + T005
- **US1 (Phase 3, T009–T012)**: Depends on Phase 2 complete; T009 parallelizable with T013 and T016 and T018
- **US2 (Phase 4, T013–T015)**: Depends on Phase 2 complete; T013 parallelizable with T009
- **US3 (Phase 5, T016–T017)**: Depends on Phase 2 complete; T016 parallelizable with T009
- **US4 (Phase 6, T018–T019)**: Depends on Phase 2 complete; T018 parallelizable with T009

### User Story Dependencies

- **US1 Work Progress (P1)**: Independent — no dependency on US2, US3, US4
- **US2 Work Photos (P2)**: Independent — no dependency on US1, US3, US4
- **US3 Quote Approval (P1)**: Independent — no dependency on US1, US2, US4
- **US4 Trust Badges (P2)**: Independent — no dependency on US1, US2, US3

All four user stories share the same foundational phase (Phase 2) and can be implemented in parallel after it.

---

## Parallel Example: After Phase 2 Complete

```
Parallel block:
  Task T009: Create WorkProgressStep.tsx
  Task T013: Create PhotoGrid.tsx
  Task T016: Create QuoteCard.tsx
  Task T018: Create TrustBadgeList.tsx

Then:
  T010 depends on T009 → WorkProgressTimeline.tsx
  T014 depends on T013 → photos.tsx screen
  T017 depends on T016 → [id].tsx QuoteCard integration
  T019 depends on T018 → centers/[id].tsx badges integration

Then:
  T011 depends on T010 → progress.tsx screen
  T012 depends on T011 → [id].tsx Track Progress button
  T015 depends on T014 → [id].tsx Work Photos button
```

---

## Implementation Strategy

### MVP First (US1 + US3 only — both P1)

1. Complete Phase 1 (T001–T005) — parallel
2. Complete Phase 2 (T006–T008) — T008 last
3. Complete Phase 3: US1 Work Progress (T009–T012)
4. Complete Phase 5: US3 Quote Approval (T016–T017)
5. **STOP and VALIDATE**: Both P1 stories independently testable
6. Add Phase 4: US2 Work Photos (T013–T015)
7. Add Phase 6: US4 Trust Badges (T018–T019)
8. Polish (T020–T022)

### Incremental Delivery

Each user story phase produces a complete, shippable increment:
- After US1: Customer can track work in real-time ✅
- After US2: Customer can view work photos ✅
- After US3: Customer can approve/reject quotes ✅
- After US4: Trust badges visible on centers ✅

---

## Notes

- **[P]** tasks = different files, no conflict risks
- **T008 must wait** for T003 + T004 + T005 — store registration requires all three slices
- **T017 and T015 and T012** all modify `bookings/[id].tsx` — implement them **sequentially** (not in parallel) to avoid merge conflicts
- **`booking.status.quote_ready` key** is used automatically by existing `t(\`booking.status.${status.toLowerCase()}\`)` pattern — no template string change needed
- All amounts in KD with 3 decimal places: use `.toFixed(3)` pattern
- `useNetworkStatus` is at `hooks/useNetworkStatus.ts` — already exists from Phase 1
