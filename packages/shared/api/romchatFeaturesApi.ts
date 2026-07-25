import axios from 'axios';
import type {
  RomChatBioAssistantRequest,
  RomChatFeatureCatalog,
  RomChatIcebreakerRequest,
  RomChatTimedMessagePayload,
} from '../types/romchatFeatures';

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export async function fetchRomChatFeatureCatalog(backendUrl: string) {
  const response = await axios.get<RomChatFeatureCatalog>(`${backendUrl}/api/romchat/features`);
  return response.data;
}

export async function generateRomChatIcebreakers(
  backendUrl: string,
  payload: RomChatIcebreakerRequest,
  token?: string | null
) {
  const response = await axios.post<{ openers: string[] }>(
    `${backendUrl}/api/romchat/ai/icebreakers`,
    payload,
    { headers: authHeaders(token) }
  );
  return response.data.openers;
}

export async function generateRomChatBioDrafts(
  backendUrl: string,
  payload: RomChatBioAssistantRequest,
  token?: string | null
) {
  const response = await axios.post<{ bios: string[] }>(
    `${backendUrl}/api/romchat/ai/bio`,
    payload,
    { headers: authHeaders(token) }
  );
  return response.data.bios;
}

export async function updateRomChatPrivacy(
  backendUrl: string,
  payload: Record<string, unknown>,
  token?: string | null
) {
  const response = await axios.patch(`${backendUrl}/api/romchat/privacy`, payload, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function sendRomChatTimedMessage(
  backendUrl: string,
  payload: RomChatTimedMessagePayload,
  token?: string | null
) {
  const response = await axios.post(`${backendUrl}/api/romchat/messages/disappearing`, payload, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function buyRomChatBoost(
  backendUrl: string,
  payload: { boostId: string; profileId?: string },
  token?: string | null
) {
  const response = await axios.post(`${backendUrl}/api/romchat/boosts`, payload, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function sendRomChatGift(
  backendUrl: string,
  payload: { matchId: string; giftId: string; note?: string },
  token?: string | null
) {
  const response = await axios.post(`${backendUrl}/api/romchat/gifts`, payload, {
    headers: authHeaders(token),
  });
  return response.data;
}
