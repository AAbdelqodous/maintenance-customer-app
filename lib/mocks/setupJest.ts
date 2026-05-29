// Global MSW wiring for jest. Registered via jest.config.js setupFilesAfterEnv.
// Unhandled requests are bypassed so tests that don't touch the network are unaffected.
import { server } from './server';
import { resetMockState } from './handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetMockState();
});
afterAll(() => server.close());
