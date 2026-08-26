import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
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
};

type SheetMode = 'native' | 'ota-available' | 'ota-downloading' | 'ota-ready' | 'ota-error';
type SheetState = {
  mode: SheetMode;
  required: boolean;
  title: string;
  message: string;
  storeUrl?: string;
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

function pickStoreUrl(payload: NativeVersionResponse) {
  const platformUrl = Platform.OS === 'ios' ? payload.iosStoreUrl : payload.androidStoreUrl;
  return platformUrl || payload.storeUrl || (Platform.OS === 'android' ? PLAY_STORE_URL : '');
}

async function fetchNativeVersion() {
  const base = String(apiBaseUrl || '').replace(/\/+$/, '');
  if (!base) return null;

  const currentVersion = getCurrentVersion();
  const url = `${base}${VERSION_ENDPOINT}?platform=${encodeURIComponent(Platform.OS)}&version=${encodeURIComponent(currentVersion)}`;
  console.info('[romchat-update] native:check', { currentVersion, url });

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Client-Platform': Platform.OS },
  });
  if (!response.ok) throw new Error(`Version endpoint returned ${response.status}`);
  return (await response.json()) as NativeVersionResponse;
}

export function AppUpdateSheet() {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const checkingRef = useRef(false);
  const downloadingRef = useRef(false);
  const lastCheckRef = useRef(0);
  const currentVersion = useMemo(() => getCurrentVersion(), []);

  const sheetKey = sheet ? `${sheet.mode}:${sheet.storeUrl || ''}:${sheet.title}` : null;
  const canDismiss = Boolean(sheet && !sheet.required && sheet.mode !== 'ota-downloading');

  const showSheet = useCallback((next: SheetState) => {
    const key = `${next.mode}:${next.storeUrl || ''}:${next.title}`;
    if (!next.required && dismissedKey === key) return;
    setSheet(next);
  }, [dismissedKey]);

  const checkNativeVersion = useCallback(async () => {
    try {
      const payload = await fetchNativeVersion();
      if (!payload) return false;

      const latestVersion = normalizeVersion(payload.latestVersion);
      const minimumVersion = normalizeVersion(payload.minVersion || payload.minimumVersion);
      const required = Boolean(payload.required || payload.forceUpdate || payload.forced) ||
        Boolean(minimumVersion && compareVersions(currentVersion, minimumVersion) < 0);
      const available = Boolean(latestVersion && compareVersions(currentVersion, latestVersion) < 0);

      console.info('[romchat-update] native:result', {
        available, currentVersion, latestVersion, minimumVersion, required,
      });
      if (!required && !available) return false;

      showSheet({
        mode: 'native',
        required,
        title: required ? 'Update required' : 'A newer RomChat is ready',
        message: payload.message || (required
          ? 'Install the latest secure version from the store to continue meeting and chatting.'
          : 'Update from the store for the newest RomChat experience.'),
        storeUrl: pickStoreUrl(payload),
      });
      return true;
    } catch (error) {
      console.warn('[romchat-update] native:failed', error);
      return false;
    }
  }, [currentVersion, showSheet]);

  const checkOtaUpdate = useCallback(async () => {
    if (__DEV__) return false;
    try {
      if (Updates.isUpdatePending) {
        console.info('[romchat-update] ota:already-downloaded');
        showSheet({
          mode: 'ota-ready',
          required: false,
          title: 'Update ready',
          message: 'RomChat finished preparing an update in the background. Restart whenever it suits you.',
        });
        return true;
      }

      console.info('[romchat-update] ota:check');
      const update = await Updates.checkForUpdateAsync();
      console.info('[romchat-update] ota:result', { available: update.isAvailable });
      if (!update.isAvailable) return false;

      showSheet({
        mode: 'ota-available',
        required: false,
        title: 'A fresh update is available',
        message: 'Download it in the background and keep using RomChat while it gets ready.',
      });
      return true;
    } catch (error) {
      console.warn('[romchat-update] ota:check-failed', error);
      return false;
    }
  }, [showSheet]);

  const runChecks = useCallback(async (force = false) => {
    const now = Date.now();
    if (checkingRef.current) return;
    if (!force && now - lastCheckRef.current < CHECK_INTERVAL_MS) return;

    checkingRef.current = true;
    lastCheckRef.current = now;
    try {
      const nativeVisible = await checkNativeVersion();
      if (!nativeVisible) await checkOtaUpdate();
    } finally {
      checkingRef.current = false;
    }
  }, [checkNativeVersion, checkOtaUpdate]);

  useEffect(() => {
    void runChecks(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runChecks();
    });
    return () => subscription.remove();
  }, [runChecks]);

  const dismiss = useCallback(() => {
    if (!sheet || !canDismiss) return;
    if (sheetKey) setDismissedKey(sheetKey);
    setSheet(null);
  }, [canDismiss, sheet, sheetKey]);

  const downloadOta = useCallback(() => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setSheet((previous) => previous ? {
      ...previous,
      mode: 'ota-downloading',
      title: 'Downloading quietly',
      message: 'Keep browsing and chatting. We will let you know when the update is ready.',
    } : previous);
    console.info('[romchat-update] ota:download-start');

    Updates.fetchUpdateAsync()
      .then(() => {
        console.info('[romchat-update] ota:download-success');
        setSheet({
          mode: 'ota-ready',
          required: false,
          title: 'Update ready',
          message: 'The update is downloaded. Restart RomChat now or apply it later.',
        });
      })
      .catch((error) => {
        console.warn('[romchat-update] ota:download-failed', error);
        setSheet({
          mode: 'ota-error',
          required: false,
          title: 'Download paused',
          message: 'We could not finish the update. Check your connection and try again.',
        });
      })
      .finally(() => { downloadingRef.current = false; });
  }, []);

  const restartNow = useCallback(() => {
    console.info('[romchat-update] ota:reload');
    void Updates.reloadAsync();
  }, []);

  const openStore = useCallback(() => {
    if (!sheet?.storeUrl) return;
    console.info('[romchat-update] native:open-store', { url: sheet.storeUrl });
    Linking.openURL(sheet.storeUrl).catch((error) => {
      console.warn('[romchat-update] native:store-open-failed', error);
    });
  }, [sheet?.storeUrl]);

  if (!sheet) return null;

  const primaryLabel = sheet.mode === 'native' ? 'Open store'
    : sheet.mode === 'ota-ready' ? 'Restart now'
      : sheet.mode === 'ota-downloading' ? 'Downloading...'
        : sheet.mode === 'ota-error' ? 'Try again' : 'Download update';
  const primaryAction = sheet.mode === 'native' ? openStore
    : sheet.mode === 'ota-ready' ? restartNow
      : sheet.mode === 'ota-error' || sheet.mode === 'ota-available' ? downloadOta : undefined;

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View pointerEvents="auto" style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.contentRow}>
          <View style={styles.iconWrap}>
            {sheet.mode === 'ota-downloading'
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.icon}>↑</Text>}
          </View>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{sheet.mode === 'native' ? 'APP UPDATE' : 'ROMCHAT UPDATE'}</Text>
            <Text style={styles.title}>{sheet.title}</Text>
            <Text style={styles.message}>{sheet.message}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {canDismiss ? (
            <Pressable accessibilityRole="button" onPress={dismiss} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Later</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={!primaryAction}
            onPress={primaryAction}
            style={[styles.primaryButton, !primaryAction && styles.primaryButtonDisabled]}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 12,
    position: 'absolute',
    right: 0,
    zIndex: 2000,
  },
  sheet: {
    backgroundColor: colors.surfaceMatte,
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
  icon: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', lineHeight: 23 },
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
