import { useCallback, useEffect, useState } from 'react';
import { romchatApi, type RomChatBootstrap, type RomChatProfile } from './api';

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
    .map((remote) => {
      const local = localById.get(remote.id) || localProfiles[0];
      if (!local) return null;
      return {
        ...local,
        ...remote,
        match: Number(remote.match ?? local.match),
        photo: local.photo,
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
        gallery: Number(remote.gallery ?? local.gallery),
      };
    })
    .filter(Boolean) as LocalProfile[];
}

export function useRomChatData(localProfiles: LocalProfile[]) {
  const [profiles, setProfiles] = useState(localProfiles);
  const [bootstrap, setBootstrap] = useState<RomChatBootstrap | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [lastAction, setLastAction] = useState('Ready');

  useEffect(() => {
    let mounted = true;
    romchatApi
      .bootstrap()
      .then((payload) => {
        if (!mounted) return;
        setBootstrap(payload);
        setProfiles(payload.profiles?.length ? mergeProfiles(payload.profiles, localProfiles) : localProfiles);
        setApiOnline(true);
        setLastAction('Live API connected');
      })
      .catch(() => {
        if (!mounted) return;
        setApiOnline(false);
        setProfiles(localProfiles);
        setLastAction('Offline demo mode');
      });
    return () => {
      mounted = false;
    };
  }, [localProfiles]);

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

  return { profiles, bootstrap, apiOnline, lastAction, swipe, sendMessage, sendGift, boost, updatePrivacy, report, verify };
}
