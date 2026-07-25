export type RomChatPremiumTier = 'free' | 'gold' | 'platinum';

export type RomChatPremiumPlan = {
  id: RomChatPremiumTier;
  name: string;
  priceUsd: number;
  billing: 'monthly' | 'one_time';
  perks: string[];
  spotlightMinutes?: number;
  priorityLikes?: number;
};

export type RomChatGift = {
  id: string;
  name: string;
  tokenCost: number;
  redeemableUsd: number;
  animation: string;
};

export type RomChatVibePoll = {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; votes: number }>;
};

export type RomChatPrivacySettings = {
  incognito: boolean;
  screenshotsBlocked: boolean;
  disappearingDefaultSeconds: number | null;
  visibleToLikedOnly: boolean;
};

export type RomChatConversationSignals = {
  readReceipts: boolean;
  typingIndicators: boolean;
  disappearingMessages: boolean;
  antiScamRisk: 'clear' | 'watch' | 'review';
};

export type RomChatFeatureCatalog = {
  premiumPlans: RomChatPremiumPlan[];
  gifts: RomChatGift[];
  boosts: Array<{ id: string; name: string; priceUsd: number; durationMinutes: number; multiplier: number }>;
  addOns: Array<{ id: string; name: string; priceUsd: number; description: string }>;
  privacy: RomChatPrivacySettings;
  conversation: RomChatConversationSignals;
  vibePolls: RomChatVibePoll[];
};

export type RomChatIcebreakerRequest = {
  profileId: string;
  myInterests?: string[];
  tone?: 'warm' | 'playful' | 'direct';
};

export type RomChatBioAssistantRequest = {
  intent: string;
  interests: string[];
  values: string[];
};

export type RomChatTimedMessagePayload = {
  matchId: string;
  text?: string;
  mediaUrl?: string;
  expiresInSeconds: number;
  viewOnce?: boolean;
};
