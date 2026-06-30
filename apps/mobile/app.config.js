module.exports = function expoConfig({ config }) {
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');

  const isProduction = appEnv === 'production';
  const EAS_PROJECT_ID =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    config?.extra?.eas?.projectId ||
    'e49ebd72-b672-411d-a8c6-e30476d2346c';

  const BACKENDS = {
    androidEmu: 'http://10.0.2.2:4001',
    iosSim: 'http://localhost:4001',
    lan1: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://192.168.137.1:4001',
    hotspot: process.env.EXPO_PUBLIC_LAN_BACKEND_URL || 'http://10.254.198.47:4001',
    prod: process.env.EXPO_PUBLIC_PROD_BACKEND_URL || 'https://server.grogonsacco.co.ke',
  };

  const DEFAULT_BACKEND =
    process.env.EXPO_PUBLIC_DEFAULT_BACKEND || process.env.BACKEND || (isProduction ? 'prod' : 'androidEmu');
  const RESOLVED_BACKEND_URL = BACKENDS[DEFAULT_BACKEND] || BACKENDS.prod;
  const usesCleartextTraffic = !isProduction && String(RESOLVED_BACKEND_URL).startsWith('http://');

  return {
    ...config,
    owner: 'paulmbugua2',
    name: 'Grogon Sacco',
    slug: 'grogonsacco',
    version: '1.0.0',
    scheme: 'grogonsacco',
    runtimeVersion: '1.0.0',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0d1c32',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      ...config.android,
      package: 'com.paulmbugua2.grogonsacco',
      permissions: ['INTERNET', 'POST_NOTIFICATIONS'],
      blockedPermissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.CAMERA',
      ],
      notification: {
        icon: './assets/notification-icon.png',
        color: '#ff5a00',
        defaultChannel: 'default',
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon-foreground.png',
        monochromeImage: './assets/adaptive-icon-monochrome.png',
        backgroundColor: '#0d1c32',
      },
      intentFilters: [
        {
          action: 'VIEW',
          category: ['BROWSABLE', 'DEFAULT'],
          data: [{ scheme: 'grogonsacco' }],
        },
      ],
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.paulmbugua2.grogonsacco',
      infoPlist: {
        ...(config?.ios?.infoPlist ?? {}),
        CFBundleDisplayName: 'Grogon Sacco',
        CFBundleName: 'Grogon Sacco',
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
      ['expo-system-ui', { lightBackgroundColor: '#ffffff', darkBackgroundColor: '#0d1c32' }],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#0d1c32',
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
    ].filter(Boolean),
    extra: {
      ...config.extra,
      EXPO_PUBLIC_APP_ENV: appEnv,
      EXPO_PUBLIC_BACKEND_URL: RESOLVED_BACKEND_URL,
      EXPO_PUBLIC_PROD_BACKEND_URL: BACKENDS.prod,
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
}
