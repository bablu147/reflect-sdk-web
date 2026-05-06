import { UtmParams } from "./types";
/**
 * Extract UTM parameters from the current page URL.
 * Returns null if no UTM params are present.
 */
export declare function captureUtm(): UtmParams | null;
/**
 * Get the document referrer (external traffic source).
 * Returns null if same-origin or empty.
 */
export declare function captureReferrer(): string | null;
