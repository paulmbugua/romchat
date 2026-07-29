const fs = require('fs');
const path = require('path');

function loadEnvironmentFile(appEnv) {
  const envPath = path.join(__dirname, 'environments', `${appEnv}.env`);
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

module.exports = function expoConfig({ config }) {
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');
  loadEnvironmentFile(appEnv);
  const isProduction = appEnv === 'production';
  const EAS_PROJECT_ID =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    config?.extra?.eas?.projectId ||
    'aaa9b53a-8fe8-4883-8033-cb972942ec37';

  const BACKENDS = {
    androidEmu: 'http://10.0.2.2:4000',
    iosSim: 'http://localhost:4000',
    lan1: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://192.168.137.1:4000',
    hotspot: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://10.254.198.47:4001',
    prod: process.env.EXPO_PUBLIC_PROD_BACKEND_URL || 'https://server.desiredoha.com',
  };

  const DEFAULT_BACKEND =
    process.env.EXPO_PUBLIC_DEFAULT_BACKEND || process.env.BACKEND || 'prod';
  const RESOLVED_BACKEND_URL = BACKENDS[DEFAULT_BACKEND] || BACKENDS.prod;
  const usesCleartextTraffic = !isProduction && String(RESOLVED_BACKEND_URL).startsWith('http://');
  const ALLOW_ANDROID_EMULATOR_BACKEND = process.env.EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND || '';
  const DEVICE_BACKEND_PORT = process.env.EXPO_PUBLIC_DEVICE_BACKEND_PORT || '4009';
  const DEVICE_BACKEND_URL = process.env.EXPO_PUBLIC_DEVICE_BACKEND_URL || '';
  const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_WEB || '';
  const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_ANDROID || '';
  const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_IOS || '';
  const GOOGLE_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID || process.env.GOOGLE_REVERSED_CLIENT_ID || '';

  return {
    ...config,
    owner: 'paulmbugua2',
    name: 'RomChat',
    slug: 'romchat',
    version: '1.0.0',
    scheme: 'romchat',
    runtimeVersion: '1.0.0',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1c1e',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      ...config.android,
      package: 'com.paulmbugua2.romchat1',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
      permissions: ['INTERNET', 'POST_NOTIFICATIONS', 'CAMERA', 'RECORD_AUDIO'],
      notification: {
        icon: './assets/notification-icon.png',
        color: '#a63646',
        defaultChannel: 'romchat-default',
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon-foreground.png',
        monochromeImage: './assets/adaptive-icon-monochrome.png',
        backgroundColor: '#1a1c1e',
      },
      intentFilters: [
        {
          action: 'VIEW',
          category: ['BROWSABLE', 'DEFAULT'],
          data: [{ scheme: 'romchat' }],
        },
      ],
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.paulmbugua2.romchat1',
      infoPlist: {
        ...(config?.ios?.infoPlist ?? {}),
        CFBundleDisplayName: 'RomChat',
        CFBundleName: 'RomChat',
        NSCameraUsageDescription: 'RomChat uses the camera for profile photos, liveness verification, and consent-based video calls.',
        NSMicrophoneUsageDescription: 'RomChat uses the microphone for consent-based voice and video calls.',
      },
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      ['expo-system-ui', { lightBackgroundColor: '#ffffff', darkBackgroundColor: '#1a1c1e' }],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#1a1c1e',
        },
      ],
      'expo-notifications',
      'expo-web-browser',
      'expo-asset',
      GOOGLE_WEB_CLIENT_ID && [
        '@react-native-google-signin/google-signin',
        {
          scopes: ['email', 'profile'],
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          iosUrlScheme: GOOGLE_REVERSED_CLIENT_ID || 'com.googleusercontent.apps.164509786898-7ca20l8gli2hia1d8p06r55v81p9f2nh',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic,
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            javaVersion: 17,
          },
          ios: { deploymentTarget: '15.1' },
        },
      ],
    ].filter(Boolean),
    extra: {
      ...config.extra,
      EXPO_PUBLIC_APP_ENV: appEnv,
      EXPO_PUBLIC_BACKEND_URL: RESOLVED_BACKEND_URL,
      EXPO_PUBLIC_PROD_BACKEND_URL: BACKENDS.prod,
      EXPO_PUBLIC_ALLOW_ANDROID_EMULATOR_BACKEND: ALLOW_ANDROID_EMULATOR_BACKEND,
      EXPO_PUBLIC_DEVICE_BACKEND_PORT: DEVICE_BACKEND_PORT,
      EXPO_PUBLIC_DEVICE_BACKEND_URL: DEVICE_BACKEND_URL,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: GOOGLE_ANDROID_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID: GOOGLE_REVERSED_CLIENT_ID,
      ...(EAS_PROJECT_ID ? { EXPO_PUBLIC_EAS_PROJECT_ID: EAS_PROJECT_ID, eas: { projectId: EAS_PROJECT_ID } } : {}),
      BACKENDS,
      DEFAULT_BACKEND,
    },
    ...(EAS_PROJECT_ID
      ? {
          updates: {
            url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
            fallbackToCacheTimeout: 0,
            checkAutomatically: 'ON_LOAD',
          },
        }
      : {}),
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
  };
};
