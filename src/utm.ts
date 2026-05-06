import { UtmParams } from "./types";

const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

/**
 * Extract UTM parameters from the current page URL.
 * Returns null if no UTM params are present.
 */
export function captureUtm(): UtmParams | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    let found = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        utm[key] = val;
        found = true;
      }
    }

    return found ? utm : null;
  } catch {
    return null;
  }
}

/**
 * Get the document referrer (external traffic source).
 * Returns null if same-origin or empty.
 */
export function captureReferrer(): string | null {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const refHost = new URL(ref).hostname;
    if (refHost === window.location.hostname) return null;
    return ref;
  } catch {
    return null;
  }
}
