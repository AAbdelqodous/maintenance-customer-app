# Tasks: Phase 4.5 — Retention

**Input**: Design documents from `/specs/005-phase-4-5-retention/`
**Branch**: `005-phase-4-5-retention`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story. Each phase is independently testable.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: i18n keys and all new API slices — no dependencies on each other.

- [ ] T001 [P] Add Phase 4.5 English i18n keys to `lib/i18n/locales/en.json`
- [ ] T002 [P] Add Phase 4.5 Arabic i18n keys to `lib/i18n/locales/ar.json`
- [ ] T003 [P] Create `store/api/loyaltyApi.ts` — loyalty account, rewards, redeem, transactions
- [ ] T004 [P] Create `store/api/vehiclesApi.ts` — CRUD vehicles + dashboard
- [ ] T005 [P] Create `store/api/remindersApi.ts` — list reminders, mark complete
- [ ] T006 [P] Create `store/api/referralApi.ts` — referral stats

---

### T001 — Add English i18n keys `lib/i18n/locales/en.json`

Add a new top-level `"loyalty"` key after the `"language"` key, a new top-level `"vehicles"` key, and a new `"referral"` key. Also add `"myLoyalty"`, `"myVehicles"`, and `"referral"` under the existing `"profile"` object.

**In `profile` object** (after `"about": "About"`), add:
```json
"myLoyalty": "My Loyalty",
"myVehicles": "My Vehicles",
"referralProgram": "Referral Program"
```

**New top-level keys** (add before the closing `}` of the entire JSON):
```json
"loyalty": {
  "title": "My Loyalty",
  "points": "Points",
  "availablePoints": "Available Points",
  "lifetimePoints": "Lifetime Points",
  "tier": "Tier",
  "tierProgress": "Progress to {{tier}}",
  "expiringWarning": "{{points}} points expire on {{date}}",
  "viewRewards": "View Rewards",
  "history": "History",
  "noRewards": "No rewards available",
  "rewardsTitle": "Rewards Catalog",
  "redeem": "Redeem",
  "redeemConfirm": "Redeem this reward for {{points}} points?",
  "redeemSuccess": "Reward redeemed!",
  "yourCode": "Your code",
  "copyCode": "Copy Code",
  "codeCopied": "Code copied!",
  "codeExpires": "Expires {{date}}",
  "insufficient": "Insufficient points",
  "tierRequired": "Requires {{tier}} tier",
  "historyTitle": "Points History",
  "noHistory": "No transactions yet",
  "loadMore": "Load more",
  "earned": "Earned",
  "spent": "Spent",
  "tiers": {
    "BRONZE": "Bronze",
    "SILVER": "Silver",
    "GOLD": "Gold",
    "PLATINUM": "Platinum"
  },
  "rewardTypes": {
    "DISCOUNT_PERCENT": "{{value}}% Discount",
    "DISCOUNT_FIXED": "KD {{value}} Off",
    "FREE_SERVICE": "Free Service"
  }
},
"vehicles": {
  "title": "My Vehicles",
  "addVehicle": "Add Vehicle",
  "noVehicles": "No vehicles yet",
  "noVehiclesMessage": "Add your vehicle to track service history and get reminders.",
  "make": "Make",
  "makePlaceholder": "e.g. Toyota",
  "model": "Model",
  "modelPlaceholder": "e.g. Corolla",
  "year": "Year",
  "yearPlaceholder": "e.g. 2020",
  "licensePlate": "License Plate",
  "licensePlatePlaceholder": "e.g. 12345",
  "color": "Color",
  "colorPlaceholder": "e.g. White",
  "mileage": "Current Mileage (km)",
  "mileagePlaceholder": "e.g. 45000",
  "nickname": "Nickname (optional)",
  "nicknamePlaceholder": "e.g. My Daily Driver",
  "primary": "Primary Vehicle",
  "save": "Save Vehicle",
  "dashboard": "Vehicle Dashboard",
  "totalServices": "Total Services",
  "totalSpent": "Total Spent",
  "lastService": "Last Service",
  "noHistory": "No service history yet",
  "reminders": "Maintenance Reminders",
  "noReminders": "No reminders",
  "overdue": "Overdue",
  "dueSoon": "Due Soon",
  "upcoming": "Upcoming",
  "daysOverdue": "{{count}} days overdue",
  "daysLeft": "{{count}} days left",
  "markComplete": "Mark as Done",
  "yearInvalid": "Year must be between 1900 and {{max}}",
  "viewReminders": "View All Reminders",
  "deleteConfirm": "Delete this vehicle?",
  "deleted": "Vehicle deleted"
},
"referral": {
  "title": "Referral Program",
  "yourCode": "Your Referral Code",
  "shareMessage": "Join Maintenance Centers and get rewarded! Use my referral code: {{code}}",
  "share": "Share Code",
  "stats": "Your Referrals",
  "total": "Total Referrals",
  "completed": "Completed",
  "pending": "Pending",
  "pointsEarned": "Points Earned",
  "noReferrals": "No referrals yet",
  "status": {
    "PENDING": "Pending",
    "COMPLETED": "Completed"
  }
}
```

---

### T002 — Add Arabic i18n keys `lib/i18n/locales/ar.json`

Apply the same structural changes as T001 but with Arabic values.

**In `profile` object**, add:
```json
"myLoyalty": "ولائي",
"myVehicles": "سياراتي",
"referralProgram": "برنامج الإحالة"
```

**New top-level keys**:
```json
"loyalty": {
  "title": "ولائي",
  "points": "نقاط",
  "availablePoints": "النقاط المتاحة",
  "lifetimePoints": "إجمالي النقاط",
  "tier": "المستوى",
  "tierProgress": "التقدم نحو {{tier}}",
  "expiringWarning": "{{points}} نقطة تنتهي في {{date}}",
  "viewRewards": "عرض المكافآت",
  "history": "السجل",
  "noRewards": "لا توجد مكافآت متاحة",
  "rewardsTitle": "كتالوج المكافآت",
  "redeem": "استبدال",
  "redeemConfirm": "استبدال هذه المكافأة مقابل {{points}} نقطة؟",
  "redeemSuccess": "تم استبدال المكافأة!",
  "yourCode": "رمزك",
  "copyCode": "نسخ الرمز",
  "codeCopied": "تم نسخ الرمز!",
  "codeExpires": "ينتهي {{date}}",
  "insufficient": "نقاط غير كافية",
  "tierRequired": "يتطلب مستوى {{tier}}",
  "historyTitle": "سجل النقاط",
  "noHistory": "لا توجد معاملات بعد",
  "loadMore": "تحميل المزيد",
  "earned": "مكتسبة",
  "spent": "مستهلكة",
  "tiers": {
    "BRONZE": "برونزي",
    "SILVER": "فضي",
    "GOLD": "ذهبي",
    "PLATINUM": "بلاتيني"
  },
  "rewardTypes": {
    "DISCOUNT_PERCENT": "خصم {{value}}%",
    "DISCOUNT_FIXED": "خصم {{value}} د.ك",
    "FREE_SERVICE": "خدمة مجانية"
  }
},
"vehicles": {
  "title": "سياراتي",
  "addVehicle": "إضافة مركبة",
  "noVehicles": "لا توجد مركبات بعد",
  "noVehiclesMessage": "أضف مركبتك لتتبع سجل الخدمات والتذكيرات.",
  "make": "الشركة المصنعة",
  "makePlaceholder": "مثال: تويوتا",
  "model": "الطراز",
  "modelPlaceholder": "مثال: كورولا",
  "year": "سنة الصنع",
  "yearPlaceholder": "مثال: 2020",
  "licensePlate": "رقم اللوحة",
  "licensePlatePlaceholder": "مثال: 12345",
  "color": "اللون",
  "colorPlaceholder": "مثال: أبيض",
  "mileage": "عداد المسافة الحالي (كم)",
  "mileagePlaceholder": "مثال: 45000",
  "nickname": "اسم مستعار (اختياري)",
  "nicknamePlaceholder": "مثال: سيارتي اليومية",
  "primary": "المركبة الرئيسية",
  "save": "حفظ المركبة",
  "dashboard": "لوحة تحكم المركبة",
  "totalServices": "إجمالي الخدمات",
  "totalSpent": "إجمالي المدفوع",
  "lastService": "آخر خدمة",
  "noHistory": "لا يوجد سجل خدمات بعد",
  "reminders": "تذكيرات الصيانة",
  "noReminders": "لا توجد تذكيرات",
  "overdue": "متأخرة",
  "dueSoon": "قريباً",
  "upcoming": "قادمة",
  "daysOverdue": "متأخرة {{count}} يوم",
  "daysLeft": "{{count}} يوم متبقٍ",
  "markComplete": "تحديد كمكتمل",
  "yearInvalid": "يجب أن تكون السنة بين 1900 و {{max}}",
  "viewReminders": "عرض جميع التذكيرات",
  "deleteConfirm": "هل تريد حذف هذه المركبة؟",
  "deleted": "تم حذف المركبة"
},
"referral": {
  "title": "برنامج الإحالة",
  "yourCode": "رمز الإحالة الخاص بك",
  "shareMessage": "انضم إلى مراكز الصيانة واحصل على مكافآت! استخدم رمز الإحالة الخاص بي: {{code}}",
  "share": "مشاركة الرمز",
  "stats": "إحالاتك",
  "total": "إجمالي الإحالات",
  "completed": "مكتملة",
  "pending": "معلقة",
  "pointsEarned": "النقاط المكتسبة",
  "noReferrals": "لا توجد إحالات بعد",
  "status": {
    "PENDING": "معلقة",
    "COMPLETED": "مكتملة"
  }
}
```

---

### T003 — Create `store/api/loyaltyApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#A8A9AD',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};

export const TIER_TEXT_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#fff',
  SILVER: '#1A1A2E',
  GOLD: '#7B6300',
  PLATINUM: '#1A1A2E',
};

export enum RewardType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  FREE_SERVICE = 'FREE_SERVICE',
}

export interface LoyaltyTierProgress {
  currentPoints: number;
  requiredPoints: number;
  percent: number;
  nextTier: LoyaltyTier | null;
}

export interface ExpiringPoints {
  points: number;
  expiresAt: string;
}

export interface LoyaltyAccount {
  totalPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierMultiplier: number;
  tierProgress: LoyaltyTierProgress;
  expiringPoints?: ExpiringPoints;
}

export interface LoyaltyReward {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  tierRequired: LoyaltyTier | null;
  canRedeem: boolean;
  reasonCannotRedeem?: string;
  validUntil?: string;
}

export interface RedemptionResult {
  redemptionCode: string;
  expiresAt: string;
  pointsDeducted: number;
  remainingPoints: number;
}

export interface LoyaltyTransaction {
  id: number;
  description: string;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string;
}

export interface PaginatedTransactions {
  content: LoyaltyTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const loyaltyApi = createApi({
  reducerPath: 'loyaltyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['LoyaltyAccount', 'LoyaltyRewards', 'LoyaltyTransactions'],
  endpoints: (builder) => ({
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
    getLoyaltyTransactions: builder.query<PaginatedTransactions, { page: number; size: number }>({
      query: ({ page, size }) => ({ url: 'loyalty/transactions', params: { page, size } }),
      providesTags: ['LoyaltyTransactions'],
    }),
  }),
});

export const {
  useGetLoyaltyAccountQuery,
  useGetLoyaltyRewardsQuery,
  useRedeemRewardMutation,
  useGetLoyaltyTransactionsQuery,
} = loyaltyApi;
```

---

### T004 — Create `store/api/vehiclesApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface UserVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  color?: string;
  currentMileage?: number;
  nickname?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  color?: string;
  currentMileage?: number;
  nickname?: string;
}

export interface ServiceHistorySummary {
  totalServices: number;
  totalSpentKD: number;
  lastServiceDate?: string;
}

export interface RecentService {
  bookingId: number;
  centerNameEn: string;
  centerNameAr: string;
  serviceType: string;
  completedAt: string;
  amountKD?: number;
}

export interface MaintenanceReminderBrief {
  id: number;
  name: string;
  dueDate?: string;
  status: string;
  daysUntilDue?: number;
}

export interface VehicleDashboard {
  vehicle: UserVehicle;
  stats: ServiceHistorySummary;
  upcomingReminders: MaintenanceReminderBrief[];
  recentServices: RecentService[];
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const vehiclesApi = createApi({
  reducerPath: 'vehiclesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Vehicles', 'VehicleDashboard'],
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleDashboardQuery,
} = vehiclesApi;
```

---

### T005 — Create `store/api/remindersApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum ReminderStatus {
  UPCOMING = 'UPCOMING',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
}

export enum ReminderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface MaintenanceReminder {
  id: number;
  vehicleId: number;
  name: string;
  dueDate?: string;
  dueMileage?: number;
  priority: ReminderPriority;
  status: ReminderStatus;
  daysUntilDue?: number;
  isCompleted: boolean;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const remindersApi = createApi({
  reducerPath: 'remindersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Reminders'],
  endpoints: (builder) => ({
    getVehicleReminders: builder.query<MaintenanceReminder[], number>({
      query: (vehicleId) => `vehicles/${vehicleId}/reminders`,
      providesTags: (result, error, vehicleId) => [{ type: 'Reminders', id: vehicleId }],
    }),
    completeReminder: builder.mutation<void, { reminderId: number; vehicleId: number }>({
      query: ({ reminderId }) => ({
        url: `reminders/${reminderId}/complete`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: (result, error, { vehicleId }) => [{ type: 'Reminders', id: vehicleId }],
    }),
  }),
});

export const { useGetVehicleRemindersQuery, useCompleteReminderMutation } = remindersApi;
```

---

### T006 — Create `store/api/referralApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface ReferralEntry {
  referredName: string;
  status: 'PENDING' | 'COMPLETED';
  pointsEarned: number;
  referredAt: string;
}

export interface ReferralStats {
  referralCode: string;
  shareUrl: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  referrals: ReferralEntry[];
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const referralApi = createApi({
  reducerPath: 'referralApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Referral'],
  endpoints: (builder) => ({
    getReferralStats: builder.query<ReferralStats, void>({
      query: () => 'referral',
      providesTags: ['Referral'],
    }),
  }),
});

export const { useGetReferralStatsQuery } = referralApi;
```

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Register all 4 new slices in the Redux store. Must complete before any component work.

**⚠️ CRITICAL**: T007 depends on T003 + T004 + T005 + T006 all completing first.

- [ ] T007 Register loyaltyApi, vehiclesApi, remindersApi, referralApi in `store/index.ts`

**Checkpoint**: TypeScript compiles. All hooks (`useGetLoyaltyAccountQuery`, `useGetVehiclesQuery`, etc.) are importable.

---

### T007 — Register new slices in `store/index.ts`

**Step 1**: Add four imports after the last existing API import (after `import { profileApi }`):

```typescript
import { loyaltyApi } from './api/loyaltyApi';
import { vehiclesApi } from './api/vehiclesApi';
import { remindersApi } from './api/remindersApi';
import { referralApi } from './api/referralApi';
```

**Step 2**: Add four reducer entries in `configureStore` (after `[profileApi.reducerPath]: profileApi.reducer,`):

```typescript
[loyaltyApi.reducerPath]: loyaltyApi.reducer,
[vehiclesApi.reducerPath]: vehiclesApi.reducer,
[remindersApi.reducerPath]: remindersApi.reducer,
[referralApi.reducerPath]: referralApi.reducer,
```

**Step 3**: Add four middleware entries in `.concat(...)` (after `profileApi.middleware,`):

```typescript
loyaltyApi.middleware,
vehiclesApi.middleware,
remindersApi.middleware,
referralApi.middleware,
```

---

## Phase 3: User Story 1 — Loyalty Points & Tier Dashboard (Priority: P1) 🎯 MVP

**Goal**: Customer can open Loyalty screen and see points, tier badge, tier progress bar, and navigate to rewards and history.

**Independent Test**: Profile → "My Loyalty" → Loyalty screen loads → balance, tier badge, progress bar visible → "View Rewards" navigates to rewards screen.

- [ ] T008 [P] [US1] Create `components/loyalty/TierBadge.tsx`
- [ ] T009 [P] [US1] Create `components/loyalty/PointsProgressBar.tsx`
- [ ] T010 [US1] Create `app/(app)/(tabs)/profile/loyalty.tsx` (depends on T008, T009)

**Checkpoint**: User Story 1 complete — Loyalty dashboard independently navigable and renderable.

---

### T008 — Create `components/loyalty/TierBadge.tsx`

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTier, TIER_COLORS, TIER_TEXT_COLORS } from '../../store/api/loyaltyApi';

interface Props {
  tier: LoyaltyTier;
  size?: 'small' | 'large';
}

export default function TierBadge({ tier, size = 'small' }: Props) {
  const { t } = useTranslation();
  const bgColor = TIER_COLORS[tier];
  const textColor = TIER_TEXT_COLORS[tier];
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        isLarge && styles.badgeLarge,
      ]}
    >
      <AppText
        style={[
          styles.text,
          { color: textColor },
          isLarge && styles.textLarge,
        ]}
      >
        {t(`loyalty.tiers.${tier}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: 14,
  },
});
```

---

### T009 — Create `components/loyalty/PointsProgressBar.tsx`

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTierProgress, LoyaltyTier } from '../../store/api/loyaltyApi';

interface Props {
  progress: LoyaltyTierProgress;
  isRTL: boolean;
}

export default function PointsProgressBar({ progress, isRTL }: Props) {
  const { t } = useTranslation();

  if (!progress.nextTier) {
    return (
      <View style={styles.container}>
        <AppText style={styles.maxLabel}>
          {t('loyalty.tiers.PLATINUM')} ✦
        </AppText>
      </View>
    );
  }

  const pct = Math.min(100, Math.max(0, progress.percent));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText style={styles.label}>
          {t('loyalty.tierProgress', { tier: t(`loyalty.tiers.${progress.nextTier}`) })}
        </AppText>
        <AppText style={styles.fraction}>
          {progress.currentPoints} / {progress.requiredPoints}
        </AppText>
      </View>
      <View style={[styles.track, isRTL && styles.trackRTL]}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  fraction: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  maxLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackRTL: {
    transform: [{ scaleX: -1 }],
  },
  fill: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});
```

---

### T010 — Create `app/(app)/(tabs)/profile/loyalty.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import PointsProgressBar from '../../../../components/loyalty/PointsProgressBar';
import TierBadge from '../../../../components/loyalty/TierBadge';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { TIER_COLORS, useGetLoyaltyAccountQuery } from '../../../../store/api/loyaltyApi';

export default function LoyaltyScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const { data: account, isLoading } = useGetLoyaltyAccountQuery();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !account ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <>
            {/* Hero Card */}
            <View style={[styles.hero, { backgroundColor: TIER_COLORS[account.tier] }]}>
              <View style={[styles.heroTop, isRTL && styles.rowReverse]}>
                <View>
                  <AppText style={styles.heroPointsLabel}>{t('loyalty.availablePoints')}</AppText>
                  <AppText style={styles.heroPoints}>{account.totalPoints.toLocaleString()}</AppText>
                </View>
                <TierBadge tier={account.tier} size="large" />
              </View>
              <AppText style={styles.heroLifetime}>
                {t('loyalty.lifetimePoints')}: {account.lifetimePoints.toLocaleString()}
              </AppText>
              {account.tierProgress && (
                <PointsProgressBar progress={account.tierProgress} isRTL={isRTL} />
              )}
            </View>

            {/* Expiring Points Warning */}
            {account.expiringPoints && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={18} color="#E65100" />
                <AppText style={styles.warningText}>
                  {t('loyalty.expiringWarning', {
                    points: account.expiringPoints.points,
                    date: formatDate(account.expiringPoints.expiresAt),
                  })}
                </AppText>
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={styles.buttonsRow}>
              <AppButton
                title={t('loyalty.viewRewards')}
                onPress={() => router.push('/(app)/(tabs)/profile/rewards')}
                style={styles.navBtn as any}
              />
              <AppButton
                title={t('loyalty.history')}
                onPress={() => router.push('/(app)/(tabs)/profile/loyalty-history')}
                variant="secondary"
                style={styles.navBtn as any}
              />
            </View>

            {/* Tier Multiplier */}
            <View style={styles.infoCard}>
              <AppText style={styles.infoLabel}>{t('loyalty.tier')}</AppText>
              <AppText style={styles.infoValue}>
                {t(`loyalty.tiers.${account.tier}`)} · {account.tierMultiplier}×
              </AppText>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  hero: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  heroPointsLabel: { fontSize: 13, color: '#fff', opacity: 0.85, marginBottom: 4 },
  heroPoints: { fontSize: 36, fontWeight: '800', color: '#fff' },
  heroLifetime: { fontSize: 12, color: '#fff', opacity: 0.75, marginTop: 4 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: { fontSize: 13, color: '#E65100', flex: 1 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  navBtn: { flex: 1 },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: { fontSize: 14, color: '#757575' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
});
```

---

## Phase 4: User Story 2 — Rewards Catalog & Redemption (Priority: P1)

**Goal**: Customer browses available rewards; eligible rewards can be redeemed inline with code displayed.

**Independent Test**: Open rewards catalog → reward with `canRedeem=true` → tap Redeem → confirm → redemption code appears in card.

- [ ] T011 [P] [US2] Create `components/loyalty/RewardCard.tsx`
- [ ] T012 [US2] Create `app/(app)/(tabs)/profile/rewards.tsx` (depends on T011)

**Checkpoint**: Rewards catalog functional; inline redemption code displayed after success.

---

### T011 — Create `components/loyalty/RewardCard.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import {
  LoyaltyReward,
  RedemptionResult,
  RewardType,
  useRedeemRewardMutation,
} from '../../store/api/loyaltyApi';

interface Props {
  reward: LoyaltyReward;
  isRTL: boolean;
  onRedeemed: (result: RedemptionResult) => void;
}

export default function RewardCard({ reward, isRTL, onRedeemed }: Props) {
  const { t, i18n } = useTranslation();
  const [redeemReward, { isLoading }] = useRedeemRewardMutation();
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  const name = i18n.language === 'ar' ? reward.nameAr : reward.nameEn;

  const getRewardLabel = () => {
    switch (reward.rewardType) {
      case RewardType.DISCOUNT_PERCENT:
        return t('loyalty.rewardTypes.DISCOUNT_PERCENT', { value: reward.rewardValue });
      case RewardType.DISCOUNT_FIXED:
        return t('loyalty.rewardTypes.DISCOUNT_FIXED', { value: reward.rewardValue.toFixed(3) });
      case RewardType.FREE_SERVICE:
        return t('loyalty.rewardTypes.FREE_SERVICE');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleRedeem = () => {
    const doRedeem = () =>
      redeemReward(reward.id)
        .unwrap()
        .then((result) => {
          setRedemptionResult(result);
          onRedeemed(result);
        })
        .catch((err) => {
          const msg = err?.data?.businessErrorDescription ?? t('common.retry');
          Alert.alert(t('common.error'), msg);
        });

    if (Platform.OS === 'web') {
      if (window.confirm(t('loyalty.redeemConfirm', { points: reward.pointsRequired }))) doRedeem();
    } else {
      Alert.alert(
        t('loyalty.rewardsTitle'),
        t('loyalty.redeemConfirm', { points: reward.pointsRequired }),
        [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.confirm'), onPress: doRedeem }]
      );
    }
  };

  const handleCopy = async () => {
    if (redemptionResult) {
      await Clipboard.setStringAsync(redemptionResult.redemptionCode);
      Alert.alert('', t('loyalty.codeCopied'));
    }
  };

  return (
    <View style={[styles.card, !reward.canRedeem && styles.cardDisabled]}>
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <View style={styles.titleBlock}>
          <AppText style={[styles.name, !reward.canRedeem && styles.nameDisabled]}>{name}</AppText>
          <AppText style={styles.rewardLabel}>{getRewardLabel()}</AppText>
        </View>
        <View style={styles.pointsBadge}>
          <AppText style={styles.pointsValue}>{reward.pointsRequired}</AppText>
          <AppText style={styles.pointsUnit}>{t('loyalty.points')}</AppText>
        </View>
      </View>

      {reward.validUntil && (
        <AppText style={styles.validUntil}>
          {t('loyalty.codeExpires', { date: formatDate(reward.validUntil) })}
        </AppText>
      )}

      {!reward.canRedeem && reward.reasonCannotRedeem && (
        <AppText style={styles.reason}>{reward.reasonCannotRedeem}</AppText>
      )}

      {/* Redemption code display */}
      {redemptionResult ? (
        <View style={styles.codeBox}>
          <AppText style={styles.codeLabel}>{t('loyalty.yourCode')}</AppText>
          <View style={[styles.codeRow, isRTL && styles.rowReverse]}>
            <AppText style={styles.code}>{redemptionResult.redemptionCode}</AppText>
            <AppButton
              title={t('loyalty.copyCode')}
              onPress={handleCopy}
              variant="secondary"
              style={styles.copyBtn as any}
            />
          </View>
          <AppText style={styles.codeExpiry}>
            {t('loyalty.codeExpires', { date: formatDate(redemptionResult.expiresAt) })}
          </AppText>
        </View>
      ) : (
        <AppButton
          title={t('loyalty.redeem')}
          onPress={handleRedeem}
          disabled={!reward.canRedeem || isLoading}
          style={[styles.redeemBtn, !reward.canRedeem && styles.redeemBtnDisabled] as any}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: { opacity: 0.65 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  titleBlock: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  nameDisabled: { color: '#9E9E9E' },
  rewardLabel: { fontSize: 13, color: '#2196F3', fontWeight: '500' },
  pointsBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pointsValue: { fontSize: 18, fontWeight: '800', color: '#1565C0' },
  pointsUnit: { fontSize: 10, color: '#1565C0' },
  validUntil: { fontSize: 11, color: '#9E9E9E', marginBottom: 6 },
  reason: { fontSize: 12, color: '#F44336', marginBottom: 8 },
  redeemBtn: { marginTop: 8 },
  redeemBtnDisabled: { opacity: 0.5 },
  codeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  codeLabel: { fontSize: 11, color: '#388E3C', marginBottom: 6, fontWeight: '600' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  code: { fontSize: 18, fontWeight: '800', color: '#1B5E20', flex: 1, letterSpacing: 1 },
  copyBtn: { paddingHorizontal: 8 },
  codeExpiry: { fontSize: 11, color: '#4CAF50' },
});
```

---

### T012 — Create `app/(app)/(tabs)/profile/rewards.tsx`

```typescript
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import RewardCard from '../../../../components/loyalty/RewardCard';
import { AppText } from '../../../../components/ui/AppText';
import { useGetLoyaltyRewardsQuery } from '../../../../store/api/loyaltyApi';

export default function RewardsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { data: rewards, isLoading } = useGetLoyaltyRewardsQuery();

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.rewardsTitle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !rewards || rewards.length === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('loyalty.noRewards')}</AppText>
          </View>
        ) : (
          <FlatList
            data={rewards}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RewardCard reward={item} isRTL={isRTL} onRedeemed={() => {}} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  list: { padding: 16 },
});
```

---

## Phase 5: User Story 3 — Points Transaction History (Priority: P2)

**Goal**: Customer views paginated points history with positive/negative indicators and infinite scroll.

**Independent Test**: Open Points History → transactions listed newest-first → green earned / red spent deltas visible → "Load more" appears when more pages exist.

- [ ] T013 [P] [US3] Create `components/loyalty/TransactionRow.tsx`
- [ ] T014 [US3] Create `app/(app)/(tabs)/profile/loyalty-history.tsx` (depends on T013)

**Checkpoint**: Points history independently functional.

---

### T013 — Create `components/loyalty/TransactionRow.tsx`

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTransaction } from '../../store/api/loyaltyApi';

interface Props {
  transaction: LoyaltyTransaction;
  isRTL: boolean;
}

export default function TransactionRow({ transaction, isRTL }: Props) {
  const { i18n } = useTranslation();
  const isEarned = transaction.pointsDelta > 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <View style={[styles.row, isRTL && styles.rowReverse]}>
      <View style={styles.textBlock}>
        <AppText style={styles.description} numberOfLines={2}>
          {transaction.description}
        </AppText>
        <AppText style={styles.date}>{formatDate(transaction.createdAt)}</AppText>
      </View>
      <View style={styles.amountBlock}>
        <AppText style={[styles.delta, isEarned ? styles.earned : styles.spent]}>
          {isEarned ? '+' : ''}{transaction.pointsDelta}
        </AppText>
        <AppText style={styles.balance}>{transaction.balanceAfter}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textBlock: { flex: 1, marginRight: 12 },
  description: { fontSize: 14, color: '#1A1A2E', marginBottom: 3 },
  date: { fontSize: 12, color: '#9E9E9E' },
  amountBlock: { alignItems: 'flex-end' },
  delta: { fontSize: 16, fontWeight: '700' },
  earned: { color: '#4CAF50' },
  spent: { color: '#F44336' },
  balance: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
});
```

---

### T014 — Create `app/(app)/(tabs)/profile/loyalty-history.tsx`

```typescript
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import TransactionRow from '../../../../components/loyalty/TransactionRow';
import { AppText } from '../../../../components/ui/AppText';
import { LoyaltyTransaction, useGetLoyaltyTransactionsQuery } from '../../../../store/api/loyaltyApi';

const PAGE_SIZE = 20;

export default function LoyaltyHistoryScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [page, setPage] = useState(0);
  const [allTransactions, setAllTransactions] = useState<LoyaltyTransaction[]>([]);

  const { data, isLoading, isFetching } = useGetLoyaltyTransactionsQuery({ page, size: PAGE_SIZE });

  useEffect(() => {
    if (data?.content) {
      setAllTransactions((prev) =>
        page === 0 ? data.content : [...prev, ...data.content]
      );
    }
  }, [data]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.historyTitle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <View style={styles.container}>
        {isLoading && page === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : allTransactions.length === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('loyalty.noHistory')}</AppText>
          </View>
        ) : (
          <FlatList
            data={allTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TransactionRow transaction={item} isRTL={isRTL} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              data && !data.last ? (
                <TouchableOpacity
                  style={styles.loadMore}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <AppText style={styles.loadMoreText}>{t('loyalty.loadMore')}</AppText>
                  )}
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  list: { padding: 16 },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: { fontSize: 14, color: '#2196F3', fontWeight: '600' },
});
```

---

## Phase 6: User Story 4 — Vehicle Management (Priority: P2)

**Goal**: Customer can add vehicles, see them in a list with primary badge, and open a vehicle dashboard.

**Independent Test**: Open My Vehicles → "Add Vehicle" → form with make/model/year → submit → vehicle appears in list → tap → dashboard shows stats.

- [ ] T015 [P] [US4] Create `components/vehicles/VehicleCard.tsx`
- [ ] T016 [P] [US4] Create `app/(app)/vehicles/index.tsx`
- [ ] T017 [US4] Create `app/(app)/vehicles/new.tsx`
- [ ] T018 [US4] Create `app/(app)/vehicles/[id].tsx`

**Checkpoint**: Vehicle Management independently navigable and functional.

---

### T015 — Create `components/vehicles/VehicleCard.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { UserVehicle } from '../../store/api/vehiclesApi';

interface Props {
  vehicle: UserVehicle;
  onPress: () => void;
  isRTL: boolean;
}

export default function VehicleCard({ vehicle, onPress, isRTL }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.row, isRTL && styles.rowReverse]}>
        <View style={styles.iconCircle}>
          <Ionicons name="car-outline" size={24} color="#2196F3" />
        </View>
        <View style={styles.info}>
          <View style={[styles.nameRow, isRTL && styles.rowReverse]}>
            <AppText style={styles.name}>
              {vehicle.make} {vehicle.model}
            </AppText>
            {vehicle.isPrimary && (
              <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
            )}
          </View>
          <AppText style={styles.meta}>
            {vehicle.year}
            {vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ''}
            {vehicle.color ? ` · ${vehicle.color}` : ''}
          </AppText>
          {vehicle.currentMileage && (
            <AppText style={styles.mileage}>
              {vehicle.currentMileage.toLocaleString()} km
            </AppText>
          )}
        </View>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={20}
          color="#9E9E9E"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowReverse: { flexDirection: 'row-reverse' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  starIcon: { marginLeft: 4 },
  meta: { fontSize: 13, color: '#757575', marginBottom: 2 },
  mileage: { fontSize: 12, color: '#9E9E9E' },
});
```

---

### T016 — Create `app/(app)/vehicles/index.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import VehicleCard from '../../../components/vehicles/VehicleCard';
import { AppText } from '../../../components/ui/AppText';
import { useDeleteVehicleMutation, useGetVehiclesQuery } from '../../../store/api/vehiclesApi';

export default function MyVehiclesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const { data: vehicles, isLoading } = useGetVehiclesQuery();
  const [deleteVehicle] = useDeleteVehicleMutation();

  const handleDelete = (id: number) => {
    const doDelete = () =>
      deleteVehicle(id)
        .unwrap()
        .then(() => Alert.alert('', t('vehicles.deleted')))
        .catch(() => Alert.alert(t('common.error'), t('common.retry')));

    if (Platform.OS === 'web') {
      if (window.confirm(t('vehicles.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('vehicles.title'), t('vehicles.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/vehicles/new')}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="add" size={24} color="#2196F3" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !vehicles || vehicles.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="car-outline" size={56} color="#BDBDBD" />
            <AppText style={styles.emptyTitle}>{t('vehicles.noVehicles')}</AppText>
            <AppText style={styles.emptyMsg}>{t('vehicles.noVehiclesMessage')}</AppText>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(app)/vehicles/new')}
            >
              <AppText style={styles.addBtnText}>{t('vehicles.addVehicle')}</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <VehicleCard
                vehicle={item}
                isRTL={isRTL}
                onPress={() =>
                  router.push({ pathname: '/(app)/vehicles/[id]', params: { id: String(item.id) } })
                }
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginTop: 16, marginBottom: 8 },
  emptyMsg: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#2196F3', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 16 },
});
```

---

### T017 — Create `app/(app)/vehicles/new.tsx`

```typescript
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useCreateVehicleMutation } from '../../../store/api/vehiclesApi';

const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z
    .number({ invalid_type_error: 'Year must be a number' })
    .int()
    .min(1900)
    .max(currentYear + 1),
  licensePlate: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  currentMileage: z.number().min(0).optional(),
  nickname: z.string().max(100).optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function NewVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createVehicle, { isLoading }] = useCreateVehicleMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { make: '', model: '', year: currentYear },
  });

  const onSubmit = async (values: VehicleForm) => {
    try {
      await createVehicle({
        make: values.make,
        model: values.model,
        year: values.year,
        licensePlate: values.licensePlate || undefined,
        color: values.color || undefined,
        currentMileage: values.currentMileage || undefined,
        nickname: values.nickname || undefined,
      }).unwrap();
      router.back();
    } catch (err: any) {
      const msg = err?.data?.businessErrorDescription ?? t('common.retry');
      Alert.alert(t('common.error'), msg);
    }
  };

  const Field = ({
    label,
    name,
    placeholder,
    keyboardType = 'default',
  }: {
    label: string;
    name: keyof VehicleForm;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, !!errors[name] && styles.inputError]}
            placeholder={placeholder}
            value={String(value ?? '')}
            onChangeText={(text) =>
              onChange(keyboardType === 'numeric' ? (text ? Number(text) : undefined) : text)
            }
            keyboardType={keyboardType}
          />
        )}
      />
      {errors[name] && (
        <AppText style={styles.errorText}>
          {name === 'year'
            ? t('vehicles.yearInvalid', { max: currentYear + 1 })
            : t('errors.required')}
        </AppText>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.addVehicle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Field label={t('vehicles.make')} name="make" placeholder={t('vehicles.makePlaceholder')} />
        <Field label={t('vehicles.model')} name="model" placeholder={t('vehicles.modelPlaceholder')} />
        <Field label={t('vehicles.year')} name="year" placeholder={t('vehicles.yearPlaceholder')} keyboardType="numeric" />
        <Field label={t('vehicles.licensePlate')} name="licensePlate" placeholder={t('vehicles.licensePlatePlaceholder')} />
        <Field label={t('vehicles.color')} name="color" placeholder={t('vehicles.colorPlaceholder')} />
        <Field label={t('vehicles.mileage')} name="currentMileage" placeholder={t('vehicles.mileagePlaceholder')} keyboardType="numeric" />
        <Field label={t('vehicles.nickname')} name="nickname" placeholder={t('vehicles.nicknamePlaceholder')} />
        <AppButton
          title={t('vehicles.save')}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.saveBtn as any}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  inputError: { borderColor: '#F44336' },
  errorText: { fontSize: 12, color: '#F44336', marginTop: 4 },
  saveBtn: { marginTop: 8 },
});
```

---

### T018 — Create `app/(app)/vehicles/[id].tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useGetVehicleDashboardQuery } from '../../../store/api/vehiclesApi';

export default function VehicleDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleId = Number(params.id);
  const isRTL = i18n.dir() === 'rtl';

  const { data, isLoading } = useGetVehicleDashboardQuery(vehicleId, { skip: !vehicleId });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <AppText style={styles.errorText}>{t('common.error')}</AppText>
      </View>
    );
  }

  const { vehicle, stats, upcomingReminders, recentServices } = data;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${vehicle.make} ${vehicle.model}`,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: t('vehicles.totalServices'), value: String(stats.totalServices) },
            { label: t('vehicles.totalSpent'), value: `KD ${stats.totalSpentKD.toFixed(3)}` },
            {
              label: t('vehicles.lastService'),
              value: stats.lastServiceDate ? formatDate(stats.lastServiceDate) : '—',
            },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <AppText style={styles.statValue}>{value}</AppText>
              <AppText style={styles.statLabel}>{label}</AppText>
            </View>
          ))}
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
            <AppText style={styles.sectionTitle}>{t('vehicles.reminders')}</AppText>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(app)/vehicles/reminders',
                  params: { id: String(vehicleId) },
                })
              }
            >
              <AppText style={styles.seeAll}>{t('vehicles.viewReminders')}</AppText>
            </TouchableOpacity>
          </View>
          {upcomingReminders.length === 0 ? (
            <AppText style={styles.emptyText}>{t('vehicles.noReminders')}</AppText>
          ) : (
            upcomingReminders.map((r) => (
              <View key={r.id} style={[styles.reminderRow, isRTL && styles.rowReverse]}>
                <Ionicons name="notifications-outline" size={16} color="#FF9800" />
                <AppText style={styles.reminderName}>{r.name}</AppText>
                {r.daysUntilDue !== undefined && (
                  <AppText style={[styles.reminderDays, r.daysUntilDue < 0 && styles.overdue]}>
                    {r.daysUntilDue < 0
                      ? t('vehicles.daysOverdue', { count: Math.abs(r.daysUntilDue) })
                      : t('vehicles.daysLeft', { count: r.daysUntilDue })}
                  </AppText>
                )}
              </View>
            ))
          )}
        </View>

        {/* Recent Services */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>{t('booking.bookingDetails')}</AppText>
          {recentServices.length === 0 ? (
            <AppText style={styles.emptyText}>{t('vehicles.noHistory')}</AppText>
          ) : (
            recentServices.map((s) => (
              <View key={s.bookingId} style={styles.serviceRow}>
                <AppText style={styles.serviceName}>
                  {i18n.language === 'ar' ? s.centerNameAr : s.centerNameEn}
                </AppText>
                <AppText style={styles.serviceDate}>{formatDate(s.completedAt)}</AppText>
                {s.amountKD && (
                  <AppText style={styles.serviceAmount}>KD {s.amountKD.toFixed(3)}</AppText>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#F44336' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2196F3', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#757575', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, margin: 16, marginTop: 0, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  seeAll: { fontSize: 13, color: '#2196F3' },
  emptyText: { fontSize: 13, color: '#9E9E9E' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  reminderName: { flex: 1, fontSize: 14, color: '#1A1A2E' },
  reminderDays: { fontSize: 12, color: '#FF9800' },
  overdue: { color: '#F44336' },
  serviceRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  serviceName: { fontSize: 14, color: '#1A1A2E', marginBottom: 2 },
  serviceDate: { fontSize: 12, color: '#9E9E9E' },
  serviceAmount: { fontSize: 13, color: '#2196F3', fontWeight: '600', marginTop: 2 },
});
```

---

## Phase 7: User Story 5 — Maintenance Reminders (Priority: P2)

**Goal**: Customer sees reminders grouped by urgency and can mark them complete.

**Independent Test**: Open vehicle reminders screen → OVERDUE group in red, DUE_SOON in amber → tap checkbox → reminder disappears.

- [ ] T019 [P] [US5] Create `components/vehicles/ReminderItem.tsx`
- [ ] T020 [US5] Create `app/(app)/vehicles/reminders.tsx` (depends on T019)

**Checkpoint**: Reminders screen functional with group headers and completion.

---

### T019 — Create `components/vehicles/ReminderItem.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { MaintenanceReminder, ReminderStatus } from '../../store/api/remindersApi';

interface Props {
  reminder: MaintenanceReminder;
  isRTL: boolean;
  onComplete: (id: number) => void;
  isCompleting: boolean;
}

const STATUS_COLORS: Record<ReminderStatus, string> = {
  OVERDUE: '#F44336',
  DUE_SOON: '#FF9800',
  UPCOMING: '#9E9E9E',
};

export default function ReminderItem({ reminder, isRTL, onComplete, isCompleting }: Props) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[reminder.status];

  const dueDaysLabel = () => {
    if (reminder.daysUntilDue === undefined) return null;
    if (reminder.daysUntilDue < 0) {
      return t('vehicles.daysOverdue', { count: Math.abs(reminder.daysUntilDue) });
    }
    return t('vehicles.daysLeft', { count: reminder.daysUntilDue });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.row, isRTL && styles.rowReverse]}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => !isCompleting && onComplete(reminder.id)}
        style={styles.checkbox}
        disabled={isCompleting}
      >
        {isCompleting ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <Ionicons name="checkbox-outline" size={24} color={color} />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <AppText style={[styles.name, { color }]}>{reminder.name}</AppText>
        {reminder.dueDate && (
          <AppText style={styles.dueDate}>{formatDate(reminder.dueDate)}</AppText>
        )}
        {reminder.dueMileage && (
          <AppText style={styles.dueDate}>{reminder.dueMileage.toLocaleString()} km</AppText>
        )}
      </View>

      {/* Days label */}
      {dueDaysLabel() && (
        <AppText style={[styles.daysLabel, { color }]}>{dueDaysLabel()}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  checkbox: { padding: 2 },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  dueDate: { fontSize: 12, color: '#9E9E9E' },
  daysLabel: { fontSize: 12, fontWeight: '600' },
});
```

---

### T020 — Create `app/(app)/vehicles/reminders.tsx`

```typescript
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import ReminderItem from '../../../components/vehicles/ReminderItem';
import { AppText } from '../../../components/ui/AppText';
import {
  MaintenanceReminder,
  ReminderStatus,
  useCompleteReminderMutation,
  useGetVehicleRemindersQuery,
} from '../../../store/api/remindersApi';

export default function VehicleRemindersScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const vehicleId = Number(params.id);
  const isRTL = i18n.dir() === 'rtl';

  const { data: reminders, isLoading } = useGetVehicleRemindersQuery(vehicleId, { skip: !vehicleId });
  const [completeReminder] = useCompleteReminderMutation();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleComplete = async (reminderId: number) => {
    setCompletingId(reminderId);
    try {
      await completeReminder({ reminderId, vehicleId }).unwrap();
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setCompletingId(null);
    }
  };

  const groups: { status: ReminderStatus; label: string; color: string }[] = [
    { status: ReminderStatus.OVERDUE, label: t('vehicles.overdue'), color: '#F44336' },
    { status: ReminderStatus.DUE_SOON, label: t('vehicles.dueSoon'), color: '#FF9800' },
    { status: ReminderStatus.UPCOMING, label: t('vehicles.upcoming'), color: '#757575' },
  ];

  const grouped = (status: ReminderStatus): MaintenanceReminder[] =>
    (reminders ?? []).filter((r) => r.status === status && !r.isCompleted);

  const total = (reminders ?? []).filter((r) => !r.isCompleted).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.reminders'),
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
        ) : total === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('vehicles.noReminders')}</AppText>
          </View>
        ) : (
          groups.map(({ status, label, color }) => {
            const items = grouped(status);
            if (items.length === 0) return null;
            return (
              <View key={status} style={styles.group}>
                <AppText style={[styles.groupHeader, { color }]}>{label}</AppText>
                {items.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    isRTL={isRTL}
                    onComplete={handleComplete}
                    isCompleting={completingId === reminder.id}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  group: { marginBottom: 20 },
  groupHeader: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
```

---

## Phase 8: User Story 6 — Referral Program (Priority: P3)

**Goal**: Customer sees their referral code, can share it via the native share sheet, and views referral stats.

**Independent Test**: Open Referral screen → code displayed → tap Share → native share sheet opens.

- [ ] T021 [US6] Create `app/(app)/(tabs)/profile/referral.tsx`

**Checkpoint**: Referral screen independently functional; Share works on native; clipboard fallback on web.

---

### T021 — Create `app/(app)/(tabs)/profile/referral.tsx`

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../../components/ui/AppText';
import { useGetReferralStatsQuery } from '../../../../store/api/referralApi';
import * as Clipboard from 'expo-clipboard';

export default function ReferralScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { data, isLoading } = useGetReferralStatsQuery();

  const handleShare = async () => {
    if (!data) return;
    const message = t('referral.shareMessage', { code: data.referralCode });

    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(data.shareUrl);
      Alert.alert('', t('loyalty.codeCopied'));
      return;
    }

    try {
      await Share.share({ message: `${message}\n${data.shareUrl}` });
    } catch {
      // User cancelled share — no action needed
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('referral.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !data ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <>
            {/* Code Card */}
            <View style={styles.codeCard}>
              <AppText style={styles.codeLabel}>{t('referral.yourCode')}</AppText>
              <AppText style={styles.code}>{data.referralCode}</AppText>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
                <AppText style={styles.shareBtnText}>{t('referral.share')}</AppText>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              {[
                { label: t('referral.total'), value: data.totalReferrals },
                { label: t('referral.completed'), value: data.completedReferrals },
                { label: t('referral.pending'), value: data.pendingReferrals },
                { label: t('referral.pointsEarned'), value: data.totalPointsEarned },
              ].map(({ label, value }) => (
                <View key={label} style={styles.statCard}>
                  <AppText style={styles.statValue}>{value}</AppText>
                  <AppText style={styles.statLabel}>{label}</AppText>
                </View>
              ))}
            </View>

            {/* Referrals List */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{t('referral.stats')}</AppText>
              {data.referrals.length === 0 ? (
                <AppText style={styles.emptyText}>{t('referral.noReferrals')}</AppText>
              ) : (
                data.referrals.map((entry, idx) => (
                  <View key={idx} style={[styles.entryRow, isRTL && styles.rowReverse]}>
                    <View style={styles.entryIcon}>
                      <Ionicons name="person-outline" size={20} color="#2196F3" />
                    </View>
                    <View style={styles.entryInfo}>
                      <AppText style={styles.entryName}>{entry.referredName}</AppText>
                      <AppText style={styles.entryDate}>{formatDate(entry.referredAt)}</AppText>
                    </View>
                    <View style={styles.entryRight}>
                      <AppText
                        style={[
                          styles.entryStatus,
                          entry.status === 'COMPLETED' && styles.statusCompleted,
                        ]}
                      >
                        {t(`referral.status.${entry.status}`)}
                      </AppText>
                      {entry.pointsEarned > 0 && (
                        <AppText style={styles.entryPoints}>+{entry.pointsEarned}</AppText>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  codeCard: {
    backgroundColor: '#2196F3',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  code: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 3, marginBottom: 20 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2196F3', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#757575', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, margin: 16, marginTop: 0, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 12 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  entryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  entryDate: { fontSize: 12, color: '#9E9E9E' },
  entryRight: { alignItems: 'flex-end' },
  entryStatus: { fontSize: 12, color: '#FF9800', fontWeight: '600' },
  statusCompleted: { color: '#4CAF50' },
  entryPoints: { fontSize: 13, color: '#4CAF50', fontWeight: '700' },
});
```

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Wire navigation rows in profile, audit RTL, run checklist.

- [ ] T022 Update `app/(app)/(tabs)/profile/index.tsx` — add My Loyalty, My Vehicles, Referral navigation rows
- [ ] T023 Run quickstart.md testing checklist — verify all 23 items pass

---

### T022 — Update `app/(app)/(tabs)/profile/index.tsx` — Add navigation rows

Find the existing "Settings & Info" section in the profile screen where navigation rows like Language, Privacy, Terms, Help are rendered. Add three new rows **before** the Language row:

```typescript
{/* My Loyalty */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/(app)/(tabs)/profile/loyalty')}
  activeOpacity={0.7}
>
  <View style={styles.menuLeft}>
    <Ionicons name="star-outline" size={20} color="#2196F3" />
    <AppText style={styles.menuText}>{t('profile.myLoyalty')}</AppText>
  </View>
  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
</TouchableOpacity>

{/* My Vehicles */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/(app)/vehicles')}
  activeOpacity={0.7}
>
  <View style={styles.menuLeft}>
    <Ionicons name="car-outline" size={20} color="#2196F3" />
    <AppText style={styles.menuText}>{t('profile.myVehicles')}</AppText>
  </View>
  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
</TouchableOpacity>

{/* Referral Program */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/(app)/(tabs)/profile/referral')}
  activeOpacity={0.7}
>
  <View style={styles.menuLeft}>
    <Ionicons name="gift-outline" size={20} color="#2196F3" />
    <AppText style={styles.menuText}>{t('profile.referralProgram')}</AppText>
  </View>
  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
</TouchableOpacity>
```

Note: `styles.menuItem`, `styles.menuLeft`, `styles.menuText` already exist in `profile/index.tsx` — reuse them directly.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001–T006)**: No dependencies — all 6 run in parallel
- **Foundational (Phase 2, T007)**: Depends on T003 + T004 + T005 + T006
- **US1 (Phase 3, T008–T010)**: Depends on Phase 2; T008 and T009 parallel; T010 depends on both
- **US2 (Phase 4, T011–T012)**: Depends on Phase 2; T011 parallel with T008/T009
- **US3 (Phase 5, T013–T014)**: Depends on Phase 2; T013 parallel with T008/T009/T011
- **US4 (Phase 6, T015–T018)**: Depends on Phase 2; T015 and T016 parallel with all components
- **US5 (Phase 7, T019–T020)**: Depends on Phase 2; T019 parallel with T015
- **US6 (Phase 8, T021)**: Depends on Phase 2
- **Polish (Phase 9, T022–T023)**: Depends on all user story phases complete

### User Story Independence

All 6 user stories are independent of each other after Phase 2.

---

## Parallel Example: After Phase 2 Complete

```
Parallel block A (components):
  T008: TierBadge.tsx
  T009: PointsProgressBar.tsx
  T011: RewardCard.tsx
  T013: TransactionRow.tsx
  T015: VehicleCard.tsx
  T016: vehicles/index.tsx
  T019: ReminderItem.tsx

Then (screens, each depends on their own component):
  T010: profile/loyalty.tsx (needs T008 + T009)
  T012: profile/rewards.tsx (needs T011)
  T014: profile/loyalty-history.tsx (needs T013)
  T017: vehicles/new.tsx (independent)
  T018: vehicles/[id].tsx (needs T015 context)
  T020: vehicles/reminders.tsx (needs T019)
  T021: profile/referral.tsx (independent)

Then:
  T022: profile/index.tsx (all screens must exist)
  T023: Checklist
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1 (T001–T006) in parallel
2. Complete Phase 2 (T007)
3. Complete Phase 3 US1 (T008–T010) — Loyalty Dashboard
4. Complete Phase 4 US2 (T011–T012) — Rewards Catalog
5. **STOP and VALIDATE**: Both P1 stories functional
6. Add remaining P2 stories (US3, US4, US5)
7. Add P3 story (US6)
8. Polish (T022–T023)

### Notes

- **T007 must wait** for T003 + T004 + T005 + T006
- **T008 and T009** are parallel (different files)
- **T022** modifies `profile/index.tsx` which is an existing file — read it carefully before editing to find the correct insertion point for the menu rows
- `expo-clipboard` is an Expo package — use `import * as Clipboard from 'expo-clipboard'` (not `@react-native-clipboard/clipboard`)
- All KD amounts: `.toFixed(3)` — 3 decimal places
- The `zodResolver` import: `import { zodResolver } from '@hookform/resolvers/zod'` — package `@hookform/resolvers` must be installed (check `package.json`)
