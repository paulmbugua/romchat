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
  fullGallery?: number;
  lockedGallery?: number;
  catalogueAccess?: number;
  photos?: string[];
  tags?: string[];
  answers?: string[];
  poll?: { id?: string; question: string; yes?: number; no?: number };
  color?: string;
  verified?: boolean;
  online?: boolean;
  distanceKm?: number;
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
  locked?: boolean;
  unlockCostTokens?: number;
  unlockedByActor?: boolean;
  messageKind?: string;
  mediaUrl?: string | null;
  mediaType?: 'voice' | 'photo' | 'video' | string | null;
};

export type RomChatVideoRequest = {
  id: string;
  matchId: string;
  senderProfileId: string;
  title: string;
  teaser: string;
  unlockCostTokens: number;
  status: 'locked' | 'unlocked' | string;
  unlockedAt?: string | null;
  createdAt?: string;
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
  bootstrap: (token?: string | null) => apiFetch<RomChatBootstrap>('/api/romchat/bootstrap', { token }),
  discovery: (verifiedOnly = true, token?: string | null) => apiFetch<{ profiles: RomChatProfile[] }>(`/api/romchat/discovery?verifiedOnly=${verifiedOnly ? 'true' : 'false'}`, { token }),
  swipe: (profileId: string, action: 'pass' | 'like' | 'super_like') =>
    apiFetch<{ id: string; matched: boolean; matchId: string | null; message: string }>('/api/romchat/swipes', {
      method: 'POST',
      body: JSON.stringify({ profileId, action }),
    }),
  sendMessage: (text: string, matchId = 'match_elena', options: { mode?: 'standard' | 'timed' | 'viewOnce'; readReceiptRequested?: boolean } = {}) =>
    apiFetch<{ message: RomChatMessage; trustInsight: string }>('/api/romchat/messages', {
      method: 'POST',
      body: JSON.stringify({ matchId, text, viewOnce: options.mode === 'viewOnce', expiresInSeconds: options.mode === 'timed' ? 86400 : null, readReceiptRequested: Boolean(options.readReceiptRequested) }),
    }),
  videoRequests: (matchId = 'match_elena') => apiFetch<{ videoRequests: RomChatVideoRequest[] }>(`/api/romchat/video-requests?matchId=${matchId}`),
  createVideoRequest: (matchId: string, senderProfileId: string) =>
    apiFetch<{ videoRequest: RomChatVideoRequest }>('/api/romchat/video-requests', {
      method: 'POST',
      body: JSON.stringify({ matchId, senderProfileId }),
    }),
  unlockMessage: (messageId: string) =>
    apiFetch<{ message: RomChatMessage; spent: number; wallet: { balance: number; currency: string } }>(`/api/romchat/messages/${messageId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  unlockVideoRequest: (requestId: string) =>
    apiFetch<{ videoRequest: RomChatVideoRequest; spent: number; wallet: { balance: number; currency: string } }>(`/api/romchat/video-requests/${requestId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  revenue: () => apiFetch<{ revenue: Record<string, { costTokens: number; title: string; description: string }> }>('/api/romchat/revenue'),
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
