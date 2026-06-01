# Feature Specification: Category → Service Booking Flow

**Feature Branch**: `006-category-service-booking`  
**Created**: 2026-05-10  
**Status**: Draft  
**Input**: Phase 3.6 — insert a Category Select screen between Center Detail and the booking form, rewire booking form Step 1 to fetch services from the new API hierarchy instead of a hardcoded list, and update Bookings list/detail screens to render the new category+service fields with a graceful fallback for legacy rows.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Booking via Category → Service Flow (Priority: P1)

A logged-in customer opens a center's detail screen, taps "Book Appointment", selects a service category from those the center offers, selects a specific service within that category, then continues through the existing booking steps (describe issue → date/time → contact → confirm) and submits successfully.

**Why this priority**: This is the core end-to-end path. Without it the booking feature is broken for all new appointments.

**Independent Test**: Navigate to any center detail screen → tap "Book Appointment" → pick a category → pick a service → complete remaining steps → booking appears in the Bookings list.

**Acceptance Scenarios**:

1. **Given** a customer is on a center detail screen for a center that has at least one active category and service, **When** they tap "Book Appointment", **Then** a Category Select screen appears listing only the categories that center actually offers.
2. **Given** the customer is on the Category Select screen, **When** they tap a category, **Then** the booking form opens with Step 1 populated by only the services the center offers in that category.
3. **Given** the customer has selected a service in Step 1, **When** they complete all remaining steps and submit, **Then** the booking is created with `categoryId` and `serviceId` in the request payload (no `serviceType` enum), and the new booking appears in the Bookings list.
4. **Given** the Category Select screen is loading, **When** the network request is in progress, **Then** a loading indicator is displayed.
5. **Given** the Category Select screen has finished loading, **When** the center offers zero active categories, **Then** an empty-state message is displayed and the customer cannot proceed.
6. **Given** the network fails while loading categories, **When** the request errors, **Then** an error state with a retry action is shown instead of crashing.

---

### User Story 2 - View Bookings List with New and Legacy Service Labels (Priority: P2)

A customer opens the "My Bookings" list and can see a clear service label on every booking row regardless of whether the booking was created before or after the Phase 3.6 migration.

**Why this priority**: All existing customers have bookings in the old format. Displaying a blank or crashing label would break the Bookings list for every user on first launch after the update.

**Independent Test**: Open the Bookings list with a test account that has both old-format bookings (serviceType only) and new-format bookings (category + service). All rows render with a visible, non-empty label.

**Acceptance Scenarios**:

1. **Given** a booking was created after Phase 3.6 and has `category` and `service` nested objects, **When** it appears in the Bookings list, **Then** the row shows the localized service name (Arabic or English per locale setting).
2. **Given** a booking was created before Phase 3.6 and has only the legacy `serviceType` field (no nested `category`/`service`), **When** it appears in the Bookings list, **Then** the row shows the localized `serviceType` enum value and a "Legacy" tag so it is still clearly readable during the transition window.
3. **Given** the Bookings list is rendered in Arabic (RTL), **When** legacy and new rows appear together, **Then** both row types render correctly in the RTL layout without overflow or clipping.

---

### User Story 3 - View Booking Detail with New and Legacy Service Labels (Priority: P3)

A customer taps any booking row and the detail screen shows the full category and service information, or a graceful legacy fallback, without crashing or showing empty fields.

**Why this priority**: Detail correctness completes the post-migration story; it is less critical than the list because customers tolerate more time on the detail screen, but it must not crash.

**Independent Test**: Tap a new-format booking and a legacy booking in the list; confirm both detail screens render all visible fields.

**Acceptance Scenarios**:

1. **Given** a new-format booking detail is opened, **When** the screen renders, **Then** the category name and service name are displayed in the customer's locale.
2. **Given** a legacy-format booking detail is opened, **When** the screen renders, **Then** the screen displays the legacy `serviceType` value and a "Legacy" tag; no field is empty or shows a raw enum key.

---

### Edge Cases

- **Zero categories for a center**: The "Book Appointment" CTA on the center detail screen remains visible. When tapped, the Category Select screen loads and shows an empty-state message ("This center has no available services at the moment"). The empty state is surfaced on the Category Select screen rather than on the Center Detail screen, avoiding an extra up-front fetch on an already data-heavy screen.
- **Zero services for a selected category**: Booking form Step 1 shows an empty-state message; the customer cannot proceed past Step 1 without selecting a service.
- **Network error loading categories**: Error state with retry; does not crash or navigate away automatically.
- **Network error loading services**: Error state with retry inline in Step 1; does not discard already-entered form data.
- **Center deactivated mid-flow**: If the category fetch returns an error that indicates the center is no longer available (distinguishable from a transient network failure via the backend error payload), the screen shows a specific "This center is no longer accepting bookings" message and navigates the customer back to the Center Detail screen. Transient network errors show a generic error state with retry instead.
- **Partial migration rows**: A booking with `category` present but `service` null (or vice versa) should display the available field and omit the missing one gracefully rather than crashing.
- **RTL layout**: All new screens and components must render correctly when the app locale is Arabic.
- **Accessibility**: All interactive elements on the Category Select screen must have descriptive accessibility labels readable by screen readers.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a Category Select screen when a customer taps "Book Appointment" on a center detail screen; this screen fetches and lists only the service categories that center actively offers.
- **FR-002**: The Category Select screen MUST show a loading indicator while the category list is being fetched, an empty-state message when zero categories are returned, and an error state with a retry action when the fetch fails.
- **FR-003**: When a customer selects a category on the Category Select screen, the system MUST open the booking form with Step 1 populated by only the services that center offers in the selected category, fetched from the API.
- **FR-004**: Booking form Step 1 MUST show a loading indicator while services are fetching, an empty-state when zero active services are returned, and an error state with retry when the fetch fails — without discarding data already entered in other steps.
- **FR-005**: When the customer submits the booking form, the system MUST send `categoryId` and `serviceId` in the booking creation request; the deprecated `serviceType` enum field MUST be omitted from new booking requests.
- **FR-006**: The Bookings list screen MUST display a localized service label on every row: for new-format bookings (with nested `category`/`service` objects) show the service name; for legacy-format bookings (only `serviceType`) show the localized enum value plus a visible "Legacy" tag.
- **FR-007**: The Booking detail screen MUST display the category name and service name for new-format bookings, and the localized `serviceType` plus a "Legacy" tag for legacy-format bookings; no field shall be empty or raw.
- **FR-008**: All new user-facing strings MUST exist in both the English and Arabic locale files, with Arabic phrasing reviewed for natural expression.
- **FR-009**: All new screens and components MUST render correctly in RTL layout when the app locale is Arabic.
- **FR-010**: All interactive elements on new screens MUST have accessibility labels suitable for screen readers (TalkBack / VoiceOver), and tap targets MUST meet the minimum 44×44 pt hit-target guideline.
- **FR-011**: If the category API returns an error payload that distinguishably indicates the center is no longer available (as opposed to a transient network failure), the system MUST surface a specific "This center is no longer accepting bookings" message and navigate the customer back to the center detail screen. All other errors MUST show a generic error state with a retry action.

### Key Entities

- **ServiceCategory**: Represents a top-level grouping of services (e.g., Repair, Maintenance). Has bilingual names (`nameAr`, `nameEn`) and a unique identifier. A center declares which categories it serves; the customer sees only those declared by the chosen center.
- **CenterService**: Represents a specific service a center offers within a category. Has bilingual name and description, an optional icon, optional duration, and optional price range. Only active center services are shown to the customer.
- **Booking**: A customer's appointment record. Post-migration bookings reference a `ServiceCategory` and a `CenterService`. Pre-migration (legacy) bookings reference only the deprecated `serviceType` enum string. Both variants must render gracefully throughout the app.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete a booking end-to-end via the new category → service → describe → date/time → confirm flow without any manual workaround or app restart, in a single session.
- **SC-002**: The Bookings list renders all booking rows — including rows created before the Phase 3.6 migration — without crashes or visually blank service-label fields, verified against a dataset containing both pre- and post-migration rows.
- **SC-003**: The Booking detail screen renders correctly for both booking formats (legacy and new) with no empty or raw-enum fields visible to the customer.
- **SC-004**: 100% of new user-facing strings (category select screen, legacy tag, error/empty states) exist in both the English and Arabic locale files before the feature ships.
- **SC-005**: A manual RTL review (with the app locale set to Arabic) confirms that all new screens and updated list/detail rows display without layout overflow, clipped text, or mis-aligned icons.
- **SC-006**: The booking creation request payload produced by the new flow contains `categoryId` and `serviceId` and does not contain `serviceType`, verified via network inspection during QA.

---

## Assumptions

- The backend Phase 3.6 endpoints (`GET /centers/{id}/categories`, `GET /centers/{id}/categories/{catId}/services`, and the updated `POST /bookings` contract) will be deployed and stable before this frontend feature ships to production; the frontend may be implemented and unit-tested against mocks before backend is live.
- The global service catalog is small (≤7 services per category) and admin-curated; no in-screen search or filter is needed on the new Category Select screen.
- Pricing information (`minPrice`, `maxPrice`) returned by the services endpoint is intentionally not displayed in this phase; no UI surface for pricing is required until a future phase explicitly adds it.
- The existing multi-step booking form's state management (describe-issue → date/time → contact → confirm) remains unchanged; only the data source for Step 1's service options changes.
- The "Legacy" tag shown on pre-migration booking rows is a QA aid acceptable during the transition window and can be removed in a future cleanup after all legacy rows are migrated server-side.
- Customers are authenticated; all new API calls require a valid session token (consistent with the rest of the app).
- The app's existing error-boundary, theme, and component library (AppText, AppButton) are reused on the new screen; no new third-party dependencies are introduced.
