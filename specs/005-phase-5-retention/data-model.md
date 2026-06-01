# Data Model: Phase 4.5 — Retention

**Branch**: `005-phase-4-5-retention`
**Date**: 2026-04-15

---

## Entity Definitions

### 1. LoyaltyTier (New Enum — loyaltyApi.ts)

```typescript
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
```

---

### 2. LoyaltyAccount (New — loyaltyApi.ts)

```typescript
export interface LoyaltyTierProgress {
  currentPoints: number;   // Points toward next tier
  requiredPoints: number;  // Total needed for next tier
  percent: number;         // 0–100
  nextTier: LoyaltyTier | null;  // null if already PLATINUM
}

export interface ExpiringPoints {
  points: number;
  expiresAt: string;  // ISO-8601 date
}

export interface LoyaltyAccount {
  totalPoints: number;       // Current available balance
  lifetimePoints: number;    // All-time earned
  tier: LoyaltyTier;
  tierMultiplier: number;    // e.g. 1.5 for Gold
  tierProgress: LoyaltyTierProgress;
  expiringPoints?: ExpiringPoints;  // null if no points expire this month
}
```

---

### 3. RewardType (New Enum — loyaltyApi.ts)

```typescript
export enum RewardType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  FREE_SERVICE = 'FREE_SERVICE',
}
```

---

### 4. LoyaltyReward (New — loyaltyApi.ts)

```typescript
export interface LoyaltyReward {
  id: number;
  code: string;             // e.g. "REWARD_GOLD_10OFF"
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;      // Percent (0–100) or KD amount or 1 for free service
  tierRequired: LoyaltyTier | null;  // null = available to all tiers
  canRedeem: boolean;       // True if customer has enough points AND meets tier
  reasonCannotRedeem?: string;  // Localised reason if canRedeem = false
  validUntil?: string;      // ISO-8601 date
}
```

---

### 5. RedemptionResult (New — loyaltyApi.ts)

```typescript
export interface RedemptionResult {
  redemptionCode: string;  // e.g. "REDEEM-ABC123"
  expiresAt: string;       // ISO-8601 date
  pointsDeducted: number;
  remainingPoints: number;
}
```

---

### 6. LoyaltyTransaction (New — loyaltyApi.ts)

```typescript
export interface LoyaltyTransaction {
  id: number;
  description: string;      // Localised by backend
  pointsDelta: number;      // Positive = earned, negative = spent
  balanceAfter: number;     // Running balance after this transaction
  createdAt: string;        // ISO-8601 datetime
}
```

---

### 7. UserVehicle (New — vehiclesApi.ts)

```typescript
export interface UserVehicle {
  id: number;
  make: string;          // e.g. "Toyota"
  model: string;         // e.g. "Corolla"
  year: number;          // e.g. 2020
  licensePlate?: string;
  color?: string;
  currentMileage?: number;  // km
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
```

**Validation Rules**:
- `year` must be 1900 ≤ year ≤ currentYear + 1 (client-side Zod + server-side)
- `make`, `model` are required, max 100 chars
- `licensePlate` is optional, max 20 chars

---

### 8. ServiceHistorySummary (New — vehiclesApi.ts)

```typescript
export interface ServiceHistorySummary {
  totalServices: number;
  totalSpentKD: number;
  lastServiceDate?: string;  // ISO-8601 date; null if no history
}
```

---

### 9. VehicleDashboard (New — vehiclesApi.ts)

```typescript
export interface VehicleDashboard {
  vehicle: UserVehicle;
  stats: ServiceHistorySummary;
  upcomingReminders: MaintenanceReminder[];  // First 3 upcoming/overdue
  recentServices: RecentService[];           // Last 3 bookings for this vehicle
}

export interface RecentService {
  bookingId: number;
  centerNameEn: string;
  centerNameAr: string;
  serviceType: string;
  completedAt: string;
  amountKD?: number;
}
```

---

### 10. ReminderStatus (New Enum — remindersApi.ts)

```typescript
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
```

---

### 11. MaintenanceReminder (New — remindersApi.ts)

```typescript
export interface MaintenanceReminder {
  id: number;
  vehicleId: number;
  name: string;              // e.g. "Oil Change" — localised by backend
  dueDate?: string;          // ISO-8601 date; null if mileage-only
  dueMileage?: number;       // km; null if date-only
  priority: ReminderPriority;
  status: ReminderStatus;
  daysUntilDue?: number;     // Negative = overdue by N days
  isCompleted: boolean;
}
```

---

### 12. ReferralEntry (New — referralApi.ts)

```typescript
export interface ReferralEntry {
  referredName: string;      // First name of referred user
  status: 'PENDING' | 'COMPLETED';
  pointsEarned: number;      // 0 if still pending
  referredAt: string;        // ISO-8601 date
}

export interface ReferralStats {
  referralCode: string;
  shareUrl: string;          // Deep link for sharing, e.g. "https://app.maintenancecenters.kw/join?ref=ABC123"
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  referrals: ReferralEntry[];
}
```

---

## Component Props Summary

### `TierBadge`
```typescript
interface Props {
  tier: LoyaltyTier;
  size?: 'small' | 'large';  // default 'small'
}
```

### `PointsProgressBar`
```typescript
interface Props {
  progress: LoyaltyTierProgress;
  isRTL: boolean;
}
```

### `RewardCard`
```typescript
interface Props {
  reward: LoyaltyReward;
  isRTL: boolean;
  onRedeemed: (result: RedemptionResult) => void;
}
```

### `TransactionRow`
```typescript
interface Props {
  transaction: LoyaltyTransaction;
  isRTL: boolean;
}
```

### `VehicleCard`
```typescript
interface Props {
  vehicle: UserVehicle;
  onPress: () => void;
  isRTL: boolean;
}
```

### `ReminderItem`
```typescript
interface Props {
  reminder: MaintenanceReminder;
  isRTL: boolean;
  onComplete: (id: number) => void;
  isCompleting: boolean;
}
```

---

## i18n Key–Value Mapping

### `en.json` additions
```json
{
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
    "yearInvalid": "Year must be between 1900 and {{max}}"
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
}
```

### `ar.json` additions
```json
{
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
    "yearInvalid": "يجب أن تكون السنة بين 1900 و {{max}}"
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
}
```
