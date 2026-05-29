// Dev-only entry that starts the MSW native server when EXPO_PUBLIC_USE_MOCKS=true.
// Dynamic import keeps msw out of production bundles when the flag is off.
// Call once, as early as possible, from the root layout.
let started = false;

export function enableMocksIfRequested() {
  if (started) return;
  if (!__DEV__) return;
  if (process.env.EXPO_PUBLIC_USE_MOCKS !== 'true') return;
  started = true;
  import('./native')
    .then(({ server }) => {
      server.listen({ onUnhandledRequest: 'bypass' });
      // eslint-disable-next-line no-console
      console.log('[mocks] MSW native server started (EXPO_PUBLIC_USE_MOCKS=true)');
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[mocks] failed to start MSW native server', err);
    });
}
