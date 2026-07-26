import { apiFetch } from '../../lib/api';

export type RomChatProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  match: number;
  intent: string;
  prompt: string;
  voiceNote?: string;
  videoPrompt?: string;
  quote?: string;
  song?: string;
  gallery?: number;
  tags?: string[];
  answers?: string[];
  poll?: { id?: string; question: string; yes?: number; no?: number };
  color?: string;
  verified?: boolean;
  online?: boolean;
};

export type RomChatMessage = {
  id: string;
  matchId: string;
  from?: string;
  senderId?: string;
  text: string;
  createdAt?: string;
  readAt?: string | null;
  risk?: string;
};

export type RomChatBootstrap = {
  profiles: RomChatProfile[];
  messages: RomChatMessage[];
  wallet?: { balance: number; currency: string };
  privacy?: {
    incognito: boolean;
    screenshotsBlocked: boolean;
    visibleToLikedOnly: boolean;
    disappearingDefaultSeconds: number;
  };
  premium?: { activeTier: string; plans: Array<{ id: string; name: string; priceUsd: number; perks: string[] }> };
  me?: { profileStrength?: number; safetyScore?: number };
};

export const romchatApi = {
  bootstrap: () => apiFetch<RomChatBootstrap>('/api/romchat/bootstrap'),
  discovery: (verifiedOnly = true) => apiFetch<{ profiles: RomChatProfile[] }>(`/api/romchat/discovery?verifiedOnly=${verifiedOnly ? 'true' : 'false'}`),
  swipe: (profileId: string, action: 'pass' | 'like' | 'super_like') =>
    apiFetch<{ id: string; matched: boolean; matchId: string | null; message: string }>('/api/romchat/swipes', {
      method: 'POST',
      body: JSON.stringify({ profileId, action }),
    }),
  sendMessage: (text: string, matchId = 'match_elena') =>
    apiFetch<{ message: RomChatMessage; trustInsight: string }>('/api/romchat/messages', {
      method: 'POST',
      body: JSON.stringify({ matchId, text }),
    }),
  sendGift: (giftId: string, matchId = 'match_elena') =>
    apiFetch('/api/romchat/gifts', {
      method: 'POST',
      body: JSON.stringify({ giftId, matchId }),
    }),
  boost: () =>
    apiFetch('/api/romchat/boosts', {
      method: 'POST',
      body: JSON.stringify({ boostId: 'local_peak_30', profileId: 'me' }),
    }),
  updatePrivacy: (payload: { incognito: boolean; screenshotsBlocked: boolean; visibleToLikedOnly: boolean }) =>
    apiFetch('/api/romchat/privacy', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  report: (profileId: string, type = 'Safety report') =>
    apiFetch('/api/romchat/reports', {
      method: 'POST',
      body: JSON.stringify({ profileId, type, severity: 'medium' }),
    }),
  verify: () =>
    apiFetch('/api/romchat/verification', {
      method: 'POST',
      body: JSON.stringify({ memberId: 'me', name: 'RomChat member' }),
    }),
};
