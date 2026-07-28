import 'react-native-gesture-handler';

import Constants from 'expo-constants';
import { registerRootComponent } from 'expo';
import * as SystemUI from 'expo-system-ui';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { colors } from './theme/tokens';

const manifestExtra = (Constants.manifest as { extra?: unknown } | null | undefined)?.extra;
const extra = (Constants.expoConfig?.extra || manifestExtra || {}) as {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
};

GoogleSignin.configure({
  webClientId: extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.ink,
    text: colors.text,
    border: colors.border,
  },
};

function Root() {
  SystemUI.setBackgroundColorAsync(colors.bg).catch(() => undefined);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
            <App />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
