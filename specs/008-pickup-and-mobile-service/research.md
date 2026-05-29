# Research: Pickup & Delivery and At-Home Mobile Service

**Feature**: 008-pickup-and-mobile-service
**Date**: 2026-05-29

> Phase 0 decision records. Each is a standalone decision with rationale and rejected alternatives.

---

## R1 — Center declares capability; the client only consumes it

**Decision**: `GET /centers/{id}/fulfillment?serviceId=` returns the modes the center supports for the
selected service, its service-area governorates, and fee rules. The client offers **only** what comes
back (FR-001). The **authoring** of that capability (which modes, area, fees) is a **center-side
dependency** — an extension of center profile/pricing — explicitly out of scope for this customer spec.

**Rationale**: Supported modes and service areas are the center's data; the customer app must not assume
every center does pickup. Reading a capability keeps the client honest and lets each center differ.

**Alternatives considered**: Offer all three modes everywhere and let the center decline later — rejected:
trains customers to pick modes that get declined, a frustrating round trip (mitigated by R7 instead).

---

## R2 — The fee is always shown before commit; authoritative fee is an invoice line

**Decision**: The capability response carries the **fee derivation** (`FLAT` amount or `PER_KM` rate +
base). The client computes and displays the fee **before** the customer confirms the mode. The
authoritative fee is added by the backend as a `FULFILLMENT_FEE` **invoice line** consumed by
`007-payments-wallet-escrow`. The client never lets the customer confirm a mode whose fee wasn't shown
(FR-003).

**Rationale**: "Never charge an amount the customer did not see" is the spec's hard rule and a trust
pillar. Showing the fee at selection, and reconciling it as an invoice line, closes the loop.

**Alternatives considered**: Compute the final fee only at checkout — rejected: the customer commits to
a mode without knowing its cost; the spec forbids surprise fees.

---

## R3 — Logistics is display-only and center-driven

**Decision**: The client renders discrete logistics states per mode (Pickup&Delivery: `PICKUP_SCHEDULED
→ EN_ROUTE_TO_CUSTOMER → COLLECTED → AT_CENTER → OUT_FOR_RETURN → DELIVERED`; At-Home: `TECH_ASSIGNED →
EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED`) and an ETA text. It **refetches on focus + push** and
**never advances a leg** — the center drives transitions.

**Rationale**: The center physically performs collection/return/visit; only it knows the real state.
The customer app's job is faithful display + notifications, not to fabricate progress.

**Alternatives considered**: Live GPS map tracking — explicitly **out of scope** (spec): v1 shows
discrete states + ETA text, not a moving dot; that's a follow-up once a logistics partner exists.

---

## R4 — Saved addresses are server-side, reusable

**Decision**: Service addresses (label Home/Work/Other, governorate/area, map pin lat/lng, free-form
note) are stored **per customer** server-side and reused across bookings via `GET/POST/PUT/DELETE
/me/addresses`.

**Rationale**: A customer shouldn't re-pin their villa every booking. Server-side storage syncs across
devices and feeds distance-fee computation (R2).

**Alternatives considered**: Device-local address book — rejected: doesn't sync, and the backend needs
the address anyway for the center/driver.

---

## R5 — Location capture: `expo-location` core; map pin with a web/manual fallback

**Decision**: Add **`expo-location`** for current-location + reverse geocode. The interactive **map pin**
uses **`react-native-maps`** on native; on **web** (and whenever location permission is denied) fall
back to **area select + manual address + optional lat/lng from search**. Location is requested **only**
at the address step, never at app launch.

**Rationale**: `expo-location` is the Expo-managed standard and works across platforms; `react-native-maps`
gives a real pin on native where it matters most, while the web/manual fallback keeps the feature usable
everywhere and respects denied permissions (Constitution V/VI).

**Alternatives considered**: Require an interactive map on all platforms — rejected: `react-native-maps`
web support is weak; a manual fallback is necessary anyway for denied permission.

---

## R6 — Pickup/arrival window validation

**Decision**: Non-drop-off modes capture a **pickup/arrival window** (distinct from the drop-off
appointment slot), validated against the center's operating hours and rejected if in the past (FR-004).

**Rationale**: A collection/visit time is a different concept from "your appointment at the shop"; it
must fit when the center actually operates and can't be retroactive.

**Alternatives considered**: Reuse the drop-off date/time slot — rejected: conflates two different timing
concepts and produces nonsensical "pick up in the past" requests.

---

## R7 — Out-of-area hiding up front; decline as the fallback

**Decision**: When the pinned governorate is clearly **outside** the center's declared service area,
unsupported modes are **hidden at selection time** (FR-010). Where it can't be determined up front, a
center **decline** returns the booking to the customer to switch to drop-off (if supported) or cancel
without penalty (US3/FR-008).

**Rationale**: Prevent dead-end bookings where possible (better UX), but honestly handle the cases the
client can't predict (the center knows its real coverage).

**Alternatives considered**: Always allow any mode and rely on decline — rejected: too many avoidable
declines; hiding clear out-of-area cases up front is cheaper and kinder.
