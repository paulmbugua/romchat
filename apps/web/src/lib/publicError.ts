const TECHNICAL_ERROR_PATTERN = /(?:\[[a-z0-9_-]+:[a-z0-9_:-]+\]|\b(?:backend|console|stack|sql|postgres|database|firebase|audience mismatch|environment variable|certificate|localhost|network request failed|request failed with status)\b|https?:\/\/|\b(?:10|127|192\.168)\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?|\*{2,}[^\s]*@|(?:check|see)\s+(?:the\s+)?(?:backend|server|console))/i;

function statusMessage(status?: number) {
  if (status === 400 || status === 422) return 'Please review your information and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to complete this action.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This information is already in use.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  return 'Something went wrong on our side. Please try again shortly.';
}

export function userFacingErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.', statusOverride?: number) {
  const source = error as { message?: unknown; status?: number; code?: string } | null;
  const status = statusOverride || source?.status;
  const message = typeof source?.message === 'string' ? source.message.replace(/\s+/g, ' ').trim() : typeof error === 'string' ? error.replace(/\s+/g, ' ').trim() : '';
  const code = String(source?.code || '');
  if (/google|oauth|firebase|audience/i.test(code + ' ' + message)) return 'Google sign-in could not be completed. Please try again or use email login.';
  if (/invalid (?:email|credentials)|email or password|incorrect password/i.test(message)) return 'The email or password you entered is incorrect.';
  if (/network|failed to fetch|connection|timeout|timed out/i.test(message)) return 'We could not connect right now. Check your internet connection and try again.';
  if (!message || message.length > 220 || TECHNICAL_ERROR_PATTERN.test(message)) return status ? statusMessage(status) : fallback;
  return message;
}

export function googleSignInErrorMessage(code?: string | null) {
  if (code === 'access_denied') return 'Google sign-in was cancelled.';
  return 'Google sign-in could not be completed. Please try again or use email login.';
}
