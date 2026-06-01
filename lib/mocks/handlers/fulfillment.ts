// MSW handlers for spec 008 — center fulfillment capability + per-booking logistics. In-memory.
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../constants/config';
import type { CenterFulfillmentCapability, LogisticsStatus } from '../../../types/fulfillment';

const BASE = API_BASE_URL.replace(/\/$/, '');

// Per-booking logistics state (advances on each poll to exercise the timeline). Center-driven.
const logistics = new Map<number, { mode: string; index: number; declined: boolean }>();

// Mirror the backend's authoritative legs (FulfillmentService).
const AT_HOME_STATES = ['TECH_ASSIGNED', 'TECH_EN_ROUTE', 'TECH_ARRIVED', 'SERVICE_IN_PROGRESS', 'SERVICE_COMPLETED'];
const PICKUP_STATES = ['PICKUP_SCHEDULED', 'DRIVER_EN_ROUTE_PICKUP', 'PICKED_UP', 'AT_CENTER', 'READY_FOR_RETURN', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export function __resetFulfillmentMock() {
  logistics.clear();
}

function capabilityFor(centerId: number): CenterFulfillmentCapability {
  return {
    centerId,
    supportedModes: ['DROP_OFF', 'PICKUP_DELIVERY', 'AT_HOME'],
    serviceAreaGovernorates: ['Hawalli', 'Salmiya', 'Capital', 'Farwaniya'],
    feeByMode: {
      DROP_OFF: { type: 'FLAT', flatAmount: 0 },
      PICKUP_DELIVERY: { type: 'PER_KM', baseAmount: 3.0, perKm: 0.25 },
      AT_HOME: { type: 'FLAT', flatAmount: 5.0 },
    },
    centerLat: 29.333,
    centerLng: 48.0,
  };
}

export const fulfillmentHandlers = [
  http.get(`${BASE}/centers/:id/fulfillment`, ({ params }) =>
    HttpResponse.json(capabilityFor(Number(params.id)), { status: 200 }),
  ),

  http.get(`${BASE}/bookings/:id/logistics`, ({ params }) => {
    const id = Number(params.id);
    const entry = logistics.get(id) ?? { mode: 'AT_HOME', index: 0, declined: false };
    const states = entry.mode === 'PICKUP_DELIVERY' ? PICKUP_STATES : AT_HOME_STATES;
    // Advance one step per poll until the final state (demo of a center-driven leg).
    if (entry.index < states.length - 1) entry.index += 1;
    logistics.set(id, entry);
    const status: LogisticsStatus = {
      bookingId: id,
      mode: entry.mode as LogisticsStatus['mode'],
      currentState: states[entry.index],
      etaText: entry.index < states.length - 1 ? '~30 min' : null,
      declined: entry.declined,
      declineReason: entry.declined ? 'Outside service area' : null,
      legs: states,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(status, { status: 200 });
  }),

  http.post(`${BASE}/bookings/:id/fulfillment/re-choose`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { mode: string };
    logistics.set(id, { mode: body.mode, index: 0, declined: false });
    const states = body.mode === 'PICKUP_DELIVERY' ? PICKUP_STATES : body.mode === 'AT_HOME' ? AT_HOME_STATES : [];
    return HttpResponse.json(
      { bookingId: id, mode: body.mode, currentState: states[0] ?? null, declined: false, legs: states, updatedAt: new Date().toISOString() },
      { status: 200 },
    );
  }),
];
