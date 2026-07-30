import fs from 'fs/promises';
import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from './r2.js';

const imageBucket = process.env.R2_BUCKET_IMAGES || 'images-romchat';
const videoBucket = process.env.R2_BUCKET_VIDEOS || 'videos-romchat';
const imagePublicBase = (process.env.R2_PUBLIC_BASE_URL_IMAGES || 'https://image.desiredoha.com').replace(/\/$/, '');
const videoPublicBase = (process.env.R2_PUBLIC_BASE_URL_VIDEOS || 'https://videos.desiredoha.com').replace(/\/$/, '');

const mediaDriver = process.env.ROMCHAT_MEDIA_DRIVER || (process.env.NODE_ENV === 'production' ? 'r2' : 'local');
export const localMediaRoot = process.env.ROMCHAT_LOCAL_MEDIA_DIR || path.join(process.cwd(), '.romchat-media');
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const videoTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const audioTypes = new Set(['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-m4a']);
const maxImageBytes = Number(process.env.R2_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
const maxVideoBytes = Number(process.env.R2_MAX_VIDEO_BYTES || 80 * 1024 * 1024);
const maxAudioBytes = Number(process.env.ROMCHAT_MAX_AUDIO_BYTES || 8 * 1024 * 1024);

function publicUrlFor(kind, key) {
  const base = kind === 'video' ? videoPublicBase : imagePublicBase;
  return `${base}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
}

function parseBase64Payload({ dataUri, base64 }) {
  const raw = dataUri || base64 || '';
  const match = /^data:([^;]+);base64,(.+)$/i.exec(raw);
  if (match) return { contentType: match[1], body: Buffer.from(match[2], 'base64') };
  return { contentType: null, body: Buffer.from(String(raw), 'base64') };
}

export async function putRomchatMedia({ memberId, mediaKind = 'image', contentType, dataUri, base64, fileName }) {
  const parsed = parseBase64Payload({ dataUri, base64 });
  const requestedKind = String(mediaKind || 'image').toLowerCase();
  const finalType = contentType || parsed.contentType || (requestedKind === 'voice' ? 'audio/m4a' : requestedKind === 'video' ? 'video/mp4' : 'image/jpeg');
  const kind = requestedKind === 'voice' || audioTypes.has(finalType) ? 'voice' : requestedKind === 'video' || videoTypes.has(finalType) ? 'video' : requestedKind === 'selfie' ? 'selfie' : 'image';
  const storageKind = kind === 'voice' ? 'audio' : kind === 'video' ? 'video' : 'image';
  const allowed = kind === 'voice' ? audioTypes : kind === 'video' ? videoTypes : imageTypes;
  const maxBytes = kind === 'voice' ? maxAudioBytes : kind === 'video' ? maxVideoBytes : maxImageBytes;
  if (!allowed.has(finalType)) {
    const error = new Error(`Unsupported RomChat media type: ${finalType}`);
    error.status = 400;
    throw error;
  }
  if (parsed.body.byteLength > maxBytes) {
    const error = new Error(`RomChat ${kind} exceeds max upload size.`);
    error.status = 413;
    throw error;
  }

  const ext = finalType.includes('png') ? 'png' : finalType.includes('webp') ? 'webp' : finalType.includes('quicktime') ? 'mov' : finalType.includes('webm') ? 'webm' : finalType.includes('wav') ? 'wav' : finalType.includes('mpeg') ? 'mp3' : kind === 'voice' ? 'm4a' : kind === 'video' ? 'mp4' : 'jpg';
  const safeName = String(fileName || `${Date.now()}.${ext}`).replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80);
  const key = `members/${memberId}/${kind}s/${Date.now()}-${safeName}`;
  const bucket = storageKind === 'video' ? videoBucket : imageBucket;

  if (mediaDriver === 'local') {
    const localPath = path.join(localMediaRoot, key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, parsed.body);
    return {
      key,
      bucket: 'local-romchat-media',
      url: `/api/romchat/media-local/${key}`,
      mediaType: kind,
      contentType: finalType,
      bytes: parsed.body.byteLength,
    };
  }

  await r2Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: parsed.body,
    ContentType: finalType,
  }));

  return {
    key,
    bucket,
    url: publicUrlFor(storageKind, key),
    mediaType: kind,
    contentType: finalType,
    bytes: parsed.body.byteLength,
  };
}
