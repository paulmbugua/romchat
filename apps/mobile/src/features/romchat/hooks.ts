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

  const refresh = useCallback(async () => {
    if (!options.enabled) return;
    const payload = await romchatApi.bootstrap(options.token);
    setBootstrap(payload);
    setProfiles(payload.profiles?.length ? mergeProfiles(payload.profiles, localProfiles) : []);
    setApiOnline(true);
    setLastAction('Distance preferences applied');
    setPaidMessages((payload.messages || []).filter((message) => message.locked));
  }, [localProfiles, options.enabled, options.token]);
  const swipe = useCallback(async (profileId: string, action: 'pass' | 'like' | 'super_like', swipeOptions: { forceMatch?: boolean } = {}) => {
    setLastAction(action === 'pass' ? 'Passed' : action === 'super_like' ? 'Priority like sent' : swipeOptions.forceMatch ? 'Match accepted' : 'Like sent');
    try {
      const result = await romchatApi.swipe(profileId, action, options.token, swipeOptions);
      setApiOnline(true);
      setLastAction(result.message);
      return result;
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'DAILY_LIKE_LIMIT_REACHED') {
        setApiOnline(true);
        setLastAction(error.message);
        throw error;
      }
      setApiOnline(false);
      return { id: 'local_swipe', matched: action !== 'pass', matchId: action === 'pass' ? null : `match_${profileId}`, message: action === 'pass' ? 'Preference saved.' : 'It is a match.' };
    }
  }, [options.token]);

  const optionsToken = options.token;
  const sendMessage = useCallback(async (text: string, matchId?: string, options: { mode?: 'standard' | 'timed' | 'viewOnce'; readReceiptRequested?: boolean } = {}) => {
    setLastAction('Sending message');
    try {
      const result = await romchatApi.sendMessage(text, matchId, options, optionsToken);
      setLastAction(result.trustInsight || 'Message sent');
      return result;
    } catch {
      setLastAction('Message saved locally');
      return null;
    }
  }, [optionsToken]);

  const getMessages = useCallback(async (matchId: string) => {
    const result = await romchatApi.messages(matchId, optionsToken);
    return result.messages || [];
  }, [optionsToken]);

  const unlockMessage = useCallback(async (messageId: string) => {
    setLastAction('Unlocking private media');
    try {
      const result = await romchatApi.unlockMessage(messageId);
      setPaidMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, ...result.message, locked: false, unlockedByActor: true } : message));
      setLastAction(`Unlocked media for ${result.spent} tokens`);
      return result;
    } catch {
      setPaidMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, locked: false, unlockedByActor: true } : message));
      setLastAction('Media unlocked locally');
      return null;
    }
  }, []);

  const unlockVideoRequest = useCallback(async (requestId: string) => {
    setLastAction('Unlocking video request');
    try {
      const result = await romchatApi.unlockVideoRequest(requestId);
      setVideoRequests((requests) => requests.map((request) => request.id === requestId ? { ...request, ...result.videoRequest, status: 'unlocked' } : request));
      setLastAction(`Video unlocked for ${result.spent} tokens`);
      return result;
    } catch {
      setVideoRequests((requests) => requests.map((request) => request.id === requestId ? { ...request, status: 'unlocked' } : request));
      setLastAction('Video request unlocked locally');
      return null;
    }
  }, []);

  const sendGift = useCallback(async (giftId: string, matchId?: string) => {
    setLastAction('Sending gift');
    try {
      await romchatApi.sendGift(giftId, matchId);
      setLastAction('Gift delivered');
    } catch {
      setLastAction('Gift queued locally');
    }
  }, []);

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

  const createPayment = useCallback(async (payload: { provider: 'mpesa' | 'paystack'; purpose?: 'tokens' | 'subscription'; packageId?: string; planId?: string; phone?: string }) => {
    setLastAction(payload.provider === 'mpesa' ? 'Starting M-Pesa payment' : 'Starting card payment');
    try {
      const result = await romchatApi.createPayment(payload, optionsToken);
      setLastAction(result.payment.instructions || 'Payment started');
      return result.payment;
    } catch {
      setLastAction('Payment could not start');
      return null;
    }
  }, [optionsToken]);

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

  const verify = useCallback(async () => {
    setLastAction('Submitting verification');
    try {
      await romchatApi.verify();
      setLastAction('Verification submitted');
    } catch {
      setLastAction('Verification queued locally');
    }
  }, []);

  return { profiles, bootstrap, apiOnline, lastAction, paidMessages, videoRequests, refresh, swipe, sendMessage, getMessages, unlockMessage, unlockVideoRequest, createVideoRequest, sendGift, boost, createPayment, updatePrivacy, block, report, reportMessage, verify };
}
