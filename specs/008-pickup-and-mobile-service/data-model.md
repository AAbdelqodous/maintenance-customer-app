# Data Model: Pickup & Delivery and At-Home Mobile Service

**Feature**: 008-pickup-and-mobile-service
**Date**: 2026-05-29

> Client-side TypeScript shapes (`types/fulfillment.ts`). Fees are **KD, 3 decimals**. The backend is
> authoritative for capability, fee, and logistics state.

---

## Enums

### `FulfillmentMode`
| Value | Meaning |
|-------|---------|
| `DROP_OFF` | Customer brings the item (default, unchanged) |
| `PICKUP_DELIVERY` | Center collects + returns |
| `AT_HOME` | Technician works at the customer location |

### `LogisticsState`
| Mode | Ordered states |
|------|----------------|
| `PICKUP_DELIVERY` | `PICKUP_SCHEDULED → EN_ROUTE_TO_CUSTOMER → COLLECTED → AT_CENTER → OUT_FOR_RETURN → DELIVERED` |
| `AT_HOME` | `TECH_ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED` |
| `DROP_OFF` | (none — uses normal booking status) |

### `FeeRuleType`
`'FLAT' | 'PER_KM'`

---

## Types (`types/fulfillment.ts`)

### `FeeRule`

| Field | Type | Notes |
|-------|------|-------|
| `type` | `FeeRuleType` | |
| `flatAmount` | `number?` | KD, when `FLAT` |
| `baseAmount` | `number?` | KD, when `PER_KM` |
| `perKm` | `number?` | KD per km, when `PER_KM` |

### `CenterFulfillmentCapability`

Returned by `GET /centers/{id}/fulfillment?serviceId=`.

| Field | Type | Notes |
|-------|------|-------|
| `centerId` | `number` | |
| `serviceId` | `number?` | The capability is per service |
| `supportedModes` | `FulfillmentMode[]` | Offer only these (FR-001) |
| `serviceAreaGovernorates` | `string[]` | Areas the center covers for non-drop-off |
| `feeByMode` | `Record<FulfillmentMode, FeeRule>` | Fee derivation per mode (R2) |
| `centerLat` / `centerLng` | `number?` | For PER_KM distance display |

### `ServiceAddress`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | (saved) | Absent for an inline one-off |
| `label` | `'HOME' \| 'WORK' \| 'OTHER'` | ✅ | |
| `governorate` | `string` | ✅ | Drives area match |
| `area` | `string?` | optional | District/block |
| `lat` | `number?` | optional | Pin (FR-002) |
| `lng` | `number?` | optional | |
| `note` | `string?` | optional | "villa 5, block 3, gate at back" |

### `PickupWindow`

| Field | Type | Notes |
|-------|------|-------|
| `date` | `string` (YYYY-MM-DD) | Not in the past (R6) |
| `startTime` | `string` (HH:mm) | Within center hours |
| `endTime` | `string` (HH:mm) | |

### `LogisticsStatus`

Returned by `GET /bookings/{id}/logistics`.

| Field | Type | Notes |
|-------|------|-------|
| `bookingId` | `number` | |
| `mode` | `FulfillmentMode` | |
| `currentState` | `string` | One of the mode's `LogisticsState` values |
| `etaText` | `string?` | Free text ETA (no live GPS) |
| `declined` | `boolean` | Center declined the requested mode (R7) |
| `declineReason` | `string?` | |
| `updatedAt` | `string` (ISO) | |

### Modified: `bookingsApi`

`CreateBookingRequest` gains:

| Field | Type | Notes |
|-------|------|-------|
| `fulfillmentMode` | `FulfillmentMode` | Required (defaults `DROP_OFF`) |
| `serviceAddressId` | `number?` | For saved address; or… |
| `serviceAddress` | `ServiceAddress?` | …an inline one-off address |
| `pickupWindow` | `PickupWindow?` | Required for non-drop-off |

`Booking` gains: `fulfillmentMode`, `serviceAddress?`, `pickupWindow?`, `fulfillmentFee?` (KD),
`logistics?` (`LogisticsStatus`).

---

## State Transitions

### Booking flow (with the new fulfillment step)

```
Step 0 Select Service (existing)
   ↓
Step F Fulfillment (NEW)
   GET /centers/{id}/fulfillment?serviceId   → supportedModes + feeByMode + area
   choose mode:
     DROP_OFF        → no address/window; fee 0
     PICKUP_DELIVERY → AddressPicker (saved/pin) + PickupWindow ; show round-trip fee
     AT_HOME         → AddressPicker + arrival window ; show at-home fee
   (modes clearly out-of-area are hidden, R7) ; fee shown before continue (FR-003)
   ↓
Step 1 Date/Time (existing — the appointment, distinct from pickup window)
   ↓
Step 2 Confirm (existing) → fee appears as a line ; submit with fulfillment fields
```

### Logistics (display-only, center-driven, R3)

```
PICKUP_DELIVERY: PICKUP_SCHEDULED → EN_ROUTE_TO_CUSTOMER → COLLECTED → AT_CENTER
                  → OUT_FOR_RETURN → DELIVERED        (each change → notification)
AT_HOME:         TECH_ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
client: refetch on focus + push ; renders currentState + etaText ; never advances
```

### Decline / re-choose (R7)

```
center declines requested mode (out-of-area) → logistics.declined = true (notification)
   → booking paused → POST /bookings/{id}/fulfillment/re-choose
        switch to DROP_OFF (if supported)  OR  cancel (no penalty)
```

---

## Validation Rules

- Offer **only** `capability.supportedModes` for the selected service; hide clearly out-of-area modes (R1/R7).
- Non-drop-off modes **require** a service address (saved or pinned) and a pickup/arrival window before continuing.
- The fulfillment **fee MUST be shown before the customer confirms the mode**; never charge an unshown amount (FR-003).
- The fee renders via the shared KD formatter (3 decimals); `PER_KM` fees that can't compute a distance
  (no pin) fall back to the base/flat or require a pin — never an unshown amount.
- Pickup/arrival window: not in the past, within center operating hours (R6).
- Location is requested **only** at the address step; permission denial → manual address entry path (R5/VI).
- Logistics is **display-only**; the client never advances a leg.
- After a decline, the booking offers re-choose (drop-off if supported) or cancel without penalty (FR-008).
- Coordinates and the home address are never logged (Principle VI).
