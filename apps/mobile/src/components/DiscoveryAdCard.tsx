import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { discoveryAdRequestOptions, discoveryAdUnitId } from '../features/ads/config';

export function DiscoveryAdCard({ height, onDismiss }: { height: number; onDismiss: () => void }) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    let active = true;
    let loadedAd: NativeAd | null = null;
    NativeAd.createForAdRequest(discoveryAdUnitId, discoveryAdRequestOptions)
      .then((ad) => {
        loadedAd = ad;
        if (active) setNativeAd(ad);
        else ad.destroy();
      })
      .catch(() => { if (active) dismissRef.current(); });
    return () => {
      active = false;
      loadedAd?.destroy();
    };
  }, []);

  const dismiss = (direction = -1) => {
    Animated.timing(translateX, { toValue: direction * 520, duration: 210, useNativeDriver: true }).start(dismissRef.current);
  };
  const panHandlers = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
    onPanResponderRelease: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 80) dismiss(gesture.dx > 0 ? 1 : -1);
      else Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current.panHandlers;

  if (!nativeAd) {
    return <View style={[styles.loadingCard, { height }]}><Text style={styles.loadingText}>Finding something useful nearby...</Text></View>;
  }

  return (
    <Animated.View style={[styles.card, { height, transform: [{ translateX }] }]} {...panHandlers}>
      <NativeAdView nativeAd={nativeAd} style={styles.nativeView}>
        <View style={styles.labelRow}>
          <View style={styles.sponsoredPill}><Text style={styles.sponsoredText}>Sponsored</Text></View>
          <TouchableOpacity onPress={() => dismiss()} style={styles.dismissButton} accessibilityLabel="Skip advertisement">
            <Icon name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <NativeMediaView style={styles.media} resizeMode="cover" />
        <View style={styles.copy}>
          <View style={styles.advertiserRow}>
            {nativeAd.icon ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
              </NativeAsset>
            ) : null}
            <View style={styles.textColumn}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text numberOfLines={2} style={styles.headline}>{nativeAd.headline}</Text>
              </NativeAsset>
              {nativeAd.advertiser ? (
                <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                  <Text numberOfLines={1} style={styles.advertiser}>{nativeAd.advertiser}</Text>
                </NativeAsset>
              ) : null}
            </View>
          </View>
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text numberOfLines={2} style={styles.body}>{nativeAd.body}</Text>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <Text style={styles.cta}>{nativeAd.callToAction}</Text>
          </NativeAsset>
          <Text style={styles.skipHint}>Swipe to continue discovering profiles</Text>
        </View>
      </NativeAdView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 26, backgroundColor: '#161117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  nativeView: { flex: 1 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#161117' },
  loadingText: { color: '#A9A2AB', fontSize: 14 },
  labelRow: { position: 'absolute', zIndex: 3, top: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sponsoredPill: { backgroundColor: 'rgba(12,9,13,0.82)', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  sponsoredText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  dismissButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,9,13,0.82)' },
  media: { flex: 1, minHeight: 260 },
  copy: { padding: 18, gap: 11, backgroundColor: '#161117' },
  advertiserRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 44, height: 44, borderRadius: 8 },
  textColumn: { flex: 1, gap: 3 },
  headline: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, fontWeight: '800' },
  advertiser: { color: '#BDB5C0', fontSize: 13, fontWeight: '600' },
  body: { color: '#D2CBD4', fontSize: 14, lineHeight: 20 },
  cta: { overflow: 'hidden', borderRadius: 8, backgroundColor: '#FF1493', color: '#FFFFFF', textAlign: 'center', paddingVertical: 13, fontSize: 15, fontWeight: '800' },
  skipHint: { color: '#827A85', fontSize: 11, textAlign: 'center' },
});
