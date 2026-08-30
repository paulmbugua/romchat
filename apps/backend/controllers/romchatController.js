import {
  activateBoost,
  addOns,
  boosts,
  blockProfile,
  createReport,
  createSwipe,
  createVerification,
  createVideoRequest as createVideoVibeRequest,
  getBootstrap,
  getMessages,
  getProfiles,
  getPrivacy,
  getRevenueCatalog,
  getRomanceVibes,
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
  createPaymentIntent,
  createModerationAppeal,
  listModerationCases,
  reinstateModeratedMember,
  resolveModerationCase,
  setRomanceVibeMembership,
  updatePrivacy,
} from '../services/romchatRepository.js';
import { moderateMediaAsset, moderateTextPayload } from '../services/romchatModerationService.js';
import pool, { queryWithRetry } from '../config/db.js';
import { getAuthState, getMemberMediaContent, loginWithGoogleToken, loginWithPassword, requestPasswordReset, requestSignupOtp, requireRomchatAccount, resetPasswordWithCode, setMainProfilePhoto, deleteMemberMedia, uploadMemberMedia, upsertMemberProfile, verifyMemberSelfie, verifySignupOtp } from '../services/romchatAccountService.js';
import { publicErrorMessage } from '../utils/publicError.js';

function sendError(res, error) {
  const status = error.status || 500;
  console.error('[romchat-api] request:error', {
    status,
    message: error.message || 'RomChat request failed.',
    code: error.code || null,
  });
  res.status(status).json({ message: publicErrorMessage(error, status), code: error.code || null, limit: error.limit || null, remaining: error.remaining ?? null, retryAt: error.retryAt || null });
}

export function createRomchatController(io) {
  async function purgeRomchatAccount(memberId, email) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const matchSubquery = 'SELECT id FROM romchat_matches WHERE actor_id = $1 OR profile_id = $1';
      const deletions = [
        ['DELETE FROM romchat_messages WHERE sender_id = $1 OR match_id IN (' + matchSubquery + ')', [memberId]],
        ['DELETE FROM romchat_notifications WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_token_unlocks WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_payment_intents WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_wallet_ledger WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_subscriptions WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_boosts WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_gifts WHERE sender_id = $1 OR match_id IN (' + matchSubquery + ')', [memberId]],
        ['DELETE FROM romchat_reports WHERE reporter_id = $1 OR profile_id = $1', [memberId]],
        ['DELETE FROM romchat_verification_requests WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_video_requests WHERE sender_profile_id = $1 OR match_id IN (' + matchSubquery + ')', [memberId]],
        ['DELETE FROM romchat_privacy_settings WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_vibe_memberships WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_swipes WHERE actor_id = $1 OR profile_id = $1', [memberId]],
        ['DELETE FROM romchat_matches WHERE actor_id = $1 OR profile_id = $1', [memberId]],
        ['DELETE FROM romchat_profile_media WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_member_profiles WHERE member_id = $1', [memberId]],
        ['DELETE FROM romchat_profiles WHERE id = $1', [memberId]],
        ['DELETE FROM romchat_email_otps WHERE email = $1', [email]],
        ['DELETE FROM romchat_password_resets WHERE email = $1', [email]],
        ['DELETE FROM romchat_accounts WHERE id = $1 OR email = $2', [memberId, email]],
      ];

      for (const [sql, params] of deletions) {
        await client.query(sql, params);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

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
    async deleteAccount(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        const email = String(user.email || '').trim();
        console.info('[romchat-account] delete:start', { memberId: user.id, email: email ? email.replace(/(.{2}).+(@.+)/, '$1***$2') : null });
        await purgeRomchatAccount(user.id, email);
        res.json({ message: 'RomChat account deleted successfully.' });
      } catch (error) {
        sendError(res, error);
      }
    },
    async requestAccountDeletion(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        const email = String(user.email || '').trim();
        const reason = String(req.body?.reason || '').trim();
        const requestId = 'del_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        console.info('[romchat-account] deletion-request:start', { memberId: user.id, email: email ? email.replace(/(.{2}).+(@.+)/, '$1***$2') : null, requestId });
        const metadata = { source: 'web-profile', userAgent: req.get('user-agent') || null, ip: req.ip || null };
        const result = await queryWithRetry(
          `INSERT INTO romchat_data_deletion_requests (id, member_id, email, reason, status, metadata)
           VALUES ($1, $2, $3, $4, 'queued', $5::jsonb)
           RETURNING id, status, requested_at AS "requestedAt"`,
          [requestId, user.id, email, reason, JSON.stringify(metadata)]
        );
        res.status(201).json({ message: 'Your deletion request has been queued.', request: result.rows[0] });
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
        console.info('[romchat-media] upload:start', { memberId: user.id, mediaType: req.body?.mediaType || 'image', replaceMediaId: req.body?.replaceMediaId || null });
        const result = await uploadMemberMedia(user.id, req.body || {});
        console.info('[romchat-media] upload:success', { memberId: user.id, mediaId: result.media?.id || null, replaced: Boolean(result.replaced) });
        res.status(201).json(result);
      } catch (error) {
        console.error('[romchat-media] upload:failed', { code: error.code || null, message: error.message || String(error) });
        sendError(res, error);
      }
    },
    async profileMediaContent(req, res) {
      try {
        const media = await getMemberMediaContent(req.params.mediaId);
        res.set('Content-Type', media.contentType);
        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        res.send(media.body);
      } catch (error) {
        sendError(res, error);
      }
    },
    async deleteProfileMedia(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.json(await deleteMemberMedia(user.id, req.params.mediaId));
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
    async romanceVibes(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        res.json({ vibes: await getRomanceVibes(user.id) });
      } catch (error) {
        sendError(res, error);
      }
    },
    async romanceVibeMembership(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        const joined = req.body?.joined !== false;
        const result = await setRomanceVibeMembership({ memberId: user.id, vibeId: req.params.vibeId, joined });
        console.info('[romchat-vibes] membership:update', { memberId: user.id, vibeId: req.params.vibeId, joined });
        res.json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async discovery(req, res) {
      const verifiedOnly = String(req.query.verifiedOnly ?? 'true') !== 'false';
      const state = await authStateFor(req);
      const catalogueAccess = state?.onboarding?.catalogueAccess || 1;
      res.json({ profiles: await getProfiles({ verifiedOnly, catalogueAccess, viewerId: state?.user?.id || null }), catalogueAccess, generatedAt: new Date().toISOString() });
    },
    async swipe(req, res) {
      try {
        const state = await authStateFor(req);
        const result = await createSwipe({ ...(req.body || {}), actorId: state?.user?.id || 'me' });
        io?.emit('romchat:swipe', { ...req.body, ...result, createdAt: new Date().toISOString() });
        res.status(201).json(result);
      } catch (error) {
        sendError(res, error);
      }
    },
    async messages(req, res) {
      try {
        const state = await authStateFor(req);
        res.json({ messages: await getMessages(req.params.matchId, state?.user?.id || 'me'), generatedAt: new Date().toISOString() });
      } catch (error) {
        sendError(res, error);
      }
    },
    async sendMessage(req, res) {
      try {
        const moderation = moderateTextPayload(req.body?.text || '');
        const mediaModeration = req.body?.mediaUrl ? moderateMediaAsset(req.body || {}) : null;
        if (moderation.status === 'blocked') {
          return res.status(422).json({ message: 'This message breaks RomChat community safety rules. Please rewrite it respectfully.', code: 'MESSAGE_BLOCKED_BY_SAFETY', moderation });
        }
        const riskOverride = moderation.status === 'review' || mediaModeration?.status === 'pending_provider_review' ? 'review' : null;
        const state = await authStateFor(req);
        const message = await sendMessage({ ...(req.body || {}), actorId: state?.user?.id || 'me', priority: riskOverride ? false : Boolean(req.body?.priority), riskOverride });
        io?.to(message.matchId).to(`member:${message.recipientId}`).emit('romchat:message', message);
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
      try {
        const user = await requireRomchatAccount(req);
        const report = await createReport({ ...(req.body || {}), reporterId: user.id });
        io?.emit('romchat:report', report);
        res.status(201).json({ report, message: 'Report received by RomChat safety.' });
      } catch (error) {
        sendError(res, error);
      }
    },
    async block(req, res) {
      try {
        const user = await requireRomchatAccount(req);
        const block = await blockProfile({ blockerId: user.id, blockedId: req.body?.profileId, reason: req.body?.reason });
        io?.to(`member:${user.id}`).emit('romchat:profile-blocked', block);
        res.status(201).json({ block, message: 'Profile blocked.' });
      } catch (error) {
        sendError(res, error);
      }
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
    async moderationCases(_req, res) {
      try {
        res.json(await listModerationCases());
      } catch (error) {
        sendError(res, error);
      }
    },
    async moderationResolve(req, res) {
      try {
        res.json({ case: await resolveModerationCase(req.params.reportId, req.body || {}) });
      } catch (error) {
        sendError(res, error);
      }
    },
    async moderationReinstate(req, res) {
      try {
        res.json(await reinstateModeratedMember(req.params.memberId, req.body || {}));
      } catch (error) {
        sendError(res, error);
      }
    },
    async moderationAppeal(req, res) {
      try {
        res.status(201).json({ appeal: await createModerationAppeal(req.body || {}) });
      } catch (error) {
        sendError(res, error);
      }
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
      res.json({ plans: premiumPlans, addOns, activeTier: 'free' });
    },
    async subscribe(req, res) {
      const plan = premiumPlans.find((item) => item.id === req.body?.planId);
      if (!plan || plan.id === 'free') return res.status(400).json({ message: 'A paid planId is required.' });
      res.status(201).json({ subscription: { id: `sub_${Date.now()}`, planId: plan.id, status: 'active', startedAt: new Date().toISOString(), currency: 'KES', amountKes: plan.priceKes }, plan });
    },
    async createPayment(req, res) {
      try {
        const state = await authStateFor(req);
        res.status(201).json({ payment: await createPaymentIntent({ ...(req.body || {}), memberId: state?.user?.id || 'me', email: state?.user?.email || '' }) });
      } catch (error) {
        sendError(res, error);
      }
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
    async wallet(req, res) {
      const state = await authStateFor(req);
      res.json(await getWallet(state?.user?.id || 'me'));
    },
    async topUp(req, res) {
      try {
        const state = await authStateFor(req);
        res.status(201).json(await topUpWallet({ ...(req.body || {}), memberId: state?.user?.id || 'me' }));
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


