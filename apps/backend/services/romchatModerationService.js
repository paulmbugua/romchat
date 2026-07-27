const abusivePatterns = [
  /\bkill\b/i,
  /\bhate\b/i,
  /\bthreat\b/i,
  /\bwire\s+money\b/i,
  /\bpassword\b/i,
  /\bcrypto\b/i,
  /\bgift\s*card\b/i,
];

export function moderateTextPayload(text = '') {
  const body = String(text || '').trim();
  const flags = abusivePatterns
    .filter((pattern) => pattern.test(body))
    .map((pattern) => pattern.source);

  return {
    status: flags.length ? 'review' : 'approved',
    flags,
    provider: process.env.ROMCHAT_TEXT_MODERATION_PROVIDER || 'local-rule-engine',
    checkedAt: new Date().toISOString(),
  };
}

export function moderateMediaAsset({ mediaUrl, mediaType = 'image' } = {}) {
  return {
    status: mediaUrl ? 'pending_provider_review' : 'missing_media',
    provider: process.env.ROMCHAT_MEDIA_MODERATION_PROVIDER || 'sightengine_or_webpurify',
    mediaType,
    mediaUrl: mediaUrl || null,
    checkedAt: new Date().toISOString(),
  };
}
