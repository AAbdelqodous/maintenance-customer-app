# Feature Specification: Pickup & Delivery and At-Home Mobile Service

**Feature Branch:** `008-pickup-and-mobile-service`
**Status:** Draft
**Created:** 2026-05-29
**Phase:** specify (next: plan → tasks → implement)
**Input:** Competitive convenience feature — let a customer choose, at booking time, how the service is fulfilled: drop the item off (today's default), have the center **pick it up and deliver it back**, or have a technician perform the work **at the customer's location** (at-home / mobile). Includes location capture, fulfillment fees, and status tracking for the logistics legs.

> **Spec Kit reminder:** This describes WHAT and WHY. Tables, endpoints, and map-SDK choices belong in `plan.md`.

---

## Dependencies (read before this spec)

- **Requires** `specs/006-category-service-booking` — fulfillment mode is chosen as a step in the booking flow after service selection.
- **Requires** `specs/002-phase-2-core-screens` — extends the existing booking creation form and booking detail screen.
- **Pairs with** center app `specs/023-payments-earnings-payouts` and customer `specs/007-payments-wallet-escrow` — fulfillment fees are line items on the invoice.
- **Relates to** center app booking management (`specs/002-booking-management`) and work-progress (`specs/009-work-progress-quotes`) — the center must be able to accept/decline a fulfillment mode and update logistics status.

---

## 1. Summary

The platform currently assumes the customer brings the car/appliance to the center and picks it up.
For a busy Kuwait customer this is the single largest friction point: dropping a car at a workshop
means arranging a second car or a ride, twice. This feature lets the customer pick **how** the job
is fulfilled:

1. **Drop-off (default):** unchanged from today.
2. **Pickup & Delivery:** the center collects the vehicle/appliance from the customer's address and
   returns it when done. Two logistics legs, each with their own status.
3. **At-Home / Mobile service:** a technician travels to the customer's location and performs the
   work there (best for home appliances, batteries, tyres, minor car jobs, AC).

Each non-default mode may carry a **fulfillment fee** (flat or distance-based) the center configures,
shown transparently before the customer commits, and added to the invoice.

---

## 2. Why Now

- Convenience is the second-strongest reason (after trust) customers cite for choosing one service
  app over another. "We come to you" is an instant, demo-able differentiator no competitor in this
  niche offers in-app.
- Home-appliance repair is overwhelmingly an at-home job already; forcing a "drop-off" model there is
  unnatural and loses those categories entirely.
- A center that offers pickup wins customers who literally cannot drop their only car off during work
  hours — a large, underserved segment.
- It composes cleanly with payments and quotes already being specced, so the marginal cost of adding
  it now (one booking-flow step + status legs) is low relative to its marketing value.

---

## 3. Scope

### In scope

- A booking-flow step to choose fulfillment mode among the modes the **selected center supports** for
  the **selected service** (centers declare supported modes; see center app).
- Capture and reuse the customer's **service address** and **map pin** for pickup and at-home modes,
  including saved addresses (Home/Work) and a free-form note ("villa 5, block 3, gate at the back").
- Display the **fulfillment fee** (and how it is derived: flat, or per-km from the center) before
  the customer confirms.
- Choose a **pickup window** / preferred time for pickup and at-home modes (distinct from the service
  appointment time used in drop-off).
- Show **logistics status** on the booking detail: for Pickup & Delivery — `PICKUP_SCHEDULED →
  EN_ROUTE_TO_CUSTOMER → COLLECTED → AT_CENTER → (work) → OUT_FOR_RETURN → DELIVERED`; for At-Home —
  `TECH_ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED`.
- Notify the customer on each logistics status change.
- Allow the center to **decline** a requested mode (e.g. out of service area) which returns the
  booking to the customer to pick another mode or cancel.

### Out of scope (explicitly deferred)

- **Live GPS tracking on a map** of the driver/technician. v1 shows discrete status states + an ETA
  text, not a moving dot. (Strong follow-up once a logistics partner exists.)
- **Third-party courier/logistics integration.** v1 assumes the center's own staff/driver performs
  pickup; the platform tracks status, it does not dispatch couriers.
- **Service-area polygon editing** by the center beyond a simple radius/governorate list.
- **Dynamic surge pricing** for fulfillment fees.
- **Multi-item pickup** in one trip across multiple bookings.
- **Insurance/condition documentation** of the vehicle at pickup (photos at handover) — valuable, but
  belongs with the work-progress media spec, not here.

---

## 4. Glossary

| Term | Meaning in this spec |
|---|---|
| **Fulfillment mode** | How the service is delivered: `DROP_OFF`, `PICKUP_DELIVERY`, or `AT_HOME`. |
| **Service address** | The customer location used for pickup or at-home work — saved address + map pin + note. |
| **Fulfillment fee** | A center-configured charge for non-drop-off modes; flat or distance-based, shown before commit. |
| **Pickup window** | A customer-preferred time range for collection or technician arrival, separate from a drop-off appointment slot. |
| **Logistics leg** | A trackable movement: the collection leg, the return leg, or the at-home visit. |
| **Service area** | The governorates/radius within which a center offers pickup or at-home service. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Book an At-Home Appliance Repair (Priority: P1)

A customer booking a home-appliance repair selects **At-Home**, picks (or pins) their address and a
preferred arrival window, sees the at-home fee added to the estimate, and confirms. The booking is
created with mode `AT_HOME` and the captured address.

**Why this priority**: At-home is the natural model for the appliance vertical and the clearest convenience win; it is the MVP slice that proves the whole feature.

**Independent Test**: For a center that supports at-home for appliances, complete the booking flow choosing At-Home with a pinned address, and verify the booking carries `fulfillmentMode = AT_HOME`, the address, and the displayed fee.

**Acceptance Scenarios**:

1. **Given** a center that supports At-Home for the selected service, **When** the customer reaches the fulfillment step, **Then** At-Home is offered alongside Drop-off and its fee is shown.
2. **Given** the customer selects At-Home, **When** they have no saved address, **Then** they are prompted to add/pin one before continuing.
3. **Given** an address and arrival window are set, **When** the customer confirms, **Then** the booking is created with mode, address, window, and fee, and these appear on the booking detail.
4. **Given** a center does **not** support At-Home for the selected service, **When** the customer reaches the fulfillment step, **Then** At-Home is not offered (or shown disabled with a reason).

---

### User Story 2 - Book Pickup & Delivery for a Car (Priority: P1)

A customer chooses **Pickup & Delivery** for a car service, sets the pickup address/window, sees the
two-way fulfillment fee, confirms, and then watches the logistics status progress on the booking detail.

**Why this priority**: Pickup & delivery is the headline differentiator for the car vertical (the largest category) and exercises both logistics legs.

**Independent Test**: Book a car service with Pickup & Delivery; verify both legs render as discrete statuses on the booking detail and that each center-driven status change pushes a notification.

**Acceptance Scenarios**:

1. **Given** a center supporting Pickup & Delivery, **When** the customer selects it, **Then** they set a pickup address + window and see the round-trip fee before confirming.
2. **Given** a Pickup & Delivery booking, **When** the center advances the collection leg (e.g. EN_ROUTE_TO_CUSTOMER → COLLECTED), **Then** the customer sees the updated status and receives a notification.
3. **Given** the work is complete, **When** the center starts the return leg, **Then** the customer sees OUT_FOR_RETURN and finally DELIVERED, each with a notification.
4. **Given** an ETA is provided by the center, **When** the customer views the active leg, **Then** the ETA text is displayed.

---

### User Story 3 - Center Declines an Out-of-Area Request (Priority: P2)

A customer requests pickup to an address outside the center's service area; the center declines the
mode, and the customer is prompted to choose drop-off, pick a different center, or cancel.

**Why this priority**: Prevents dead-end bookings and sets honest expectations; needed for a trustworthy launch but not the core happy path.

**Acceptance Scenarios**:

1. **Given** a pickup request the center marks out-of-area, **When** the decline is received, **Then** the customer is notified and the booking is paused pending a new choice.
2. **Given** a declined fulfillment mode, **When** the customer reopens the booking, **Then** they can switch to drop-off (if supported) or cancel without penalty.
3. **Given** the customer's pinned address is clearly outside any supported governorate, **When** they reach the fulfillment step, **Then** unsupported modes are hidden up front to avoid the decline round-trip where possible.

### Edge Cases

- Customer changes the service after choosing a mode the new service doesn't support → mode resets and must be re-chosen.
- GPS/location permission denied → customer can still enter an address manually and drop a pin by search.
- Distance-based fee where distance can't be computed (no pin) → fall back to flat fee or require a pin, never charge an unshown amount.
- Pickup window in the past or outside center hours → rejected with guidance.
- Mode chosen but center supports it generally yet not for the customer's governorate → treated as out-of-area (US3).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The booking flow MUST offer only the fulfillment modes the selected center supports for the selected service.
- **FR-002**: For Pickup & Delivery and At-Home, the system MUST capture a service address with a map pin, support saved addresses, and allow a free-form location note.
- **FR-003**: The system MUST display any fulfillment fee, and how it is derived (flat or per-distance), before the customer confirms — never charge an amount the customer did not see.
- **FR-004**: The system MUST let the customer choose a pickup/arrival window for non-drop-off modes, validated against center operating hours and not in the past.
- **FR-005**: The booking MUST persist its fulfillment mode, address, window, and fee, all visible on the booking detail.
- **FR-006**: The booking detail MUST display the appropriate logistics status states for the chosen mode and update them as the center advances them.
- **FR-007**: The system MUST notify the customer on every logistics status change and on a decline.
- **FR-008**: The system MUST let the center decline a requested mode and return the booking to the customer to re-choose or cancel without penalty.
- **FR-009**: The fulfillment fee MUST appear as an itemized line on the invoice consumed by `007-payments-wallet-escrow`.
- **FR-010**: Where the customer's location is clearly outside a center's declared service area, unsupported modes SHOULD be hidden at selection time.
- **FR-011**: All fee values MUST be KD with 3 decimal places and localized (AR/EN).

### Key Entities

- **Fulfillment** (on booking): mode, service address reference, pickup/arrival window, fee, derivation.
- **Service Address**: label (Home/Work/Other), governorate/area, map pin (lat/lng), free-form note; reusable across bookings.
- **Logistics Status**: ordered states per mode, current state, ETA text, timestamps; drives notifications.
- **Center Fulfillment Capability** (read from center): which modes are offered per service, service-area governorates/radius, fee rules. (Authored in the center app; consumed here.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete an at-home booking, including pinning an address, in under 2 minutes.
- **SC-002**: ≥ 30% of home-appliance bookings use At-Home within 3 months of launch.
- **SC-003**: ≥ 15% of car bookings use Pickup & Delivery within 3 months at centers that offer it.
- **SC-004**: 100% of non-drop-off bookings show the fulfillment fee before confirmation (zero "surprise fee" complaints attributable to this flow).
- **SC-005**: Median time from a logistics status change at the center to the customer notification is under 10 seconds.

## Assumptions

- Centers declare which fulfillment modes they support and their service area + fee rules in the center app (a companion center spec or an extension of center profile/pricing).
- v1 logistics are performed by the center's own staff; the platform tracks, it does not dispatch third-party couriers.
- Map/pin uses a standard maps SDK; exact provider is a `plan.md` decision.
- Distance-based fees are computed from the center location to the service address as a straight-line or routing distance (decided in plan).
- Vehicle/appliance condition documentation at handover is handled by the work-progress media flow, not here.
