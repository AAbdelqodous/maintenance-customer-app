# Feature Specification: Phase 2 — Core Screens

**Feature Branch**: `001-phase-2-core-screens`
**Created**: 2026-04-15
**Status**: Complete
**Phase**: 2 of 7

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse & Search Maintenance Centers (Priority: P1)

A customer opens the app and lands on the Centers tab. They see a paginated list of maintenance centers. They can search by name, filter by service category (Car, Electronics, Home Appliance), and see results update in real time. Tapping a center opens its detail page showing name, description, service types, ratings, and address. From the detail page they can favourite the center, start a booking, or open a chat.

**Why this priority**: Discovering centers is the primary customer goal. All other flows (booking, chat, reviews) originate from center discovery.

**Independent Test**: Browse the centers list, search "car", tap a result, tap Favourite — center should appear in the Favorites tab.

**Acceptance Scenarios**:

1. **Given** the Centers tab, **When** it loads, **Then** a paginated list of centers is shown with name, category icons, and star rating.
2. **Given** the search bar, **When** the user types at least 2 characters, **Then** the list filters to matching centers within 400ms (debounced).
3. **Given** a center detail page, **When** the user taps "Favourite", **Then** the center is added to their favorites and a confirmation is shown.
4. **Given** a center detail page in Arabic, **When** rendered, **Then** name, category, and description render in Arabic with RTL layout.
5. **Given** no internet connection, **When** the Centers list is opened, **Then** a "No connection" banner is shown and cached results are displayed if available.

---

### User Story 2 — Create a Booking (Priority: P1)

A customer selects a center and taps "Book". A multi-step form guides them through: selecting a service type, choosing a date and time, adding optional notes, and selecting a payment method. A confirmation screen summarises the booking before final submission. On success, a success screen is shown and the booking appears in "My Bookings".

**Why this priority**: Booking is the core transaction and the primary value exchange in the marketplace.

**Independent Test**: Complete a full booking → confirm → submit → check My Bookings — booking should appear with status "Pending".

**Acceptance Scenarios**:

1. **Given** the booking form, **When** all required fields are completed and submitted, **Then** a booking confirmation screen is shown with full summary.
2. **Given** the confirmation screen, **When** the user taps "Confirm Booking", **Then** the booking is submitted and a success screen is shown.
3. **Given** a submitted booking, **When** the user navigates to My Bookings, **Then** the new booking appears with status "Pending".
4. **Given** the date/time step, **When** the user selects a past date, **Then** a validation error is shown and submission is blocked.
5. **Given** an in-progress booking form, **When** the user navigates back, **Then** a confirmation dialog asks if they want to discard changes.

---

### User Story 3 — Manage Bookings (Priority: P1)

A customer views their bookings list, filterable by status. They tap any booking to see full details including service type, center info, date/time, payment method, and current status. For pending or confirmed bookings they can cancel, which requires a confirmation dialog.

**Why this priority**: Post-booking management is essential for customer trust. Without it, customers have no visibility into their service requests.

**Independent Test**: Cancel a pending booking → confirm → booking status should update to "Cancelled" in the list.

**Acceptance Scenarios**:

1. **Given** the Bookings tab, **When** it loads, **Then** all bookings are displayed and filterable by status.
2. **Given** a booking detail with status "Pending" or "Confirmed", **When** viewed, **Then** a "Cancel Booking" button is visible.
3. **Given** the cancel button, **When** tapped, **Then** a confirmation dialog appears before the cancellation is sent.
4. **Given** a completed booking, **When** the detail screen is viewed, **Then** no cancel button is shown.

---

### User Story 4 — Real-Time Chat with Centers (Priority: P2)

A customer can open a chat with any maintenance center from the center detail page. The Chat tab shows all conversations with the latest message preview and unread count. Opening a conversation shows the message thread with real-time updates via WebSocket. The customer can send text messages.

**Why this priority**: Chat is the primary support and clarification channel between customers and centers.

**Independent Test**: Open a chat with a center, send "Hello" — message appears immediately. A reply from the center appears without refresh.

**Acceptance Scenarios**:

1. **Given** the Chat tab, **When** it loads, **Then** all conversations are listed with center name, last message preview, and unread badge.
2. **Given** an open conversation, **When** the user sends a message, **Then** it appears in the thread immediately with a sent timestamp.
3. **Given** an open conversation, **When** the center sends a message via WebSocket, **Then** it appears in real time without manual refresh.
4. **Given** a conversation in Arabic, **When** rendered, **Then** Arabic messages are right-aligned and the input is RTL.

---

### User Story 5 — Favorites (Priority: P2)

A customer saves centers to their Favorites list by tapping the heart icon on a center card or detail page. The Favorites tab shows all saved centers. They can remove a center from favorites. Favorites persist across sessions.

**Why this priority**: Favorites drive repeat visits and re-booking — a key retention mechanic.

**Independent Test**: Add two centers to favorites → close and reopen app → both should still appear in the Favorites tab.

**Acceptance Scenarios**:

1. **Given** a center detail, **When** the user taps "Favourite", **Then** the center appears in the Favorites tab.
2. **Given** the Favorites tab, **When** the user removes a center, **Then** it disappears from the list immediately.
3. **Given** the app is restarted, **When** the Favorites tab is opened, **Then** previously favourited centers are still present.

---

### User Story 6 — Notifications (Priority: P2)

A customer sees a list of in-app notifications for booking updates, new messages, review replies, and complaint updates. Unread notifications are visually highlighted. Tapping a notification navigates to the relevant screen. The customer can mark all notifications as read.

**Why this priority**: Notifications keep customers informed about their bookings and center responses without requiring manual polling.

**Independent Test**: A booking update notification appears in the list with an unread badge → tap it → navigates to the booking detail.

**Acceptance Scenarios**:

1. **Given** unread notifications exist, **When** the Notifications tab is opened, **Then** unread items are visually highlighted and the tab shows a badge count.
2. **Given** a notification, **When** tapped, **Then** the user navigates to the relevant screen (booking, chat, review, or complaint).
3. **Given** the Notifications tab, **When** "Mark all as read" is tapped, **Then** all notifications lose their unread highlight.

---

### User Story 7 — Profile Management (Priority: P2)

A customer views and edits their profile: first name, last name, profile photo, and phone number. They can change their password. They can log out from the profile screen.

**Why this priority**: Profile management is a standard user expectation and underpins trust for reviews and complaints.

**Independent Test**: Update the first name → navigate away → return to Profile → updated name is displayed.

**Acceptance Scenarios**:

1. **Given** the Profile tab, **When** the user edits their name and saves, **Then** the change is reflected immediately and persists.
2. **Given** the Profile tab, **When** the user uploads a profile photo, **Then** the new photo is displayed.
3. **Given** the Profile tab, **When** "Log Out" is tapped, **Then** the session is cleared and the user is navigated to the auth entry screen.

---

### User Story 8 — Reviews (Priority: P2)

A customer writes a review for a maintenance center after a completed booking. Reviews include a star rating (1–5) and an optional text comment. The customer can view a list of all their submitted reviews.

**Why this priority**: Reviews are the core trust signal in the marketplace. Centers are evaluated and chosen based on customer feedback.

**Independent Test**: Submit a review for a completed booking → it appears in My Reviews list and on the center's reviews page.

**Acceptance Scenarios**:

1. **Given** a completed booking, **When** the customer submits a review with a rating, **Then** the review is saved and visible on the center's reviews page.
2. **Given** the My Reviews screen, **When** it loads, **Then** all reviews submitted by the customer are shown with center name, rating, and date.
3. **Given** the review form, **When** no star rating is selected, **Then** submission is blocked with a validation message.

---

### User Story 9 — Complaints (Priority: P3)

A customer files a complaint about a booking by selecting a complaint type and describing the issue. They can view their complaints list and each complaint's detail, including status updates from the center.

**Why this priority**: Complaints are the escalation path for unresolved issues — important for retention but lower priority than booking and review flows.

**Independent Test**: Submit a complaint for a booking → it appears in the Complaints list with status "Open".

**Acceptance Scenarios**:

1. **Given** the new complaint form, **When** all required fields are completed and submitted, **Then** the complaint is created with status "Open".
2. **Given** the Complaints list, **When** it loads, **Then** all complaints are listed with their current status and submission date.
3. **Given** a complaint detail, **When** the status has been updated by the center, **Then** the latest status is displayed.

---

### Edge Cases

- What if a center has no reviews? → Show "No reviews yet" empty state on the center detail page.
- What if a booking is cancelled by the center? → Show the booking with status "Cancelled" and indicate it was cancelled by the center.
- What if the WebSocket disconnects mid-chat? → Show a reconnecting indicator; do not lose outgoing messages.
- What if a profile photo upload fails? → Show an inline error with a retry option; do not block other profile save actions.
- What if there are no centers matching a search? → Show "No centers found" empty state with a clear-filters prompt.
- What if the customer tries to review a booking they've already reviewed? → The review form is not shown; the existing review is displayed instead.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display a paginated list of maintenance centers on the Centers tab.
- **FR-002**: The app MUST support debounced text search across center names.
- **FR-003**: The app MUST support filtering centers by service category.
- **FR-004**: The app MUST display a center detail page with name, description, service types, rating, and address.
- **FR-005**: The app MUST allow customers to favourite and un-favourite centers.
- **FR-006**: Favorites MUST persist across sessions.
- **FR-007**: The app MUST provide a multi-step booking form (service type → date/time → notes → payment → confirmation).
- **FR-008**: The app MUST validate all required booking fields before allowing final submission.
- **FR-009**: The app MUST display a booking summary confirmation screen before final submission.
- **FR-010**: The app MUST display a bookings list filterable by booking status.
- **FR-011**: The app MUST allow cancellation of pending or confirmed bookings with a confirmation dialog.
- **FR-012**: The app MUST provide real-time chat via WebSocket/STOMP with a conversations list and message thread.
- **FR-013**: The app MUST display a notifications list with unread visual indicators and tap-to-navigate behavior.
- **FR-014**: The app MUST allow customers to update profile fields and upload a profile photo.
- **FR-015**: The app MUST allow customers to submit a star-rated review for a completed booking.
- **FR-016**: The app MUST allow customers to submit a complaint linked to a booking.
- **FR-017**: All screens MUST support Arabic (RTL) and English (LTR).
- **FR-018**: All data-fetching screens MUST show a loading indicator and handle API errors gracefully.
- **FR-019**: All list screens MUST show an appropriate empty state when no data is available.
- **FR-020**: All form screens MUST show an offline banner when there is no internet connection.

### Key Entities

- **ServiceCenter**: ID, nameAr, nameEn, service categories, rating, totalReviews, isActive, address.
- **Booking**: ID, centerId, serviceType, bookingDate, bookingTime, notes, paymentMethod, bookingStatus, cancelledBy.
- **Conversation**: ID, centerName, lastMessage, unreadCount, updatedAt.
- **Message**: ID, conversationId, content, senderType, messageType, createdAt.
- **Notification**: ID, notificationType, notificationPriority, isRead, createdAt, relatedEntityId.
- **Review**: ID, centerId, rating, comment, createdAt, ownerReply, ownerReplyAt.
- **Complaint**: ID, bookingId, complaintType, description, complaintStatus, complaintPriority.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can discover, open, and favourite a center in under 60 seconds from the Centers tab.
- **SC-002**: A customer can complete the full booking flow (form → confirmation → success screen) in under 3 minutes.
- **SC-003**: Chat messages from a center appear in the app within 2 seconds of being sent (real-time delivery).
- **SC-004**: All 9 feature areas render correctly in both Arabic (RTL) and English (LTR).
- **SC-005**: All list screens display an appropriate empty state when no data is available.
- **SC-006**: All data-fetching screens show a loading indicator while data is being retrieved.

---

## Assumptions

- The Spring Boot backend provides all required endpoints for Phase 2 features.
- WebSocket/STOMP server is available at the configured WS base URL.
- Profile photo upload is handled by the backend; the app sends a multipart request.
- Booking cancellation is only available for `PENDING` and `CONFIRMED` statuses.
- Actual payment processing (KNET, Credit Card) happens at the center; the app records the payment method choice only.
- Push notifications are out of scope for Phase 2 — planned for Phase 3.5.
- The review form is accessible from the completed booking detail screen and from the My Reviews entry point.
- Password change requires the current password before setting a new one.
- Help, Privacy Policy, and Terms of Service screens are static content screens included in this phase.
- Notification preferences (toggles per notification type) are included in this phase as an AsyncStorage-persisted settings screen.
