'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { getIdToken } from 'firebase/auth';

import { signInGooglePopup } from '@/lib/firebaseAuthWeb';
import { userFacingErrorMessage } from '@/lib/publicError';

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

      const result = await signInGooglePopup();
      const idToken = await getIdToken(result.user, true);
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

      console.info('[romchat-google-web] firebase-login-success', {
        uid: result.user.uid,
        email: result.user.email,
        hasIdToken: Boolean(idToken),
      });

      const response = await fetch(`${backendUrl}/api/romchat/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'RomChat Google login failed.');
      }

      console.info('[romchat-google-web] backend-login-success');

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

      alert(userFacingErrorMessage(error, 'Google sign-in could not be completed. Please try again or use email login.'));
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
