const normalizedLeetMap = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

const moderationRules = [
  { category: 'child_sexual_exploitation', severity: 'critical', patterns: [
    /\b(?:child|kid|minor|underage|schoolgirl|schoolboy)\b.{0,50}\b(?:sex|sexual|nude|naked|porn|explicit|meet\s+alone)\b/i,
    /\b(?:sex|sexual|nude|naked|porn|explicit)\b.{0,50}\b(?:child|kid|minor|underage|schoolgirl|schoolboy)\b/i,
    /\b(?:do not|don'?t)\s+tell\s+(?:your\s+)?(?:parent|parents|mum|mom|dad|guardian)\b/i,
  ] },
  { category: 'racial_slur', severity: 'critical', patterns: [/\bn+[\W_]*[i1!]+[\W_]*g+[\W_]*g*(?:[e3]r|a|ah|uh)s?\b/i, /\bk+[\W_]*[i1!]+[\W_]*k+[\W_]*e+s?\b/i, /\bc+[\W_]*h+[\W_]*[i1!]+[\W_]*n+[\W_]*k+s?\b/i] },
  { category: 'sexual_offense', severity: 'high', patterns: [/\brape\b/i, /\bsexually\s+assault\b/i, /\bforce\s+(?:you|ur|u)\s+to\s+(?:sex|sleep)/i, /\b(?:send|show)\s+(?:me\s+)?(?:a\s+)?nudes?\b/i, /\bslut\b/i, /\bwhore\b/i] },
  { category: 'abuse_or_threat', severity: 'high', patterns: [/\bkill\s+(?:you|ur|u|yourself)\b/i, /\bbeat\s+(?:you|ur|u)\b/i, /\bhurt\s+(?:you|ur|u)\b/i, /\bi\s+hate\s+you\b/i, /\bworthless\b/i] },
  { category: 'self_harm', severity: 'high', patterns: [/\b(?:kill|hurt)\s+myself\b/i, /\b(?:want|going)\s+to\s+die\b/i, /\bsuicide\b/i] },
  { category: 'scam_or_extortion', severity: 'medium', patterns: [/\bwire\s+money\b/i, /\bgift\s*card\b/i, /\bcrypto\b/i, /\bpassword\b/i, /\bsend\s+(?:cash|money)\b/i] },
];

function normalizeText(text = '') {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[013457@$!]/g, (char) => normalizedLeetMap[char] || char)
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/[\s._\-]+/g, ' ')
    .trim();
}

function redactEvidence(text = '') {
  return String(text || '').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]').replace(/\+?\d[\d\s().-]{6,}\d/g, '[phone]');
}

export function redactModerationEvidence(text = '') {
  return redactEvidence(text);
}

export function moderateTextPayload(text = '') {
  const original = String(text || '');
  const normalized = normalizeText(original);
  const compact = normalized.replace(/[^a-z0-9]+/g, '');
  const hits = [];

  for (const rule of moderationRules) {
    const matchedPatterns = rule.patterns.filter((pattern) => pattern.test(normalized) || pattern.test(compact));
    if (matchedPatterns.length) hits.push({ category: rule.category, severity: rule.severity, count: matchedPatterns.length });
  }

  const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
  const topSeverity = hits.reduce((current, hit) => severityRank[hit.severity] > severityRank[current] ? hit.severity : current, 'low');
  const shouldBlock = topSeverity === 'critical' || topSeverity === 'high';

  return {
    status: shouldBlock ? 'blocked' : hits.length ? 'review' : 'approved',
    severity: hits.length ? topSeverity : 'none',
    categories: hits.map((hit) => hit.category),
    flags: hits.map((hit) => hit.category),
    hits,
    shouldBlock,
    redactedText: redactEvidence(original),
    provider: process.env.ROMCHAT_TEXT_MODERATION_PROVIDER || 'romchat-local-safety-engine',
    checkedAt: new Date().toISOString(),
  };
}

export async function moderateMediaAsset({ mediaUrl, mediaType = 'image' } = {}) {
  const checkedAt = new Date().toISOString();
  if (!mediaUrl) return { status: 'missing_media', provider: 'none', mediaType, mediaUrl: null, shouldBlock: false, shouldQuarantine: false, checkedAt };

  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!apiUser || !apiSecret || !/^https:\/\//i.test(String(mediaUrl))) {
    return {
      status: 'pending_provider_review',
      provider: 'manual_review',
      reason: !apiUser || !apiSecret ? 'provider_not_configured' : 'media_url_not_public',
      mediaType,
      mediaUrl,
      shouldBlock: false,
      shouldQuarantine: true,
      checkedAt,
    };
  }

  try {
    const body = new URLSearchParams({
      url: String(mediaUrl),
      models: 'nudity-2.1,wad,offensive,gore-2.0',
      api_user: apiUser,
      api_secret: apiSecret,
    });
    const response = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || result?.status === 'failure') throw new Error(result?.error?.message || 'Media moderation provider rejected the request.');
    const sexual = Math.max(Number(result?.nudity?.sexual_activity || 0), Number(result?.nudity?.sexual_display || 0), Number(result?.nudity?.erotica || 0));
    const offensive = Math.max(Number(result?.offensive?.prob || 0), Number(result?.gore?.prob || 0));
    const weapon = Math.max(Number(result?.weapon || 0), Number(result?.alcohol || 0), Number(result?.drugs || 0));
    const score = Math.max(sexual, offensive, weapon);
    const shouldBlock = score >= 0.8;
    const shouldQuarantine = !shouldBlock && score >= 0.45;
    return {
      status: shouldBlock ? 'blocked' : shouldQuarantine ? 'pending_provider_review' : 'approved',
      provider: 'sightengine',
      mediaType,
      mediaUrl,
      score,
      categories: { sexual, offensive, weapon },
      shouldBlock,
      shouldQuarantine,
      checkedAt,
    };
  } catch (error) {
    console.error('[romchat-moderation] media provider unavailable', { message: error?.message || String(error) });
    return { status: 'pending_provider_review', provider: 'manual_review', reason: 'provider_unavailable', mediaType, mediaUrl, shouldBlock: false, shouldQuarantine: true, checkedAt };
  }
}
