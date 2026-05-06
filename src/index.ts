import { ReflectSDK } from "./reflect";

export type {
  ReflectWebConfig,
  WebEvent,
  UtmParams,
  BrowserFingerprint,
  WebSessionData,
} from "./types";

// Singleton instance
const instance = new ReflectSDK();

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
  setUserId: instance.setUserId.bind(instance),
  clearUserId: instance.clearUserId.bind(instance),
  setUserProperties: instance.setUserProperties.bind(instance),
  getWebSessionId: instance.getWebSessionId.bind(instance),
  getInstallUuid: instance.getInstallUuid.bind(instance),
  setEnabled: instance.setEnabled.bind(instance),
  decorateUrl: instance.decorateUrl.bind(instance),
  flush: instance.flush.bind(instance),
  destroy: instance.destroy.bind(instance),
};

