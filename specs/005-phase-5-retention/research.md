# Research: Phase 4.5 — Retention

**Branch**: `005-phase-4-5-retention`
**Date**: 2026-04-15

---

## Resolution Log

### 1. Navigation Structure for Loyalty & Vehicles

**Question**: Where do loyalty, vehicle, referral, and reminder screens live in the Expo Router file structure?

**Decision**:
- **Loyalty screens** → `app/(app)/(tabs)/profile/loyalty.tsx`, `rewards.tsx`, `loyalty-history.tsx`, `referral.tsx` — under the Profile tab since loyalty is user-account data.
- **Vehicle screens** → `app/(app)/vehicles/index.tsx`, `new.tsx`, `[id].tsx`, `reminders.tsx` — flat screens outside tabs, following the same pattern as `app/(app)/complaints/` and `app/(app)/reviews/`. Accessible via deep link from profile.

**Rationale**: Loyalty is profile-adjacent (same tab), vehicles are feature-specific screens that deserve their own route namespace. The complaints/reviews precedent confirms flat screen routing for feature areas.

---

### 2. Profile Screen Navigation Additions

**Question**: How does the user navigate to Loyalty, My Vehicles, and Referral?

**Decision**: Add three new navigation rows to `app/(app)/(tabs)/profile/index.tsx` in the "Settings & Info" section:
- **My Loyalty** → `router.push('/(app)/(tabs)/profile/loyalty')`
- **My Vehicles** → `router.push('/(app)/vehicles')`
- **Referral Program** → `router.push('/(app)/(tabs)/profile/referral')`

These rows use the same `TouchableOpacity` pattern as the existing "Language", "Privacy Policy", etc. rows.

---

### 3. Pagination Strategy for Points History

**Question**: Use RTK Query `serializeQueryArgs` infinite scroll or manual page management?

**Decision**: Manual page state (`useState(0)`) in the screen component. `useGetLoyaltyTransactionsQuery({ page, size: 20 })` is called with the page number. An "Load more" button appears when `!data.last` (following the paginated response pattern from `centersApi`). No RTK Query infinite scroll configuration needed.

**Rationale**: The existing codebase uses `{ content, totalPages, number, size, last }` paginated response shape. A simple `FlatList` + "Load more" button is consistent with bookings list and notifications list patterns.

---

### 4. Redemption Code Display

**Question**: How is the redemption code shown after successful redemption?

**Decision**: Inline within the `RewardCard` component. After a successful `POST /loyalty/rewards/:id/redeem`, the API response includes `{ redemptionCode, expiresAt }`. The card swaps its "Redeem" button state to show the code in a bordered box with a "Copy" action. No navigation push, no modal.

**Rationale**: Keeps the user on the rewards catalog screen so they can continue browsing. The code display pattern (bordered pill with copy button) is standard mobile UX.

---

### 5. Vehicle Year Validation

**Question**: Client-side or server-side year validation?

**Decision**: Both. Client-side with a Zod `z.number().min(1900).max(new Date().getFullYear() + 1)` schema validated by React Hook Form (already used in the booking form). Server also validates — client shows `t('errors.vehicleYearInvalid')` on mismatch.

**Rationale**: Consistent with existing React Hook Form + Zod pattern used throughout the app.

---

### 6. Reminder Completion UX

**Question**: Swipe gesture or checkbox tap to complete a reminder?

**Decision**: Tap on a checkbox icon (Ionicons `checkbox-outline` → `checkbox`). A loading state is shown during the PATCH request. Optimistic update: the item disappears immediately from the list; on error, the item reappears with an alert.

**Rationale**: Swipe gestures require `react-native-gesture-handler` configuration and are harder to implement reliably cross-platform. Checkbox tap is simpler, accessible, and consistent with the existing app style.

---

### 7. Share Functionality

**Question**: What library to use for the referral share action?

**Decision**: `Share.share()` from `react-native` built-in. No new library needed.

**Rationale**: `react-native` already exports `Share` — zero dependencies. Works on iOS, Android, and web (with clipboard fallback on web via `Platform.OS === 'web'` guard).

---

### 8. New API Slices

**Question**: One large `retentionApi` slice or per-resource slices?

**Decision**: Four separate slices:
- `loyaltyApi.ts` — LoyaltyAccount, LoyaltyReward, redeem, LoyaltyTransaction
- `vehiclesApi.ts` — CRUD vehicles, vehicle dashboard
- `remindersApi.ts` — list reminders, mark complete
- `referralApi.ts` — ReferralStats

**Rationale**: Consistent with the existing per-resource pattern. Keeps caches independent for fine-grained invalidation.

---

### 9. Tier Color Constants

**Decision**: Locked per spec assumptions. Define as a const map in `loyaltyApi.ts`:

```typescript
export const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#A8A9AD',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};
```

---

### 10. Reward Type Enum Values

**Decision**: Three values from spec:
```typescript
export enum RewardType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  FREE_SERVICE = 'FREE_SERVICE',
}
```

---

### 11. Reminder Status Grouping

**Decision**: Backend returns `status: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'`. The reminders screen groups by status in this order: OVERDUE → DUE_SOON → UPCOMING. Client groups by iterating: `reminders.filter(r => r.status === 'OVERDUE')` etc.

---

### 12. Loyalty Tier Enum

**Decision**:
```typescript
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}
```

---

### 13. Vehicle mileage unit

**Decision**: Kilometers (KM) — per constitution Regional Standards (distance: kilometers). Free text input with "km" suffix label. No conversion logic.
