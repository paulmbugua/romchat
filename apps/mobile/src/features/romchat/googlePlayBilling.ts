import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetchProducts, finishTransaction, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase, endConnection, type ProductOrSubscription, type Purchase } from 'expo-iap';
import { GOOGLE_PLAY_CONSUMABLE_PRODUCT_IDS, GOOGLE_PLAY_PRODUCT_IDS } from './billingCatalog';

/**
 * Small capability boundary for the first billing milestone. The actual
 * purchase flow is intentionally not exposed until receipt verification is
 * enabled on the API.
 */
const billingFlag = String(
  process.env.EXPO_PUBLIC_GOOGLE_PLAY_BILLING_ENABLED ||
  (Constants.expoConfig?.extra as { EXPO_PUBLIC_GOOGLE_PLAY_BILLING_ENABLED?: string } | undefined)?.EXPO_PUBLIC_GOOGLE_PLAY_BILLING_ENABLED ||
  ''
).toLowerCase();

export const googlePlayBilling = {
  enabled: Platform.OS === 'android' && billingFlag === 'true',
  productIds: GOOGLE_PLAY_CONSUMABLE_PRODUCT_IDS,
  subscriptionIds: ['romchat_gold', 'romchat_platinum'] as const,
};

export async function connectGooglePlayBilling() {
  if (!googlePlayBilling.enabled) return [] as ProductOrSubscription[];
  await initConnection();
  const [products, subscriptions] = await Promise.all([
    fetchProducts({ skus: [...googlePlayBilling.productIds], type: 'in-app' }),
    fetchProducts({ skus: [...googlePlayBilling.subscriptionIds], type: 'subs' }),
  ]);
  const catalog = [...(products || []), ...(subscriptions || [])];
  if (__DEV__) console.info('[romchat-billing] catalog:ready', { productIds: catalog.map((item) => item.id) });
  return catalog;
}

export function listenForGooglePlayPurchases(onPurchase: (purchase: Purchase) => Promise<void>, onError: (error: Error) => void) {
  if (!googlePlayBilling.enabled) return () => undefined;
  const update = purchaseUpdatedListener((purchase) => {
    void onPurchase(purchase).catch((error) => onError(error instanceof Error ? error : new Error('We could not confirm this purchase. Please try again.')));
  });
  const error = purchaseErrorListener((purchaseError) => onError(new Error(purchaseError.message || 'Google Play purchase failed.')));
  return () => { update.remove(); error.remove(); void endConnection(); };
}

export async function launchGooglePlayPurchase(productId: string, subscription = false, offerToken?: string | null) {
  if (!googlePlayBilling.enabled) throw new Error('Google Play purchases are not available in this build.');
  if (subscription) {
    await requestPurchase({ type: 'subs', request: { google: { skus: [productId], subscriptionOffers: offerToken ? [{ sku: productId, offerToken }] : undefined } } });
    return;
  }
  await requestPurchase({ type: 'in-app', request: { google: { skus: [productId] } } });
}

export { finishTransaction };
