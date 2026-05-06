export type { ReflectWebConfig, WebEvent, UtmParams, BrowserFingerprint, WebSessionData, } from "./types";
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
export declare const ReflectWeb: {
    initialize: (config: import("./types").ReflectWebConfig) => void;
    trackEvent: (name: string, properties?: Record<string, unknown>) => void;
    trackPageView: (url?: string) => void;
    setUserId: (userId: string) => void;
    clearUserId: () => void;
    setUserProperties: (properties: Record<string, unknown>) => void;
    getWebSessionId: () => string;
    getInstallUuid: () => string;
    setEnabled: (enabled: boolean) => void;
    decorateUrl: (url: string) => string;
    flush: () => void;
    destroy: () => void;
};
