/**
 * Google Play product IDs must match the products created in Play Console.
 * Keep this list in one place so the client and server cannot drift silently.
 */
export const GOOGLE_PLAY_PRODUCT_IDS = {
  tokens100: 'romchat_tokens_100',
  tokens350: 'romchat_tokens_350',
  tokens1000: 'romchat_tokens_1000',
  superLikes15: 'romchat_superlikes_15',
  superLikes30: 'romchat_superlikes_30',
  firstImpressions3: 'romchat_first_impressions_3',
  firstImpressions12: 'romchat_first_impressions_12',
  firstImpressions50: 'romchat_first_impressions_50',
} as const;

export const GOOGLE_PLAY_CONSUMABLE_PRODUCT_IDS = Object.values(GOOGLE_PLAY_PRODUCT_IDS);

export type GooglePlayProductId = (typeof GOOGLE_PLAY_CONSUMABLE_PRODUCT_IDS)[number];

export function isGooglePlayProductId(value: string): value is GooglePlayProductId {
  return GOOGLE_PLAY_CONSUMABLE_PRODUCT_IDS.includes(value as GooglePlayProductId);
}
