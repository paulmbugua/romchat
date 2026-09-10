import { useEffect, useState } from 'react';
import mobileAds, { AdsConsent, MaxAdContentRating } from 'react-native-google-mobile-ads';
import { discoveryAdsEnabled } from './config';

export function useMobileAds() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!discoveryAdsEnabled) return;
    let mounted = true;

    void (async () => {
      try {
        const consent = await AdsConsent.gatherConsent();
        if (!consent.canRequestAds) return;
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.T,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
        if (mounted) setReady(true);
      } catch {
        // Ads are optional: discovery remains fully usable if consent or inventory fails.
      }
    })();

    return () => { mounted = false; };
  }, []);

  return ready;
}
