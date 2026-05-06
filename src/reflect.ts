import { ReflectWebConfig, WebEvent, RevenueParams, UtmParams, BrowserFingerprint } from "./types";
import { getInstallUuid, getSessionId } from "./cookie";
import { captureUtm, captureReferrer } from "./utm";
import { collectFingerprint } from "./fingerprint";
import { validateEvent } from "./event-validator";

const DEFAULT_BASE_URL = "https://reflect.bablu147147.workers.dev";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUE_SIZE = 100;

interface QueuedEvent {
  payload: Record<string, unknown>;
  attempts: number;
}

export class ReflectSDK {
  private config: ReflectWebConfig | null = null;
  private installUuid = "";
  private sessionId = "";
  private userId: string | null = null;
  private userProperties: Record<string, unknown> | null = null;
  private globalProperties: Record<string, unknown> = {};
  private utm: UtmParams | null = null;
  private referrer: string | null = null;
  private fingerprint: BrowserFingerprint | null = null;
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private enabled = true;

  initialize(config: ReflectWebConfig): void {
    if (this.initialized) return;

    this.config = config;
    this.installUuid = getInstallUuid(config.cookieDomain);
    this.sessionId = getSessionId(config.cookieDomain);
    this.utm = captureUtm();
    this.referrer = captureReferrer();
    this.fingerprint = collectFingerprint();
    this.initialized = true;

    // Start flush timer
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Session tracking + beacon on unload
    if (typeof window !== "undefined") {
      this.trackEvent("session_start");

      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.trackEvent("session_end");
          this.flushBeacon();
        } else if (document.visibilityState === "visible") {
          this.trackEvent("session_start");
        }
      });

      window.addEventListener("beforeunload", () => {
        this.trackEvent("session_end");
        this.flushBeacon();
      });

      // Error capture
      window.addEventListener("error", (e) => {
        this.captureError(e.message, e.filename + ":" + e.lineno);
      });

      window.addEventListener("unhandledrejection", (e) => {
        this.captureError(String(e.reason), "unhandledrejection");
      });
    }

    // Auto page view
    if (config.autoPageView) {
      this.trackPageView();
    }

    this.log("Initialized — appKey=" + config.appKey + " uuid=" + this.installUuid);
  }

  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.initialized || !this.enabled) return;

    const result = validateEvent(name, properties);
    if (!result.valid) {
      this.log("Validation failed: " + result.error);
      return;
    }

    // Merge global properties (event props override)
    const merged = { ...this.globalProperties, ...(result.cleaned ?? properties) };

    const event: WebEvent = {
      event_name: name,
      event_id: this.generateEventId(),
      event_ts_ms: Date.now(),
      properties: Object.keys(merged).length > 0 ? merged : undefined,
      page_url: window.location.href,
      page_title: document.title,
      referrer: this.referrer || undefined,
    };

    this.enqueue(event);
    this.log("trackEvent: " + name);
  }

  trackPageView(url?: string): void {
    this.trackEvent("page_view", {
      url: url || window.location.href,
      path: window.location.pathname,
      title: document.title,
    });
  }

  trackRevenue(params: RevenueParams): void {
    this.trackEvent("revenue", {
      revenue_amount: params.amount,
      revenue_currency: params.currency,
      ...(params.productId ? { product_id: params.productId } : undefined),
      ...(params.transactionId ? { transaction_id: params.transactionId } : undefined),
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = null;
  }

  setUserProperties(properties: Record<string, unknown>): void {
    this.userProperties = properties;
  }

  setGlobalProperty(key: string, value: unknown): void {
    this.globalProperties[key] = value;
  }

  unsetGlobalProperty(key: string): void {
    delete this.globalProperties[key];
  }

  clearGlobalProperties(): void {
    this.globalProperties = {};
  }

  setAudience(...tags: string[]): void {
    this.trackEvent("_set_audience", { tags });
  }

  getWebSessionId(): string {
    return this.sessionId;
  }

  getInstallUuid(): string {
    return this.installUuid;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * GDPR — delete user data. Clears local storage/cookies and
   * sends a deletion request to the server.
   */
  async deleteUserData(): Promise<boolean> {
    if (!this.initialized) return false;
    const baseUrl = this.config?.baseUrl || DEFAULT_BASE_URL;
    try {
      const resp = await fetch(baseUrl + "/privacy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_key: this.config!.appKey,
          install_uuid: this.installUuid,
          ...(this.userId ? { user_id: this.userId } : undefined),
        }),
      });
      // Clear local state
      this.userId = null;
      this.userProperties = null;
      this.globalProperties = {};
      this.queue = [];
      // Clear cookies
      if (typeof document !== "undefined") {
        document.cookie = "reflect_uuid=; Max-Age=0; path=/";
        document.cookie = "reflect_sid=; Max-Age=0; path=/";
      }
      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Decorate a URL with the cross-domain tracking parameter.
   * Use this for links to other domains you own.
   */
  decorateUrl(url: string): string {
    try {
      const u = new URL(url);
      u.searchParams.set("_reflect_xd", this.sessionId);
      return u.toString();
    } catch {
      return url;
    }
  }

  flush(): void {
    if (this.queue.length === 0) return;
    this.sendBatch([...this.queue]);
    this.queue = [];
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBeacon();
    this.initialized = false;
  }

  // --- Private ---

  private lastCrashMs = 0;

  private captureError(message: string, source: string): void {
    const now = Date.now();
    if (now - this.lastCrashMs < 60_000) return; // rate limit: 1/min
    this.lastCrashMs = now;
    this.trackEvent("_crash", {
      message: (message || "").slice(0, 1024),
      source: (source || "").slice(0, 256),
    });
  }

  private enqueue(event: WebEvent): void {
    const payload: Record<string, unknown> = {
      app_key: this.config!.appKey,
      ...event,
      install_uuid: this.installUuid,
      session_id: this.sessionId,
      sdk_version: "web-1.1.0",
      platform: "web",
    };

    if (this.userId) payload.user_id = this.userId;
    if (this.config!.companyKey) payload.company_key = this.config!.companyKey;
    if (this.utm) payload.utm = this.utm;
    if (this.userProperties) payload.user_properties = this.userProperties;
    if (this.fingerprint) payload.fingerprint = this.fingerprint;

    this.queue.push({ payload, attempts: 0 });

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  private sendBatch(events: QueuedEvent[]): void {
    const baseUrl = this.config?.baseUrl || DEFAULT_BASE_URL;
    const url = baseUrl + "/event/batch";
    const body = JSON.stringify({
      app_key: this.config!.appKey,
      events: events.map((e) => e.payload),
    });

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reflect-Platform": "web",
      },
      body,
      keepalive: true,
    }).catch((err) => {
      this.log("Send error: " + err);
      for (const e of events) {
        if (e.attempts < 1) {
          e.attempts++;
          this.queue.push(e);
        }
      }
    });
  }

  private flushBeacon(): void {
    if (this.queue.length === 0) return;
    const baseUrl = this.config?.baseUrl || DEFAULT_BASE_URL;
    const url = baseUrl + "/event/batch";
    const body = JSON.stringify({
      app_key: this.config!.appKey,
      events: this.queue.map((e) => e.payload),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    }
    this.queue = [];
  }

  private generateEventId(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  private log(msg: string): void {
    if (this.config?.debug) {
      console.log("[Reflect]", msg);
    }
  }
}
