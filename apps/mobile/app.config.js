export default function expoConfig({ config }) {
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');

  const isProduction = appEnv === 'production';
  const isDevClient = process.env.EXPO_DEV_CLIENT === 'true';
  const enableGooglePlugin = isProduction || isDevClient;

  const EAS_PROJECT_ID =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    '9926dcae-ad3c-4e30-b818-6a02f8c08ac7';

  const BACKENDS = {
    androidEmu: 'http://10.0.2.2:4001',
    iosSim: 'http://localhost:4001',
    lan1: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://192.168.137.1:4001',
    hotspot: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://10.254.198.47:4001',
    prod: process.env.EXPO_PUBLIC_PROD_BACKEND_URL || 'https://server.grogondigital.co.ke',
  };

  const DEFAULT_BACKEND =
    process.env.EXPO_PUBLIC_DEFAULT_BACKEND || process.env.BACKEND || (isProduction ? 'prod' : 'androidEmu');
  const RESOLVED_BACKEND_URL = BACKENDS[DEFAULT_BACKEND] || BACKENDS.prod;
  const usesCleartextTraffic = !isProduction && String(RESOLVED_BACKEND_URL).startsWith('http://');

  const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const GOOGLE_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID || '';

  return {
    ...config,
    owner: 'paulmbugua2',
    name: 'Grogon',
    slug: 'grogon',
    version: '1.0.0',
    scheme: 'grogon',
    runtimeVersion: { policy: 'appVersion' },
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#050505',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      ...config.android,
      package: 'com.paulmbugua2.grogon',
      permissions: ['INTERNET', 'POST_NOTIFICATIONS', 'CAMERA', 'READ_MEDIA_IMAGES'],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || undefined,
      notification: {
        icon: './assets/notification-icon.png',
        color: '#ff5a00',
        defaultChannel: 'default',
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon-foreground.png',
        backgroundColor: '#050505',
      },
      intentFilters: [
        {
          action: 'VIEW',
          category: ['BROWSABLE', 'DEFAULT'],
          data: [{ scheme: 'grogon' }],
        },
      ],
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.paulmbugua2.grogon',
      infoPlist: {
        ...(config?.ios?.infoPlist ?? {}),
        UIBackgroundModes: (config?.ios?.infoPlist?.UIBackgroundModes ?? []).filter((mode) => mode !== 'audio'),
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
      ['expo-system-ui', { lightBackgroundColor: '#ffffff', darkBackgroundColor: '#050505' }],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#050505',
        },
      ],
      'expo-notifications',
      'expo-web-browser',
      'expo-asset',
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
      enableGooglePlugin && GOOGLE_WEB_CLIENT_ID && [
        '@react-native-google-signin/google-signin',
        {
          scopes: ['email', 'profile'],
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          iosClientId: GOOGLE_IOS_CLIENT_ID,
          iosUrlScheme: GOOGLE_REVERSED_CLIENT_ID,
        },
      ],
    ].filter(Boolean),
    extra: {
      ...config.extra,
      EXPO_PUBLIC_APP_ENV: appEnv,
      EXPO_PUBLIC_BACKEND_URL: RESOLVED_BACKEND_URL,
      EXPO_PUBLIC_PROD_BACKEND_URL: BACKENDS.prod,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID: GOOGLE_REVERSED_CLIENT_ID,
      EXPO_PUBLIC_EAS_PROJECT_ID: EAS_PROJECT_ID,
      eas: { projectId: EAS_PROJECT_ID },
      BACKENDS,
      DEFAULT_BACKEND,
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      fallbackToCacheTimeout: 0,
      checkAutomatically: 'ON_LOAD',
    },
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
  };
}
