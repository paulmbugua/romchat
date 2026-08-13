'use client';

import { firebaseAuth } from '@/lib/firebase';

export const ensureBrowserPersistence = async () => {
  if (typeof window === 'undefined') return;

  try {
    const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
    await setPersistence(firebaseAuth, browserLocalPersistence);
  } catch (error) {
    console.warn('[romchat-google-web] persistence-failed', error);
  }
};

export const buildGoogleProviderSelectAccount = async () => {
  const { GoogleAuthProvider } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

export const signInGooglePopup = async () => {
  await ensureBrowserPersistence();

  const { signInWithPopup } = await import('firebase/auth');
  const provider = await buildGoogleProviderSelectAccount();
  return signInWithPopup(firebaseAuth, provider);
};
