import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── Navigation integration ────────────────────────────────────────────────────
// Created at module level so it can be referenced both in init() and in the
// root layout's useEffect that registers the navigation container.
export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

// ── Release identifier ────────────────────────────────────────────────────────
// Sentry uses this to associate events with a specific build.
// Format: "bundleId@appVersion+buildNumber"

const appVersion = Constants.expoConfig?.version ?? '0.0.0';
const buildNumber = Platform.select({
  ios: Constants.expoConfig?.ios?.buildNumber ?? '0',
  android: String(Constants.expoConfig?.android?.versionCode ?? '0'),
  default: '0',
});
const bundleId = Platform.select({
  ios: Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.dohot.app',
  android: Constants.expoConfig?.android?.package ?? 'com.dohot.app',
  default: 'com.dohot.app',
});

const release = `${bundleId}@${appVersion}+${buildNumber}`;

// ── Init ──────────────────────────────────────────────────────────────────────
// Called at module-evaluation time so it runs before any component renders.
Sentry.init({
  dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],

  environment: __DEV__ ? 'development' : 'production',
  release,
  dist: buildNumber,

  // Only ship events to Sentry in production. In development the SDK still
  // initialises so captureException/captureMessage calls don't throw, but
  // they are silently dropped instead of hitting the network.
  enabled: true,
  debug: false,

  integrations: [navigationIntegration],

  // Capture 10% of normal transactions — enough for perf insights without
  // burning through quota. Errors are always 100%.
  tracesSampleRate: 0.1,

  // Never send PII automatically attached by the SDK.
  sendDefaultPii: false,

  // Strip potentially sensitive data before any event leaves the device.
  beforeSend(event) {
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b: Sentry.Breadcrumb) => {
        // XHR/fetch breadcrumbs may carry request bodies that contain
        // base64 images, auth tokens, or customer data.
        if (b.category === 'xhr' || b.category === 'fetch') {
          if (b.data) {
            const clean = { ...b.data };
            delete clean['body'];
            delete clean['request_body'];
            delete clean['response_body'];
            return { ...b, data: clean };
          }
        }
        return b;
      });
    }
    return event;
  },
});

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Report a caught error to Sentry with optional structured context.
 * Safe to call anywhere — no-ops in development.
 *
 * Example:
 *   captureException(err, { screen: 'WizardVoice', documentId: doc.id });
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Send a message-level event to Sentry.
 * Use for non-exception events worth tracking (e.g. unexpected states).
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>,
): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

export { Sentry };
