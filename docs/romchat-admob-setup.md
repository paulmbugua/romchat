# RomChat AdMob production setup

RomChat displays a native sponsored card after every six completed profile decisions for free members. Gold and Platinum members do not see ads. Development builds always use Google's test inventory. Production shows no ad unless a production Native ad unit ID is configured.

## 1. Create AdMob inventory

1. Create or open the RomChat app in Google AdMob using Android package `com.paulmbugua2.romchat1`.
2. Copy the AdMob Android App ID. It has the form `ca-app-pub-...~...`.
3. Create a **Native advanced** ad unit named `RomChat Discovery`.
4. Copy its Ad Unit ID. It has the form `ca-app-pub-.../...`.
5. Link AdMob to the published Google Play listing once it is available.

## 2. Add EAS production variables

```text
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-REPLACE~REPLACE
EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID=ca-app-pub-REPLACE/REPLACE
EXPO_PUBLIC_ADS_EVERY_N_SWIPES=6
```

Only add `EXPO_PUBLIC_ADMOB_IOS_APP_ID` when an iOS AdMob app exists. AdMob identifiers are public configuration values, not secrets, but they must still be scoped to the production EAS environment.

## 3. Configure privacy and policy

1. In AdMob **Privacy & messaging**, publish the European regulations consent message.
2. Keep the app's public privacy policy aligned with the in-app Advertising disclosure.
3. In Google Play Console, open **Policy and programmes > App content > Ads** and declare that the app contains ads.
4. Update the Play Data safety form for Google Mobile Ads SDK data collection and sharing.
5. Confirm all user-generated profile content is moderated. Explicit sexual content can disable ad serving.

RomChat deliberately requests non-personalized ads. Kenyan relevance comes from contextual keywords and coarse geography, not users' relationship preferences or other sensitive profile data.

## 4. Build and verify

The Mobile Ads SDK includes native code, so an OTA update is not enough.

```powershell
eas build --profile production --platform android
```

Verify on a physical device that:

- an ad appears only after six completed swipes;
- every card is labeled **Sponsored**;
- swiping or tapping close returns to the next profile;
- Gold and Platinum accounts see no ads;
- consent appears where required;
- production requests use the production unit, never `TestIds.NATIVE`.

Do not tap live ads during testing. Use development builds and Google's test inventory for interaction testing.
