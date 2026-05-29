// Proves the MSW mock backend intercepts RTK Query payment requests (spec 007).
import { configureStore } from '@reduxjs/toolkit';
import { paymentsApi, PaymentMethod, PaymentStatus } from '../../store/api/paymentsApi';
import authReducer from '../../store/authSlice';
import { __setReleaseEligible } from '../../lib/mocks/handlers/payments';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [paymentsApi.reducerPath]: paymentsApi.reducer,
    },
    middleware: (gDM) => gDM().concat(paymentsApi.middleware),
  });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
});
afterEach(() => {
  store.dispatch(paymentsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('paymentsApi against the MSW mock backend', () => {
  it('fetches an itemized invoice whose lines sum to the total', async () => {
    const res = await store.dispatch(paymentsApi.endpoints.getBookingInvoice.initiate(123));
    const inv = (res as { data?: any }).data;
    expect(inv.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(inv.total).toBe(28.5);
    const sum = inv.lines.reduce((a: number, l: any) => a + Math.round(l.amount * 1000), 0) / 1000;
    expect(sum).toBe(inv.total);
    expect(inv.availableMethods).toContain(PaymentMethod.KNET);
  });

  it('initiates a KNET payment → returns a checkout URL and PENDING', async () => {
    const res = await store.dispatch(
      paymentsApi.endpoints.initiatePayment.initiate({
        bookingId: 123,
        method: PaymentMethod.KNET,
        useWalletBalance: false,
        idempotencyKey: 'k-1',
      }),
    );
    const out = (res as { data?: any }).data;
    expect(out.status).toBe(PaymentStatus.PENDING);
    expect(out.checkoutUrl).toContain('/checkout/');
    expect(out.returnUrlPrefix).toBeTruthy();
  });

  it('release is blocked until eligible, then moves to RELEASED', async () => {
    // pay → HELD (poll twice), then release
    const init = await store.dispatch(
      paymentsApi.endpoints.initiatePayment.initiate({
        bookingId: 200, method: PaymentMethod.KNET, useWalletBalance: false, idempotencyKey: 'k-2',
      }),
    );
    const paymentId = (init as { data?: any }).data.paymentId;
    await store.dispatch(paymentsApi.endpoints.getPaymentStatus.initiate(paymentId, { forceRefetch: true }));
    const second = await store.dispatch(paymentsApi.endpoints.getPaymentStatus.initiate(paymentId, { forceRefetch: true }));
    expect((second as { data?: any }).data.status).toBe(PaymentStatus.HELD);

    // not eligible yet → release conflicts
    const blocked = await store.dispatch(paymentsApi.endpoints.releaseEscrow.initiate(200));
    expect('error' in blocked).toBe(true);

    // center marks complete → eligible → release succeeds
    __setReleaseEligible(200, true);
    const released = await store.dispatch(paymentsApi.endpoints.releaseEscrow.initiate(200));
    expect((released as { data?: any }).data.paymentStatus).toBe('RELEASED');
  });
});
