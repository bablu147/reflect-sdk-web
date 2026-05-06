// ─────────────────────────────────────────────────────────────────────────────
//  Client-side event validation matching server-side limits.
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    error?: string;
    cleaned?: Record<string, unknown>;
}

const MAX_EVENT_NAME_LEN = 64;
const MAX_PROPS_COUNT = 25;
const MAX_KEY_LEN = 40;
const MAX_STRING_VALUE_LEN = 1024;

const NAME_RE = /^[a-z][a-z0-9_-]*$/;
const INTERNAL_NAME_RE = /^_[a-z][a-z0-9_-]*$/;

function normaliseValue(v: unknown): unknown {
    if (v == null) return null;
    if (typeof v === "boolean" || typeof v === "number") {
        if (typeof v === "number" && (!isFinite(v) || isNaN(v))) return 0;
        return v;
    }
    if (typeof v === "string") {
        return v.length > MAX_STRING_VALUE_LEN ? v.slice(0, MAX_STRING_VALUE_LEN) : v;
    }
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") return v;
    return String(v);
}

export function validateEvent(
    eventName: string,
    properties?: Record<string, unknown>,
): ValidationResult {
    if (!eventName || eventName.length > MAX_EVENT_NAME_LEN) {
        return { valid: false, error: `Event name must be 1-${MAX_EVENT_NAME_LEN} chars` };
    }
    if (!NAME_RE.test(eventName) && !INTERNAL_NAME_RE.test(eventName)) {
        return { valid: false, error: `Event name "${eventName}" invalid` };
    }

    if (!properties) return { valid: true };

    const keys = Object.keys(properties);
    if (keys.length > MAX_PROPS_COUNT) {
        return { valid: false, error: `Too many properties: ${keys.length}` };
    }

    const cleaned: Record<string, unknown> = {};
    for (const key of keys) {
        if (key.length > MAX_KEY_LEN) {
            return { valid: false, error: `Key "${key}" too long` };
        }
        cleaned[key] = normaliseValue(properties[key]);
    }

    return { valid: true, cleaned };
}
