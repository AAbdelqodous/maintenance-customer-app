# Feature Specification: Phase 4.0 — Deep Trust

**Feature Branch**: `004-phase-4-deep-trust`
**Created**: 2026-04-15
**Status**: Planned
**Phase**: 4.0 of 7

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Live Work Progress Timeline (Priority: P1)

A customer with a booking in progress can open a Work Progress screen from the booking detail. They see a timeline of work stages (Received, Diagnosing, Parts Ordered, Work in Progress, Quality Check, Ready for Pickup, Picked Up), with the current stage highlighted and a percentage progress bar. Each completed stage shows the timestamp and any notes left by the center. The customer can see what stage is expected next.

**Why this priority**: Real-time work visibility is the single biggest differentiator from traditional service centers. It eliminates the "where is my car/appliance?" anxiety that drives customer dissatisfaction.

**Independent Test**: Open a booking that has been progressed to "WORK_IN_PROGRESS" stage → progress screen shows the timeline with prior stages timestamped and the current stage highlighted → progress bar shows approximately 50%.

**Acceptance Scenarios**:

1. **Given** a booking in progress, **When** the customer opens the Work Progress screen, **Then** a timeline of all completed stages is shown with timestamps, newest first.
2. **Given** the progress screen, **When** loaded, **Then** a progress bar reflects the `progressPercentage` from the backend.
3. **Given** a stage with notes, **When** displayed in the timeline, **Then** the notes are shown below the stage name.
4. **Given** a stage with an attached photo, **When** displayed in the timeline, **Then** a thumbnail is shown and tapping it opens the full-size image.
5. **Given** the progress screen in Arabic, **When** rendered, **Then** all stage names and notes are in Arabic and the layout is RTL.
6. **Given** a booking with status `QUOTE_READY`, **When** the progress screen is viewed, **Then** the timeline reflects the QUOTE_READY stage and a call-to-action prompts the customer to review the quote.

---

### User Story 2 — Work Photos Gallery (Priority: P2)

A customer can view a gallery of photos taken by the center during their service. Photos are organised by category (Diagnostics, Parts, Work in Progress, Completed). The customer can tap any photo to view it full-screen with a caption and timestamp. They can filter by category.

**Why this priority**: Photographic evidence of work performed builds confidence that the service was completed as described and parts were genuinely replaced.

**Independent Test**: Open a booking's photos screen → at least one photo is displayed in a 2-column grid → tap it → full-screen view with caption appears.

**Acceptance Scenarios**:

1. **Given** a booking with media, **When** the Photos screen loads, **Then** photos are displayed in a 2-column grid.
2. **Given** the Photos screen, **When** a photo is tapped, **Then** a full-screen modal opens with the photo, its caption, and creation date.
3. **Given** the category filter bar, **When** a category is selected, **Then** only photos in that category are shown.
4. **Given** a booking with no media, **When** the Photos screen loads, **Then** an "No photos yet" empty state is shown.

---

### User Story 3 — Quote Review & Approval (Priority: P1)

When a center has completed a diagnosis and prepared a repair quote, the customer is notified. They can view the quote on their booking detail: a breakdown of labour and parts costs, estimated duration, subtotal, discount, tax, and total. They can approve or reject the quote. If approved, the center begins work. If rejected, they can optionally provide a reason.

**Why this priority**: Quote approval is the customer's explicit consent for work to begin. It protects the customer from unexpected charges and gives centers legal clarity before proceeding.

**Independent Test**: A center creates a quote for a booking → customer receives a notification → opens booking detail → QuoteCard is shown → tap "Approve" → status changes, center begins work.

**Acceptance Scenarios**:

1. **Given** a booking with status `QUOTE_READY`, **When** the detail screen loads, **Then** a quote card is shown with all line items, totals, and estimated duration.
2. **Given** the quote card, **When** the customer taps "Approve", **Then** a confirmation dialog appears; on confirm, the quote is approved and the center is notified.
3. **Given** the quote card, **When** the customer taps "Reject", **Then** a reason input (optional) is shown; on confirm, the quote is rejected.
4. **Given** the quote is approved or rejected, **When** the action completes, **Then** the quote card is replaced with the updated booking status.
5. **Given** the quote card in Arabic, **When** rendered, **Then** all labels, amounts (in KD), and buttons appear in Arabic with RTL layout.

---

### User Story 4 — Trust Badges on Center Detail (Priority: P2)

A maintenance center's detail page displays trust badges that surface at-a-glance credibility signals: verified business, years of operation, certified technicians, satisfaction guarantee, etc. Badges are awarded by the platform and are not self-declared.

**Why this priority**: Trust badges give undecided customers a fast, scannable set of credibility signals before committing to a booking. They drive conversion from browse to book.

**Independent Test**: Open a center detail page for a center with trust badges → at least one badge renders with its icon and label.

**Acceptance Scenarios**:

1. **Given** a center with trust badges, **When** the detail page loads, **Then** each badge is displayed with an icon and bilingual label.
2. **Given** a center with no trust badges, **When** the detail page loads, **Then** the trust badges section is hidden entirely.
3. **Given** trust badges in Arabic, **When** rendered, **Then** badge labels appear in Arabic.

---

### Edge Cases

- What if the progress endpoint returns an empty timeline? → Show "No progress updates yet" in the timeline area; the progress bar shows 0%.
- What if a quote has zero line items? → Show "No items" in the line items section with only the totals row visible.
- What if the customer taps Approve while offline? → Show an "No internet connection" banner and block the action.
- What if the work progress timeline has a stage with a null photo URL? → Render the timeline item without a thumbnail — no broken image placeholder.
- What if the estimated completion date has passed? → Show the date with a "Delayed" indicator but do not hide it.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a Work Progress screen accessible from the booking detail for in-progress bookings.
- **FR-002**: The progress screen MUST display a scrollable timeline of completed work stages, newest first.
- **FR-003**: The progress screen MUST display a percentage progress bar.
- **FR-004**: The progress screen MUST display the current stage name, description, and last-updated timestamp.
- **FR-005**: The progress screen MUST display optional stage notes and photo thumbnails.
- **FR-006**: The app MUST provide a Photos screen accessible from the booking detail.
- **FR-007**: The Photos screen MUST display work photos in a 2-column grid with category filter.
- **FR-008**: Tapping a photo MUST open a full-screen modal with caption and date.
- **FR-009**: The booking detail MUST display a QuoteCard when the booking status is `QUOTE_READY`.
- **FR-010**: The QuoteCard MUST show all line items (description, parts cost, labour cost), subtotal, discount, tax, and total in KD.
- **FR-011**: The app MUST allow the customer to approve or reject a quote from the booking detail.
- **FR-012**: Quote rejection MUST support an optional reason text input.
- **FR-013**: The center detail page MUST display trust badges when available.
- **FR-014**: All new screens and components MUST support Arabic (RTL) and English (LTR).

### Key Entities

- **WorkProgressItem**: Stage enum, bilingual display name, notes, photo URL, timestamp.
- **WorkProgressResponse**: Current stage, description, estimated completion, progress percentage, timeline array, next expected stage.
- **BookingMedia**: ID, URL, category, bilingual category display name, caption, creation date.
- **BookingQuote**: Version, line items (description, parts cost, labour cost), subtotal, discount, tax, total, estimated duration, status (DRAFT/SENT/APPROVED/REJECTED/REVISED).
- **QuoteLineItem**: Description, Arabic description, parts cost, labour cost.
- **TrustBadge**: Badge type, bilingual label, icon identifier, awarded date.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can see the current work stage of their in-progress booking without contacting the center.
- **SC-002**: A customer can approve or reject a quote in under 60 seconds from receiving the notification.
- **SC-003**: Work photos load and display in the gallery within 3 seconds on a standard mobile connection.
- **SC-004**: 100% of bookings with status `QUOTE_READY` display the QuoteCard on the booking detail screen.
- **SC-005**: All new screens render correctly in Arabic (RTL) and English (LTR) with no layout overflow.

---

## Assumptions

- The backend provides `GET /bookings/:id/progress`, `GET /bookings/:id/media`, `GET /bookings/:id/quote`, `POST /quotes/:id/approve`, and `POST /quotes/:id/reject` endpoints (new — not yet implemented).
- Work stage display names are localised by the backend based on the `Accept-Language` header.
- Trust badge data is included in the existing center detail response or returned by a separate `GET /centers/:id/badges` endpoint.
- The work progress screen is navigated to from the booking detail via a "Track Progress" button, visible only when `bookingStatus` is in an active work stage.
- The photos screen is navigated to from the booking detail via a "Work Photos" button, visible only when media exists.
- Quote notifications are pushed to the customer via FCM (requires Phase 3 push infrastructure to be in place).
- Estimated completion date is optional — not all centers will provide it.
