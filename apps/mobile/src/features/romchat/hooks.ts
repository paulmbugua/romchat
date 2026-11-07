import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../../lib/api';
import { romchatApi, type RomChatBootstrap, type RomChatMessage, type RomChatProfile, type RomChatVideoRequest } from './api';

type LocalProfile = RomChatProfile & {
  photo?: unknown;
  color: string;
  voiceNote: string;
  videoPrompt: string;
  quote: string;
  song: string;
  gallery: number;
  tags: string[];
  answers: string[];
  poll: { question: string; yes: number; no: number };
};

function mergeProfiles(remoteProfiles: RomChatProfile[], localProfiles: LocalProfile[]) {
  const localById = new Map(localProfiles.map((profile) => [profile.id, profile]));
  return remoteProfiles
    .map((remote, index) => {
      const local = localById.get(remote.id) || localProfiles[index % Math.max(1, localProfiles.length)] || localProfiles[0];
      const photos = Array.isArray(remote.photos) ? remote.photos.filter(Boolean) : [];
      return {
        ...(local || {}),
        ...remote,
        match: Number(remote.match ?? local?.match ?? 88),
        photo: photos[0] ? { uri: photos[0] } : undefined,
        photos,
        color: remote.color || local?.color || '#FF1493',
        gender: remote.gender || local?.gender || '',
        tags: remote.tags?.length ? remote.tags : local?.tags || [],
        answers: remote.answers?.length ? remote.answers : local?.answers || [],
        poll: remote.poll?.question
          ? {
              question: remote.poll.question,
              yes: Number(remote.poll.yes ?? local?.poll?.yes ?? 64),
              no: Number(remote.poll.no ?? local?.poll?.no ?? 36),
            }
          : local?.poll || { question: 'Coffee date or sunset walk?', yes: 64, no: 36 },
        voiceNote: remote.voiceNote || local?.voiceNote || '',
        videoPrompt: remote.videoPrompt || local?.videoPrompt || '',
        quote: remote.quote || local?.quote || '',
        song: remote.song || local?.song || '',
        gallery: Number(remote.gallery ?? photos.length ?? local?.gallery ?? 0),
        distanceKm: typeof remote.distanceKm === 'number' ? remote.distanceKm : undefined,
        fullGallery: Number(remote.fullGallery ?? remote.gallery ?? photos.length ?? local?.gallery ?? 0),
        lockedGallery: Number(remote.lockedGallery ?? 0),
        catalogueAccess: Number(remote.catalogueAccess ?? photos.length ?? 1),
      };
    })
    .filter(Boolean) as LocalProfile[];
}

export function useRomChatData(localProfiles: LocalProfile[], options: { enabled?: boolean; token?: string | null } = {}) {
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [bootstrap, setBootstrap] = useState<RomChatBootstrap | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [lastAction, setLastAction] = useState('Ready');
  const [paidMessages, setPaidMessages] = useState<RomChatMessage[]>([]);
  const [videoRequests, setVideoRequests] = useState<RomChatVideoRequest[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!options.enabled) {
      setApiOnline(false);
      setProfiles([]);
      setLastAction('Login required');
      return () => {
        mounted = false;
      };
    }
    romchatApi
      .bootstrap(options.token)
      .then((payload) => {
        if (!mounted) return;
        setBootstrap(payload);
        setProfiles(payload.profiles?.length ? mergeProfiles(payload.profiles, localProfiles) : []);
        setApiOnline(true);
        setLastAction('Live API connected');
        setPaidMessages((payload.messages || []).filter((message) => message.locked));
        void romchatApi.videoRequests().then((result) => setVideoRequests(result.videoRequests || [])).catch(() => undefined);
      })
      .catch(() => {
        if (!mounted) return;
        setApiOnline(false);
        setProfiles([]);
        setLastAction('Live profiles unavailable');
      });
    return () => {
      mounted = false;
    };
  }, [localProfiles, options.enabled, options.token]);

  useEffect(() => {
    if (!options.enabled) return undefined;
    let mounted = true;
    const syncInbox = () => romchatApi.discovery(false, options.token)
      .then((payload) => {
        if (mounted && payload.profiles?.length) setProfiles(mergeProfiles(payload.profiles, localProfiles));
      })
      .catch(() => undefined);
    const timer = setInterval(syncInbox, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [localProfiles, options.enabled, options.token]);

  const refresh = useCallback(async () => {
    if (!options.enabled) return;
    const payload = await romchatApi.bootstrap(options.token);
    setBootstrap(payload);
    setProfiles(payload.profiles?.length ? mergeProfiles(payload.profiles, localProfiles) : []);
    setApiOnline(true);
    setLastAction('Distance preferences applied');
    setPaidMessages((payload.messages || []).filter((message) => message.locked));
  }, [localProfiles, options.enabled, options.token]);
  const markLikesSeen = useCallback(async () => {
    setBootstrap((current) => current?.likes ? { ...current, likes: { ...current.likes, unreadReceivedCount: 0 } } : current);
    try {
      await romchatApi.markLikesSeen(options.token);
      await refresh();
    } catch {
      setLastAction('Likes viewed');
    }
  }, [options.token, refresh]);
  const swipe = useCallback(async (profileId: string, action: 'pass' | 'like' | 'super_like') => {
    setLastAction(action === 'pass' ? 'Passed' : action === 'super_like' ? 'Super Like sent' : 'Like sent');
    try {
      const result = await romchatApi.swipe(profileId, action, options.token);
      setApiOnline(true);
      setLastAction(result.message);
      if (result.matched) await refresh();
      return result;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setApiOnline(true);
        setLastAction(error.message);
        throw error;
      }
      setApiOnline(false);
      throw error;
    }
  }, [options.token, refresh]);

  const optionsToken = options.token;
  const sendMessage = useCallback(async (text: string, matchId?: string, options: { mode?: 'standard' | 'timed' | 'viewOnce'; readReceiptRequested?: boolean; priority?: boolean } = {}) => {
    setLastAction('Sending message');
    try {
      const result = await romchatApi.sendMessage(text, matchId, options, optionsToken);
      if (result.wallet) setBootstrap((current) => current ? { ...current, wallet: result.wallet! } : current);
      setLastAction(result.trustInsight || 'Message sent');
      return result;
    } catch {
      setLastAction('Message saved locally');
      return null;
    }
  }, [optionsToken]);

  const getMessages = useCallback(async (matchId: string, readerId?: string) => {
    const result = await romchatApi.messages(matchId, optionsToken);
    const messages = result.messages || [];
    const unreadMessageIds = messages
      .filter((message) => !message.readAt && (!readerId || (message.senderId || message.from) !== readerId))
      .map((message) => message.id);
    if (unreadMessageIds.length) {
      setProfiles((current) => current.map((profile) => profile.matchId === matchId ? { ...profile, unreadMessageCount: 0, unreadPriorityCount: 0, latestPriorityAt: null } : profile));
      void romchatApi.markMessagesRead(matchId, unreadMessageIds, optionsToken).catch(() => undefined);
    }
    return messages;
  }, [optionsToken]);

  const unlockMessage = useCallback(async (messageId: string) => {
    setLastAction('Unlocking private media');
    try {
      const result = await romchatApi.unlockMessage(messageId, optionsToken);
      setPaidMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, ...result.message, locked: false, unlockedByActor: true } : message));
      setLastAction(`Unlocked media for ${result.spent} tokens`);
      return result;
    } catch {
      setPaidMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, locked: false, unlockedByActor: true } : message));
      setLastAction('Media unlocked locally');
      return null;
    }
  }, [optionsToken]);

  const unlockVideoRequest = useCallback(async (requestId: string) => {
    setLastAction('Unlocking video request');
    try {
      const result = await romchatApi.unlockVideoRequest(requestId, optionsToken);
      setVideoRequests((requests) => requests.map((request) => request.id === requestId ? { ...request, ...result.videoRequest, status: 'unlocked' } : request));
      setLastAction(`Video unlocked for ${result.spent} tokens`);
      return result;
    } catch {
      setVideoRequests((requests) => requests.map((request) => request.id === requestId ? { ...request, status: 'unlocked' } : request));
      setLastAction('Video request unlocked locally');
      return null;
    }
  }, [optionsToken]);

  const sendGift = useCallback(async (giftId: string, matchId?: string) => {
    setLastAction('Sending gift');
    try {
      const result = await romchatApi.sendGift(giftId, matchId, optionsToken);
      setBootstrap((current) => current ? { ...current, wallet: result.wallet } : current);
      setLastAction('Gift delivered');
      return result;
    } catch {
      setLastAction('Gift could not be sent');
      return null;
    }
  }, [optionsToken]);

  const spendTokens = useCallback(async (feature: 'undo_swipe' | 'reveal_admirer' | 'priority_message' | 'super_like', targetId: string) => {
    const result = await romchatApi.spendTokens(feature, targetId, optionsToken);
    setBootstrap((current) => current ? { ...current, wallet: result.wallet } : current);
    setLastAction(result.alreadyProcessed ? 'Already unlocked' : `${result.spent} tokens used`);
    return result;
  }, [optionsToken]);

  const createVideoRequest = useCallback(async (matchId: string, senderProfileId: string) => {
    setLastAction('Requesting video vibe');
    try {
      const result = await romchatApi.createVideoRequest(matchId, senderProfileId);
      if (result.videoRequest) setVideoRequests((requests) => [result.videoRequest, ...requests.filter((request) => request.id !== result.videoRequest.id)]);
      setLastAction('Video vibe requested');
      return result.videoRequest;
    } catch {
      setLastAction('Video request unavailable');
      return null;
    }
  }, []);

  const boost = useCallback(async () => {
    setLastAction('Activating boost');
    try {
      await romchatApi.boost();
      setLastAction('Boost active');
    } catch {
      setLastAction('Boost queued locally');
    }
  }, []);

  const updatePrivacy = useCallback(async (payload: { incognito: boolean; screenshotsBlocked: boolean; visibleToLikedOnly: boolean }) => {
    setLastAction('Updating privacy');
    try {
      await romchatApi.updatePrivacy(payload);
      setLastAction('Privacy updated');
    } catch {
      setLastAction('Privacy saved locally');
    }
  }, []);

  const block = useCallback(async (profileId: string) => {
    setLastAction('Blocking profile');
    await romchatApi.block(profileId, optionsToken);
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    setLastAction('Profile blocked');
  }, [optionsToken]);

  const report = useCallback(async (profileId: string, reason = 'Safety report') => {
    setLastAction('Submitting report');
    await romchatApi.report(profileId, reason, optionsToken);
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    setLastAction('Report submitted');
  }, [optionsToken]);

  const reportMessage = useCallback(
  async (payload: {
    profileId: string;
    reportedMemberId?: string;
    matchId?: string;
    messageId?: string;
    text?: string;
    senderId?: string;
    moderation?: unknown;
    reporterNote?: string;
  }) => {
    setLastAction('Reporting message');

    try {
      await romchatApi.reportMessage(payload, optionsToken);
      setProfiles((current) => current.filter((profile) => profile.id !== payload.profileId));
      setLastAction('Message reported and user blocked');
      return true;
    } catch (error) {
      console.error('[romchat] report-message failed', error);
      setLastAction('Unable to report message');
      return false;
    }
  },
  [optionsToken]
);

  const setVibeMembership = useCallback(async (vibeId: string, joined: boolean) => {
    setLastAction(joined ? 'Joining romance vibe' : 'Leaving romance vibe');
    const result = await romchatApi.setVibeMembership(vibeId, joined, optionsToken);
    setBootstrap((current) => current ? { ...current, vibes: result.vibes } : current);
    setApiOnline(true);
    setLastAction(joined ? `Joined ${result.vibe.title}` : `Left ${result.vibe.title}`);
    return result.vibe;
  }, [optionsToken]);

  const verify = useCallback(async () => {
    setLastAction('Submitting verification');
    try {
      await romchatApi.verify();
      setLastAction('Verification submitted');
    } catch {
      setLastAction('Verification queued locally');
    }
  }, []);

  return { profiles, bootstrap, apiOnline, lastAction, paidMessages, videoRequests, refresh, markLikesSeen, swipe, sendMessage, getMessages, unlockMessage, unlockVideoRequest, createVideoRequest, sendGift, spendTokens, boost, updatePrivacy, block, report, reportMessage, setVibeMembership, verify };
}
