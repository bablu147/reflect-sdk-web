import { BrowserFingerprint } from "./types";
/**
 * Collect a lightweight browser fingerprint for web-to-app attribution matching.
 * This does NOT use third-party cookies or tracking pixels.
 */
export declare function collectFingerprint(): BrowserFingerprint;
