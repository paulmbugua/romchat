const normalizedLeetMap = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

const moderationRules = [
  { category: 'racial_slur', severity: 'critical', patterns: [/\bn+[\W_]*[i1!]+[\W_]*g+[\W_]*g*(?:[e3]r|a|ah|uh)s?\b/i, /\bk+[\W_]*[i1!]+[\W_]*k+[\W_]*e+s?\b/i, /\bc+[\W_]*h+[\W_]*[i1!]+[\W_]*n+[\W_]*k+s?\b/i] },
  { category: 'sexual_offense', severity: 'high', patterns: [/\brape\b/i, /\bsexually\s+assault\b/i, /\bforce\s+(?:you|ur|u)\s+to\s+(?:sex|sleep)/i, /\bslut\b/i, /\bwhore\b/i] },
  { category: 'abuse_or_threat', severity: 'high', patterns: [/\bkill\s+(?:you|ur|u|yourself)\b/i, /\bbeat\s+(?:you|ur|u)\b/i, /\bhurt\s+(?:you|ur|u)\b/i, /\bi\s+hate\s+you\b/i, /\bworthless\b/i] },
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

export function moderateMediaAsset({ mediaUrl, mediaType = 'image' } = {}) {
  return {
    status: mediaUrl ? 'pending_provider_review' : 'missing_media',
    provider: process.env.ROMCHAT_MEDIA_MODERATION_PROVIDER || 'sightengine_or_webpurify',
    mediaType,
    mediaUrl: mediaUrl || null,
    checkedAt: new Date().toISOString(),
  };
}
