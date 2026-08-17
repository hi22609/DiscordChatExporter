/**
 * Tagged logger — silent in production builds, structured in dev.
 * Swap the sink for Sentry/Datadog when observability lands.
 */
const isDev = process.env.EXPO_PUBLIC_APP_ENV !== 'production';

export const log = {
  debug(tag: string, ...args: unknown[]) {
    if (isDev) console.log(`[${tag}]`, ...args);
  },
  warn(tag: string, ...args: unknown[]) {
    if (isDev) console.warn(`[${tag}]`, ...args);
  },
  error(tag: string, ...args: unknown[]) {
    // Always emitted — this is the hook point for a crash reporter.
    console.error(`[${tag}]`, ...args);
  },
};
