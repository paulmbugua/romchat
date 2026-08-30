// authApi.ts
import axios from 'axios';
import type {
  AuthPayload,
  RegisterPayload,
  UpdateRolePayload,
  AuthResponse,
} from '@mindcare/shared/types';

// Optional: a single axios instance so headers/credentials are consistent
function client(backendUrl: string, token?: string) {
  return axios.create({
    baseURL: backendUrl,
    withCredentials: true, // important if backend uses cookies/sessions
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

const technicalErrorPattern = /(?:\[[a-z0-9_-]+:[a-z0-9_:-]+\]|\b(?:backend|console|stack|sql|postgres|database|firebase|audience mismatch|localhost|network request failed|request failed with status)\b|https?:\/\/|\*{2,}[^\s]*@)/i;

const toMessage = (err: any) => {
  const status = Number(err?.response?.status || 0);
  const raw = err?.response?.data?.message || err?.response?.data?.error || (typeof err?.response?.data === 'string' ? err.response.data : '') || err?.message || '';
  const message = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  if (/google|oauth|firebase|audience/i.test(message)) return 'Google sign-in could not be completed. Please try again or use email login.';
  if (/invalid (?:email|credentials)|email or password|incorrect password/i.test(message)) return 'The email or password you entered is incorrect.';
  if (/network|failed to fetch|connection|timeout/i.test(message)) return 'We could not connect right now. Check your internet connection and try again.';
  if (message && message.length <= 220 && !technicalErrorPattern.test(message)) return message;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to complete this action.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This information is already in use.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again shortly.';
  return 'Something went wrong. Please try again.';
};

// --- Google login stays mostly same but add withCredentials for cookies
export const exchangeGoogleAuthCode = async (
  backendUrl: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const api = client(backendUrl);
    const res = await api.post<AuthResponse>('/api/auth/google/exchange', { code });
    return res.data;
  } catch (err: any) {
    console.error('🔴 [exchangeGoogleAuthCode] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
};

export const login = async (
  backendUrl: string,
  payload: AuthPayload,
  token?: string
): Promise<AuthResponse> => {
  try {
    const api = client(backendUrl, token);
    const p = {
      // normalize/trim to avoid failing server validators
      email: payload.email?.trim(),
      password: payload.password ?? '',
    };
    const res = await api.post<AuthResponse>('/api/user/login', p);
    return res.data;
  } catch (err: any) {
    console.error('🔴 [login] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
};

export const register = async (
  backendUrl: string,
  payload: RegisterPayload,
  token?: string
): Promise<AuthResponse> => {
  const api = client(backendUrl, token);

  // >>> log what we send
  try { console.log('[register] payload →', JSON.stringify(payload)); } catch {}

  try {
    const res = await api.post<AuthResponse>('/api/user/register', payload);
    return res.data;
  } catch (err: any) {
    console.error('🔴 [register] status:', err.response?.status);
    console.error('🔴 [register] data:', err.response?.data);
    throw new Error(toMessage(err));
  }
};

export const requestOTP = async (
  backendUrl: string,
  email: string,
  token?: string
): Promise<AuthResponse> => {
  try {
    const api = client(backendUrl, token);
    const res = await api.post<AuthResponse>('/api/user/reset-password', { email: email?.trim() });
    return res.data;
  } catch (err: any) {
    console.error('🔴 [requestOTP] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
};

export const verifyOTP = async (
  backendUrl: string,
  email: string,
  otp: string,
  newPassword: string,
  token?: string
): Promise<AuthResponse> => {
  try {
    const api = client(backendUrl, token);
    const res = await api.post<AuthResponse>('/api/user/verify-otp', {
      email: email?.trim(),
      otp: otp?.trim(),
      newPassword,
    });
    return res.data;
  } catch (err: any) {
    console.error('🔴 [verifyOTP] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
};

export const updateRole = async (
  backendUrl: string,
  payload: UpdateRolePayload,
  token: string
): Promise<AuthResponse> => {
  try {
    const api = client(backendUrl, token);
    const res = await api.put<AuthResponse>('/api/user/update-role', payload);
    return res.data;
  } catch (err: any) {
    console.error('🔴 [updateRole] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
};

export async function deleteAccount(
  backendUrl: string,
  token: string
): Promise<void> {
  try {
    const api = client(backendUrl, token);
    await api.delete<void>('/api/user/account');
  } catch (err: any) {
    console.error('🔴 [deleteAccount] status/data:', err.response?.status, err.response?.data);
    throw new Error(toMessage(err));
  }
}
