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
  gender?: string;
  verified?: boolean;
  online?: boolean;
  matchId?: string | null;
  lastSeenAt?: string | null;
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
  likes?: { receivedCount: number; sentCount?: number; sentProfileIds?: string[]; topPickProfileIds?: string[] };
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
  swipe: (profileId: string, action: 'pass' | 'like' | 'super_like', token?: string | null, options: { forceMatch?: boolean } = {}) =>
    apiFetch<{ id: string; matched: boolean; matchId: string | null; message: string; limit?: number; remaining?: number; retryAt?: string | null }>('/api/romchat/swipes', {
      method: 'POST',
      token,
      body: JSON.stringify({ profileId, action, forceMatch: Boolean(options.forceMatch) }),
    }),
  sendMessage: (text: string, matchId = 'match_elena', options: { mode?: 'standard' | 'timed' | 'viewOnce'; readReceiptRequested?: boolean } = {}, token?: string | null) =>
    apiFetch<{ message: RomChatMessage; trustInsight: string }>('/api/romchat/messages', {
      method: 'POST',
      token,
      body: JSON.stringify({ matchId, text, viewOnce: options.mode === 'viewOnce', expiresInSeconds: options.mode === 'timed' ? 86400 : null, readReceiptRequested: Boolean(options.readReceiptRequested) }),
    }),
  messages: (matchId: string, token?: string | null) => apiFetch<{ messages: RomChatMessage[]; generatedAt: string }>(`/api/romchat/messages/${encodeURIComponent(matchId)}`, { token }),
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
  createPayment: (payload: { provider: 'mpesa' | 'paystack'; purpose?: 'tokens' | 'subscription'; packageId?: string; planId?: string; phone?: string }) =>
    apiFetch<{ payment: { id: string; provider: string; amountKes: number; tokens: number; checkoutUrl?: string | null; instructions: string; status: string; currency: string } }>('/api/romchat/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
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
