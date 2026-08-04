import {
  activateBoost,
  addOns,
  boosts,
  createReport,
  createSwipe,
  createVerification,
  createVideoRequest as createVideoVibeRequest,
  getBootstrap,
  getMessages,
  getProfiles,
  getPrivacy,
  getRevenueCatalog,
  getVideoRequests,
  getWallet,
  gifts,
  premiumPlans,
  tokenPackages,
  sendGift,
  sendMessage,
  unlockPaidMessage,
  unlockVideoRequest,
  topUpWallet,
  updatePrivacy,
} from '../services/romchatRepository.js';
import { moderateMediaAsset, moderateTextPayload } from '../services/romchatModerationService.js';
import { getAuthState, loginWithGoogleToken, loginWithPassword, requestPasswordReset, requestSignupOtp, requireRomchatAccount, resetPasswordWithCode, setMainProfilePhoto, uploadMemberMedia, upsertMemberProfile, verifyMemberSelfie, verifySignupOtp } from '../services/romchatAccountService.js';

function sendError(res, error) {
  console.error('[romchat-api] request:error', {
    status: error.status || 500,
    message: error.message || 'RomChat request failed.',
    code: error.code || null,
  });
  res.status(error.status || 500).json({ message: error.message || 'RomChat request failed.' });
}

export function createRomchatController(io) {
  async function authStateFor(req) {
    try {
      return await getAuthState(req);
    } catch {
      return null;
    }
  }

  return {
    async health(_req, res) {
      res.json({ ok: true, service: 'romchat', generatedAt: new Date().toISOString() });
    },
    async authRequestOtp(req, res) {
      try {
        res.status(202).json(await requestSignupOtp(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async authVerifyOtp(req, res) {
      try {
        res.status(201).json(await verifySignupOtp(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async authLogin(req, res) {
      try {
        res.json(await loginWithPassword(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async authForgotPassword(req, res) {
      try {
        res.status(202).json(await requestPasswordReset(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async authResetPassword(req, res) {
      try {
        res.json(await resetPasswordWithCode(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async authGoogle(req, res) {
      const requestId = `rcg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const tokenLength = String(req.body?.idToken || req.body?.token || '').length;
      console.info('[romchat-google] auth:start', { requestId, tokenLength, userAgent: req.get('user-agent') || null });
      try {
        const session = await loginWithGoogleToken(req.body || {}, { requestId });
        console.info('[romchat-google] auth:success', { requestId, userId: session.user?.id, email: session.user?.email });
        res.json(session);
      } catch (error) {
        console.error('[romchat-google] auth:failed', { requestId, status: error.status || 500, message: error.message, code: error.code || null });
        sendError(res, error);
      }
    },
    async authMe(req, res) {
      try {
        res.json(await getAuthState(req));
      } catch (error) {
        sendError(res, error);
      }
    },
    async saveProfile(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.json({ profile: await upsertMemberProfile(user.id, req.body || {}) });
      } catch (error) {
        sendError(res, error);
      }
    },
    async uploadProfileMedia(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.status(201).json(await uploadMemberMedia(user.id, req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async verifySelfie(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.status(201).json(await verifyMemberSelfie(user.id, req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async setMainProfilePhoto(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.json(await setMainProfilePhoto(user.id, req.params.mediaId));
      } catch (error) {
        sendError(res, error);
      }
    },
    async bootstrap(req, res) {
      const state = await authStateFor(req);
      res.json(await getBootstrap({ catalogueAccess: state?.onboarding?.catalogueAccess || 1, viewerId: state?.user?.id || null }));
    },
    async discovery(req, res) {
      const verifiedOnly = String(req.query.verifiedOnly ?? 'true') !== 'false';
      const state = await authStateFor(req);
      const catalogueAccess = state?.onboarding?.catalogueAccess || 1;
      res.json({ profiles: await getProfiles({ verifiedOnly, catalogueAccess, viewerId: state?.user?.id || null }), catalogueAccess, generatedAt: new Date().toISOString() });
    },
    async swipe(req, res) {
      try {
        const result = await createSwipe(req.body || {});
        io?.emit('romchat:swipe', { ...req.body, ...result, createdAt: new Date().toISOString() });
        res.status(201).json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async messages(req, res) {
      res.json({ messages: await getMessages(req.params.matchId), generatedAt: new Date().toISOString() });
    },
    async sendMessage(req, res) {
      try {
        const moderation = moderateTextPayload(req.body?.text || '');
        const mediaModeration = req.body?.mediaUrl ? moderateMediaAsset(req.body || {}) : null;
        const riskOverride = moderation.status === 'review' || mediaModeration?.status === 'pending_provider_review' ? 'review' : null;
        const message = await sendMessage({ ...(req.body || {}), priority: riskOverride ? false : Boolean(req.body?.priority), riskOverride });
        io?.to(message.matchId).emit('romchat:message', message);
        res.status(201).json({ message, moderation, mediaModeration, trustInsight: riskOverride || message.risk === 'review' ? 'Message queued for trust review.' : 'Message delivered.' });
      } catch (error) {
        sendError(res, error);
      }
    },
    async disappearingMessage(req, res) {
      try {
        const moderation = moderateTextPayload(req.body?.text || '');
        const mediaModeration = req.body?.mediaUrl ? moderateMediaAsset(req.body || {}) : null;
        const riskOverride = moderation.status === 'review' || mediaModeration?.status === 'pending_provider_review' ? 'review' : null;
        const message = await sendMessage({ ...(req.body || {}), expiresInSeconds: req.body?.expiresInSeconds || 86400, viewOnce: Boolean(req.body?.viewOnce), priority: riskOverride ? false : Boolean(req.body?.priority), riskOverride });
        io?.to(message.matchId).emit('romchat:message', message);
        res.status(201).json({ message, moderation, mediaModeration });
      } catch (error) {
        sendError(res, error);
      }
    },
    async typing(req, res) {
      const event = { matchId: req.body?.matchId || 'match_elena', userId: req.body?.userId || 'me', typing: req.body?.typing !== false, at: new Date().toISOString() };
      io?.to(event.matchId).emit('romchat:typing', event);
      res.status(202).json(event);
    },
    async readReceipts(req, res) {
      const receipt = { matchId: req.body?.matchId || 'match_elena', messageIds: Array.isArray(req.body?.messageIds) ? req.body.messageIds : [], readAt: new Date().toISOString() };
      io?.to(receipt.matchId).emit('romchat:read', receipt);
      res.json(receipt);
    },
    async privacy(req, res) {
      res.json({ privacy: await getPrivacy() });
    },
    async updatePrivacy(req, res) {
      const privacy = await updatePrivacy(req.body || {});
      io?.emit('romchat:privacy', privacy);
      res.json({ privacy });
    },
    async report(req, res) {
      const report = await createReport(req.body || {});
      io?.emit('romchat:report', report);
      res.status(201).json({ report, message: 'Report received by RomChat safety.' });
    },
    async verification(req, res) {
      const request = await createVerification(req.body || {});
      res.status(201).json({ request, message: 'Verification submitted for review.' });
    },
    async features(_req, res) {
      res.json({ premiumPlans, tokenPackages, gifts, boosts, addOns, revenue: await getRevenueCatalog(), privacy: await getPrivacy(), conversation: { readReceipts: true, typingIndicators: true, disappearingMessages: true, lockedMedia: true, paidVideoRequests: true } });
    },
    async revenue(_req, res) {
      res.json({ revenue: await getRevenueCatalog() });
    },
    async moderateText(req, res) {
      res.json({ moderation: moderateTextPayload(req.body?.text || '') });
    },
    async moderateMedia(req, res) {
      res.json({ moderation: moderateMediaAsset(req.body || {}) });
    },
    async videoRequests(req, res) {
      res.json({ videoRequests: await getVideoRequests(req.query.matchId || 'match_elena') });
    },
    async createVideoRequest(req, res) {
      try {
        const videoRequest = await createVideoVibeRequest(req.body || {});
        io?.to(videoRequest?.matchId).emit('romchat:video-request', videoRequest);
        res.status(201).json({ videoRequest });
      } catch (error) {
        sendError(res, error);
      }
    },
    async unlockMessage(req, res) {
      try {
        const result = await unlockPaidMessage(req.params.messageId);
        io?.to(result.message.matchId).emit('romchat:unlock', { targetType: 'message', targetId: req.params.messageId });
        res.status(201).json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async unlockVideo(req, res) {
      try {
        const result = await unlockVideoRequest(req.params.requestId);
        io?.to(result.videoRequest.matchId).emit('romchat:unlock', { targetType: 'video_request', targetId: req.params.requestId });
        res.status(201).json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async premium(_req, res) {
      res.json({ plans: premiumPlans, addOns, activeTier: 'gold' });
    },
    async subscribe(req, res) {
      const plan = premiumPlans.find((item) => item.id === req.body?.planId);
      if (!plan || plan.id === 'free') return res.status(400).json({ message: 'A paid planId is required.' });
      res.status(201).json({ subscription: { id: `sub_${Date.now()}`, planId: plan.id, status: 'active', startedAt: new Date().toISOString() }, plan });
    },
    async boost(req, res) {
      const result = await activateBoost(req.body || {});
      io?.emit('romchat:boost', result.boost);
      res.status(201).json(result);
    },
    async gift(req, res) {
      try {
        const result = await sendGift(req.body || {});
        io?.to(result.gift.matchId).emit('romchat:gift', result.gift);
        res.status(201).json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async wallet(_req, res) {
      res.json(await getWallet());
    },
    async topUp(req, res) {
      try {
        res.status(201).json(await topUpWallet(req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async icebreakers(req, res) {
      const profiles = await getProfiles({ verifiedOnly: false });
      const profile = profiles.find((item) => item.id === req.body?.profileId) || profiles[0];
      const anchor = profile?.tags?.[0] || 'your profile';
      res.json({ openers: [`I noticed ${anchor}. What made it stick for you?`, `Your ${profile?.intent || 'dating'} energy feels rare. What pace feels good?`, `Quick vibe check: defend your poll answer in one sentence.`] });
    },
    async bio(req, res) {
      const interestText = (req.body?.interests || []).slice(0, 3).join(', ') || 'good conversation';
      const valueText = (req.body?.values || []).slice(0, 2).join(' and ') || 'kindness and consistency';
      res.json({ bios: [`Looking for ${req.body?.intent || 'intentional connection'}. I light up around ${interestText}, and care about ${valueText}.`, `Dating with intention and humor. Best with someone who values ${valueText}.`] });
    },
    async votePoll(req, res) {
      res.status(201).json({ pollId: req.params.pollId, optionId: req.body?.optionId, message: 'Vote saved.' });
    },
  };
}
