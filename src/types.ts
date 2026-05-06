export interface ReflectWebConfig {
  appKey: string;
  companyKey?: string;
  baseUrl?: string;
  debug?: boolean;
  /** Domain to scope the first-party cookie (e.g., ".example.com") */
  cookieDomain?: string;
  /** Domains for cross-domain tracking link decoration */
  crossDomainDomains?: string[];
  /** Auto-track page views on navigation. Default: false */
  autoPageView?: boolean;
}

export interface WebEvent {
  event_name: string;
  event_id: string;
  event_ts_ms: number;
  properties?: Record<string, unknown>;
  page_url?: string;
  page_title?: string;
  referrer?: string;
}

export interface WebSessionData {
  session_id: string;
  install_uuid: string;
  first_seen_ms: number;
  last_seen_ms: number;
  page_views: number;
  utm?: UtmParams;
  referrer?: string;
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface BrowserFingerprint {
  canvas_hash?: string;
  webgl_renderer?: string;
  timezone: string;
  language: string;
  platform: string;
  screen_resolution: string;
  color_depth: number;
}
