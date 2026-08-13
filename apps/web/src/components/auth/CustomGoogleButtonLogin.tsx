'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase';
import { resolveBackendUrl } from '@/lib/backendUrl';

type Props = {
  className?: string;
  onSuccess?: (session: any) => void;
};

export default function CustomGoogleButtonLogin({
  className,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: 'select_account',
      });

      // 1. Login through Firebase
      const result = await signInWithPopup(firebaseAuth, provider);

      // 2. Obtain Firebase ID token
      const idToken = await result.user.getIdToken();

      console.info('[romchat-google-web] firebase-login-success', {
        uid: result.user.uid,
        email: result.user.email,
        hasIdToken: Boolean(idToken),
      });

      // 3. Exchange Firebase token with RomChat backend
      const backendUrl = resolveBackendUrl(
        process.env.NEXT_PUBLIC_BACKEND_URL
      );

      const response = await fetch(
        `${backendUrl}/api/romchat/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'RomChat Google login failed.'
        );
      }

      console.info('[romchat-google-web] backend-login-success');

      // 4. Save RomChat JWT
      if (data.token) {
        localStorage.setItem('romchat-web-token', data.token);
        localStorage.setItem('romchat:auth:token', data.token);
      }

      onSuccess?.(data);

      window.location.reload();
    } catch (error: any) {
      console.error('[romchat-google-web] login-failure', error);

      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }

      alert(
        error?.message ||
        'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={
        className ??
        `inline-flex w-full items-center justify-center gap-3
         rounded-xl border border-gray-200 bg-white px-4 py-2.5
         text-sm font-semibold text-gray-900 shadow-sm
         transition hover:bg-gray-50
         disabled:cursor-not-allowed disabled:opacity-60`
      }
    >
      <FcGoogle className="h-5 w-5" />

      {loading ? 'Connecting to Google…' : 'Continue with Google'}
    </button>
  );
}