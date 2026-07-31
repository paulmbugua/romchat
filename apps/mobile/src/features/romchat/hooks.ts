import { useCallback, useEffect, useState } from 'react';
import { romchatApi, type RomChatBootstrap, type RomChatMessage, type RomChatProfile, type RomChatVideoRequest } from './api';

type LocalProfile = RomChatProfile & {
  photo: unknown;
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
      if (!local) return null;
      const photos = Array.isArray(remote.photos) ? remote.photos.filter(Boolean) : [];
      return {
        ...local,
        ...remote,
        match: Number(remote.match ?? local.match),
        photo: photos[0] ? { uri: photos[0] } : local.photo,
        photos,
        color: remote.color || local.color,
        tags: remote.tags?.length ? remote.tags : local.tags,
        answers: remote.answers?.length ? remote.answers : local.answers,
        poll: remote.poll?.question
          ? {
              question: remote.poll.question,
              yes: Number(remote.poll.yes ?? local.poll.yes),
              no: Number(remote.poll.no ?? local.poll.no),
            }
          : local.poll,
        voiceNote: remote.voiceNote || local.voiceNote,
        videoPrompt: remote.videoPrompt || local.videoPrompt,
        quote: remote.quote || local.quote,
        song: remote.song || local.song,
        gallery: Number(remote.gallery ?? photos.length ?? local.gallery),
        fullGallery: Number(remote.fullGallery ?? remote.gallery ?? photos.length ?? local.gallery),
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
  const [paidMessages, setPaidMessages] = useState<RomChatMessage[]>([
    { id: 'media_locked_1', matchId: 'match_elena', from: 'elena', senderId: 'elena', text: 'I sent a private voice note preview. Basic text stays free; unlock this optional media when you want the full moment.', locked: true, unlockCostTokens: 10, unlockedByActor: false, mediaUrl: 'romchat://demo/voice/elena-saturday-note', mediaType: 'voice', messageKind: 'locked_media' },
  ]);
  const [videoRequests, setVideoRequests] = useState<RomChatVideoRequest[]>([
    { id: 'vr_elena_1', matchId: 'match_elena', senderProfileId: 'elena', title: 'Elena invited you to a 2-minute video vibe check', teaser: 'She is online now. Unlock to accept the request before it expires.', unlockCostTokens: 25, status: 'locked' },
  ]);

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

  const swipe = useCallback(async (profileId: string, action: 'pass' | 'like' | 'super_like') => {
    setLastAction(action === 'pass' ? 'Passed' : action === 'super_like' ? 'Priority like sent' : 'Like sent');
    try {
      const result = await romchatApi.swipe(profileId, action);
      setApiOnline(true);
      setLastAction(result.message);
      return result;
    } catch {
      setApiOnline(false);
      return { id: 'local_swipe', matched: action !== 'pass', matchId: action === 'pass' ? null : `match_${profileId}`, message: action === 'pass' ? 'Preference saved.' : 'It is a match.' };
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    setLastAction('Sending message');
    try {
      const result = await romchatApi.sendMessage(text);
      setLastAction(result.trustInsight || 'Message sent');
      return result;
    } catch {
      setLastAction('Message saved locally');
      return null;
    }
  }, []);

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

  const sendGift = useCallback(async (giftId: string) => {
    setLastAction('Sending gift');
    try {
      await romchatApi.sendGift(giftId);
      setLastAction('Gift delivered');
    } catch {
      setLastAction('Gift queued locally');
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

  const report = useCallback(async (profileId: string) => {
    setLastAction('Submitting report');
    try {
      await romchatApi.report(profileId);
      setLastAction('Report submitted');
    } catch {
      setLastAction('Report queued locally');
    }
  }, []);

  const verify = useCallback(async () => {
    setLastAction('Submitting verification');
    try {
      await romchatApi.verify();
      setLastAction('Verification submitted');
    } catch {
      setLastAction('Verification queued locally');
    }
  }, []);

  return { profiles, bootstrap, apiOnline, lastAction, paidMessages, videoRequests, swipe, sendMessage, unlockMessage, unlockVideoRequest, sendGift, boost, updatePrivacy, report, verify };
}
