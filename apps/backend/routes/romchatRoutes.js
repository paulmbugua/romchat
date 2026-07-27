import express from 'express';
import { createRomchatController } from '../controllers/romchatController.js';

export default function romchatRoutes(io) {
  const router = express.Router();
  const controller = createRomchatController(io);

  router.get('/bootstrap', controller.bootstrap);
  router.get('/discovery', controller.discovery);
  router.post('/swipes', controller.swipe);
  router.get('/messages/:matchId', controller.messages);
  router.post('/messages', controller.sendMessage);
  router.post('/messages/disappearing', controller.disappearingMessage);
  router.post('/messages/typing', controller.typing);
  router.post('/messages/read-receipts', controller.readReceipts);
  router.get('/privacy', controller.privacy);
  router.patch('/privacy', controller.updatePrivacy);
  router.post('/reports', controller.report);
  router.post('/verification', controller.verification);
  router.get('/features', controller.features);
  router.get('/revenue', controller.revenue);
  router.post('/moderation/text', controller.moderateText);
  router.post('/moderation/media', controller.moderateMedia);
  router.get('/video-requests', controller.videoRequests);
  router.post('/messages/:messageId/unlock', controller.unlockMessage);
  router.post('/video-requests/:requestId/unlock', controller.unlockVideo);
  router.get('/premium', controller.premium);
  router.post('/subscriptions', controller.subscribe);
  router.post('/boosts', controller.boost);
  router.post('/gifts', controller.gift);
  router.get('/wallet', controller.wallet);
  router.post('/wallet/topups', controller.topUp);
  router.post('/ai/icebreakers', controller.icebreakers);
  router.post('/ai/bio', controller.bio);
  router.post('/vibe-polls/:pollId/votes', controller.votePoll);

  return router;
}
