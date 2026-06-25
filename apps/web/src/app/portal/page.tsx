'use client';

import { useEffect, useState } from 'react';
import GrogonSaccoPortal from '../sacco-portal';

export default function Page() {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('grogon-sacco-session');
    if (session) {
      setAllowed(true);
      setReady(true);
      return;
    }
    window.location.replace('/login');
  }, []);

  if (!ready || !allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1c32] px-6 text-white">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="font-mont text-2xl font-black">Opening member portal...</p>
          <p className="mt-2 text-[#d6e3ff]">Checking SACCO access.</p>
        </div>
      </main>
    );
  }

  return <GrogonSaccoPortal />;
}
