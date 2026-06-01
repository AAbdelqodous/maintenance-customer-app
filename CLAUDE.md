# Maintenance Customer App — Claude Code Context

## 🎯 Project Overview

React Native customer-facing app for a service marketplace in Kuwait. Customers
discover, favorite, book, and review maintenance centers for cars, electronics,
and home appliances. Real-time chat with centers is supported.

**Target Market:** Kuwait (primary), GCC / Middle East (expansion)
**Languages:** Arabic RTL (primary), English
**Status:** Phase 1 (auth + foundation) ✅ complete. Phase 2 (core screens) ~60% complete.

---

## 🏗️ Architecture

### Repository Structure (3 Separate Repos)
```
life-experience-app/service-center/   # Spring Boot API backend
maintenance-center-app/               # React Native center-owner app (complete)
maintenance-customer-app/             # React Native customer app (this repo, in progress)
```

### File Layout
```
maintenance-customer-app/
├── app/
│   ├── _layout.tsx                   # Root: Provider + Stack + ErrorBoundary
│   ├── index.tsx                     # Splash redirect (checks onboarding + session)
│   ├── (onboarding)/
│   │   └── index.tsx                 # 3-slide carousel, first-time only
│   ├── (auth)/
│   │   ├── index.tsx                 # Auth entry (Sign In / Create Account)
│   │   ├── login.tsx                 # Login form
│   │   ├── register.tsx              # Registration form
│   │   └── otp-verify.tsx            # OTP verification + auto-login
│   └── (app)/
│       ├── _layout.tsx               # Auth guard + session expiry check
│       ├── index.tsx                 # Home placeholder
│       ├── search.tsx                # Debounced search screen
│       ├── about.tsx                 # About page
│       ├── help.tsx                  # Help/FAQ (stub)
│       ├── privacy.tsx               # Privacy policy (stub)
│       ├── terms.tsx                 # Terms (stub)
│       ├── (tabs)/
│       │   ├── _layout.tsx           # Bottom tabs: Home, Centers, Bookings, Chat, Profile
│       │   ├── index.tsx             # Tab home/dashboard
│       │   ├── centers/
│       │   │   ├── index.tsx         # Center list + search/filter (complete)
│       │   │   ├── [id].tsx          # Center detail + book/chat/favorite (complete)
│       │   │   └── reviews.tsx       # Center reviews list (partial)
│       │   ├── bookings/
│       │   │   ├── index.tsx         # My bookings list (complete)
│       │   │   ├── new.tsx           # Booking creation form (partial)
│       │   │   ├── [id].tsx          # Booking detail + cancel (partial)
│       │   │   ├── confirmation.tsx  # Booking summary before submit (stub)
│       │   │   └── success.tsx       # Success screen (stub)
│       │   ├── chat/
│       │   │   ├── index.tsx         # Conversations list (complete)
│       │   │   └── [id].tsx          # Chat thread + WebSocket (partial)
│       │   ├── favorites/
│       │   │   └── index.tsx         # Saved centers (complete)
│       │   ├── notifications/
│       │   │   └── index.tsx         # Notification list + mark read (complete)
│       │   └── profile/
│       │       └── index.tsx         # Profile view/edit/logout (complete)
│       ├── complaints/
│       │   ├── index.tsx             # My complaints list (complete)
│       │   ├── new.tsx               # Create complaint (partial)
│       │   └── [id].tsx              # Complaint detail (partial)
│       ├── reviews/
│       │   ├── index.tsx             # My reviews list (complete)
│       │   └── new.tsx               # Write review (complete)
│       └── settings/
│           ├── language.tsx          # Language switcher (complete)
│           └── notifications.tsx     # Notification prefs (stub)
├── store/
│   ├── index.ts                      # Store + 401 middleware
│   ├── authSlice.ts                  # session + JWT decode (exp, fullName)
│   ├── uiSlice.ts                    # locale, isRTL
│   ├── centersSlice.ts               # filters, recent searches
│   ├── bookingsSlice.ts              # booking filters
│   ├── chatSlice.ts                  # messages, conversations
│   ├── favoritesSlice.ts
│   ├── notificationsSlice.ts         # unread count
│   └── api/
│       ├── authApi.ts                # register, login, activateAccount
│       ├── centersApi.ts             # search, filter, getById, reviews, categories
│       ├── bookingsApi.ts            # create, list, getById, cancel
│       ├── chatApi.ts                # conversations, messages, startConversation
│       ├── reviewsApi.ts             # create, list, getByCenterId
│       ├── favoritesApi.ts           # add, remove, check, list
│       ├── notificationsApi.ts       # list, markRead, delete
│       ├── complaintsApi.ts          # create, list, getById
│       └── profileApi.ts             # getMe, update, changePassword, uploadImage
├── components/
│   ├── auth/                         # AuthInput, AuthButton, PasswordInput, OtpInput
│   ├── listings/                     # CenterCard, BookingCard, ReviewCard, NotificationItem
│   ├── onboarding/                   # OnboardingSlide, OnboardingDots
│   └── ui/                           # AppText, AppButton, SearchBar, FilterModal, RatingStars, LanguageSwitcher
├── hooks/
│   ├── useAuth.ts                    # session, isAuthenticated, isSessionExpired, logout
│   ├── useLanguage.ts                # locale, isRTL, switchLanguage
│   ├── useNetworkStatus.ts           # connectivity detection
│   └── useWebSocketChat.ts           # WebSocket chat (placeholder — needs full implementation)
├── lib/
│   ├── constants/config.ts           # API_BASE_URL (from app.config.js extra), WS_BASE_URL
│   ├── secureStorage.ts              # getJwt / setJwt / deleteJwt via expo-secure-store
│   └── i18n/
│       ├── index.ts                  # i18next init, async locale load
│       └── locales/en.json ar.json
├── specs/master/                     # Speckit: spec.md, plan.md, tasks.md (Phase 1 complete)
├── app.config.js                     # Reads EXPO_PUBLIC_API_BASE_URL from .env
└── app.json                          # Expo SDK 54 config
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Redux Toolkit + RTK Query |
| Forms | React Hook Form + Zod |
| Persistence | expo-secure-store (JWT) + AsyncStorage (locale, onboarding flag) |
| i18n | react-i18next (Arabic RTL + English) |
| Web support | react-native-web (static output) |
| Icons | @expo/vector-icons (Ionicons) |
| Network | @react-native-community/netinfo |
| Images | expo-image + expo-image-picker |
| Animations | react-native-reanimated + react-native-gesture-handler |
| New Architecture | Enabled (newArchEnabled: true, reactCompiler: true) |

---

## 📡 Backend API

**Base:** `http://10.0.2.2:8080/api/v1/` (Android) / `http://localhost:8080/api/v1/` (web)
**Configured via:** `app.config.js → extra.apiBaseUrl → lib/constants/config.ts`
**Auth header:** `Authorization: Bearer <jwt>`
**Paginated responses:** `{ content, totalElements, totalPages, number, size }`

### Key Response Field Names (do not rename)
| Field | Notes |
|-------|-------|
| `bookingStatus` | NOT `status` |
| `bookingDate`, `bookingTime` | NOT `scheduledDate`/`scheduledTime` |
| `isRead` | NOT `read` |
| `notificationType` | NOT `type` |
| `totalReviews` | NOT `reviewCount` |
| `isActive` | NOT `isOpen` |
| `nameAr`/`nameEn` | Always use bilingual pair |

### BookingRequest fields
```typescript
{
  centerId: number,
  serviceType: 'CAR' | 'ELECTRONICS' | 'HOME_APPLIANCE' | 'EMERGENCY' | 'INSTALLATION' | 'REPAIR',
  bookingDate: 'YYYY-MM-DD',
  bookingTime: 'HH:mm:ss',
  notes?: string,
  paymentMethod: 'CASH' | 'KNET' | 'CREDIT_CARD'
}
```

---

## 🔐 Session & Auth

- Login → `secureStorage.setJwt(token)` → Redux `setSession`
- App launch → `app/_layout.tsx` decodes JWT `exp` claim; expired → `clearSession` → login
- 401 → Redux middleware clears session → redirect to `/(auth)/`
- Logout → `useAuth().logout()` → clears JWT + Redux + navigates to auth entry

---

## ⚠️ Production Blockers (NOT production-ready yet)

1. **Partial screens** — bookings/new.tsx, bookings/[id].tsx, chat/[id].tsx, complaints/new.tsx, complaints/[id].tsx are incomplete
2. **Missing screens** — bookings/confirmation.tsx, bookings/success.tsx not built
3. **No EAS project ID** — `app.json` missing `extra.eas.projectId` for push notifications
4. **No refresh token** — JWT expires in 2.4h with no silent refresh; forces re-login
5. **HTTP not HTTPS** — `config.ts` uses `http://`; must switch to `https://` for production builds
6. **ws:// not wss://** — `config.ts` derives WebSocket URL; auto-converts http→ws but needs https→wss
7. **No crash reporting** — ErrorBoundary logs to console only; needs Sentry or Firebase Crashlytics
8. **No certificate pinning** — RTK Query uses plain fetch; add pinning for production
9. **Stub screens** — help.tsx, privacy.tsx, terms.tsx, settings/notifications.tsx have no content

---

## ⚙️ Development Environment

```bash
# Copy environment file
cp .env.example .env
# Edit .env: EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1

cd ~/MaintenanceCenters/maintenance-customer-app

npx expo start --web          # Web (browser)
npx expo start                # Native (requires Android/iOS emulator)
```

---

## 📋 Coding Standards

- RTK Query for **all** API calls — never raw `fetch`
- React Hook Form + Zod for all forms
- `??` not `||` for null/undefined fallbacks (avoids swallowing `false`)
- `Platform.OS === 'web'` guard for `Alert.alert` multi-button dialogs — use `window.confirm` on web
- Bilingual: always render `i18n.language === 'ar' ? item.nameAr : item.nameEn`
- RTL: `isRTL = i18n.dir() === 'rtl'` → `flexDirection: 'row-reverse'`, `textAlign: 'right'`
- Key field names: `bookingStatus` (not `status`), `bookingDate`/`bookingTime`, `isRead`, `notificationType`

### Existing Enums (do not redefine)
`BookingStatus`, `ServiceType`, `PaymentMethod`, `PaymentStatus`, `CancelledBy`,
`MessageType`, `SenderType`, `ComplaintType`, `ComplaintStatus`, `ComplaintPriority`,
`NotificationType`, `NotificationPriority`, `UserType`, `Language`, `SearchSource`

---

## 🚀 Development Phases

### Phase 1 — Foundation ✅ Complete (Tasks T001–T051)
- [x] Project scaffold + dependencies (Expo SDK 54, RTK Query, React Hook Form, Zod, i18next)
- [x] Redux store + authSlice + 401 middleware
- [x] SecureStore session persistence
- [x] i18n (Arabic RTL + English) with AsyncStorage persistence
- [x] Error boundary in root layout
- [x] Onboarding (3-slide carousel, one-time only)
- [x] Auth flow: register → OTP verify → login (JWT decode with exp check)
- [x] Session expiry detection + logout
- [x] Language switcher (AR/EN with RTL flip)
- [x] Offline detection on all form screens

### Phase 2 — Core Screens 🔄 In Progress (~60%)
- [x] Centers: search/filter list, center detail
- [x] Bookings: list with status tabs
- [x] Chat: conversations list
- [x] Favorites list
- [x] Notifications list + mark read
- [x] Profile view/edit/logout
- [x] My reviews list, complaints list
- [x] Write review (reviews/new.tsx)
- [ ] Booking form (new.tsx) — needs date/time pickers + payment method
- [ ] Booking detail ([id].tsx) — needs full fields + cancel + write review button
- [ ] Booking confirmation + success screens
- [ ] Chat thread ([id].tsx) — needs full WebSocket/STOMP real-time implementation
- [ ] Complaint new + detail screens
- [ ] Push notifications (FCM)

### Phase 3 — Polish & Production
- [ ] Refresh token flow
- [ ] EAS project ID + push notification setup
- [ ] HTTPS/WSS enforcement
- [ ] Crash reporting (Sentry)
- [ ] Certificate pinning
- [ ] Fill stub screens (help, privacy, terms, notification prefs)
- [ ] App store submission (EAS build)

---

## 🧠 Claude Code Rules

**1. Always ask before executing any command.**
State what you are about to run and wait for explicit confirmation.

**2. Always ask before modifying any existing file.**
Show full file path + summary of changes. Wait for confirmation.

**3. Read each file before editing it.**

**4. Production-ready code only — no pseudocode or placeholders.**

**5. Always confirm which repo before acting.**
- `service-center` — Spring Boot backend
- `maintenance-center-app` — React Native center-owner app
- `maintenance-customer-app` — React Native customer app (this repo)



# Phase 3.6 — Category → Service Booking Flow

> **Append to `maintenance-customer-app/CLAUDE.md`. Pairs with the backend's
> Phase 3.6 migration. Detailed UX requirements and tasks live in the Spec Kit
> spec at `specs/3.6-category-service-booking/` — this section is the pointer,
> not the source of truth.**

---

## 🎯 Goal

Update the booking flow to match the new backend hierarchy:
**center → categories → services → booking form**.

Currently the booking form's Step 1 ("Select Service") is hardcoded with a small
list (Engine Repair / Oil Change / Brake Service / Other). After this phase:

- A new **Category Select** screen sits between Center Detail and the booking form.
- Booking form Step 1 fetches services from
  `GET /centers/{id}/categories/{catId}/services` instead of using a static list.
- Bookings list and detail screens display the category + service name pair
  instead of the legacy `serviceType` enum.

---

## 📐 Design Decisions (locked — see backend Phase 3.6 for full rationale)

1. Service catalog is **global** (admin-curated) — clients consume it read-only
2. Customer drill-down is two levels: category, then service
3. Old `serviceType` enum is being deprecated — new bookings must send
   `categoryId` + `serviceId`
4. Old bookings may have null category/service during the transition window —
   list and detail screens must handle that gracefully
5. Generic 7-service catalog (REPAIR, MAINTENANCE, INSTALLATION, WARRANTY,
   INSPECTION, BUYING, SELLING) — the booking form's existing "Describe issue"
   step still collects specifics

---

## 📂 Files (high-level — see Spec Kit `plan.md` for details)

```
app/(app)/centers/[id]/
├── book/
│   ├── category.tsx              # NEW — CategorySelectScreen
│   └── (existing booking form)   # MODIFIED — Step 1 now data-driven
└── index.tsx                      # MODIFIED — "Book" CTA navigates to /book/category

app/(app)/bookings/
├── index.tsx                      # MODIFIED — show category + service instead of enum
└── [id].tsx                       # MODIFIED — same

store/api/
└── centerServicesApi.ts           # NEW — RTK Query endpoints
```

Existing booking-related Redux state and form logic stay; only Step 1's data
source and the navigation entry change.

---

## 🚧 Migration Behavior During Rollout

While the backend has both old (`serviceType`) and new (`service_id` + `category_id`)
fields populated:
- New bookings created via this app **always** send the new fields
- Bookings list/detail rendering: prefer the new fields when present, fall back
  to the deprecated `serviceType` for legacy rows
- A small "Legacy booking" tag appears on rows that only have the old enum
  (helpful during QA, removable post-cleanup)

---

## 🚀 Phase Tracker — Append

```
### Phase 3.6 — Category → Service Booking Flow ⏳ Pending
- [ ] Spec Kit: /specify (use the prompt in PHASE_3.6_SPECKIT_PROMPT.md)
- [ ] Spec Kit: /clarify, /plan, /tasks
- [ ] centerServicesApi.ts (RTK Query)
- [ ] CategorySelectScreen (app/(app)/centers/[id]/book/category.tsx)
- [ ] Booking form Step 1 — replace static list with API-driven service list
- [ ] BookingRequest payload — send categoryId + serviceId
- [ ] Bookings list — render category + service, fallback to enum for legacy
- [ ] Booking detail — same
- [ ] i18n keys (en + ar) for new screen + legacy tag
- [ ] RTL spot-check on the new screen
- [ ] Smoke test: pick category → pick service → describe → confirm → see in list
```

---

## 📍 Spec Location

Once Spec Kit is run:

```
maintenance-customer-app/specs/3.6-category-service-booking/
├── spec.md          # output of /specify
├── clarification.md # output of /clarify (resolved questions only)
├── plan.md          # output of /plan
└── tasks.md         # output of /tasks
```

The spec is the source of truth for UX, accessibility, edge cases, and per-task
acceptance criteria. This CLAUDE.md section just reflects the high-level outcome.
