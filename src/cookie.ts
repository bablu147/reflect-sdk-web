const COOKIE_NAME = "_reflect_uid";
const COOKIE_SESSION = "_reflect_sid";
const COOKIE_DISMISS = "_reflect_banner_dismissed";
const COOKIE_MAX_AGE_DAYS = 395; // 13 months (max first-party)

export function getInstallUuid(cookieDomain?: string): string {
  let uid = getCookie(COOKIE_NAME);
  if (!uid) {
    uid = generateId();
    setCookie(COOKIE_NAME, uid, COOKIE_MAX_AGE_DAYS, cookieDomain);
  }
  return uid;
}

export function getSessionId(cookieDomain?: string): string {
  let sid = getCookie(COOKIE_SESSION);
  if (!sid) {
    sid = generateId();
    // Session cookie: 30 min sliding expiry
    setCookie(COOKIE_SESSION, sid, 0, cookieDomain, 1800);
  } else {
    // Refresh session TTL
    setCookie(COOKIE_SESSION, sid, 0, cookieDomain, 1800);
  }
  return sid;
}

export function isBannerDismissed(): boolean {
  return getCookie(COOKIE_DISMISS) === "1";
}

export function dismissBanner(days: number, cookieDomain?: string): void {
  setCookie(COOKIE_DISMISS, "1", days, cookieDomain);
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(
  name: string,
  value: string,
  days: number,
  domain?: string,
  maxAgeSec?: number
): void {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (maxAgeSec) {
    cookie += `; max-age=${maxAgeSec}`;
  } else if (days > 0) {
    cookie += `; max-age=${days * 86400}`;
  }
  if (domain) {
    cookie += `; domain=${domain}`;
  }
  document.cookie = cookie;
}

function generateId(): string {
  // 32-char hex
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
