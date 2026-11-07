import test from 'node:test';
import assert from 'node:assert/strict';
import { moderateMediaAsset, moderateTextPayload } from './romchatModerationService.js';

test('approves ordinary dating conversation', () => {
  const result = moderateTextPayload('Would you like to meet for coffee on Saturday?');
  assert.equal(result.status, 'approved');
  assert.equal(result.shouldBlock, false);
});

test('blocks threats and obfuscated slurs', () => {
  assert.equal(moderateTextPayload('I will kill you').status, 'blocked');
  assert.equal(moderateTextPayload('n1gg3r').status, 'blocked');
});

test('blocks child sexual exploitation language', () => {
  const result = moderateTextPayload('send explicit nude photos of that underage schoolgirl');
  assert.equal(result.status, 'blocked');
  assert.equal(result.severity, 'critical');
  assert.ok(result.categories.includes('child_sexual_exploitation'));
});

test('queues scam indicators for review instead of silently delivering', () => {
  const result = moderateTextPayload('Send money using a gift card');
  assert.equal(result.status, 'review');
  assert.ok(result.categories.includes('scam_or_extortion'));
});

test('fails closed when media moderation provider is unavailable', async () => {
  const previousUser = process.env.SIGHTENGINE_API_USER;
  const previousSecret = process.env.SIGHTENGINE_API_SECRET;
  delete process.env.SIGHTENGINE_API_USER;
  delete process.env.SIGHTENGINE_API_SECRET;
  try {
    const result = await moderateMediaAsset({ mediaUrl: 'https://cdn.example.com/image.jpg', mediaType: 'image' });
    assert.equal(result.status, 'pending_provider_review');
    assert.equal(result.shouldQuarantine, true);
  } finally {
    if (previousUser) process.env.SIGHTENGINE_API_USER = previousUser;
    if (previousSecret) process.env.SIGHTENGINE_API_SECRET = previousSecret;
  }
});
