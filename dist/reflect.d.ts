import { ReflectWebConfig } from "./types";
export declare class ReflectSDK {
    private config;
    private installUuid;
    private sessionId;
    private userId;
    private userProperties;
    private utm;
    private referrer;
    private fingerprint;
    private queue;
    private flushTimer;
    private initialized;
    private enabled;
    initialize(config: ReflectWebConfig): void;
    trackEvent(name: string, properties?: Record<string, unknown>): void;
    trackPageView(url?: string): void;
    setUserId(userId: string): void;
    clearUserId(): void;
    setUserProperties(properties: Record<string, unknown>): void;
    getWebSessionId(): string;
    getInstallUuid(): string;
    setEnabled(enabled: boolean): void;
    /**
     * Decorate a URL with the cross-domain tracking parameter.
     * Use this for links to other domains you own.
     */
    decorateUrl(url: string): string;
    flush(): void;
    destroy(): void;
    private enqueue;
    private sendBatch;
    private flushBeacon;
    private generateEventId;
    private log;
}
