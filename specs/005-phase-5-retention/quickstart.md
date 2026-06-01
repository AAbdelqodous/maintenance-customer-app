# Quickstart: Phase 4.5 — Retention

**Branch**: `005-phase-4-5-retention`
**Date**: 2026-04-15

---

## Prerequisites

All Phase 4.0 Deep Trust dependencies must be in place. No new packages required.

Verify existing setup:
```bash
cd ~/MaintenanceCenters/maintenance-customer-app
cat package.json | grep '"react-hook-form"'  # Must exist (vehicle form validation)
cat package.json | grep '"zod"'              # Must exist
```

---

## Environment Setup

No new environment variables required. Existing `.env` is sufficient.

---

## Backend Requirements

All Phase 4.5 endpoints are new — none are yet implemented:

| Endpoint | Required For |
|----------|-------------|
| `GET /loyalty/account` | Loyalty Dashboard (US1) |
| `GET /loyalty/rewards` | Rewards Catalog (US2) |
| `POST /loyalty/rewards/:id/redeem` | Reward Redemption (US2) |
| `GET /loyalty/transactions` | Points History (US3) |
| `GET /vehicles` | Vehicle List (US4) |
| `POST /vehicles` | Add Vehicle (US4) |
| `DELETE /vehicles/:id` | Delete Vehicle (US4) |
| `GET /vehicles/:id/dashboard` | Vehicle Dashboard (US4) |
| `GET /vehicles/:id/reminders` | Maintenance Reminders (US5) |
| `PATCH /reminders/:id/complete` | Complete Reminder (US5) |
| `GET /referral` | Referral Screen (US6) |

**Graceful degradation when backend is not ready**: All components render empty states — no crashes.

---

## Running the App

```bash
npx expo start --web   # Fastest for UI development
npx expo start         # Native (Android: press 'a', iOS: press 'i')
```

---

## New Files to Create

In implementation order:

```
lib/i18n/locales/en.json                              # Add Phase 4.5 keys
lib/i18n/locales/ar.json                              # Add Phase 4.5 Arabic keys
store/api/loyaltyApi.ts                               # New RTK Query slice
store/api/vehiclesApi.ts                              # New RTK Query slice
store/api/remindersApi.ts                             # New RTK Query slice
store/api/referralApi.ts                              # New RTK Query slice
store/index.ts                                        # Register 4 new slices
components/loyalty/TierBadge.tsx
components/loyalty/PointsProgressBar.tsx
components/loyalty/RewardCard.tsx
components/loyalty/TransactionRow.tsx
components/vehicles/VehicleCard.tsx
components/vehicles/ReminderItem.tsx
app/(app)/(tabs)/profile/loyalty.tsx                  # Loyalty dashboard
app/(app)/(tabs)/profile/rewards.tsx                  # Rewards catalog
app/(app)/(tabs)/profile/loyalty-history.tsx          # Points history
app/(app)/(tabs)/profile/referral.tsx                 # Referral screen
app/(app)/vehicles/index.tsx                          # My vehicles list
app/(app)/vehicles/new.tsx                            # Add vehicle form
app/(app)/vehicles/[id].tsx                           # Vehicle dashboard
app/(app)/vehicles/reminders.tsx                      # Reminders screen
app/(app)/(tabs)/profile/index.tsx                    # Add My Loyalty, My Vehicles, Referral rows
```

---

## Testing Checklist

### Loyalty Dashboard (US1)
- [ ] Open Profile → "My Loyalty" row visible → tap → Loyalty screen loads
- [ ] Points balance, tier badge, and progress bar displayed
- [ ] Expiring points warning shows when applicable
- [ ] "View Rewards" button → rewards catalog opens
- [ ] "History" button → points history opens
- [ ] Switch to Arabic → RTL layout, all labels in Arabic

### Rewards Catalog (US2)
- [ ] Rewards list displays with point cost and reward value
- [ ] Ineligible reward greyed out with reason text
- [ ] Eligible reward → tap Redeem → confirm dialog → code displayed inline
- [ ] Code copy button copies to clipboard
- [ ] Switch to Arabic → reward names in Arabic

### Points History (US3)
- [ ] Transactions listed newest first
- [ ] Positive deltas (earned) shown in green, negative (spent) in red
- [ ] "Load more" button appears when more pages exist
- [ ] Empty state shown when no transactions

### Vehicle Management (US4)
- [ ] Profile → "My Vehicles" → vehicle list opens
- [ ] Tap "Add Vehicle" → form opens with all fields
- [ ] Submit with valid data → vehicle appears in list
- [ ] Year validation: year 1800 → error shown
- [ ] Primary vehicle has star badge
- [ ] Tap vehicle → dashboard shows stats, reminders, recent services

### Maintenance Reminders (US5)
- [ ] Vehicle dashboard → "Maintenance Reminders" → reminders screen opens
- [ ] Overdue reminders in red group, Due Soon in amber, Upcoming in grey
- [ ] Tap checkbox on reminder → spinner → reminder disappears from list
- [ ] No reminders → empty state shown

### Referral Program (US6)
- [ ] Profile → "Referral Program" → screen opens with unique code
- [ ] Tap "Share Code" → system share sheet opens with message + code
- [ ] Referral stats show total/pending/completed/points
- [ ] No referrals → "No referrals yet" but code still visible
