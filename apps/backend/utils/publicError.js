const TECHNICAL_ERROR_PATTERN = /(?:\[[a-z0-9_-]+:[a-z0-9_:-]+\]|\b(?:backend|console|stack(?: trace)?|sql|postgres(?:ql)?|database|firebase|client[_ -]?id|audience mismatch|environment variable|certificate|localhost|network request failed|request failed with status)\b|https?:\/\/|\b(?:10|127|192\.168)\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?|\*{2,}[^\s]*@|(?:check|see)\s+(?:the\s+)?(?:backend|server|console))/i;

const CODE_MESSAGES = {
  DAILY_LIKE_LIMIT_REACHED: "You have reached today's like limit. Try again tomorrow or upgrade for more likes.",
  GOOGLE_AUTH_FAILED: 'Google sign-in could not be completed. Please try again or use email login.',
  GOOGLE_TOKEN_INVALID: 'Google sign-in could not be completed. Please try again or use email login.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
};

function defaultMessage(status) {
  if (status === 400) return 'Please check the information you entered and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to complete this action.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This information is already in use.';
  if (status === 422) return 'Please review your information and try again.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  return 'Something went wrong on our side. Please try again shortly.';
}

function normalizeMessage(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function publicErrorMessage(errorOrMessage, status = 500, code = null) {
  const message = normalizeMessage(typeof errorOrMessage === 'string' ? errorOrMessage : errorOrMessage?.message);
  const resolvedCode = code || (typeof errorOrMessage === 'object' ? errorOrMessage?.code : null);
  if (resolvedCode && CODE_MESSAGES[resolvedCode]) return CODE_MESSAGES[resolvedCode];
  if (/google|oauth|audience mismatch|firebase token/i.test(String(resolvedCode || '') + ' ' + message)) return 'Google sign-in could not be completed. Please try again or use email login.';
  if (/invalid (?:email|credentials)|email or password|incorrect password/i.test(message)) return 'The email or password you entered is incorrect.';
  if (status >= 500) return defaultMessage(status);
  if (/network|failed to fetch|connection|timeout|timed out/i.test(message)) return 'We could not connect right now. Check your internet connection and try again.';
  if (!message || message.length > 220 || TECHNICAL_ERROR_PATTERN.test(message)) return defaultMessage(status);
  return message;
}

export function sanitizeErrorPayload(payload, status = 500) {
  if (status < 400 || !payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const sanitized = { ...payload, message: publicErrorMessage(payload.message || payload.error, status, payload.code) };
  delete sanitized.error;
  delete sanitized.stack;
  delete sanitized.trace;
  delete sanitized.exception;
  if (status >= 500 || TECHNICAL_ERROR_PATTERN.test(normalizeMessage(sanitized.details))) {
    delete sanitized.details;
    delete sanitized.detail;
  }
  if (status >= 500) delete sanitized.code;
  return sanitized;
}

export function shouldExposeTechnicalErrors() {
  return process.env.NODE_ENV !== 'production' && process.env.EXPOSE_TECHNICAL_ERRORS === 'true';
}
