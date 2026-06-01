const appJson = require('./app.json');

// Spec 008 — react-native-maps needs a Google Maps API key, injected here from the environment so no
// secret is committed. Set EXPO_PUBLIC_GOOGLE_MAPS_KEY (+ EXPO_PUBLIC_ENABLE_MAPS=true) in a dev
// client / production build to render the interactive pin; without it the app falls back to GPS + manual.
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

module.exports = {
  ...appJson.expo,
  // Disable typedRoutes until `expo start` regenerates expo-env.d.ts with new routes
  experiments: {
    ...appJson.expo.experiments,
    typedRoutes: false,
  },
  ios: {
    ...appJson.expo.ios,
    ...(mapsKey ? { config: { ...(appJson.expo.ios?.config ?? {}), googleMapsApiKey: mapsKey } } : {}),
  },
  android: {
    ...appJson.expo.android,
    ...(mapsKey
      ? { config: { ...(appJson.expo.android?.config ?? {}), googleMaps: { apiKey: mapsKey } } }
      : {}),
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  },
};
