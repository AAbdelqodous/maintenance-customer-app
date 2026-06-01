// Shared MSW handler registry. Each feature contributes its handlers here so the same
// mock backend powers jest tests and the RN dev runtime. Add new features' handlers to
// the spread below (e.g. paymentsHandlers, fulfillmentHandlers, …).
import { quoteRequestsHandlers, __resetQuoteRequestsMock } from './quoteRequests';
import { paymentsHandlers, __resetPaymentsMock } from './payments';
import { fulfillmentHandlers, __resetFulfillmentMock } from './fulfillment';
import { addressesHandlers, __resetAddressesMock } from './addresses';

export const handlers = [
  ...quoteRequestsHandlers,
  ...paymentsHandlers,
  ...fulfillmentHandlers,
  ...addressesHandlers,
];

/** Reset all in-memory mock state (call from afterEach in tests). */
export function resetMockState() {
  __resetQuoteRequestsMock();
  __resetPaymentsMock();
  __resetFulfillmentMock();
  __resetAddressesMock();
}
