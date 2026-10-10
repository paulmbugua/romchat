import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiBaseUrl } from '../lib/api';
import { colors } from '../theme/tokens';

type NativeVersionResponse = {
  latestVersion?: string;
  minVersion?: string;
  minimumVersion?: string;
  required?: boolean;
  forceUpdate?: boolean;
  forced?: boolean;
  message?: string;
  storeUrl?: string;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  latestBuildNumber?: number | string;
  minimumBuildNumber?: number | string;
};

type SheetState = {
  title: string;
  message: string;
  storeUrl: string;
};

const VERSION_ENDPOINT = '/api/mobile/version';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.paulmbugua2.romchat1';

function normalizeVersion(value: unknown) {
  return String(value || '').trim().replace(/^[^\d]*/, '');
}

function compareVersions(a: string, b: string) {
  const left = normalizeVersion(a).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = normalizeVersion(b).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function getCurrentVersion() {
  return (
    Constants.nativeAppVersion ||
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    '0.0.0'
  );
}

function getCurrentBuildNumber() {
  const value = Number.parseInt(String(Constants.nativeBuildVersion || ''), 10);
  return Number.isFinite(value) ? value : null;
}

function parseBuildNumber(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickStoreUrl(payload: NativeVersionResponse) {
  const platformUrl = Platform.OS === 'ios' ? payload.iosStoreUrl : payload.androidStoreUrl;
  return platformUrl || payload.storeUrl || (Platform.OS === 'android' ? PLAY_STORE_URL : '');
}

async function fetchNativeVersion() {
  const base = String(apiBaseUrl || '').replace(/\/+$/, '');
  if (!base) return null;

  const currentVersion = getCurrentVersion();
  const currentBuildNumber = getCurrentBuildNumber();
  const buildQuery = currentBuildNumber === null ? '' : `&buildNumber=${encodeURIComponent(currentBuildNumber)}`;
  const url = `${base}${VERSION_ENDPOINT}?platform=${encodeURIComponent(Platform.OS)}&version=${encodeURIComponent(currentVersion)}${buildQuery}`;
  console.info('[romchat-update] native:check', { currentBuildNumber, currentVersion, url });

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Client-Platform': Platform.OS },
  });
  if (!response.ok) throw new Error(`Version endpoint returned ${response.status}`);
  return (await response.json()) as NativeVersionResponse;
}

export function AppUpdateSheet() {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);
  const translateY = useRef(new Animated.Value(42)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const currentVersion = useMemo(() => getCurrentVersion(), []);
  const currentBuildNumber = useMemo(() => getCurrentBuildNumber(), []);

  useEffect(() => {
    if (!sheet) return;
    translateY.setValue(42);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 260,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, sheet, translateY]);

  const checkNativeVersion = useCallback(async () => {
    try {
      const payload = await fetchNativeVersion();
      if (!payload) return false;

      const latestVersion = normalizeVersion(payload.latestVersion);
      const minimumVersion = normalizeVersion(payload.minVersion || payload.minimumVersion);
      const latestBuildNumber = parseBuildNumber(payload.latestBuildNumber);
      const minimumBuildNumber = parseBuildNumber(payload.minimumBuildNumber);
      const buildAvailable = currentBuildNumber !== null && latestBuildNumber !== null &&
        currentBuildNumber < latestBuildNumber;
      const buildRequired = currentBuildNumber !== null && minimumBuildNumber !== null &&
        currentBuildNumber < minimumBuildNumber;
      const required = Boolean(payload.required || payload.forceUpdate || payload.forced) ||
        Boolean(minimumVersion && compareVersions(currentVersion, minimumVersion) < 0) || buildRequired;
      const available = Boolean(latestVersion && compareVersions(currentVersion, latestVersion) < 0) ||
        buildAvailable || required;

      console.info('[romchat-update] native:result', {
        available,
        currentBuildNumber,
        currentVersion,
        latestBuildNumber,
        latestVersion,
        minimumBuildNumber,
        minimumVersion,
        required,
      });
      if (!required) {
        console.info('[romchat-update] native:store-managed', { available });
        return false;
      }

      setSheet({
        title: 'Update required',
        message: payload.message || 'Install the latest secure version from Google Play to continue meeting and chatting.',
        storeUrl: pickStoreUrl(payload),
      });
      return true;
    } catch (error) {
      console.warn('[romchat-update] native:failed', error);
      return false;
    }
  }, [currentBuildNumber, currentVersion]);

  const runChecks = useCallback(async (force = false) => {
    const now = Date.now();
    if (checkingRef.current) return;
    if (!force && now - lastCheckRef.current < CHECK_INTERVAL_MS) return;

    checkingRef.current = true;
    lastCheckRef.current = now;
    try {
      await checkNativeVersion();
    } finally {
      checkingRef.current = false;
    }
  }, [checkNativeVersion]);

  useEffect(() => {
    void runChecks(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runChecks();
    });
    return () => {
      subscription.remove();
    };
  }, [runChecks]);

  const openStore = useCallback(() => {
    if (!sheet?.storeUrl) return;
    console.info('[romchat-update] native:open-store', { url: sheet.storeUrl });
    Linking.openURL(sheet.storeUrl).catch((error) => {
      console.warn('[romchat-update] native:store-open-failed', error);
    });
  }, [sheet?.storeUrl]);

  if (!sheet) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => undefined}>
      <Pressable
        style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 14) + 10 }]}
      >
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.contentRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" color="#FFFFFF" size={26} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>SECURITY UPDATE</Text>
            <Text style={styles.title}>{sheet.title}</Text>
            <Text style={styles.message}>{sheet.message}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={openStore}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Update from Google Play</Text>
          </Pressable>
        </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(3, 1, 8, 0.52)',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  sheet: {
    backgroundColor: colors.surfaceMatte,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderColor: colors.borderSubtle,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    elevation: 22,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    height: 4,
    marginBottom: 13,
    width: 38,
  },
  contentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  copy: { flex: 1 },
  eyebrow: {
    color: colors.secondaryAccent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 2,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 0 },
  message: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 9, justifyContent: 'flex-end', marginTop: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 15,
  },
  primaryButtonDisabled: { opacity: 0.68 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 17,
  },
  secondaryText: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
});
