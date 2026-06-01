// Proves the MSW mock backend intercepts RTK Query requests for spec 009.
import { configureStore } from '@reduxjs/toolkit';
import { quoteRequestsApi } from '../../store/api/quoteRequestsApi';
import authReducer from '../../store/authSlice';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [quoteRequestsApi.reducerPath]: quoteRequestsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(quoteRequestsApi.middleware),
  });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  // Fake timers so RTK Query's keepUnusedDataFor cleanup timers can be flushed
  // before teardown (otherwise they fire after the jest env is gone).
  jest.useFakeTimers();
  store = makeStore();
});

afterEach(() => {
  store.dispatch(quoteRequestsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('quoteRequestsApi against the MSW mock backend', () => {
  it('creates a request → OPEN with a reach count and seeded responses', async () => {
    const result = await store.dispatch(
      quoteRequestsApi.endpoints.createQuoteRequest.initiate({
        categoryId: 1,
        description: 'AC not cold',
      }),
    );
    const data = (result as { data?: any }).data;
    expect(data).toBeDefined();
    expect(data.state).toBe('OPEN');
    expect(data.reachCount).toBeGreaterThan(0);
    expect(data.responses.length).toBeGreaterThanOrEqual(1);
    expect(data.responses[0]).toHaveProperty('priceMin');
    expect(data.responses[0]).toHaveProperty('centerNameAr');
  });

  it('accepts a quote → ACCEPTED with a booking id, others not selected', async () => {
    const created = await store.dispatch(
      quoteRequestsApi.endpoints.createQuoteRequest.initiate({
        categoryId: 1,
        description: 'noise',
      }),
    );
    const req = (created as { data?: any }).data;
    const quoteId = req.responses[0].id;

    const accepted = await store.dispatch(
      quoteRequestsApi.endpoints.acceptQuote.initiate({ requestId: req.id, quoteId }),
    );
    const data = (accepted as { data?: any }).data;
    expect(data.state).toBe('ACCEPTED');
    expect(typeof data.acceptedBookingId).toBe('number');

    const sub = store.dispatch(
      quoteRequestsApi.endpoints.getQuoteRequest.initiate(req.id, { forceRefetch: true }),
    );
    const refetched = await sub;
    const full = (refetched as { data?: any }).data;
    const chosen = full.responses.find((q: any) => q.id === quoteId);
    expect(chosen.state).toBe('SELECTED');
    expect(full.responses.filter((q: any) => q.state === 'NOT_SELECTED').length).toBeGreaterThanOrEqual(1);
    sub.unsubscribe();
  });
});
