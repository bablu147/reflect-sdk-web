// ─────────────────────────────────────────────────────────────────────────────
//  Standard event names and typed helpers for the Reflect Web SDK.
//  Web-relevant subset of the full MMP taxonomy.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReflectSDK } from "./reflect";

type Props = Record<string, unknown>;

export const StandardEventNames = {
    SignUp: "sign_up",
    Login: "login",
    ViewItem: "view_item",
    Search: "search",
    Share: "share",
    Rate: "rate",
    AddToCart: "add_to_cart",
    BeginCheckout: "begin_checkout",
    Purchase: "purchase",
    Subscribe: "subscribe",
    StartTrial: "start_trial",
    TrialConverted: "trial_converted",
    SubscriptionRenewed: "subscription_renewed",
    SubscriptionCancelled: "subscription_cancelled",
    SubscriptionRefunded: "subscription_refunded",
    AdImpression: "ad_impression",
    AdClick: "ad_click",
} as const;

/** Creates bound standard event helpers for a ReflectSDK instance. */
export function createStandardEvents(sdk: ReflectSDK) {
    return {
        signUpWith(method: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.SignUp, { method, ...extra });
        },
        loginWith(method: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.Login, { method, ...extra });
        },
        viewItem(contentType: string, itemId: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.ViewItem, { content_type: contentType, item_id: itemId, ...extra });
        },
        searchPerformed(query: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.Search, { query, ...extra });
        },
        shared(contentType: string, itemId: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.Share, { content_type: contentType, item_id: itemId, ...extra });
        },
        rated(rating: number, extra?: Props) {
            sdk.trackEvent(StandardEventNames.Rate, { rating, ...extra });
        },
        addedToCart(sku: string, price: number, currency: string, quantity = 1, extra?: Props) {
            sdk.trackEvent(StandardEventNames.AddToCart, { sku, price, currency, quantity, ...extra });
        },
        checkoutBegan(cartValue: number, currency: string, itemCount?: number, extra?: Props) {
            sdk.trackEvent(StandardEventNames.BeginCheckout, {
                cart_value: cartValue, currency,
                ...(itemCount != null ? { item_count: itemCount } : undefined),
                ...extra,
            });
        },
        trialStarted(productId: string, price: number, currency: string, txnId?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.StartTrial, {
                product_id: productId, price, currency,
                ...(txnId ? { transaction_id: txnId } : undefined),
                ...extra,
            });
        },
        trialConvertedTo(productId: string, price: number, currency: string, txnId?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.TrialConverted, {
                product_id: productId, price, currency,
                ...(txnId ? { transaction_id: txnId } : undefined),
                ...extra,
            });
        },
        subscriptionDidRenew(productId: string, price: number, currency: string, txnId?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.SubscriptionRenewed, {
                product_id: productId, price, currency,
                ...(txnId ? { transaction_id: txnId } : undefined),
                ...extra,
            });
        },
        subscriptionDidCancel(productId: string, reason?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.SubscriptionCancelled, {
                product_id: productId,
                ...(reason ? { reason } : undefined),
                ...extra,
            });
        },
        subscriptionDidRefund(productId: string, amount: number, currency: string, txnId?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.SubscriptionRefunded, {
                product_id: productId, amount, currency,
                ...(txnId ? { transaction_id: txnId } : undefined),
                ...extra,
            });
        },
        adShown(adNetwork: string, adFormat: string, revenue?: number, currency?: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.AdImpression, {
                ad_network: adNetwork, ad_format: adFormat,
                ...(revenue != null ? { revenue } : undefined),
                ...(currency ? { currency } : undefined),
                ...extra,
            });
        },
        adClicked(adNetwork: string, adFormat: string, extra?: Props) {
            sdk.trackEvent(StandardEventNames.AdClick, { ad_network: adNetwork, ad_format: adFormat, ...extra });
        },
    };
}
