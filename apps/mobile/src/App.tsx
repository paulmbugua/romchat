import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GestureResponderHandlers, ImageSourcePropType, LayoutChangeEvent } from 'react-native';
import {
  Image,
  ImageBackground,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  View,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../utils/storage';
import { romchatAccountApi, romchatBackendHealth, type RomChatAccount, type RomChatMemberProfile, type RomChatOnboardingState, type RomChatSessionPayload } from './features/romchat/account';
import { apiBaseUrl } from './lib/api';
import { useRomChatData } from './features/romchat/hooks';

type Section = 'explore' | 'likes' | 'chat' | 'premium' | 'safety' | 'profile';
type MessageMode = 'standard' | 'timed' | 'viewOnce';
type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';
type SessionState = RomChatSessionPayload & { onboarding: RomChatOnboardingState };
type RomChatPromptAnswer = { prompt: string; answer: string };

const ROMCHAT_TOKEN_KEY = 'romchat:auth:token';
const ROMCHAT_SESSION_KEY = 'romchat:auth:session';

type ProfileSeed = {
  id: string;
  name: string;
  age: number;
  city: string;
  match: number;
  intent: string;
  prompt: string;
  voiceNote: string;
  videoPrompt: string;
  quote: string;
  song: string;
  gallery: number;
  fullGallery?: number;
  lockedGallery?: number;
  distanceKm?: number;
  catalogueAccess?: number;
  photos?: string[];
  tags: string[];
  answers: string[];
  poll: { question: string; yes: number; no: number };
  color: string;
  photo: ImageSourcePropType;
  online?: boolean;
  verified?: boolean;
};

const localProfiles: ProfileSeed[] = [
  {
    id: 'elena',
    name: 'Aisha',
    age: 26,
    city: 'Nairobi',
    match: 94,
    intent: 'Serious Kenyan love, slow burn',
    prompt: 'Java dates, Karura walks, and dinners where phones stay away.',
    voiceNote: '10s voice note: Saturday brunch, Nairobi sunsets, quiet confidence.',
    videoPrompt: 'Loop: golden-hour walk through Westlands.',
    quote: 'Green flags are consistency, respect, and showing up even when Nairobi traffic wins.',
    song: 'Currently replaying: Sauti Sol - Suzanna',
    gallery: 9,
    tags: ['Karura', 'Afrobeats', 'Travel'],
    answers: ['Intentional effort', 'Dinner first', 'Texts with substance'],
    poll: { question: 'Mutura date after sunset?', yes: 68, no: 32 },
    color: '#ff4f88',
    photo: require('../assets/romchat/profile-elena.png'),
  },
  {
    id: 'amara',
    name: 'Wanjiku',
    age: 29,
    city: 'Mombasa',
    match: 91,
    intent: 'Ready for partnership',
    prompt: 'Coast weekends, Swahili food, film nights, and tiny rituals.',
    voiceNote: '10s voice note: I will remember your chai order.',
    videoPrompt: 'Loop: beach dinner in Nyali with a film queue.',
    quote: 'A good Kenyan date feels easy, respectful, and worth crossing town for.',
    song: 'Currently replaying: Bien - Inauma',
    gallery: 10,
    tags: ['Swahili food', 'Design', 'Film'],
    answers: ['Plan the date', 'Acts of service', 'Sunday market'],
    poll: { question: 'Diani weekend or Nairobi rooftop?', yes: 74, no: 26 },
    color: '#ff6a3d',
    photo: require('../assets/romchat/profile-amara.png'),
  },
  {
    id: 'noah',
    name: 'Brian',
    age: 31,
    city: 'Kisumu',
    match: 88,
    intent: 'Intentional connection',
    prompt: 'Runner, builder, and the guy who books the table before traffic starts.',
    voiceNote: '10s voice note: Sunday run, Java stop, rooftop sunset.',
    videoPrompt: 'Loop: city run ending at a Kisumu lakefront cafe.',
    quote: 'The best relationships are playful, prayerful if that is your lane, and deeply reliable.',
    song: 'Currently replaying: Bensoul - Favorite Song',
    gallery: 8,
    tags: ['Books', 'Rooftops', 'Running'],
    answers: ['Early flight', 'Rooftop view', 'Calls over voice notes'],
    poll: { question: 'Matatu adventure or Bolt comfort?', yes: 57, no: 43 },
    color: '#8a3ffc',
    photo: require('../assets/romchat/profile-noah.png'),
  },
];

const shortcuts: Array<{ id: Section; label: string; title: string }> = [
  { id: 'chat', label: 'Inbox', title: 'Matches' },
  { id: 'premium', label: 'Plus', title: 'Boost' },
  { id: 'safety', label: 'Safe', title: 'Trust' },
  { id: 'profile', label: 'Me', title: 'Profile' },
];

const plans = [
  { name: 'Gold', price: 'KES 499', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts'] },
  { name: 'Platinum', price: 'KES 999', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'] },
];

const gifts = [
  { id: 'rose', name: 'Rose', tokens: 5 },
  { id: 'chai', name: 'Chai date', tokens: 12 },
  { id: 'spotlight', name: 'Spotlight', tokens: 30 },
];

const tokenPackages = [
  { id: 'tokens_100', amount: 100, price: 'KES 250', unit: 'KES 2.50/ea', badge: '' },
  { id: 'tokens_350', amount: 350, price: 'KES 650', unit: 'KES 1.85/ea', badge: 'MOST POPULAR' },
  { id: 'tokens_1000', amount: 1000, price: 'KES 1,500', unit: 'KES 1.50/ea', badge: 'BEST VALUE' },
];

const SUPER_LIKE_COST = 15;
const UNDO_SWIPE_COST = 9;
const MATCH_POP_DURATION_MS = 1100;

const profilePromptTemplates = [
  'My ideal Kenyan date is',
  'Green flags I notice fast',
  'A song that explains my vibe',
  'Two truths and a soft secret',
  'The food date I will never reject',
  'How I show care',
  'What I am ready to build',
];

const tokenCatalog = [
  ['Unlock voice/photo media', '10'],
  ['Accept video request', '25'],
  ['Send rose', '5'],
  ['Priority message', String(SUPER_LIKE_COST)],
  ['Reveal admirer', '22'],
  ['Undo previous swipe', String(UNDO_SWIPE_COST)],
];

const starterMessages: Array<[string, string, string]> = [
  ['Aisha', 'Your answer about building a life with room for quiet days was rare.', 'Seen 8:41 PM'],
  ['You', 'The best connection feels calm before it feels exciting.', 'Read'],
  ['Aisha', 'That deserves a golden-hour walk. Saturday?', 'Typing now'],
];

const screenTitles: Record<Section, string> = {
  explore: 'Explore',
  likes: 'Likes',
  chat: 'Chat',
  premium: 'RomChat Plus',
  safety: 'Kenya Safety',
  profile: 'My Kenyan Profile',
};

export default function App() {
  const [authBooted, setAuthBooted] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState<SessionState | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [index, setIndex] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [incognito, setIncognito] = useState(true);
  const [antiGrab, setAntiGrab] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [messageMode, setMessageMode] = useState<MessageMode>('timed');
  const [tokens, setTokens] = useState(146);
  const [boosted, setBoosted] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const appReady = Boolean(session?.token && session.profile && !session.onboarding.needsFirstImage);
  const romchat = useRomChatData(localProfiles, { enabled: appReady, token: session?.token });
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 32);
  const footerHeight = 64 + bottomInset;
  const bottomContentPadding = footerHeight + 18;
  const swipeCardHeight = Math.max(500, windowHeight - insets.top - footerHeight - 92);
  const profiles = romchat.profiles as ProfileSeed[];
  const profile = profiles.length ? profiles[index % profiles.length]! : null;
  const firstUploadedImageUrl = resolveMediaUrl([...(session?.profile?.media || [])].sort((a, b) => (a.position || 0) - (b.position || 0)).find((item) => item.mediaType === 'image')?.url);
  const strength = useMemo(() => 82 + (verifiedOnly ? 5 : 0) + (incognito ? 4 : 0) + (antiGrab ? 3 : 0), [verifiedOnly, incognito, antiGrab]);
  const activePlan = boosted ? 'Platinum' : 'Gold';

  function normalizeSession(payload: RomChatSessionPayload | (Omit<RomChatSessionPayload, 'token'> & { token?: string }), tokenFallback?: string | null): SessionState {
    const token = payload.token || tokenFallback || '';
    const profile = payload.profile || null;
    const onboarding = payload.onboarding || { needsProfile: !profile, needsFirstImage: !profile?.imageCount, imageCount: profile?.imageCount || 0, catalogueAccess: Math.min(6, Math.max(1, profile?.imageCount || 0)) };
    return { token, user: payload.user, profile, onboarding };
  }

  async function persistSession(next: SessionState | null) {
    setSession(next);
    if (!next) {
      await storage.removeItem(ROMCHAT_TOKEN_KEY);
      await storage.removeItem(ROMCHAT_SESSION_KEY);
      return;
    }
    await storage.setItem(ROMCHAT_TOKEN_KEY, next.token);
    await storage.setItem(ROMCHAT_SESSION_KEY, JSON.stringify(next));
  }

  async function refreshSession(token = session?.token || '') {
    const payload = await romchatAccountApi.me(token);
    const next = normalizeSession(payload, token);
    await persistSession(next);
    return next;
  }

  async function pullToRefresh() {
    if (!session?.token || refreshing) return;
    setRefreshing(true);
    setAuthError('');
    try {
      await refreshSession(session.token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to refresh RomChat.');
    } finally {
      setRefreshing(false);
    }
  }

  async function applyAuth(payload: RomChatSessionPayload) {
    const next = normalizeSession(payload, payload.token);
    await persistSession(next);
  }

  async function signOut() {
    await persistSession(null);
    setActiveSection(null);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const savedToken = await storage.getItem(ROMCHAT_TOKEN_KEY);
      const savedSession = await storage.getItem(ROMCHAT_SESSION_KEY);
      if (savedSession && mounted) {
        try { setSession(JSON.parse(savedSession) as SessionState); } catch {}
      }
      if (savedToken) {
        try {
          const payload = await romchatAccountApi.me(savedToken);
          if (mounted) await persistSession(normalizeSession(payload, savedToken));
        } catch {
          if (mounted) await persistSession(null);
        }
      }
      if (mounted) setAuthBooted(true);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    };
  }, []);

  function clearMatchTimer() {
    if (matchTimerRef.current) {
      clearTimeout(matchTimerRef.current);
      matchTimerRef.current = null;
    }
  }

  function openTokenStore() {
    clearMatchTimer();
    setShowMatch(false);
    setActiveSection('premium');
  }

  function openMatchedChatSoon() {
    clearMatchTimer();
    setShowMatch(true);
    matchTimerRef.current = setTimeout(() => {
      setShowMatch(false);
      setActiveSection('chat');
    }, MATCH_POP_DURATION_MS);
  }

  function passProfile() {
    clearMatchTimer();
    if (!profile) return;
    void romchat.swipe(profile.id, 'pass');
    setIndex((value) => (value + 1) % profiles.length);
    setShowMatch(false);
  }

  function previous() {
    if (tokens < UNDO_SWIPE_COST) {
      openTokenStore();
      return;
    }
    clearMatchTimer();
    setTokens((value) => Math.max(0, value - UNDO_SWIPE_COST));
    setIndex((value) => (value - 1 + profiles.length) % profiles.length);
    setShowMatch(false);
  }

  function likeProfile(action: 'like' | 'super_like' = 'like') {
    if (!profile) return;
    void romchat.swipe(profile.id, action);
    openMatchedChatSoon();
  }

  function superLikeProfile() {
    if (tokens < SUPER_LIKE_COST) {
      openTokenStore();
      return;
    }
    setTokens((value) => Math.max(0, value - SUPER_LIKE_COST));
    likeProfile('super_like');
  }

  const swipeHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dy) < 24,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx > 48) {
            likeProfile('like');
          }
          if (gesture.dx < -48) {
            passProfile();
          }
        },
      }).panHandlers,
    [profile?.id, profiles.length, romchat, likeProfile, passProfile]
  );

  async function loginWithEmail(email: string, password: string) {
    setAuthBusy(true);
    setAuthError('');
    try { await applyAuth(await romchatAccountApi.login({ email, password })); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to login.'); }
    finally { setAuthBusy(false); }
  }

  async function requestOtp(name: string, email: string, password: string) {
    setAuthBusy(true);
    setAuthError('');
    try { await romchatAccountApi.requestOtp({ name, email, password }); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to send verification code.'); throw error; }
    finally { setAuthBusy(false); }
  }

  async function verifyOtp(email: string, otp: string) {
    setAuthBusy(true);
    setAuthError('');
    try { await applyAuth(await romchatAccountApi.verifyOtp({ email, otp })); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to verify code.'); }
    finally { setAuthBusy(false); }
  }

  async function requestPasswordReset(email: string) {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await romchatAccountApi.forgotPassword({ email });
      const devCode = response.developmentCode ? ' Dev code: ' + response.developmentCode : '';
      return (response.message || 'Reset code sent. Check your email.') + devCode;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to send reset email.');
      throw error;
    } finally {
      setAuthBusy(false);
    }
  }

  async function resetPassword(email: string, code: string, password: string) {
    setAuthBusy(true);
    setAuthError('');
    try { await applyAuth(await romchatAccountApi.resetPassword({ email, code, password })); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to reset password.'); throw error; }
    finally { setAuthBusy(false); }
  }

  async function loginWithGoogle(idToken: string) {
    setAuthBusy(true);
    setAuthError('');
    console.info('[romchat-google] token-login:start', { apiBaseUrl, tokenLength: idToken.length });
    try {
      await applyAuth(await romchatAccountApi.google(idToken));
      console.info('[romchat-google] token-login:success');
    }
    catch (error) {
      console.warn('[romchat-google] token-login:failed', error);
      setAuthError(error instanceof Error ? error.message : 'Google login failed.');
    }
    finally { setAuthBusy(false); }
  }

  async function loginWithNativeGoogle() {
    setAuthBusy(true);
    setAuthError('');
    try {
      console.info('[romchat-google] native:start', { apiBaseUrl });
      try { await GoogleSignin.signOut(); } catch (signOutError) { console.info('[romchat-google] native:signout-skip', signOutError); }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.info('[romchat-google] native:play-services-ok');
      await GoogleSignin.signIn();
      console.info('[romchat-google] native:signin-ok');
      const { idToken } = await GoogleSignin.getTokens();
      console.info('[romchat-google] native:tokens', { hasIdToken: Boolean(idToken), tokenLength: idToken?.length || 0 });
      if (!idToken) throw new Error('Google did not return an ID token.');
      try {
        const health = await romchatBackendHealth();
        console.info('[romchat-google] backend:health-ok', health);
      } catch (healthError) {
        console.warn('[romchat-google] backend:health-failed', healthError);
      }
      await applyAuth(await romchatAccountApi.google(idToken));
      console.info('[romchat-google] native:backend-auth-success');
    } catch (error) {
      console.warn('[romchat-google] native:failed', error);
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
      if (code === statusCodes.SIGN_IN_CANCELLED) setAuthError('Google sign-in cancelled.');
      else if (code === statusCodes.IN_PROGRESS) setAuthError('Google sign-in is already in progress.');
      else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) setAuthError('Google Play Services is unavailable or needs an update.');
      else setAuthError(error instanceof Error ? error.message : 'Google login failed.');
    } finally { setAuthBusy(false); }
  }

  async function saveOnboardingProfile(payload: { displayName: string; age: number; gender: string; city: string; intent: string; bio: string; interests: string[] }) {
    if (!session?.token) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      await romchatAccountApi.saveProfile(session.token, payload);
      await refreshSession(session.token);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to save profile.'); }
    finally { setAuthBusy(false); }
  }

  async function uploadProfileImage() {
    if (!session?.token) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission is required.');
      const shouldCropForAvatar = !session.profile?.imageCount;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: shouldCropForAvatar, ...(shouldCropForAvatar ? { aspect: [1, 1] as [number, number] } : {}), quality: 0.82, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error('Unable to read image data.');
      const contentType = asset.mimeType || 'image/jpeg';
      const dataUri = `data:${contentType};base64,${asset.base64}`;
      const response = await romchatAccountApi.uploadMedia(session.token, { mediaType: 'image', dataUri, contentType, fileName: asset.fileName || 'profile.jpg' });
      if (response.profile) {
        const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
        await persistSession(next);
      } else {
        await refreshSession(session.token);
      }
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to upload image.'); }
    finally { setAuthBusy(false); }
  }

  async function setMainProfilePhoto(mediaId: string) {
    if (!session?.token || !mediaId) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await romchatAccountApi.setMainPhoto(session.token, mediaId);
      const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
      await persistSession(next);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to update main photo.'); }
    finally { setAuthBusy(false); }
  }

  async function verifySelfieProfile() {
    if (!session?.token) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Camera permission is required for selfie verification.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.72, base64: true, cameraType: ImagePicker.CameraType.front });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error('Unable to read selfie data.');
      const contentType = asset.mimeType || 'image/jpeg';
      const response = await romchatAccountApi.verifySelfie(session.token, { dataUri: `data:${contentType};base64,${asset.base64}`, contentType, fileName: asset.fileName || 'selfie-verification.jpg' });
      const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
      await persistSession(next);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to verify selfie.'); }
    finally { setAuthBusy(false); }
  }

  async function saveProfileDetails(payload: { displayName: string; gender: string; city: string; intent: string; bio: string; interests: string[] }) {
    if (!session?.token || !session.profile) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await romchatAccountApi.saveProfile(session.token, {
        ...payload,
        age: session.profile.age,
        promptAnswers: session.profile.promptAnswers,
        maxDistanceKm: session.profile.maxDistanceKm,
        minAge: session.profile.minAge,
        maxAge: session.profile.maxAge,
        mapDiscoveryEnabled: session.profile.mapDiscoveryEnabled,
      });
      const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
      await persistSession(next);
      await romchat.refresh();
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to save profile details.'); }
    finally { setAuthBusy(false); }
  }

  async function saveProfilePrompts(promptAnswers: RomChatPromptAnswer[]) {
    if (!session?.token || !session.profile) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await romchatAccountApi.saveProfile(session.token, {
        displayName: session.profile.displayName,
        age: session.profile.age,
        gender: session.profile.gender,
        city: session.profile.city,
        intent: session.profile.intent,
        bio: session.profile.bio,
        interests: session.profile.interests,
        promptAnswers,
        maxDistanceKm: session.profile.maxDistanceKm,
        minAge: session.profile.minAge,
        maxAge: session.profile.maxAge,
        mapDiscoveryEnabled: session.profile.mapDiscoveryEnabled,
      });
      const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
      await persistSession(next);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to save prompts.'); }
    finally { setAuthBusy(false); }
  }

  async function saveDiscoverySettings(payload: { maxDistanceKm: number; minAge: number; maxAge: number; mapDiscoveryEnabled: boolean }) {
    if (!session?.token || !session.profile) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await romchatAccountApi.saveProfile(session.token, {
        displayName: session.profile.displayName,
        age: session.profile.age,
        gender: session.profile.gender,
        city: session.profile.city,
        intent: session.profile.intent,
        bio: session.profile.bio,
        interests: session.profile.interests,
        promptAnswers: session.profile.promptAnswers,
        maxDistanceKm: payload.maxDistanceKm,
        minAge: payload.minAge,
        maxAge: payload.maxAge,
        mapDiscoveryEnabled: payload.mapDiscoveryEnabled,
      });
      const next = normalizeSession({ token: session.token, user: session.user, profile: response.profile });
      await persistSession(next);
      await romchat.refresh();
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to save distance settings.'); }
    finally { setAuthBusy(false); }
  }
  function openSwipeDeck() {
    setActiveSection(null);
    if (appReady) void romchat.refresh();
  }

  function renderSection(section: Section) {
    if (section === 'explore') {
      return <ExploreScreen openLikes={() => setActiveSection('likes')} />;
    }
    if (section === 'likes') {
      return <LikesScreen profiles={profiles} openPremium={openTokenStore} likeProfile={() => likeProfile('like')} passProfile={passProfile} />;
    }
    if (section === 'chat') {
      return (
        <Chat
          profiles={profiles}
          readReceipts={readReceipts}
          setReadReceipts={setReadReceipts}
          messageMode={messageMode}
          setMessageMode={setMessageMode}
          tokens={tokens}
          setTokens={setTokens}
          openTokenStore={openTokenStore}
          sendMessage={romchat.sendMessage}
          sendGift={romchat.sendGift}
          unlockVideoRequest={romchat.unlockVideoRequest}
          videoRequests={romchat.videoRequests}
          status={romchat.lastAction}
        />
      );
    }
    if (section === 'premium') {
      return <Premium tokens={tokens} boosted={boosted} activePlan={activePlan} activateBoost={() => { setBoosted(true); void romchat.boost(); }} />;
    }
    if (section === 'safety') {
      return (
        <Safety
          incognito={incognito}
          setIncognito={setIncognito}
          antiGrab={antiGrab}
          setAntiGrab={setAntiGrab}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          updatePrivacy={(next) => void romchat.updatePrivacy(next)}
          report={() => profile ? void romchat.report(profile.id) : undefined}
          verify={romchat.verify}
          status={romchat.lastAction}
        />
      );
    }
    return <Profile account={session?.user || null} profile={session?.profile || null} strength={strength} incognito={incognito} busy={authBusy} error={authError} onUploadImage={uploadProfileImage} onSetMainPhoto={setMainProfilePhoto} onVerifySelfie={verifySelfieProfile} onSaveDetails={saveProfileDetails} onSavePrompts={saveProfilePrompts} onSaveDiscoverySettings={saveDiscoverySettings} status={romchat.lastAction} onSignOut={signOut} />;
  }

  if (!authBooted) {
    return <LoadingScreen label="Preparing RomChat" />;
  }

  if (!session?.token) {
    return <AuthScreen busy={authBusy} error={authError} onLogin={loginWithEmail} onRequestOtp={requestOtp} onVerifyOtp={verifyOtp} onForgotPassword={requestPasswordReset} onResetPassword={resetPassword} onNativeGoogle={loginWithNativeGoogle} />;
  }

  if (!session.profile || session.onboarding.needsFirstImage) {
    return <ProfileOnboardingScreen busy={authBusy} error={authError} accountName={session.user.name} profile={session.profile} uploadedImageCount={session.onboarding.imageCount} onSaveProfile={saveOnboardingProfile} onUploadImage={uploadProfileImage} onSignOut={signOut} />;
  }

  if (activeSection) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#120914" />
        <ScreenHeader title={screenTitles[activeSection]} onBack={() => setActiveSection(null)} apiOnline={romchat.apiOnline} />
        <ScrollView
          contentContainerStyle={[styles.screenContent, { paddingBottom: bottomContentPadding }]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void pullToRefresh()} tintColor="#FF1493" colors={['#FF1493', '#FFD700']} progressBackgroundColor="#1E1222" />}
        >
          {renderSection(activeSection)}
        </ScrollView>
        <FooterNav active={activeSection} setActiveSection={setActiveSection} openSwipeDeck={openSwipeDeck} bottomInset={bottomInset} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#120914" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void pullToRefresh()} tintColor="#FF1493" colors={['#FF1493', '#FFD700']} progressBackgroundColor="#1E1222" />}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setActiveSection('profile')} style={styles.brandRow}>
            <Image source={firstUploadedImageUrl ? { uri: firstUploadedImageUrl } : require('../assets/icon.png')} style={styles.logo} />
            <View><Text style={styles.brand}>RomChat</Text><Text style={styles.brandTagline}>Kenya dating</Text></View>
          </TouchableOpacity>
          <View style={styles.topControls}>
            <TouchableOpacity onPress={() => setActiveSection('chat')} style={styles.iconButton} accessibilityLabel="Open inbox">
              <Icon name="chatbubbles" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSection('safety')} style={styles.iconButton} accessibilityLabel="Open safety center">
              <Icon name="shield-checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSection('premium')} style={styles.walletPill}>
              <Icon name="diamond" size={15} color="#FFD700" />
              <Text style={styles.walletText}>{tokens}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {profile ? (
          <>
            <Discover
              profile={profile}
              passProfile={passProfile}
              likeProfile={() => likeProfile('like')}
              topProfile={superLikeProfile}
              previous={previous}
              swipeHandlers={swipeHandlers}
              showMatch={showMatch}
              dismissMatch={passProfile}
              openChat={() => {
                clearMatchTimer();
                setShowMatch(false);
                setActiveSection('chat');
              }}
              profiles={profiles}
              cardHeight={swipeCardHeight}
            />
          </>
        ) : (
          <EmptyDiscovery openProfile={() => setActiveSection('profile')} status={romchat.lastAction} />
        )}
      </ScrollView>
      <FooterNav active="swipe" setActiveSection={setActiveSection} openSwipeDeck={openSwipeDeck} bottomInset={bottomInset} />
    </SafeAreaView>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeCenter}>
      <ActivityIndicator color="#FF1493" size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </SafeAreaView>
  );
}

function AuthScreen({ busy, error, onLogin, onRequestOtp, onVerifyOtp, onForgotPassword, onResetPassword, onNativeGoogle }: {
  busy: boolean;
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onRequestOtp: (name: string, email: string, password: string) => Promise<void>;
  onVerifyOtp: (email: string, otp: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string>;
  onResetPassword: (email: string, code: string, password: string) => Promise<void>;
  onNativeGoogle: () => Promise<void>;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [localError, setLocalError] = useState('');
  const manifestExtra = (Constants.manifest as { extra?: unknown } | null | undefined)?.extra;
  const extra = (Constants.expoConfig?.extra || manifestExtra || {}) as { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string; EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string; EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string };
  const googleConfigured = Boolean(extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID && extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  const titleByMode: Record<AuthMode, string> = {
    login: 'Meet Kenyan singles. Chat beautifully.',
    signup: 'Create your RomChat account.',
    verify: 'Confirm your email.',
    forgot: 'Reset your RomChat password.',
    reset: 'Create a new password.',
  };
  const copyByMode: Record<AuthMode, string> = {
    login: 'Login to meet verified Kenyan singles in Nairobi, Mombasa, Kisumu, Eldoret, Nakuru, and beyond.',
    signup: 'Join Kenya-first romance chats with verified profiles, beautiful prompts, and safer dating tools.',
    verify: 'Enter the 6-digit code we sent to your email to unlock your RomChat profile.',
    forgot: 'Enter your email and we will send a private reset code to help you get back in.',
    reset: 'Use the reset code from your email and choose a stronger password for your account.',
  };

  async function submit() {
    setResetNotice('');
    setLocalError('');
    if (mode === 'login') return onLogin(email, password);
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      await onRequestOtp(name, email, password);
      setMode('verify');
      return;
    }
    if (mode === 'forgot') {
      const message = await onForgotPassword(email);
      setResetNotice(message || 'Reset code requested. Check your email, then enter the code below.');
      setMode('reset');
      return;
    }
    if (mode === 'reset') return onResetPassword(email, otp, resetPasswordValue);
    return onVerifyOtp(email, otp);
  }

  const primaryLabel = mode === 'verify'
    ? 'Verify email'
    : mode === 'signup'
      ? 'Send email code'
      : mode === 'forgot'
        ? 'Send reset email'
        : mode === 'reset'
          ? 'Reset password'
          : 'Login';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.authSafe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0} style={styles.keyboardAvoider}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        <Text style={styles.authLogo}>RomChat</Text>
        <Text style={styles.authTitle}>{titleByMode[mode]}</Text>
        <Text style={styles.authCopy}>{copyByMode[mode]}</Text>
        {mode !== 'forgot' && mode !== 'reset' && (
          <TouchableOpacity disabled={!googleConfigured || busy} onPress={() => void onNativeGoogle()} style={[styles.googleButton, !googleConfigured && styles.googleButtonDisabled]}>
            <Icon name="logo-google" size={18} color="#120914" />
            <Text style={styles.googleButtonText}>{!googleConfigured ? 'Google setup pending' : busy ? 'Connecting...' : 'Continue with Google'}</Text>
          </TouchableOpacity>
        )}
        {mode !== 'forgot' && mode !== 'reset' && mode !== 'verify' && (
          <View style={styles.authTabs}>
            {(['login', 'signup'] as AuthMode[]).map((item) => (
              <TouchableOpacity key={item} onPress={() => setMode(item)} style={[styles.authTab, mode === item && styles.authTabActive]}>
                <Text style={[styles.authTabText, mode === item && styles.authTabTextActive]}>{item === 'login' ? 'Login' : 'Create'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {mode === 'signup' && <TextInput value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.authInput} />}
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.authInput} />
        {(mode === 'login' || mode === 'signup') && <PasswordField value={password} onChangeText={setPassword} visible={showPassword} setVisible={setShowPassword} placeholder="Password" />}
        {mode === 'signup' && <PasswordField value={confirmPassword} onChangeText={setConfirmPassword} visible={showConfirmPassword} setVisible={setShowConfirmPassword} placeholder="Confirm password" />}
        {(mode === 'verify' || mode === 'reset') && <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder={mode === 'reset' ? 'Reset code' : '6-digit email code'} placeholderTextColor="rgba(255,255,255,0.45)" style={styles.authInput} />}
        {mode === 'reset' && <PasswordField value={resetPasswordValue} onChangeText={setResetPasswordValue} visible={showResetPassword} setVisible={setShowResetPassword} placeholder="New password" />}
        {!!resetNotice && <Text style={styles.authSuccess}>{resetNotice}</Text>}
        {!!localError && <Text style={styles.authError}>{localError}</Text>}
        <TouchableOpacity disabled={busy} onPress={() => void submit()} style={styles.authPrimary}>
          <Text style={styles.authPrimaryText}>{busy ? 'Please wait...' : primaryLabel}</Text>
        </TouchableOpacity>
        {mode === 'login' && <TouchableOpacity onPress={() => { setResetNotice(''); setMode('forgot'); }}><Text style={styles.authLink}>Forgot password?</Text></TouchableOpacity>}
        {mode === 'verify' && <TouchableOpacity onPress={() => setMode('signup')}><Text style={styles.authLink}>Edit signup details</Text></TouchableOpacity>}
        {(mode === 'forgot' || mode === 'reset') && <TouchableOpacity onPress={() => { setResetNotice(''); setMode('login'); }}><Text style={styles.authLink}>Back to login</Text></TouchableOpacity>}
        {!!error && <Text style={styles.authError}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const datingIntentions = [
  'Serious relationship',
  'Life partner',
  'Marriage minded',
  'Intentional connection',
  'Long-term, open to short',
  'Short-term, open to long',
  'New friends first',
  'Slow dating',
  'Christian dating',
  'Muslim dating',
  'Single parent dating',
  'Travel romance',
  'Casual dates',
  'Still figuring it out',
];

const datingInterests = [
  'Coffee dates', 'Dinner dates', 'Brunch', 'Road trips', 'Beach weekends', 'Karura walks', 'Nairobi nightlife', 'Mombasa coast',
  'Live music', 'Afrobeats', 'Bongo', 'Amapiano', 'Sauti Sol', 'Karaoke', 'Dancing', 'Concerts',
  'Movies', 'Netflix nights', 'K-dramas', 'Comedy shows', 'Theatre', 'Photography', 'Content creation', 'Fashion',
  'Gym', 'Running', 'Hiking', 'Cycling', 'Yoga', 'Football', 'Rugby', 'Swimming', 'Wellness',
  'Cooking', 'Baking', 'Foodie', 'Street food', 'Nyama choma', 'Sushi', 'Wine tasting', 'Mocktails',
  'Travel', 'Staycations', 'Safari', 'Camping', 'Picnics', 'Sunsets', 'Lake views', 'Adventure',
  'Books', 'Poetry', 'Podcasts', 'Tech', 'Startups', 'Business', 'Investing', 'Volunteering',
  'Church', 'Mosque', 'Family time', 'Parenting', 'Pets', 'Board games', 'Gaming', 'Art galleries',
];

function PasswordField({ value, onChangeText, visible, setVisible, placeholder }: { value: string; onChangeText: (value: string) => void; visible: boolean; setVisible: (value: boolean) => void; placeholder: string }) {
  return (
    <View style={styles.passwordRow}>
      <TextInput value={value} onChangeText={onChangeText} secureTextEntry={!visible} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.45)" style={styles.passwordInput} />
      <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.passwordEye} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
        <Icon name={visible ? 'eye-off' : 'eye'} size={20} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );
}

function ProfileOnboardingScreen({ busy, error, accountName, profile, uploadedImageCount, onSaveProfile, onUploadImage, onSignOut }: {
  busy: boolean;
  error: string;
  accountName: string;
  profile: RomChatMemberProfile | null;
  uploadedImageCount: number;
  onSaveProfile: (payload: { displayName: string; age: number; gender: string; city: string; intent: string; bio: string; interests: string[] }) => Promise<void>;
  onUploadImage: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const initialDisplayName = profile?.displayName || accountName || '';
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender || 'female');
  const [city, setCity] = useState(profile?.city || '');
  const [intent, setIntent] = useState(profile?.intent || 'Serious relationship');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests?.length ? profile.interests : ['Coffee dates', 'Travel', 'Live music']);
  const hasProfile = Boolean(profile);
  const imageCount = profile?.imageCount || uploadedImageCount || 0;
  const scrollRef = useRef<ScrollView | null>(null);
  const sectionYRef = useRef<Record<string, number>>({});
  const [missingSection, setMissingSection] = useState('');
  const toggleInterest = (interest: string) => setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  const rememberSection = (key: string) => (event: LayoutChangeEvent) => { sectionYRef.current[key] = event.nativeEvent.layout.y; };
  function jumpToMissing(section: string) {
    setMissingSection(section);
    const y = Math.max(0, (sectionYRef.current[section] || 0) - 16);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: true }));
  }
  function handleSaveProfile() {
    const ageValue = Number(age);
    const requiredSections = [
      { key: 'displayName', missing: !displayName.trim() },
      { key: 'age', missing: !ageValue || ageValue < 18 },
      { key: 'gender', missing: !gender.trim() },
      { key: 'city', missing: !city.trim() },
      { key: 'intent', missing: !intent.trim() },
      { key: 'interests', missing: selectedInterests.length === 0 },
      { key: 'bio', missing: !bio.trim() },
      { key: 'image', missing: imageCount < 1 },
    ];
    const firstMissing = requiredSections.find((item) => item.missing);
    if (firstMissing) {
      jumpToMissing(firstMissing.key);
      return;
    }
    setMissingSection('');
    void onSaveProfile({ displayName, age: ageValue, gender, city, intent, bio, interests: selectedInterests });
  }
  useEffect(() => {
    if (!displayName.trim() && initialDisplayName.trim()) setDisplayName(initialDisplayName);
  }, [displayName, initialDisplayName]);
  useEffect(() => {
    if (!missingSection) return;
    const ageValue = Number(age);
    const fixed = {
      displayName: Boolean(displayName.trim()),
      age: Boolean(ageValue && ageValue >= 18),
      gender: Boolean(gender.trim()),
      city: Boolean(city.trim()),
      intent: Boolean(intent.trim()),
      interests: selectedInterests.length > 0,
      bio: Boolean(bio.trim()),
      image: imageCount >= 1,
    }[missingSection];
    if (fixed) setMissingSection('');
  }, [age, bio, city, displayName, gender, imageCount, intent, missingSection, selectedInterests.length]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.authSafe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0} style={styles.keyboardAvoider}>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.authContent, styles.authContentTop]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        <Text style={styles.authLogo}>RomChat</Text>
        <Text style={styles.authTitle}>{hasProfile ? 'Add your first photo' : 'Create your Kenyan dating profile'}</Text>
        <Text style={styles.authCopy}>Upload at least 1 image to enter Kenyan discovery. More uploaded images unlock more of other members' photo catalogues.</Text>
        <View onLayout={rememberSection('displayName')}><TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor="rgba(255,255,255,0.45)" style={[styles.authInput, missingSection === 'displayName' && styles.inputMissing]} /></View>
        <View onLayout={rememberSection('age')}><TextInput value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Age" placeholderTextColor="rgba(255,255,255,0.45)" style={[styles.authInput, missingSection === 'age' && styles.inputMissing]} /></View>
        <View onLayout={rememberSection('gender')} style={[styles.genderRow, missingSection === 'gender' && styles.sectionMissing]}>{['female', 'male', 'nonbinary'].map((item) => <TouchableOpacity key={item} onPress={() => setGender(item)} style={[styles.genderChip, gender === item && styles.genderChipActive]}><Text style={[styles.genderText, gender === item && styles.genderTextActive]}>{item}</Text></TouchableOpacity>)}</View>
        <View onLayout={rememberSection('city')}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="rgba(255,255,255,0.45)" style={[styles.authInput, missingSection === 'city' && styles.inputMissing]} /></View>
        <View onLayout={rememberSection('intent')}><Text style={[styles.selectorTitle, missingSection === 'intent' && styles.selectorTitleMissing]}>Dating intention in Kenya</Text>
        <View style={styles.choiceWrap}>{datingIntentions.map((item) => <TouchableOpacity key={item} onPress={() => setIntent(item)} style={[styles.choiceChip, intent === item && styles.choiceChipActive]}><Text style={[styles.choiceText, intent === item && styles.choiceTextActive]}>{item}</Text></TouchableOpacity>)}</View></View>
        <View onLayout={rememberSection('interests')}><Text style={[styles.selectorTitle, missingSection === 'interests' && styles.selectorTitleMissing]}>Interests and vibe signals</Text>
        <View style={styles.choiceWrap}>{datingInterests.map((item) => { const active = selectedInterests.includes(item); return <TouchableOpacity key={item} onPress={() => toggleInterest(item)} style={[styles.choiceChip, active && styles.choiceChipActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item}</Text></TouchableOpacity>; })}</View></View>
        <View onLayout={rememberSection('bio')}><TextInput value={bio} onChangeText={setBio} placeholder="Short Kenyan romance bio" placeholderTextColor="rgba(255,255,255,0.45)" style={[styles.authInput, styles.authTextArea, missingSection === 'bio' && styles.inputMissing]} multiline /></View>
        <TouchableOpacity onLayout={rememberSection('image')} disabled={busy} onPress={() => void onUploadImage()} style={[styles.uploadCard, missingSection === 'image' && styles.uploadCardMissing]}>
          <Icon name="image" size={24} color="#FFD700" />
          <View style={{ flex: 1 }}><Text style={styles.uploadTitle}>{imageCount ? String(imageCount) + ' image uploaded' : 'Upload first profile image'}</Text><Text style={styles.uploadMeta}>{missingSection === 'image' ? 'Add at least one photo before saving.' : 'Private RomChat photo gallery'}</Text></View>
        </TouchableOpacity>
        {!!missingSection && <Text style={styles.validationNudge}>Finish this highlighted section to continue.</Text>}
        <TouchableOpacity disabled={busy} onPress={handleSaveProfile} style={styles.authPrimary}>
          <Text style={styles.authPrimaryText}>Save profile</Text>
        </TouchableOpacity>
        {!!error && <Text style={styles.authError}>{error}</Text>}
        <TouchableOpacity onPress={() => void onSignOut()}><Text style={styles.authLink}>Use another account</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScreenHeader({ title, onBack, apiOnline }: { title: string; onBack: () => void; apiOnline: boolean }) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}><Icon name="chevron-back" size={20} color="#FFFFFF" /></TouchableOpacity>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.apiPill}>{apiOnline ? 'Live' : 'Local'}</Text>
    </View>
  );
}

function Discover({
  profile,
  passProfile,
  likeProfile,
  topProfile,
  previous,
  swipeHandlers,
  showMatch,
  dismissMatch,
  openChat,
  profiles,
  cardHeight,
}: {
  profile: ProfileSeed;
  passProfile: () => void;
  likeProfile: () => void;
  topProfile: () => void;
  previous: () => void;
  swipeHandlers: GestureResponderHandlers;
  showMatch: boolean;
  dismissMatch: () => void;
  openChat: () => void;
  profiles: ProfileSeed[];
  cardHeight: number;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryNotice, setGalleryNotice] = useState('');
  const popScale = useRef(new Animated.Value(0.82)).current;
  const popOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!showMatch) return;
    popScale.setValue(0.82);
    popOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(popScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
      Animated.timing(popOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [popOpacity, popScale, showMatch]);
  useEffect(() => {
    setPhotoIndex(0);
    setGalleryNotice('');
  }, [profile.id]);
  const openers = [`Ask ${profile.name} about ${profile.tags[0]?.toLowerCase() || 'her vibe'}.`, `Start with: "${profile.poll.question}"`];
  const remotePhotos = (profile.photos || []).map((url) => ({ uri: resolveMediaUrl(url) })).filter((item) => Boolean(item.uri));
  const photoSlots = remotePhotos.length ? remotePhotos : [profile.photo];
  const totalGallery = Number(profile.fullGallery || profile.gallery || photoSlots.length);
  const changePhoto = (direction: -1 | 1) => setPhotoIndex((value) => {
    if (direction > 0 && value >= photoSlots.length - 1 && totalGallery > photoSlots.length) {
      setGalleryNotice('Add more of your own photos to unlock the rest of this gallery.');
      return value;
    }
    setGalleryNotice('');
    return (value + direction + photoSlots.length) % photoSlots.length;
  });

  return (
    <View style={styles.discovery}>
      <View style={styles.deckShadow} {...swipeHandlers}>
        <ImageBackground source={photoSlots[photoIndex]} resizeMode="cover" style={[styles.profileCard, { height: cardHeight, minHeight: cardHeight }]} imageStyle={styles.profilePhoto}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(18,9,20,0.2)', 'rgba(18,9,20,0.95)']} style={styles.photoOverlay} />
          <View style={styles.photoDots}>
            {photoSlots.map((_, itemIndex) => (
              <View key={itemIndex} style={[styles.photoDot, itemIndex === photoIndex && styles.photoDotActive]} />
            ))}
          </View>
          <View style={styles.tapZones}>
            <TouchableOpacity onPress={() => changePhoto(-1)} style={styles.tapZone} accessibilityLabel="Previous photo" />
            <TouchableOpacity onPress={() => changePhoto(1)} style={styles.tapZone} accessibilityLabel="Next photo" />
          </View>
          {!!galleryNotice && (
            <View style={styles.galleryLockNotice}>
              <Icon name="images" size={17} color="#FFD700" />
              <Text style={styles.galleryLockText}>{galleryNotice}</Text>
            </View>
          )}
          <View style={styles.cardCopy}>
            <View style={styles.pillRow}>
              <Text style={styles.cardBadge}>{profile.match}%</Text>
              <Text style={styles.verifiedBadge}>Active</Text>
            </View>
            <Text style={styles.cardTitle}>{profile.name} <Text style={styles.cardAge}>{profile.age}</Text></Text>
            <Text style={styles.cardSub}>{profile.city} - Kenya{typeof profile.distanceKm === 'number' && profile.distanceKm > 0 ? ` - ${profile.distanceKm} km away` : ''}</Text>
            <Text numberOfLines={2} style={styles.cardPrompt}>{profile.prompt}</Text>
            <View style={styles.tagRow}>{profile.tags.slice(0, 3).map((tag) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
          </View>
          <View style={styles.actionDock}>
            <View style={styles.actionItem}>
              <TouchableOpacity onPress={previous} style={styles.rewindAction} accessibilityLabel="Undo swipe"><Icon name="return-up-back" size={18} color="#C9C3CB" /></TouchableOpacity>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity onPress={passProfile} style={styles.passAction} accessibilityLabel="Pass profile"><Icon name="close" size={30} color="#FFFFFF" /></TouchableOpacity>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity onPress={topProfile} style={styles.topAction} accessibilityLabel="Super like"><Icon name="star" size={22} color="#9BC6FF" /></TouchableOpacity>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity onPress={likeProfile} style={styles.likeAction} accessibilityLabel="Like profile"><Icon name="heart" size={30} color="#FF1200" /></TouchableOpacity>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity onPress={openChat} style={styles.messageAction} accessibilityLabel="Message match"><Icon name="paper-plane" size={21} color="#9BC6FF" /></TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {showMatch && (
        <Animated.View pointerEvents="box-none" style={[styles.matchPopOverlay, { opacity: popOpacity, transform: [{ scale: popScale }] }]}>
        <LinearGradient colors={['#120914', '#FF1493']} style={styles.matchSheet}>
          <View style={styles.matchAvatarPair}>
            <Image source={require('../assets/icon.png')} style={styles.matchAvatarLarge} />
            <Image source={photoSlots[0]} style={[styles.matchAvatarLarge, styles.matchAvatarOverlap]} />
            <View style={styles.floatingHeart}><Icon name="heart" size={18} color="#FFFFFF" /></View>
          </View>
          <Text style={styles.matchKicker}>Ni match</Text>
          <Text style={styles.matchTitle}>You and {profile.name} both felt the Kenyan vibe</Text>
          {openers.map((item) => <Text key={item} style={styles.matchPrompt}>{item}</Text>)}
          <View style={styles.matchActions}>
            <TouchableOpacity onPress={dismissMatch} style={styles.matchSecondary}><Text style={styles.matchSecondaryText}>Keep swiping</Text></TouchableOpacity>
            <TouchableOpacity onPress={openChat} style={styles.matchPrimary}><Text style={styles.matchPrimaryText}>Send a Kenyan romantic intro - 5 tokens</Text></TouchableOpacity>
          </View>
        </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

function ShortcutRail({ setActiveSection }: { setActiveSection: (section: Section) => void }) {
  return (
    <View style={styles.shortcutRail}>
      {shortcuts.map((item) => (
        <TouchableOpacity key={item.id} onPress={() => setActiveSection(item.id)} style={styles.shortcut}>
          <Text style={styles.shortcutLabel}>{item.label}</Text>
          <Text style={styles.shortcutTitle}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FooterNav({ active, setActiveSection, openSwipeDeck, bottomInset }: { active: Section | 'swipe'; setActiveSection: (section: Section | null) => void; openSwipeDeck: () => void; bottomInset: number }) {
  const items: Array<{ key: Section | 'swipe'; label: string; icon: string; target: Section | null; badge?: string }> = [
    { key: 'swipe', label: 'Swipe', icon: 'flame', target: null },
    { key: 'explore', label: 'Explore', icon: 'compass', target: 'explore' },
    { key: 'likes', label: 'Likes', icon: 'heart-outline', target: 'likes', badge: '99+' },
    { key: 'chat', label: 'Chat', icon: 'chatbubble', target: 'chat' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', target: 'profile' },
  ];
  return (
    <View style={[styles.footerNav, { paddingBottom: Math.max(bottomInset, 12), minHeight: 64 + Math.max(bottomInset, 12) }]}>
      {items.map((item) => {
        const selected = active === item.key;
        return (
          <TouchableOpacity key={item.key} onPress={() => item.key === 'swipe' ? openSwipeDeck() : setActiveSection(item.target)} style={styles.footerItem} accessibilityLabel={item.label}>
            <View>
              <Icon name={item.icon} size={21} color={selected ? '#FFFFFF' : 'rgba(255,255,255,0.62)'} />
              {!!item.badge && <Text style={styles.footerBadge}>{item.badge}</Text>}
            </View>
            <Text style={[styles.footerLabel, selected && styles.footerLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ExploreScreen({ openLikes }: { openLikes: () => void }) {
  const tiles: Array<[string, string, string, string]> = [
    ['Long-term partner', 'rose', '1K', '#FF1493'],
    ['Serious commitment', 'diamond', '614', '#F472B6'],
    ['Binge watchers', 'tv', '334', '#FF6F61'],
    ['Sporty', 'fitness', '299', '#60A5FA'],
    ['Coast weekends', 'sunny', '528', '#FFD700'],
    ['Soft romance', 'moon', '487', '#9BC6FF'],
  ];
  return (
    <View>
      <Text style={styles.exploreTitle}>Explore romance vibes</Text>
      <View style={styles.exploreGrid}>
        {tiles.map(([label, icon, count, color]) => (
          <TouchableOpacity key={label} onPress={openLikes} style={styles.exploreTile}>
            <Icon name={icon} size={44} color={color} />
            <View style={styles.exploreTileFooter}>
              <Text style={styles.exploreTileTitle}>{label}</Text>
              <Text style={styles.exploreTileCount}>{count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function LikesScreen({ profiles, openPremium, likeProfile, passProfile }: { profiles: ProfileSeed[]; openPremium: () => void; likeProfile: () => void; passProfile: () => void }) {
  const featured = profiles[0] || localProfiles[0]!;
  const photo = featured.photos?.[0] ? { uri: resolveMediaUrl(featured.photos[0]) } : featured.photo;
  return (
    <View>
      <View style={styles.likesTabs}><Text style={styles.likesTabActive}>99+ Likes</Text><Text style={styles.likesTab}>Likes Sent</Text><Text style={styles.likesTab}>Top Picks</Text></View>
      <Text style={styles.exploreTitle}>Matches your vibe</Text>
      <ImageBackground source={photo} resizeMode="cover" style={styles.likePreviewCard} imageStyle={styles.likePreviewImage}>
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.62)', 'rgba(0,0,0,0.92)']} style={styles.photoOverlay} />
        <View style={styles.likePreviewCopy}>
          <Text style={styles.cardTitle}>{featured.name} <Text style={styles.cardAge}>{featured.age}</Text></Text>
          <Text style={styles.cardPrompt}>{featured.intent || 'Long-term partner'} - {featured.city}</Text>
          <View style={styles.tagRow}>{featured.tags.slice(0, 3).map((tag) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
          <View style={styles.likePreviewActions}>
            <TouchableOpacity onPress={passProfile} style={styles.passAction}><Icon name="close" size={28} color="#FFFFFF" /></TouchableOpacity>
            <TouchableOpacity onPress={likeProfile} style={styles.likeAction}><Icon name="heart" size={29} color="#FF1200" /></TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      <TouchableOpacity onPress={openPremium} style={styles.likesUnlockButton}><Text style={styles.likesUnlockText}>See all your likes now</Text></TouchableOpacity>
    </View>
  );
}

function EmptyDiscovery({ openProfile, status }: { openProfile: () => void; status: string }) {
  return (
    <View style={styles.emptyDiscovery}>
      <Icon name="heart-circle" size={52} color="#FF1493" />
      <Text style={styles.emptyDiscoveryTitle}>Finding Kenyan profiles</Text>
      <Text style={styles.emptyDiscoveryText}>{status === 'Live API connected' || status === 'Distance preferences applied' ? 'No profiles match your current filters yet. Open your profile, widen distance, or refresh after more members upload photos.' : 'Refreshing the RomChat backend. If this stays here, check the backend URL and try again.'}</Text>
      <TouchableOpacity onPress={openProfile} style={styles.emptyDiscoveryButton}><Text style={styles.emptyDiscoveryButtonText}>Improve my profile</Text></TouchableOpacity>
    </View>
  );
}

function HomeNudge({ profile, openProfile, status }: { profile: ProfileSeed; openProfile: () => void; status: string }) {
  return (
    <TouchableOpacity onPress={openProfile} style={styles.homeNudge}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{status}</Text>
        <Text style={styles.nudgeTitle}>{profile.name} likes thoughtful openers</Text>
      </View>
      <Text style={styles.nudgeAction}>View</Text>
    </TouchableOpacity>
  );
}

function Chat({ profiles, readReceipts, setReadReceipts, messageMode, setMessageMode, tokens, setTokens, openTokenStore, sendMessage, sendGift, unlockVideoRequest, videoRequests, status }: {
  profiles: ProfileSeed[];
  readReceipts: boolean;
  setReadReceipts: (value: boolean) => void;
  messageMode: MessageMode;
  setMessageMode: (value: MessageMode) => void;
  tokens: number;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
  openTokenStore: () => void;
  sendMessage: (text: string, matchId?: string) => Promise<unknown>;
  sendGift: (giftId: string) => Promise<void>;
  unlockVideoRequest: (requestId: string) => Promise<unknown>;
  videoRequests: Array<{ id: string; matchId?: string; senderProfileId?: string; title: string; teaser: string; unlockCostTokens: number; status: string }>;
  status: string;
}) {
  const matchPool = profiles;
  const onlineMatches = matchPool.filter((profile) => profile.online === true);
  const orderedMatches = [...onlineMatches, ...matchPool.filter((profile) => profile.online !== true)];
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [threadMessages, setThreadMessages] = useState<Record<string, Array<{ id: string; from: 'You'; text: string; status: string }>>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const selectedMatch = orderedMatches.find((profile) => profile.id === selectedMatchId) || null;
  const visibleThreads = orderedMatches.filter((profile) => `${profile.name} ${profile.city} ${profile.intent} ${profile.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const modeLabel = messageMode === 'standard' ? 'Standard' : messageMode === 'timed' ? 'Vanishes in 24h' : 'View once';
  const promptChips = selectedMatch ? [`Ask ${selectedMatch.name} about ${selectedMatch.tags[0] || 'her vibe'}`, 'Send a rose', 'Suggest Saturday coffee'] : ['Open a match', 'Start soft', 'Keep it respectful'];
  const activePhoto = selectedMatch?.photos?.[0] ? { uri: resolveMediaUrl(selectedMatch.photos[0]) } : selectedMatch?.photo || require('../assets/icon.png');
  const selectedVideoRequests = selectedMatch ? videoRequests.filter((request) => request.matchId === `match_${selectedMatch.id}` || request.senderProfileId === selectedMatch.id) : [];
  const selectedMessages = selectedMatch ? threadMessages[selectedMatch.id] || [] : [];

  function submit() {
    const text = draft.trim();
    if (!text || !selectedMatch) return;
    setDraft('');
    setThreadMessages((current) => ({
      ...current,
      [selectedMatch.id]: [...(current[selectedMatch.id] || []), { id: `local_${Date.now()}`, from: 'You', text, status: readReceipts ? 'Sent - receipt on' : 'Sent' }],
    }));
    void sendMessage(text, `match_${selectedMatch.id}`);
  }

  if (selectedMatch) {
    return (
      <View style={styles.chatScreen}>
        <View style={styles.threadTopBar}>
          <TouchableOpacity onPress={() => setSelectedMatchId(null)} style={styles.chatBackButton}><Icon name="chevron-back" size={20} color="#FFFFFF" /></TouchableOpacity>
          <View style={styles.chatIdentity}>
            <Image source={activePhoto} style={styles.chatHeaderAvatar} />
            <View>
              <Text style={styles.chatName}>{selectedMatch.name}</Text>
              <Text style={styles.chatStatus}>{selectedMatch.online === true ? 'Online now - ready to talk' : 'Matched recently'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.chatIconButton}><Icon name="videocam-outline" size={19} color="#FF1493" /></TouchableOpacity>
            <TouchableOpacity style={styles.chatIconButton}><Icon name="shield-checkmark-outline" size={19} color="#FFFFFF" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.conversationPanel}>
          <View style={styles.signalRow}>
            <Text style={styles.signal}>Read {readReceipts ? 'on' : 'off'}</Text>
            <Text style={styles.signal}>{modeLabel}</Text>
            <Text style={styles.signal}>{tokens} tokens</Text>
          </View>
          <Text style={styles.matchContext}>{selectedMatch.intent} - {selectedMatch.city}{typeof selectedMatch.distanceKm === 'number' && selectedMatch.distanceKm > 0 ? ` - ${selectedMatch.distanceKm} km` : ''}</Text>
          {selectedMessages.length ? selectedMessages.map((message) => (
            <View key={message.id} style={[styles.bubble, styles.sent]}>
              <Text style={styles.sentText}>{message.text}</Text>
              <Text style={styles.sentMeta}>{message.status}</Text>
            </View>
          )) : (
            <View style={styles.emptyThreadCard}>
              <Text style={styles.emptyThreadTitle}>Start the chat freely</Text>
              <Text style={styles.emptyThreadText}>Text messages are open after a match. Tokens only unlock optional 2-minute video vibe requests.</Text>
            </View>
          )}
        </View>

        {selectedVideoRequests.map((request) => (
          <View key={request.id} style={styles.videoInvite}>
            <Text style={styles.videoTitle}>{request.title || '2-minute video vibe request'}</Text>
            <Text style={styles.videoTeaser}>{request.status === 'unlocked' ? 'Video room unlocked. Tap to join when ready.' : request.teaser}</Text>
            <TouchableOpacity onPress={() => {
              if (request.status === 'unlocked') return;
              if (tokens < request.unlockCostTokens) {
                openTokenStore();
                return;
              }
              setTokens((value) => Math.max(0, value - request.unlockCostTokens));
              void unlockVideoRequest(request.id);
            }} style={[styles.unlockButton, request.status === 'unlocked' && styles.unlockButtonDone]}>
              <Text style={styles.unlockButtonText}>{request.status === 'unlocked' ? 'Join video' : tokens < request.unlockCostTokens ? `Buy tokens for video (${request.unlockCostTokens})` : `Unlock 2-min vibe (${request.unlockCostTokens} tokens)`}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.chatTools}>
          <View style={styles.promptRow}>
            {promptChips.map((prompt) => <TouchableOpacity key={prompt} onPress={() => {
              if (prompt === 'Send a rose') {
                if (tokens < 5) {
                  openTokenStore();
                  return;
                }
                setTokens((value) => Math.max(0, value - 5));
                void sendGift('rose');
                return;
              }
              setDraft(prompt);
            }}><Text style={styles.promptChip}>{prompt}</Text></TouchableOpacity>)}
          </View>
          <View style={styles.segment}>
            {(['standard', 'timed', 'viewOnce'] as MessageMode[]).map((mode) => (
              <TouchableOpacity key={mode} onPress={() => setMessageMode(mode)} style={[styles.segmentItem, messageMode === mode && styles.segmentActive]}>
                <Text style={[styles.segmentText, messageMode === mode && styles.segmentTextActive]}>{mode === 'viewOnce' ? 'Once' : mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ToggleRow title="Read receipt add-on" value={readReceipts} onPress={() => setReadReceipts(!readReceipts)} />
        </View>
        <View style={styles.composer}>
          <TextInput value={draft} onChangeText={setDraft} placeholder={`Message ${selectedMatch.name}`} style={styles.input} placeholderTextColor="#a45a72" />
          <TouchableOpacity onPress={submit} style={styles.send}><Icon name="send" size={18} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatInboxHeader}>
        <View>
          <Text style={styles.chatHeroTitle}>Chat</Text>
          <Text style={styles.chatHeroMeta}>{onlineMatches.length} ready now - {orderedMatches.length} matches</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.chatIconButton}><Icon name="shield-checkmark-outline" size={20} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.chatIconButton}><Icon name="chatbubbles-outline" size={20} color="#FF1493" /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="rgba(255,255,255,0.62)" />
        <TextInput value={query} onChangeText={setQuery} placeholder={`Search ${orderedMatches.length} Matches`} placeholderTextColor="rgba(255,255,255,0.58)" style={styles.searchInput} />
      </View>
      <Text style={styles.chatSectionTitle}>New Matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.readyMatchesRail}>
        {onlineMatches.map((profile) => {
          const photo = profile.photos?.[0] ? { uri: resolveMediaUrl(profile.photos[0]) } : profile.photo;
          return (
            <TouchableOpacity key={profile.id} onPress={() => setSelectedMatchId(profile.id)} style={styles.readyMatchCard}>
              <Image source={photo} style={styles.readyMatchPhoto} />
              <View style={styles.onlineDot} />
              <Text numberOfLines={1} style={styles.readyMatchName}>{profile.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.messagesPanel}>
        <Text style={styles.messagesTitle}>Messages</Text>
        {visibleThreads.map((profile, index) => {
          const photo = profile.photos?.[0] ? { uri: resolveMediaUrl(profile.photos[0]) } : profile.photo;
          const preview = index % 3 === 0 ? 'Hello there' : index % 3 === 1 ? profile.prompt : 'Good morning love';
          const yourTurn = index % 2 === 0;
          return (
            <TouchableOpacity key={profile.id} onPress={() => setSelectedMatchId(profile.id)} style={styles.threadRow}>
              <View>
                <Image source={photo} style={styles.threadAvatar} />
                {profile.online !== false && <View style={styles.threadOnlineDot} />}
              </View>
              <View style={styles.threadCopy}>
                <Text numberOfLines={1} style={styles.threadName}>{profile.name}{profile.verified ? ' verified' : ''}</Text>
                <Text numberOfLines={1} style={styles.threadPreview}>{preview}</Text>
              </View>
              {yourTurn ? <Text style={styles.yourTurnPill}>Your Turn</Text> : <Icon name="heart" size={21} color="#FFD700" />}
            </TouchableOpacity>
          );
        })}
        {!visibleThreads.length && <Text style={styles.emptyThreadText}>No matched conversations found. New matches will appear here when they are ready to talk.</Text>}
      </View>
    </View>
  );
}

function Premium({ tokens, boosted, activePlan, activateBoost }: { tokens: number; boosted: boolean; activePlan: string; activateBoost: () => void }) {
  return (
    <View>
      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.walletHero}>
        <Text style={styles.kickerDark}>Token Wallet</Text>
        <Text style={styles.balance}>{tokens} tokens</Text>
        <Text style={styles.heroCopyDark}>Transparent token pricing before every purchase.</Text>
      </LinearGradient>
      <View style={styles.packageGrid}>
        {tokenPackages.map((pack) => (
          <TouchableOpacity key={pack.id} style={[styles.packageCard, pack.badge && styles.packageFeatured]}>
            {!!pack.badge && <Text style={styles.packageBadge}>{pack.badge}</Text>}
            <Text style={styles.packageAmount}>{pack.amount}</Text>
            <Text style={styles.packagePrice}>{pack.price}</Text>
            <Text style={styles.packageUnit}>{pack.unit}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.catalogCard}>
        <Text style={styles.sectionLabel}>Token feature catalog</Text>
        {tokenCatalog.map(([label, cost]) => <View key={label} style={styles.catalogRow}><Text style={styles.catalogLabel}>{label}</Text><Text style={styles.catalogCost}>{cost}</Text></View>)}
      </View>
      <Text style={styles.sectionLabel}>Plus tiers</Text>
      {plans.map((plan) => (
        <LinearGradient key={plan.name} colors={plan.name === 'Gold' ? ['#FF6F61', '#FF1493'] : ['#1E1222', '#120914']} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.name === 'Gold' ? '$19.99/mo' : '$34.99/mo'}</Text>
          </View>
          {['Unlimited Rewinds', 'See Who Liked You', '20 Free Monthly Tokens', 'Priority Likes', 'Incognito Browsing'].map((perk) => <Text key={perk} style={styles.planPerk}>{perk}</Text>)}
        </LinearGradient>
      ))}
      <TouchableOpacity onPress={activateBoost} style={[styles.boostButton, boosted && styles.boostButtonActive]}>
        <Text style={styles.boostText}>{boosted ? 'Spotlight active for 30 minutes' : 'Boost profile for peak hour'}</Text>
      </TouchableOpacity>
      <Text style={styles.complianceText}>Purchases use Google Play Billing or StoreKit. Subscriptions renew automatically unless cancelled in your store account before renewal.</Text>
    </View>
  );
}

function Safety({ incognito, setIncognito, antiGrab, setAntiGrab, verifiedOnly, setVerifiedOnly, updatePrivacy, report, verify, status }: {
  incognito: boolean;
  setIncognito: (value: boolean) => void;
  antiGrab: boolean;
  setAntiGrab: (value: boolean) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
  updatePrivacy: (payload: { incognito: boolean; screenshotsBlocked: boolean; visibleToLikedOnly: boolean }) => void;
  report: () => void;
  verify: () => Promise<void>;
  status: string;
}) {
  function setPrivacy(next: { verifiedOnly?: boolean; incognito?: boolean; antiGrab?: boolean }) {
    const values = {
      verifiedOnly: next.verifiedOnly ?? verifiedOnly,
      incognito: next.incognito ?? incognito,
      antiGrab: next.antiGrab ?? antiGrab,
    };
    setVerifiedOnly(values.verifiedOnly);
    setIncognito(values.incognito);
    setAntiGrab(values.antiGrab);
    updatePrivacy({ incognito: values.incognito, screenshotsBlocked: values.antiGrab, visibleToLikedOnly: values.verifiedOnly });
  }

  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{status}</Text>
        <Text style={styles.title}>Kenyan safety & privacy hub</Text>
        <ToggleRow title="Verified-only discovery" value={verifiedOnly} onPress={() => setPrivacy({ verifiedOnly: !verifiedOnly })} />
        <ToggleRow title="Incognito visibility" value={incognito} onPress={() => setPrivacy({ incognito: !incognito })} />
        <ToggleRow title="Anti-screengrab blocks" value={antiGrab} onPress={() => setPrivacy({ antiGrab: !antiGrab })} />
        <TouchableOpacity onPress={() => void verify()} style={styles.listItem}><Text style={styles.listTitle}>Selfie verification</Text><Text style={styles.caption}>Persona / Smile Identity ready</Text></TouchableOpacity>
        <TouchableOpacity onPress={report} style={styles.listItem}><Text style={styles.listTitle}>Report profile</Text><Text style={styles.caption}>Kenya safety team</Text></TouchableOpacity>
        <TouchableOpacity style={styles.listItem}><Text style={styles.listTitle}>Blocked accounts</Text><Text style={styles.caption}>Manage list</Text></TouchableOpacity>
        <TouchableOpacity style={styles.listItem}><Text style={styles.listTitle}>Community support</Text><Text style={styles.caption}>Get help</Text></TouchableOpacity>
      </View>
      <View style={styles.safetyScore}>
        <Text style={styles.score}>97</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>Safety score</Text>
          <Text style={styles.caption}>Identity, consent, and Kenyan community signals are healthy.</Text>
        </View>
      </View>
    </View>
  );
}

function resolveMediaUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

function Profile({ account, profile, strength, incognito, busy, error, onUploadImage, onSetMainPhoto, onVerifySelfie, onSaveDetails, onSavePrompts, onSaveDiscoverySettings, status, onSignOut }: { account: RomChatAccount | null; profile: RomChatMemberProfile | null; strength: number; incognito: boolean; busy: boolean; error: string; onUploadImage: () => Promise<void>; onSetMainPhoto: (mediaId: string) => Promise<void>; onVerifySelfie: () => Promise<void>; onSaveDetails: (payload: { displayName: string; gender: string; city: string; intent: string; bio: string; interests: string[] }) => Promise<void>; onSavePrompts: (answers: RomChatPromptAnswer[]) => Promise<void>; onSaveDiscoverySettings: (payload: { maxDistanceKm: number; minAge: number; maxAge: number; mapDiscoveryEnabled: boolean }) => Promise<void>; status: string; onSignOut: () => Promise<void> }) {
  const imageCount = profile?.imageCount || 0;
  const computedStrength = profile?.profileStrength || strength;
  const catalogueAccess = Math.min(6, Math.max(1, imageCount));
  const photoMedia = [...(profile?.media || [])].filter((item) => item.mediaType === 'image').sort((a, b) => (a.position || 0) - (b.position || 0));
  const promptSeed = profilePromptTemplates.map((prompt, index) => ({ prompt, answer: profile?.promptAnswers?.[index]?.answer || '' }));
  const [displayName, setDisplayName] = useState(profile?.displayName || account?.name || '');
  const [gender, setGender] = useState(profile?.gender || 'female');
  const [city, setCity] = useState(profile?.city || '');
  const [intent, setIntent] = useState(profile?.intent || 'Serious relationship');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests?.length ? profile.interests : []);
  const [detailsNotice, setDetailsNotice] = useState('');
  const [promptAnswers, setPromptAnswers] = useState<RomChatPromptAnswer[]>(promptSeed);
  useEffect(() => { setPromptAnswers(promptSeed); }, [profile?.memberId, profile?.promptAnswers?.length]);
  useEffect(() => {
    setDisplayName(profile?.displayName || account?.name || '');
    setGender(profile?.gender || 'female');
    setCity(profile?.city || '');
    setIntent(profile?.intent || 'Serious relationship');
    setBio(profile?.bio || '');
    setSelectedInterests(profile?.interests?.length ? profile.interests : []);
    setDetailsNotice('');
  }, [account?.name, profile?.memberId]);
  const toggleEditableInterest = (interest: string) => setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  function saveEditableDetails() {
    if (!displayName.trim()) return setDetailsNotice('Add a display name.');
    if (!gender.trim()) return setDetailsNotice('Choose your gender.');
    if (!city.trim()) return setDetailsNotice('Add your city.');
    if (!intent.trim()) return setDetailsNotice('Choose your dating intention.');
    if (!selectedInterests.length) return setDetailsNotice('Pick at least one interest.');
    if (!bio.trim()) return setDetailsNotice('Write a short bio.');
    setDetailsNotice('');
    void onSaveDetails({ displayName, gender, city, intent, bio, interests: selectedInterests });
  }
  const [distanceKm, setDistanceKm] = useState(profile?.maxDistanceKm || 80);
  const [minAge, setMinAge] = useState(profile?.minAge || 18);
  const [maxAge, setMaxAge] = useState(profile?.maxAge || 80);
  const [mapEnabled, setMapEnabled] = useState(profile?.mapDiscoveryEnabled !== false);
  useEffect(() => {
    setDistanceKm(profile?.maxDistanceKm || 80);
    setMinAge(profile?.minAge || 18);
    setMaxAge(profile?.maxAge || 80);
    setMapEnabled(profile?.mapDiscoveryEnabled !== false);
  }, [profile?.memberId, profile?.maxDistanceKm, profile?.minAge, profile?.maxAge, profile?.mapDiscoveryEnabled]);
  const updateMinAge = (value: number) => setMinAge(Math.min(Math.round(value), maxAge - 1));
  const updateMaxAge = (value: number) => setMaxAge(Math.max(Math.round(value), minAge + 1));
  const completePrompts = promptAnswers.filter((item) => item.prompt && item.answer.trim()).length;
  const profileTasks = [
    [`Images uploaded: ${imageCount}`, imageCount >= 3 ? 'Fuller catalogues unlocked' : 'Add photos to unlock more galleries'],
    [`Catalogue access: ${catalogueAccess} photos`, incognito ? 'Visible after like' : 'Discovery ready'],
    ['Answer 7 prompts', completePrompts === 7 ? 'All prompts live' : `${completePrompts}/7 prompts answered`],
    ['Selfie verification', profile?.selfieVerified ? 'Verified badge active' : 'Verify with a live selfie'],
  ];

  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{account?.email || status}</Text>
        <Text style={styles.title}>{profile?.displayName || account?.name || 'Kenyan profile & vibe'}</Text>
        <Text style={styles.caption}>{profile?.city ? `${profile.city} - ${profile.intent || 'Intentional connection'}` : status}</Text>
        <Text style={styles.profileStrength}>{computedStrength}% complete</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${computedStrength}%` }]} /></View>
        <View style={styles.editProfilePanel}>
          <View style={styles.editProfileHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.distanceTitle}>Profile details</Text>
              <Text style={styles.distanceMeta}>Age is locked after creation. Everything else stays editable.</Text>
            </View>
            <View style={styles.ageLockPill}><Icon name="lock-closed" size={14} color="#120914" /><Text style={styles.ageLockText}>{profile?.age || '--'}</Text></View>
          </View>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor="rgba(255,255,255,0.42)" style={styles.authInput} />
          <View style={styles.lockedAgeRow}>
            <View><Text style={styles.lockedAgeLabel}>Age</Text><Text style={styles.lockedAgeValue}>{profile?.age || '--'} years</Text></View>
            <Text style={styles.lockedAgeBadge}>Locked</Text>
          </View>
          <View style={styles.genderRow}>{['female', 'male', 'nonbinary'].map((item) => <TouchableOpacity key={item} disabled={busy} onPress={() => setGender(item)} style={[styles.genderChip, gender === item && styles.genderChipActive]}><Text style={[styles.genderText, gender === item && styles.genderTextActive]}>{item}</Text></TouchableOpacity>)}</View>
          <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="rgba(255,255,255,0.42)" style={styles.authInput} />
          <TextInput value={bio} onChangeText={setBio} placeholder="Short Kenyan romance bio" placeholderTextColor="rgba(255,255,255,0.42)" style={[styles.authInput, styles.authTextArea]} multiline />
        </View>
        <View style={styles.distancePanel}>
          <View style={styles.distanceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.distanceTitle}>Distance preference</Text>
              <Text style={styles.distanceMeta}>{mapEnabled ? 'Map discovery on' : 'Map discovery paused'} - show people within {distanceKm} km</Text>
            </View>
            <TouchableOpacity disabled={busy} onPress={() => setMapEnabled((value) => !value)} style={[styles.mapToggle, mapEnabled && styles.mapToggleActive]}>
              <Icon name={mapEnabled ? 'map' : 'map-outline'} size={18} color={mapEnabled ? '#120914' : '#FFD700'} />
            </TouchableOpacity>
          </View>
          <Slider value={distanceKm} minimumValue={5} maximumValue={500} step={5} minimumTrackTintColor="#FF1493" maximumTrackTintColor="rgba(255,255,255,0.20)" thumbTintColor="#FFD700" onValueChange={setDistanceKm} />
          <View style={styles.distanceScale}><Text style={styles.distanceScaleText}>5 km</Text><Text style={styles.distanceScaleText}>500 km</Text></View>
          <View style={styles.ageRangeBlock}>
            <View style={styles.ageRangeHeader}>
              <Text style={styles.distanceTitle}>Age range</Text>
              <Text style={styles.ageRangeValue}>{minAge} - {maxAge}</Text>
            </View>
            <Text style={styles.distanceMeta}>Show profiles in this age range, like Tinder discovery.</Text>
            <Slider value={minAge} minimumValue={18} maximumValue={79} step={1} minimumTrackTintColor="#FF1493" maximumTrackTintColor="rgba(255,255,255,0.18)" thumbTintColor="#FFD700" onValueChange={updateMinAge} />
            <Slider value={maxAge} minimumValue={19} maximumValue={80} step={1} minimumTrackTintColor="#FF6F61" maximumTrackTintColor="rgba(255,255,255,0.18)" thumbTintColor="#FFFFFF" onValueChange={updateMaxAge} />
            <View style={styles.distanceScale}><Text style={styles.distanceScaleText}>18</Text><Text style={styles.distanceScaleText}>80+</Text></View>
          </View>
          <TouchableOpacity disabled={busy} onPress={() => void onSaveDiscoverySettings({ maxDistanceKm: distanceKm, minAge, maxAge, mapDiscoveryEnabled: mapEnabled })} style={styles.distanceSaveButton}><Text style={styles.distanceSaveText}>Apply discovery filters</Text></TouchableOpacity>
        </View>
        <View style={styles.photoSlotGrid}>{Array.from({ length: 6 }).map((_, index) => {
          const media = photoMedia[index];
          const uri = resolveMediaUrl(media?.url);
          const isMain = Boolean(media && index === 0);
          return <TouchableOpacity disabled={busy} onPress={() => media?.id ? void onSetMainPhoto(media.id) : void onUploadImage()} key={media?.id || index} style={[styles.photoSlot, isMain && styles.photoSlotMain]}>{uri ? <Image source={{ uri }} style={styles.photoThumb} /> : <Icon name={index < imageCount ? 'image' : 'add'} size={22} color={index < imageCount ? '#FFD700' : '#FF1493'} />}{!uri && <Text style={styles.photoSlotText}>Add</Text>}</TouchableOpacity>;
        })}</View>
        {profileTasks.map(([item, detail]) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>{detail}</Text>
          </View>
        ))}
        <View style={styles.profileActionGrid}><TouchableOpacity disabled={busy} onPress={() => void onUploadImage()} style={styles.profileAction}><Icon name="images" size={18} color="#FFD700" /><Text style={styles.profileActionText}>Add photo</Text></TouchableOpacity><TouchableOpacity disabled={busy || !imageCount} onPress={() => void onVerifySelfie()} style={[styles.profileAction, !imageCount && styles.profileActionDisabled]}><Icon name="shield-checkmark" size={18} color="#FFD700" /><Text style={styles.profileActionText}>{profile?.selfieVerified ? 'Verified' : 'Verify selfie'}</Text></TouchableOpacity></View>{!!error && <Text style={styles.authError}>{error}</Text>}
        <TouchableOpacity onPress={() => void onSignOut()} style={styles.textButton}><Text style={styles.textButtonLabel}>Sign out</Text></TouchableOpacity>
      </View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Bio assistant</Text>
        <Text style={styles.insight}>{bio || profile?.bio || 'One-tap Kenyan bio: I am looking for something warm, honest, and intentional around real dates.'}</Text>
        <Text style={styles.insight}>{selectedInterests.length ? `Vibe signals: ${selectedInterests.join(', ')}` : 'Best dates: Karura walks, Java chats, lakefront sunsets, and food worth remembering.'}</Text>
        <Text style={styles.selectorTitle}>Dating intention in Kenya</Text>
        <View style={styles.choiceWrap}>{datingIntentions.map((item) => <TouchableOpacity key={item} disabled={busy} onPress={() => setIntent(item)} style={[styles.choiceChip, intent === item && styles.choiceChipActive]}><Text style={[styles.choiceText, intent === item && styles.choiceTextActive]}>{item}</Text></TouchableOpacity>)}</View>
        <Text style={styles.selectorTitle}>Interests and vibe signals</Text>
        <View style={styles.choiceWrap}>{datingInterests.map((item) => { const active = selectedInterests.includes(item); return <TouchableOpacity key={item} disabled={busy} onPress={() => toggleEditableInterest(item)} style={[styles.choiceChip, active && styles.choiceChipActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item}</Text></TouchableOpacity>; })}</View>
        {!!detailsNotice && <Text style={styles.validationNudge}>{detailsNotice}</Text>}
        <TouchableOpacity disabled={busy} onPress={saveEditableDetails} style={styles.distanceSaveButton}><Text style={styles.distanceSaveText}>Save profile details</Text></TouchableOpacity>
        <Text style={styles.kicker}>Dating prompts</Text>
        {promptAnswers.map((item, index) => <View key={item.prompt} style={styles.promptEditor}><Text style={styles.promptEditorLabel}>{item.prompt}</Text><TextInput value={item.answer} onChangeText={(answer) => setPromptAnswers((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, answer } : row))} placeholder="Write a charming answer" placeholderTextColor="rgba(255,255,255,0.42)" style={styles.promptEditorInput} multiline /></View>)}
        <TouchableOpacity disabled={busy} onPress={() => void onSavePrompts(promptAnswers)} style={styles.boostButton}><Text style={styles.boostText}>Save 7 profile prompts</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function ToggleRow({ title, value, onPress }: { title: string; value: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.switchRow}>
      <Text style={styles.switchTitle}>{title}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleDot, value && styles.toggleDotOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#120914' },
  safeCenter: { flex: 1, backgroundColor: '#120914', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: '#FFFFFF', fontWeight: '900', marginTop: 14 },
  authSafe: { flex: 1, backgroundColor: '#120914' },
  keyboardAvoider: { flex: 1 },
  authContent: { padding: 20, paddingBottom: 120, flexGrow: 1, justifyContent: 'center' },
  authContentTop: { justifyContent: 'flex-start', paddingTop: 24 },
  authLogo: { color: '#FF1493', fontSize: 30, fontWeight: '900', marginBottom: 10 },
  authTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', lineHeight: 39, marginBottom: 10 },
  authCopy: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', lineHeight: 22, marginBottom: 18 },
  googleButton: { minHeight: 52, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginBottom: 14 },
  googleButtonText: { color: '#120914', fontWeight: '900', fontSize: 16 },
  googleButtonDisabled: { opacity: 0.58 },
  authTabs: { flexDirection: 'row', backgroundColor: '#1E1222', borderRadius: 18, padding: 4, marginBottom: 12 },
  authTab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 15 },
  authTabActive: { backgroundColor: '#FF1493' },
  authTabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '900' },
  authTabTextActive: { color: '#FFFFFF' },
  authInput: { minHeight: 52, borderRadius: 18, backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', paddingHorizontal: 14, color: '#FFFFFF', fontWeight: '800', marginBottom: 10 },
  inputMissing: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  sectionMissing: { borderWidth: 1, borderColor: '#FFD700', borderRadius: 18, padding: 6, backgroundColor: 'rgba(255,215,0,0.06)' },
  passwordRow: { minHeight: 52, borderRadius: 18, backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minHeight: 52, paddingHorizontal: 14, color: '#FFFFFF', fontWeight: '800' },
  passwordEye: { width: 50, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  authTextArea: { minHeight: 92, paddingTop: 14, textAlignVertical: 'top' },
  authPrimary: { minHeight: 54, borderRadius: 18, backgroundColor: '#FF1493', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 12 },
  authPrimaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  authLink: { color: '#FFD700', fontWeight: '900', textAlign: 'center', marginTop: 8 },
  authError: { color: '#FF6F61', fontWeight: '900', lineHeight: 20, marginTop: 4, marginBottom: 8 },
  authSuccess: { color: '#FFD700', fontWeight: '900', lineHeight: 20, marginTop: 2, marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  genderChip: { flex: 1, backgroundColor: '#1E1222', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', paddingVertical: 11, alignItems: 'center' },
  genderChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  genderText: { color: '#FFFFFF', fontWeight: '900', textTransform: 'capitalize' },
  genderTextActive: { color: '#120914' },
  selectorTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, marginTop: 4, marginBottom: 10 },
  selectorTitleMissing: { color: '#FFD700' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  choiceChip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', backgroundColor: '#1E1222', paddingHorizontal: 13, paddingVertical: 10 },
  choiceChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  choiceText: { color: 'rgba(255,255,255,0.78)', fontWeight: '900', fontSize: 13 },
  choiceTextActive: { color: '#120914' },
  uploadCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E1222', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)', padding: 16, marginBottom: 8 },
  uploadCardMissing: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  uploadCardDisabled: { opacity: 0.45 },
  validationNudge: { color: '#FFD700', fontWeight: '900', marginTop: 2, marginBottom: 10, textAlign: 'center' },
  uploadTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  uploadMeta: { color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginTop: 3 },
  content: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#120914' },
  screenContent: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#120914' },
  screenHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#120914', borderBottomWidth: 1, borderBottomColor: 'rgba(255,20,147,0.2)' },
  screenTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1E1222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 20, 147, 0.24)' },
  backButtonText: { color: '#FFFFFF', fontWeight: '900' },
  apiPill: { color: '#FFD700', backgroundColor: '#1E1222', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#FFD700', backgroundColor: '#2A1A30' },
  brand: { color: '#FF1493', fontSize: 25, fontWeight: '900' },
  brandTagline: { color: '#FFD7E6', fontSize: 11, fontWeight: '900', marginTop: 1 },
  caption: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', lineHeight: 18 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', alignItems: 'center', justifyContent: 'center' },
  walletPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E1222', paddingHorizontal: 12, height: 42, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.38)' },
  walletText: { color: '#FFD700', fontWeight: '900', fontSize: 14 },
  safePill: { backgroundColor: '#1E1222', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  safePillText: { color: '#FFD700', fontWeight: '900' },
  discovery: { marginBottom: 4 },
  deckShadow: { borderRadius: 26, marginBottom: 10, shadowColor: '#FF1493', shadowOpacity: 0.34, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  profileCard: { width: '100%', borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#1E1222' },
  profilePhoto: { borderRadius: 28 },
  photoOverlay: { ...StyleSheet.absoluteFillObject },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  tapZone: { flex: 1 },
  photoDots: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', gap: 4 },
  photoDot: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: '#FF1493' },
  galleryLockNotice: { position: 'absolute', top: 28, left: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(18,9,20,0.82)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
  galleryLockText: { flex: 1, color: '#FFFFFF', fontWeight: '900', fontSize: 12, lineHeight: 17 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 30 },
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  verifiedBadge: { color: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.12)', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontWeight: '900', fontSize: 10 },
  cardBadge: { color: '#120914', backgroundColor: '#FFD700', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontWeight: '900', fontSize: 10 },
  cardCopy: { paddingHorizontal: 18, paddingBottom: 118, paddingTop: 56 },
  cardTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900' },
  cardAge: { color: '#FFFFFF', fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '800', marginTop: 2 },
  cardPrompt: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, marginTop: 6, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  photoTag: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, fontWeight: '900', fontSize: 10 },
  actionDock: { position: 'absolute', left: 18, right: 18, bottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 3 },
  actionItem: { alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: 'rgba(255,255,255,0.68)', fontWeight: '900', fontSize: 10, marginTop: 5 },
  passAction: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(20,20,22,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 7 },
  passGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  topAction: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(20,20,22,0.88)', borderWidth: 1, borderColor: 'rgba(155,198,255,0.35)', justifyContent: 'center', alignItems: 'center' },
  likeAction: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(20,20,22,0.88)', borderWidth: 1, borderColor: 'rgba(255,18,0,0.26)', alignItems: 'center', justifyContent: 'center' },
  likeGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  rewindAction: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(20,20,22,0.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' },
  messageAction: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(20,20,22,0.78)', borderWidth: 1, borderColor: 'rgba(155,198,255,0.35)', justifyContent: 'center', alignItems: 'center' },
  smallAction: { backgroundColor: '#1E1222', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  smallActionText: { color: '#FFFFFF', fontWeight: '900' },
  passActionText: { color: '#8A7B89', fontWeight: '900' },
  likeActionText: { color: '#FFFFFF', fontWeight: '900' },
  topActionText: { color: '#FFD700', fontWeight: '900' },
  matchPopOverlay: { position: 'absolute', left: 14, right: 14, top: 96, zIndex: 4 },
  matchSheet: { borderRadius: 28, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)', shadowColor: '#FF1493', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  matchAvatarPair: { height: 116, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 10 },
  matchAvatarLarge: { width: 92, height: 92, borderRadius: 46, borderWidth: 4, borderColor: '#FFD700', backgroundColor: '#1E1222' },
  matchAvatarOverlap: { marginLeft: -22 },
  floatingHeart: { position: 'absolute', top: 44, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF1493', alignItems: 'center', justifyContent: 'center' },
  matchKicker: { color: '#FFD700', fontWeight: '900', textTransform: 'uppercase', fontSize: 12, textAlign: 'center' },
  matchTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 6, marginBottom: 10, textAlign: 'center' },
  matchPrompt: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 12, fontWeight: '800', lineHeight: 20, marginTop: 8 },
  matchActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  matchSecondary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  matchSecondaryText: { color: '#FFFFFF', fontWeight: '900' },
  matchPrimary: { flex: 1.25, alignItems: 'center', paddingVertical: 13, borderRadius: 999, backgroundColor: '#FF1493' },
  matchPrimaryText: { color: '#FFFFFF', fontWeight: '900', textAlign: 'center' },
  shortcutRail: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shortcut: { flex: 1, backgroundColor: '#1E1222', borderRadius: 18, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,20,147,0.2)' },
  shortcutLabel: { color: '#FF1493', fontWeight: '900', fontSize: 12 },
  shortcutTitle: { color: '#FFFFFF', fontWeight: '900', marginTop: 4, fontSize: 12 },
  homeNudge: { backgroundColor: '#1E1222', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 18 },
  emptyDiscovery: { minHeight: 470, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', backgroundColor: '#1E1222', alignItems: 'center', justifyContent: 'center', padding: 24, marginBottom: 18 },
  emptyDiscoveryTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  emptyDiscoveryText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  emptyDiscoveryButton: { backgroundColor: '#FF1493', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13, marginTop: 18 },
  emptyDiscoveryButtonText: { color: '#FFFFFF', fontWeight: '900' },
  footerNav: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, paddingHorizontal: 14, backgroundColor: '#080608', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  footerLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '800' },
  footerLabelActive: { color: '#FFFFFF', fontWeight: '900' },
  footerBadge: { position: 'absolute', top: -7, right: -15, minWidth: 26, color: '#FFFFFF', backgroundColor: '#FF1200', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, textAlign: 'center', fontSize: 9, fontWeight: '900' },
  exploreTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  exploreTile: { width: '47.8%', aspectRatio: 0.78, borderRadius: 22, backgroundColor: '#211B1F', padding: 18, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exploreTileFooter: { gap: 4 },
  exploreTileTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '900' },
  exploreTileCount: { color: 'rgba(255,255,255,0.62)', fontSize: 16, fontWeight: '900' },
  likesTabs: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.10)', marginBottom: 20 },
  likesTab: { flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.58)', paddingBottom: 14, fontWeight: '900' },
  likesTabActive: { flex: 1, textAlign: 'center', color: '#FFFFFF', paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: '#FF1200', fontWeight: '900' },
  likePreviewCard: { minHeight: 520, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#211B1F', marginBottom: 16 },
  likePreviewImage: { borderRadius: 28 },
  likePreviewCopy: { padding: 20 },
  likePreviewActions: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 18 },
  likesUnlockButton: { backgroundColor: '#FFFFFF', borderRadius: 999, alignItems: 'center', paddingVertical: 16, marginBottom: 14 },
  likesUnlockText: { color: '#120914', fontSize: 18, fontWeight: '900' },
  nudgeTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginTop: 3 },
  nudgeAction: { color: '#FFD700', fontWeight: '900' },
  panel: { backgroundColor: '#1E1222', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', padding: 18, marginBottom: 14 },
  chatInboxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, marginBottom: 18 },
  chatHeroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  chatHeroMeta: { color: 'rgba(255,255,255,0.58)', fontWeight: '900', marginTop: 3 },
  searchBox: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  searchInput: { flex: 1, minHeight: 48, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  chatSectionTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginBottom: 12 },
  readyMatchesRail: { gap: 16, paddingRight: 12, paddingBottom: 18 },
  readyMatchCard: { width: 86, alignItems: 'center' },
  readyMatchPhoto: { width: 84, height: 104, borderRadius: 18, backgroundColor: '#1E1222' },
  onlineDot: { position: 'absolute', top: 4, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A', borderWidth: 3, borderColor: '#120914' },
  readyMatchName: { color: '#FFFFFF', fontWeight: '900', marginTop: 7, maxWidth: 86, textAlign: 'center' },
  messagesPanel: { backgroundColor: '#111011', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  messagesTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginBottom: 8 },
  threadRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  threadAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#241528' },
  threadOnlineDot: { position: 'absolute', right: 1, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#16A34A', borderWidth: 2, borderColor: '#111011' },
  threadCopy: { flex: 1, minWidth: 0 },
  threadName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  threadPreview: { color: 'rgba(255,255,255,0.62)', fontSize: 15, fontWeight: '800', marginTop: 4 },
  yourTurnPill: { color: '#120914', backgroundColor: '#FFFFFF', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 13, paddingVertical: 7, fontWeight: '900', fontSize: 12 },
  emptyThreadCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,20,147,0.16)', borderRadius: 18, padding: 16, marginTop: 8 },
  emptyThreadTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 17, marginBottom: 5, textAlign: 'center' },
  emptyThreadText: { color: 'rgba(255,255,255,0.62)', fontWeight: '800', lineHeight: 21, paddingVertical: 18, textAlign: 'center' },
  threadTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  chatBackButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1E1222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,20,147,0.20)' },
  matchContext: { color: '#FFD700', fontWeight: '900', marginBottom: 10, lineHeight: 18 },
  chatScreen: { backgroundColor: '#120914', paddingBottom: 24 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  chatIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatInboxStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E1222', borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,20,147,0.18)' },
  chatScreenTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  chatTokenPill: { color: '#120914', backgroundColor: '#FFD700', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7, fontWeight: '900' },
  conversationPanel: { backgroundColor: '#1E1222', borderRadius: 22, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,20,147,0.18)' },
  chatIconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A1A30', borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', alignItems: 'center', justifyContent: 'center' },
  chatTools: { backgroundColor: '#1E1222', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: 'rgba(255,20,147,0.14)' },
  chatHeaderAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#FF1493' },
  chatName: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  chatStatus: { color: '#16A34A', fontWeight: '800', fontSize: 12 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  kicker: { color: '#FF1493', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerLight: { color: '#FFE9F1', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerDark: { color: '#120914', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginBottom: 12 },
  sectionLabel: { color: '#FFD700', fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, fontSize: 12 },
  insight: { color: '#FFFFFF', backgroundColor: '#2A1A30', borderRadius: 16, padding: 13, marginTop: 8, fontWeight: '800', lineHeight: 21 },
  newMatches: { flexDirection: 'row', gap: 12, paddingRight: 8, marginBottom: 14 },
  matchAvatarWrap: { alignItems: 'center', gap: 6 },
  matchAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#FF1493' },
  matchAvatarText: { color: 'rgba(255,255,255,0.72)', fontWeight: '900', fontSize: 12 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  signal: { backgroundColor: '#2A1A30', color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden', fontWeight: '900', fontSize: 12 },
  promptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  promptChip: { backgroundColor: '#FFD700', color: '#120914', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900', fontSize: 12 },
  videoInvite: { backgroundColor: '#1E1222', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FF1493', alignItems: 'center' },
  videoTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  videoTeaser: { color: 'rgba(255,255,255,0.68)', fontWeight: '800', lineHeight: 21, marginTop: 6, textAlign: 'center' },
  lockedReply: { backgroundColor: '#1E1222', borderWidth: 1, borderColor: '#FFD700', borderRadius: 20, padding: 16, marginVertical: 10, gap: 8 },
  lockedHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lockedTitle: { color: '#FFD700', fontWeight: '900', fontSize: 13 },
  blurredMask: { color: 'rgba(255,255,255,0.24)', fontSize: 16, letterSpacing: 2, lineHeight: 24 },
  lockedText: { color: 'rgba(255,255,255,0.72)', fontWeight: '800', fontSize: 13, lineHeight: 20 },
  unlockButton: { backgroundColor: '#FFD700', borderRadius: 14, alignItems: 'center', paddingVertical: 13, marginTop: 8 },
  unlockButtonDone: { backgroundColor: '#16A34A' },
  unlockButtonText: { color: '#120914', fontWeight: '900' },
  bubble: { maxWidth: '86%', padding: 13, borderRadius: 20, marginVertical: 5 },
  sent: { alignSelf: 'flex-end', backgroundColor: '#FF1493', borderBottomRightRadius: 4 },
  received: { alignSelf: 'flex-start', backgroundColor: '#1E1222', borderBottomLeftRadius: 4 },
  sentText: { color: '#FFFFFF', fontWeight: '800', lineHeight: 22 },
  receivedText: { color: '#FFFFFF', fontWeight: '800', lineHeight: 22 },
  sentMeta: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '900', marginTop: 6 },
  receivedMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', marginTop: 6 },
  segment: { flexDirection: 'row', backgroundColor: '#1E1222', borderRadius: 18, padding: 4, marginVertical: 12 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 15 },
  segmentActive: { backgroundColor: '#FF1493' },
  segmentText: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', textTransform: 'capitalize', fontSize: 12 },
  segmentTextActive: { color: '#FFFFFF' },
  giftRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  giftButton: { flex: 1, backgroundColor: '#1E1222', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)' },
  giftName: { color: '#FFFFFF', fontWeight: '900' },
  giftMeta: { color: '#FFD700', fontWeight: '900', marginTop: 4, fontSize: 12 },
  composer: { flexDirection: 'row', gap: 8, marginTop: 14, backgroundColor: '#1E1222', borderRadius: 999, padding: 5, borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)' },
  input: { flex: 1, minHeight: 42, paddingHorizontal: 14, color: '#FFFFFF' },
  send: { width: 42, height: 42, backgroundColor: '#FF1493', borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#FFFFFF', fontWeight: '900' },
  walletHero: { borderRadius: 28, padding: 20, marginBottom: 14 },
  balance: { color: '#120914', fontSize: 44, fontWeight: '900' },
  heroCopy: { color: '#FFE9F1', fontWeight: '800', lineHeight: 22, marginTop: 8 },
  heroCopyDark: { color: '#3E2400', fontWeight: '900', lineHeight: 22, marginTop: 8 },
  packageGrid: { gap: 10, marginBottom: 14 },
  packageCard: { backgroundColor: '#1E1222', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', padding: 16 },
  packageFeatured: { borderColor: '#FFD700' },
  packageBadge: { alignSelf: 'flex-start', color: '#120914', backgroundColor: '#FFD700', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontWeight: '900', fontSize: 11, marginBottom: 8 },
  packageAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  packagePrice: { color: '#FF1493', fontWeight: '900', fontSize: 18, marginTop: 3 },
  packageUnit: { color: 'rgba(255,255,255,0.62)', fontWeight: '800', marginTop: 3 },
  catalogCard: { backgroundColor: '#1E1222', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)', padding: 16, marginBottom: 16 },
  catalogRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  catalogLabel: { color: '#FFFFFF', fontWeight: '800' },
  catalogCost: { color: '#FFD700', fontWeight: '900' },
  planCard: { borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(255,215,0,0.28)', marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  planPrice: { color: '#FFD700', fontWeight: '900', fontSize: 16 },
  planPerk: { color: '#FFFFFF', fontWeight: '800', paddingVertical: 5 },
  boostButton: { backgroundColor: '#FFD700', padding: 18, borderRadius: 22, alignItems: 'center', marginTop: 12, marginBottom: 14 },
  boostButtonActive: { backgroundColor: '#FF6F61' },
  boostText: { color: '#120914', fontWeight: '900' },
  textButton: { alignItems: 'center', paddingVertical: 12 },
  textButtonLabel: { color: '#FFD700', fontWeight: '900' },
  complianceText: { color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginBottom: 18 },
  listItem: { backgroundColor: '#2A1A30', borderRadius: 18, padding: 15, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,20,147,0.14)' },
  listTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', borderRadius: 20, padding: 16, marginBottom: 12 },
  switchTitle: { flex: 1, fontWeight: '900', color: '#FFFFFF', paddingRight: 10 },
  toggleTrack: { width: 52, height: 30, borderRadius: 999, backgroundColor: '#4B384F', padding: 3 },
  toggleTrackOn: { backgroundColor: '#FF1493' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleDotOn: { transform: [{ translateX: 22 }] },
  safetyScore: { flexDirection: 'row', gap: 16, backgroundColor: '#1E1222', borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)' },
  score: { width: 76, height: 76, borderRadius: 38, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#FFD700', color: '#120914', fontSize: 30, fontWeight: '900', overflow: 'hidden' },
  scoreTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  progress: { height: 9, backgroundColor: '#2A1A30', borderRadius: 999, overflow: 'hidden', marginVertical: 12 },
  progressFill: { height: 9, backgroundColor: '#FF1493' },
  profileStrength: { color: '#FFD700', fontWeight: '900', fontSize: 18 },
  editProfilePanel: { backgroundColor: '#241528', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', padding: 14, marginTop: 12, marginBottom: 12 },
  editProfileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  ageLockPill: { minWidth: 54, height: 38, borderRadius: 999, backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10 },
  ageLockText: { color: '#120914', fontWeight: '900' },
  lockedAgeRow: { minHeight: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.26)', paddingHorizontal: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedAgeLabel: { color: 'rgba(255,255,255,0.58)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  lockedAgeValue: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginTop: 2 },
  lockedAgeBadge: { color: '#120914', backgroundColor: '#FFD700', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontWeight: '900', fontSize: 11 },
  distancePanel: { backgroundColor: '#2A1A30', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,20,147,0.24)', padding: 14, marginTop: 12, marginBottom: 12 },
  distanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  distanceTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  distanceMeta: { color: 'rgba(255,255,255,0.66)', fontWeight: '800', marginTop: 3, lineHeight: 18 },
  mapToggle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,215,0,0.45)', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1222' },
  mapToggleActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  distanceScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  distanceScaleText: { color: 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: '800' },
  ageRangeBlock: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14 },
  ageRangeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ageRangeValue: { color: '#FFD700', fontWeight: '900', fontSize: 16 },
  distanceSaveButton: { marginTop: 10, backgroundColor: '#FF1493', borderRadius: 999, alignItems: 'center', paddingVertical: 12 },
  distanceSaveText: { color: '#FFFFFF', fontWeight: '900' },
  photoSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  photoSlot: { width: '30.5%', aspectRatio: 0.82, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,20,147,0.25)', backgroundColor: '#2A1A30', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  photoSlotMain: { borderColor: '#FFD700', borderWidth: 2 },
  photoSlotText: { color: 'rgba(255,255,255,0.86)', fontWeight: '900', fontSize: 12, position: 'absolute', left: 6, right: 6, bottom: 7, textAlign: 'center', backgroundColor: 'rgba(18,9,20,0.72)', borderRadius: 999, overflow: 'hidden', paddingVertical: 4 },
  photoThumb: { width: '100%', height: '100%', borderRadius: 12 },
  profileActionGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  profileAction: { flex: 1, minHeight: 54, borderRadius: 18, backgroundColor: '#2A1A30', borderWidth: 1, borderColor: 'rgba(255,215,0,0.24)', alignItems: 'center', justifyContent: 'center', gap: 5 },
  profileActionText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12, textAlign: 'center' },
  profileActionDisabled: { opacity: 0.48 },
  promptEditor: { backgroundColor: '#2A1A30', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,20,147,0.18)', padding: 12, marginTop: 9 },
  promptEditorLabel: { color: '#FFD700', fontWeight: '900', marginBottom: 7 },
  promptEditorInput: { minHeight: 46, color: '#FFFFFF', fontWeight: '800', lineHeight: 20, textAlignVertical: 'top' },
});

