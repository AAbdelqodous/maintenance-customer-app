# Feature Specification: Phase 4.5 — Retention

**Feature Branch**: `005-phase-4-5-retention`
**Created**: 2026-04-15
**Status**: Planned
**Phase**: 4.5 of 7

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Loyalty Points & Tier Dashboard (Priority: P1)

A customer opens the Loyalty section and sees their current points balance, lifetime points, and tier (Bronze, Silver, Gold, Platinum) with a progress bar toward the next tier. If points are expiring this month, a warning is shown. They can navigate to the rewards catalog and points history from this screen.

**Why this priority**: A visible points balance and tier progress motivate customers to book again. It is the primary engagement hook in the retention loop.

**Independent Test**: Open the Loyalty screen → current points, tier badge, and tier progress bar are displayed → tap "View Rewards" → rewards catalog loads.

**Acceptance Scenarios**:

1. **Given** a customer with loyalty points, **When** the Loyalty screen loads, **Then** their available points, tier badge, and tier progress bar are displayed.
2. **Given** a customer with points expiring this month, **When** the Loyalty screen loads, **Then** a warning shows the number of points expiring and the expiry date.
3. **Given** the Loyalty screen, **When** "View Rewards" is tapped, **Then** the rewards catalog screen opens.
4. **Given** the Loyalty screen, **When** "History" is tapped, **Then** the points transaction history screen opens.
5. **Given** the Loyalty screen in Arabic, **When** rendered, **Then** all labels and numbers are in Arabic with RTL layout.

---

### User Story 2 — Rewards Catalog & Redemption (Priority: P1)

A customer can browse available rewards: percentage discounts, fixed KD discounts, and free services. Each reward shows the points required, the reward type and value, and whether the customer has enough points to redeem. Tapping "Redeem" on an eligible reward shows a confirmation dialog and then displays the redemption code.

**Why this priority**: Redeemable rewards are the payoff of the loyalty loop. Without a usable rewards catalog, points have no tangible value.

**Independent Test**: Open the rewards catalog → find a reward the customer has enough points for → tap Redeem → confirm → redemption code is displayed.

**Acceptance Scenarios**:

1. **Given** the rewards catalog, **When** it loads, **Then** all available rewards are listed with their point cost and reward value.
2. **Given** a reward the customer cannot redeem (insufficient points or tier), **When** displayed, **Then** it is visually greyed out with the reason shown.
3. **Given** an eligible reward, **When** the customer taps "Redeem" and confirms, **Then** the redemption code is displayed and the points are deducted.
4. **Given** the rewards catalog in Arabic, **When** rendered, **Then** reward names and labels appear in Arabic.

---

### User Story 3 — Points Transaction History (Priority: P2)

A customer can view a paginated list of all their loyalty point transactions: points earned from bookings (positive, green) and points spent on rewards (negative, red). Each row shows a description, points delta, running balance, and date.

**Why this priority**: History builds confidence in the loyalty system. Customers want to verify that points were credited correctly after a booking.

**Independent Test**: Complete a booking → open Points History → a new entry for the booking appears with the correct points amount and a positive green indicator.

**Acceptance Scenarios**:

1. **Given** the points history screen, **When** it loads, **Then** transactions are listed newest first with points earned in green and points spent in red.
2. **Given** many transactions, **When** the user scrolls to the bottom, **Then** older transactions load automatically (infinite scroll / pagination).
3. **Given** no transaction history, **When** the screen loads, **Then** an "No transactions yet" empty state is shown.

---

### User Story 4 — Vehicle Management (Priority: P2)

A customer can add and manage their vehicles (car make, model, year, mileage, license plate). Each vehicle has a dashboard showing service history, total spent, and upcoming maintenance reminders. The primary vehicle is marked with a star badge.

**Why this priority**: Vehicle profiles enable personalized service recommendations and pre-filled booking forms. They are the foundation of proactive maintenance reminders.

**Independent Test**: Add a new vehicle (Toyota Corolla, 2020, 45000 km) → it appears in My Vehicles list → tap it → vehicle dashboard shows empty service history.

**Acceptance Scenarios**:

1. **Given** the My Vehicles screen, **When** the customer taps "Add Vehicle", **Then** a form opens for make, model, year, and optional mileage/plate.
2. **Given** a valid vehicle form, **When** submitted, **Then** the vehicle appears in the My Vehicles list.
3. **Given** the My Vehicles list, **When** a vehicle is tapped, **Then** the vehicle dashboard opens with service history and stats.
4. **Given** a vehicle marked as primary, **When** displayed in the list, **Then** a star badge is shown.
5. **Given** the vehicle add form in Arabic, **When** rendered, **Then** all labels and inputs are in Arabic with RTL layout.

---

### User Story 5 — Maintenance Reminders (Priority: P2)

A customer can view maintenance reminders for their vehicle (e.g., oil change due in 14 days, tyre rotation overdue). Reminders are grouped by urgency: Overdue (red), Due Soon (amber), and Upcoming (grey). The customer can mark a reminder as completed by tapping a checkbox or swiping.

**Why this priority**: Proactive reminders drive repeat bookings by surfacing service needs before the customer thinks to check. They are the highest-value retention mechanic for vehicle owners.

**Independent Test**: Open a vehicle's reminders screen → at least one overdue reminder is shown in red → tap to complete it → it disappears from the overdue group.

**Acceptance Scenarios**:

1. **Given** a vehicle with reminders, **When** the reminders screen loads, **Then** reminders are grouped as Overdue, Due Soon, and Upcoming with appropriate colors.
2. **Given** an overdue reminder, **When** the customer marks it as completed, **Then** it is removed from the list.
3. **Given** a reminder with a due date, **When** displayed, **Then** the days until (or since) due are shown.
4. **Given** no reminders, **When** the screen loads, **Then** an "No reminders" empty state is shown.

---

### User Story 6 — Referral Program (Priority: P3)

A customer can share their unique referral code with friends. When a referred friend completes their first booking, the referring customer earns loyalty points. The referral screen shows the code, a share button, and statistics (total referrals, completed, pending, points earned).

**Why this priority**: Referrals are the lowest-cost acquisition channel. Points incentive drives customers to actively promote the platform.

**Independent Test**: Open the Referral screen → a unique referral code is displayed → tap Share → system share sheet opens with the referral link.

**Acceptance Scenarios**:

1. **Given** the Referral screen, **When** it loads, **Then** the customer's unique referral code and share URL are displayed.
2. **Given** the Share button, **When** tapped, **Then** the device system share sheet opens with the referral link and a message.
3. **Given** referral statistics, **When** displayed, **Then** total referrals, completed, pending, and total points earned are shown.
4. **Given** the Referral screen in Arabic, **When** rendered, **Then** all labels and stats appear in Arabic.

---

### Edge Cases

- What if the loyalty account has zero points? → Show 0 balance with BRONZE tier and an empty progress bar — no error state.
- What if a vehicle form is submitted with a year in the future? → Show a validation error; year must be between 1900 and the current year + 1.
- What if a reward requires a tier the customer has not reached? → Show the tier requirement label and grey out the Redeem button.
- What if the customer tries to redeem a reward but has insufficient points at the time of confirmation (race condition)? → Show an error "Insufficient points" after the server rejects the redemption.
- What if the referral stats show zero? → Show "No referrals yet" but still display the referral code and Share button.
- What if a reminder has no due date and no due mileage? → Show the reminder name only, without a due-date row.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a Loyalty dashboard showing points balance, tier, tier progress, and expiring-points warning.
- **FR-002**: The app MUST provide a rewards catalog listing all available rewards with redemption eligibility.
- **FR-003**: The app MUST allow eligible customers to redeem rewards and receive a redemption code.
- **FR-004**: The app MUST provide a paginated points transaction history screen.
- **FR-005**: The app MUST allow customers to add and manage their vehicles.
- **FR-006**: The app MUST provide a vehicle dashboard with service history stats and upcoming reminders.
- **FR-007**: The app MUST display maintenance reminders grouped by urgency (Overdue, Due Soon, Upcoming).
- **FR-008**: The app MUST allow customers to mark a maintenance reminder as completed.
- **FR-009**: The app MUST provide a referral screen with the customer's unique referral code and a system share action.
- **FR-010**: The app MUST display referral statistics (total, completed, pending, points earned).
- **FR-011**: All new screens MUST support Arabic (RTL) and English (LTR).
- **FR-012**: All new API calls MUST follow the RTK Query pattern with typed endpoints and auth headers.
- **FR-013**: Vehicle forms MUST validate year range (1900 to current year + 1).

### Key Entities

- **LoyaltyAccount**: Total points, available points, lifetime points, tier, tier multiplier, tier progress (current/next/percent), expiring points.
- **LoyaltyReward**: ID, code, bilingual name, points required, reward type (DISCOUNT_PERCENT / DISCOUNT_FIXED / FREE_SERVICE), reward value, tier required, can-redeem flag, reason-cannot-redeem.
- **LoyaltyTransaction**: Description, points delta, balance after transaction, date.
- **UserVehicle**: ID, make, model, year, license plate, color, current mileage, nickname, isPrimary flag.
- **VehicleDashboard**: Vehicle info, total services, total spent, last service date, upcoming reminders list, recent service history.
- **MaintenanceReminder**: ID, name, due date, due mileage, priority (LOW/NORMAL/HIGH/CRITICAL), status (UPCOMING/DUE_SOON/OVERDUE), days until due, isCompleted.
- **ReferralStats**: Code, share URL, total referrals, pending, completed, total points earned, referrals list (name, status, points earned, date).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can view their loyalty points balance and tier within 2 taps from the home screen.
- **SC-002**: A customer can complete a reward redemption (browse → select → confirm → code displayed) in under 90 seconds.
- **SC-003**: A customer can add a new vehicle and see it in their vehicles list in under 60 seconds.
- **SC-004**: Maintenance reminders accurately reflect due-soon and overdue states, allowing a customer to identify their most urgent upcoming service at a glance.
- **SC-005**: A customer can share their referral code via the device share sheet in under 3 taps.
- **SC-006**: All new screens render correctly in Arabic (RTL) and English (LTR) with no layout overflow.

---

## Assumptions

- The backend provides all Phase 4.5 endpoints listed in CLAUDE.md (loyalty, vehicles, reminders, referral) — none are yet implemented.
- Loyalty points are earned automatically by the backend when a booking reaches "Completed" status; the app only displays the result.
- The referral points incentive amount is configured on the backend; the app displays it via the rewards catalog or a static label.
- Vehicle make/model fields are free text in Phase 4.5; a pre-populated dropdown (make/model database) is out of scope.
- Maintenance reminders are created by the center or auto-generated by the backend based on service history; the customer app only marks them complete.
- The loyalty tier color scheme (BRONZE `#CD7F32`, SILVER `#A8A9AD`, GOLD `#FFD700`, PLATINUM `#E5E4E2`) is a design decision locked for this phase.
- Notification preferences for loyalty events (points earned, tier upgrade, reminder due) are controlled by the existing notification preferences screen built in Phase 2.
- The vehicle dashboard `GET /vehicles/:id/dashboard` is a new composite endpoint combining vehicle info, stats, and recent reminders.
