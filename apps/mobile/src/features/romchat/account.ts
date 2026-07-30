import { apiFetch } from '../../lib/api';

export type RomChatAccount = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  provider: string;
  tokenBalance: number;
};

export type RomChatProfileMedia = {
  id: string;
  mediaType: 'image' | 'video' | 'voice' | 'selfie' | string;
  url: string;
  position: number;
  moderationStatus?: string;
};

export type RomChatMemberProfile = {
  memberId: string;
  displayName: string;
  age: number;
  gender: string;
  city: string;
  intent: string;
  bio: string;
  interests: string[];
  promptAnswers?: Array<{ prompt: string; answer: string }>;
  voiceIntroUrl?: string;
  selfieMediaUrl?: string;
  selfieVerified?: boolean;
  verificationStatus?: string;
  profileStrength: number;
  media: RomChatProfileMedia[];
  imageCount: number;
  videoCount: number;
};

export type RomChatOnboardingState = {
  needsProfile: boolean;
  needsFirstImage: boolean;
  imageCount: number;
  catalogueAccess: number;
};

export type RomChatSessionPayload = {
  token: string;
  user: RomChatAccount;
  profile: RomChatMemberProfile | null;
  onboarding?: RomChatOnboardingState;
};

export const romchatBackendHealth = () =>
  apiFetch<{ ok: boolean; service: string; generatedAt: string }>('/api/romchat/health');

export const romchatAccountApi = {
  requestOtp: (payload: { name: string; email: string; password: string }) =>
    apiFetch<{ email: string; expiresInMinutes: number; message: string }>('/api/romchat/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyOtp: (payload: { email: string; otp: string }) =>
    apiFetch<RomChatSessionPayload>('/api/romchat/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<RomChatSessionPayload>('/api/romchat/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  google: (idToken: string) =>
    apiFetch<RomChatSessionPayload>('/api/romchat/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
  me: (token: string) => apiFetch<Omit<RomChatSessionPayload, 'token'>>('/api/romchat/auth/me', { token }),
  saveProfile: (token: string, payload: { displayName: string; age: number; gender: string; city: string; intent: string; bio: string; interests: string[]; promptAnswers?: Array<{ prompt: string; answer: string }> }) =>
    apiFetch<{ profile: RomChatMemberProfile }>('/api/romchat/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    }),
  uploadMedia: (token: string, payload: { mediaType: 'image' | 'video' | 'voice' | 'selfie'; dataUri: string; contentType: string; fileName?: string }) =>
    apiFetch<{ media: RomChatProfileMedia; profile: RomChatMemberProfile }>('/api/romchat/profile/media', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
  verifySelfie: (token: string, payload: { dataUri: string; contentType: string; fileName?: string }) =>
    apiFetch<{ media: RomChatProfileMedia; profile: RomChatMemberProfile; verification: { status: string; selfieVerified: boolean; verifiedAt: string } }>('/api/romchat/profile/selfie-verification', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
};
