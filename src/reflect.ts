import { ReflectWebConfig, WebEvent, UtmParams, BrowserFingerprint } from "./types";
import { getInstallUuid, getSessionId } from "./cookie";
import { captureUtm, captureReferrer } from "./utm";
import { collectFingerprint } from "./fingerprint";

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

    // Beacon on unload
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flushBeacon();
        }
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

    const event: WebEvent = {
      event_name: name,
      event_id: this.generateEventId(),
      event_ts_ms: Date.now(),
      properties,
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

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = null;
  }

  setUserProperties(properties: Record<string, unknown>): void {
    this.userProperties = properties;
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

  private enqueue(event: WebEvent): void {
    const payload: Record<string, unknown> = {
      app_key: this.config!.appKey,
      ...event,
      install_uuid: this.installUuid,
      session_id: this.sessionId,
      sdk_version: "web-1.0.0",
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
      // Re-queue failed events (max 1 retry)
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
      // Fallback to sync XHR (last resort)
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
