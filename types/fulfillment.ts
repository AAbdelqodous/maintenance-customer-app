// Spec 008 — pickup & delivery / at-home mobile service. Fees are KD, 3 decimals. The backend is
// authoritative for capability, fee, and logistics state; the client offers only what's supported.

export type FulfillmentMode = 'DROP_OFF' | 'PICKUP_DELIVERY' | 'AT_HOME';

export const FULFILLMENT_MODES: FulfillmentMode[] = ['DROP_OFF', 'PICKUP_DELIVERY', 'AT_HOME'];

export type FeeRuleType = 'FLAT' | 'PER_KM';

export interface FeeRule {
  type: FeeRuleType;
  flatAmount?: number; // when FLAT
  baseAmount?: number; // when PER_KM
  perKm?: number; // when PER_KM
}

export interface CenterFulfillmentCapability {
  centerId: number;
  serviceId?: number;
  supportedModes: FulfillmentMode[];
  serviceAreaGovernorates: string[];
  feeByMode: Record<FulfillmentMode, FeeRule>;
  centerLat?: number;
  centerLng?: number;
}

export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface ServiceAddress {
  id?: number;
  label: AddressLabel;
  governorate: string;
  area?: string;
  lat?: number;
  lng?: number;
  note?: string;
}

export interface PickupWindow {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// Ordered logistics states per mode (DROP_OFF uses normal booking status — no legs).
export const LOGISTICS_STATES: Record<Exclude<FulfillmentMode, 'DROP_OFF'>, string[]> = {
  PICKUP_DELIVERY: ['PICKUP_SCHEDULED', 'EN_ROUTE_TO_CUSTOMER', 'COLLECTED', 'AT_CENTER', 'OUT_FOR_RETURN', 'DELIVERED'],
  AT_HOME: ['TECH_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'],
};

export interface LogisticsStatus {
  bookingId: number;
  mode: FulfillmentMode;
  currentState: string;
  etaText?: string | null;
  declined: boolean;
  declineReason?: string | null;
  updatedAt: string;
}

/** Compute the displayed fee for a mode from its rule (R2). PER_KM needs a distance; null = unknown. */
export function computeFee(rule: FeeRule | undefined, distanceKm?: number): number | null {
  if (!rule) return null;
  if (rule.type === 'FLAT') return rule.flatAmount ?? 0;
  // PER_KM
  if (distanceKm == null) return null; // can't compute without a distance — show "from base"
  return Math.round(((rule.baseAmount ?? 0) + (rule.perKm ?? 0) * distanceKm) * 1000) / 1000;
}
