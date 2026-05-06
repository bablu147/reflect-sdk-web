import { ReflectSDK } from "./reflect";
import { createStandardEvents, StandardEventNames } from "./standard-events";

export type {
  ReflectWebConfig,
  WebEvent,
  UtmParams,
  BrowserFingerprint,
  WebSessionData,
  RevenueParams,
} from "./types";

export { validateEvent } from "./event-validator";
export type { ValidationResult } from "./event-validator";
export { StandardEventNames } from "./standard-events";

// Singleton instance
const instance = new ReflectSDK();
const standardEvents = createStandardEvents(instance);

/**
 * Reflect Web SDK — lightweight analytics and attribution for web properties.
 *
 * Usage:
 * ```js
 * ReflectWeb.initialize({ appKey: 'YOUR_APP_KEY', debug: true });
 * ReflectWeb.trackEvent('signup', { plan: 'pro' });
 * ReflectWeb.trackPageView();
 * ```
 */
export const ReflectWeb = {
  initialize: instance.initialize.bind(instance),
  trackEvent: instance.trackEvent.bind(instance),
  trackPageView: instance.trackPageView.bind(instance),
  trackRevenue: instance.trackRevenue.bind(instance),
  setUserId: instance.setUserId.bind(instance),
  clearUserId: instance.clearUserId.bind(instance),
  setUserProperties: instance.setUserProperties.bind(instance),
  setGlobalProperty: instance.setGlobalProperty.bind(instance),
  unsetGlobalProperty: instance.unsetGlobalProperty.bind(instance),
  clearGlobalProperties: instance.clearGlobalProperties.bind(instance),
  setAudience: instance.setAudience.bind(instance),
  getWebSessionId: instance.getWebSessionId.bind(instance),
  getInstallUuid: instance.getInstallUuid.bind(instance),
  setEnabled: instance.setEnabled.bind(instance),
  deleteUserData: instance.deleteUserData.bind(instance),
  decorateUrl: instance.decorateUrl.bind(instance),
  flush: instance.flush.bind(instance),
  destroy: instance.destroy.bind(instance),
  // Standard event helpers
  ...standardEvents,
};
