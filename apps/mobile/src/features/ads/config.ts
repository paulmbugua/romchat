import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, unknown>;
const appEnvironment = String(extra.EXPO_PUBLIC_APP_ENV || 'development').toLowerCase();
const configuredNativeUnitId = String(extra.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID || '').trim();
const platformConfigured = Platform.OS === 'android'
  ? extra.EXPO_PUBLIC_ADMOB_ANDROID_CONFIGURED === true
  : extra.EXPO_PUBLIC_ADMOB_IOS_CONFIGURED === true;

export const isProductionAdsBuild = appEnvironment === 'production';
export const discoveryAdUnitId = isProductionAdsBuild ? configuredNativeUnitId : TestIds.NATIVE;
export const discoveryAdsEnabled = Platform.OS !== 'web' && (!isProductionAdsBuild || platformConfigured) && Boolean(discoveryAdUnitId);
const configuredCadence = Number(extra.EXPO_PUBLIC_ADS_EVERY_N_SWIPES || 6);
export const discoveryAdCadence = Number.isFinite(configuredCadence) ? Math.max(4, Math.floor(configuredCadence)) : 6;

export const discoveryAdRequestOptions = {
  requestNonPersonalizedAdsOnly: true,
  keywords: ['Kenya', 'Nairobi', 'Mombasa', 'travel', 'food', 'entertainment', 'mobile services'],
  contentUrl: 'https://romchat.co.ke/',
  requestAgent: 'RomChat',
};
