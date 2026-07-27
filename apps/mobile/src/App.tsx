import React, { useMemo, useState } from 'react';
import type { GestureResponderHandlers, ImageSourcePropType } from 'react-native';
import {
  Image,
  ImageBackground,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRomChatData } from './features/romchat/hooks';

type Section = 'chat' | 'premium' | 'safety' | 'profile';
type MessageMode = 'standard' | 'timed' | 'viewOnce';

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
  tags: string[];
  answers: string[];
  poll: { question: string; yes: number; no: number };
  color: string;
  photo: ImageSourcePropType;
};

const localProfiles: ProfileSeed[] = [
  {
    id: 'elena',
    name: 'Elena',
    age: 26,
    city: 'New York',
    match: 94,
    intent: 'Long-term, slow burn',
    prompt: 'Coffee, galleries, and dinner where phones stay away.',
    voiceNote: '10s voice note: Saturday jazz, morning markets, quiet confidence.',
    videoPrompt: 'Loop: golden-hour walk through a design district.',
    quote: 'Green flags are consistency, curiosity, and calm effort.',
    song: 'Currently replaying: Sweet Disposition',
    gallery: 9,
    tags: ['Architecture', 'Jazz', 'Travel'],
    answers: ['Quiet confidence', 'Dinner first', 'Texts with substance'],
    poll: { question: 'Pineapple on pizza?', yes: 62, no: 38 },
    color: '#ff4f88',
    photo: require('../assets/romchat/profile-elena.png'),
  },
  {
    id: 'amara',
    name: 'Amara',
    age: 29,
    city: 'Brooklyn',
    match: 91,
    intent: 'Ready for partnership',
    prompt: 'Thoughtful dinners, film nights, and tiny rituals.',
    voiceNote: '10s voice note: I will remember your coffee order.',
    videoPrompt: 'Loop: candlelit pasta night with a film queue.',
    quote: 'A good date feels like the conversation had somewhere to go.',
    song: 'Currently replaying: Golden Hour',
    gallery: 10,
    tags: ['Cooking', 'Design', 'Film'],
    answers: ['Plan the date', 'Acts of service', 'Sunday market'],
    poll: { question: 'Plan the date or freestyle?', yes: 74, no: 26 },
    color: '#ff6a3d',
    photo: require('../assets/romchat/profile-amara.png'),
  },
  {
    id: 'noah',
    name: 'Noah',
    age: 31,
    city: 'Jersey City',
    match: 88,
    intent: 'Intentional connection',
    prompt: 'Runner, builder, and the friend who books the table.',
    voiceNote: '10s voice note: Sunday run, bookstore, rooftop sunset.',
    videoPrompt: 'Loop: city run ending at a skyline cafe.',
    quote: 'The best relationships are playful and deeply reliable.',
    song: 'Currently replaying: Lost in Yesterday',
    gallery: 8,
    tags: ['Books', 'Rooftops', 'Running'],
    answers: ['Early flight', 'Rooftop view', 'Calls over voice notes'],
    poll: { question: 'Early flight or late checkout?', yes: 57, no: 43 },
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
  { name: 'Gold', price: '$19', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts'] },
  { name: 'Platinum', price: '$39', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'] },
];

const gifts = [
  { id: 'rose', name: 'Rose', tokens: 5 },
  { id: 'coffee', name: 'Coffee', tokens: 12 },
  { id: 'spotlight', name: 'Spotlight', tokens: 30 },
];

const tokenPackages = [
  { id: 'tokens_100', amount: 100, price: '$4.99', unit: '$0.05/ea', badge: '' },
  { id: 'tokens_350', amount: 350, price: '$12.99', unit: '$0.03/ea', badge: 'MOST POPULAR' },
  { id: 'tokens_1000', amount: 1000, price: '$29.99', unit: '$0.02/ea', badge: 'BEST VALUE' },
];

const tokenCatalog = [
  ['Unlock voice/photo media', '10'],
  ['Accept video request', '25'],
  ['Send rose', '5'],
  ['Priority message', '15'],
  ['Reveal admirer', '22'],
  ['Extend match', '9'],
];

const starterMessages = [
  ['Elena', 'Your answer about building a life with room for quiet days was rare.', 'Seen 8:41 PM'],
  ['You', 'The best connection feels calm before it feels exciting.', 'Read'],
  ['Elena', 'That deserves a golden-hour walk. Saturday?', 'Typing now'],
];

const screenTitles: Record<Section, string> = {
  chat: 'Inbox',
  premium: 'RomChat Plus',
  safety: 'Safety Center',
  profile: 'My Profile',
};

export default function App() {
  const romchat = useRomChatData(localProfiles);
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 32);
  const bottomContentPadding = bottomInset + 72;
  const profiles = romchat.profiles.length ? (romchat.profiles as ProfileSeed[]) : localProfiles;
  const profile = profiles[index % profiles.length]!;
  const strength = useMemo(() => 82 + (verifiedOnly ? 5 : 0) + (incognito ? 4 : 0) + (antiGrab ? 3 : 0), [verifiedOnly, incognito, antiGrab]);
  const activePlan = boosted ? 'Platinum' : 'Gold';

  function passProfile() {
    void romchat.swipe(profile.id, 'pass');
    setIndex((value) => (value + 1) % profiles.length);
    setShowMatch(false);
  }

  function previous() {
    setIndex((value) => (value - 1 + profiles.length) % profiles.length);
    setShowMatch(false);
  }

  function likeProfile(action: 'like' | 'super_like' = 'like') {
    void romchat.swipe(profile.id, action);
    setShowMatch(true);
  }

  const swipeHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dy) < 24,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx > 48) {
            void romchat.swipe(profile.id, 'like');
            setShowMatch(true);
          }
          if (gesture.dx < -48) {
            void romchat.swipe(profile.id, 'pass');
            setIndex((value) => (value + 1) % profiles.length);
            setShowMatch(false);
          }
        },
      }).panHandlers,
    [profile.id, profiles.length, romchat]
  );

  function renderSection(section: Section) {
    if (section === 'chat') {
      return (
        <Chat
          readReceipts={readReceipts}
          setReadReceipts={setReadReceipts}
          messageMode={messageMode}
          setMessageMode={setMessageMode}
          tokens={tokens}
          setTokens={setTokens}
          sendMessage={romchat.sendMessage}
          sendGift={romchat.sendGift}
          unlockMessage={romchat.unlockMessage}
          unlockVideoRequest={romchat.unlockVideoRequest}
          paidMessages={romchat.paidMessages}
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
          report={() => void romchat.report(profile.id)}
          verify={romchat.verify}
          status={romchat.lastAction}
        />
      );
    }
    return <Profile strength={strength} incognito={incognito} verify={romchat.verify} status={romchat.lastAction} />;
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
        >
          {renderSection(activeSection)}
        </ScrollView>
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
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setActiveSection('profile')} style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
            <Text style={styles.brand}>RomChat</Text>
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

        <Discover
          profile={profile}
          passProfile={passProfile}
          likeProfile={() => likeProfile('like')}
          topProfile={() => likeProfile('super_like')}
          previous={previous}
          swipeHandlers={swipeHandlers}
          showMatch={showMatch}
          dismissMatch={passProfile}
          openChat={() => {
            setShowMatch(false);
            setActiveSection('chat');
          }}
          profiles={profiles}
        />

        <HomeNudge profile={profile} openProfile={() => setActiveSection('profile')} status={romchat.lastAction} />
      </ScrollView>
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
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const openers = [`Ask ${profile.name} about ${profile.tags[0]?.toLowerCase()}.`, `Start with: "${profile.poll.question}"`];
  const photoSlots = [profile.photo, profile.photo, profile.photo];
  const changePhoto = (direction: -1 | 1) => setPhotoIndex((value) => (value + direction + photoSlots.length) % photoSlots.length);

  return (
    <View style={styles.discovery}>
      <View style={styles.deckShadow} {...swipeHandlers}>
        <ImageBackground source={photoSlots[photoIndex]} resizeMode="cover" style={styles.profileCard} imageStyle={styles.profilePhoto}>
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
          <View style={styles.cardCopy}>
            <View style={styles.pillRow}>
              <Text style={styles.cardBadge}>{profile.match}% Match</Text>
              <Text style={styles.verifiedBadge}>Verified</Text>
            </View>
            <Text style={styles.cardTitle}>{profile.name}, {profile.age}</Text>
            <Text style={styles.cardSub}>{profile.city} - 2 mi away</Text>
            <Text style={styles.cardPrompt}>{profile.prompt}</Text>
            <View style={styles.tagRow}>{profile.tags.map((tag) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.actionDock}>
        <View style={styles.actionItem}>
          <TouchableOpacity onPress={passProfile} style={styles.passAction} accessibilityLabel="Pass profile"><Icon name="close" size={25} color="#8A7B89" /></TouchableOpacity>
          <Text style={styles.actionLabel}>Pass</Text>
        </View>
        <View style={styles.actionItem}>
          <TouchableOpacity onPress={topProfile} style={styles.topAction} accessibilityLabel="Super like"><Icon name="star" size={28} color="#FFD700" /></TouchableOpacity>
          <Text style={styles.actionLabel}>Super</Text>
        </View>
        <View style={styles.actionItem}>
          <TouchableOpacity onPress={likeProfile} style={styles.likeAction} accessibilityLabel="Like profile"><LinearGradient colors={['#FF1493', '#FF6F61']} style={styles.likeGradient}><Icon name="heart" size={36} color="#FFFFFF" /></LinearGradient></TouchableOpacity>
          <Text style={styles.actionLabel}>Like</Text>
        </View>
        <View style={styles.actionItem}>
          <TouchableOpacity onPress={previous} style={styles.rewindAction} accessibilityLabel="Undo swipe"><Icon name="return-up-back" size={22} color="#FFD700" /></TouchableOpacity>
          <Text style={styles.actionLabel}>Undo</Text>
        </View>
      </View>

      {showMatch && (
        <LinearGradient colors={['#120914', '#FF1493']} style={styles.matchSheet}>
          <View style={styles.matchAvatarPair}>
            <Image source={require('../assets/icon.png')} style={styles.matchAvatarLarge} />
            <Image source={profile.photo} style={[styles.matchAvatarLarge, styles.matchAvatarOverlap]} />
            <View style={styles.floatingHeart}><Icon name="heart" size={18} color="#FFFFFF" /></View>
          </View>
          <Text style={styles.matchKicker}>It is a match</Text>
          <Text style={styles.matchTitle}>You and {profile.name} both felt it</Text>
          {openers.map((item) => <Text key={item} style={styles.matchPrompt}>{item}</Text>)}
          <View style={styles.matchActions}>
            <TouchableOpacity onPress={dismissMatch} style={styles.matchSecondary}><Text style={styles.matchSecondaryText}>Keep swiping</Text></TouchableOpacity>
            <TouchableOpacity onPress={openChat} style={styles.matchPrimary}><Text style={styles.matchPrimaryText}>Send a romantic intro - 5 tokens</Text></TouchableOpacity>
          </View>
        </LinearGradient>
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

function Chat({ readReceipts, setReadReceipts, messageMode, setMessageMode, tokens, setTokens, sendMessage, sendGift, unlockMessage, unlockVideoRequest, paidMessages, videoRequests, status }: {
  readReceipts: boolean;
  setReadReceipts: (value: boolean) => void;
  messageMode: MessageMode;
  setMessageMode: (value: MessageMode) => void;
  tokens: number;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
  sendMessage: (text: string) => Promise<unknown>;
  sendGift: (giftId: string) => Promise<void>;
  unlockMessage: (messageId: string) => Promise<unknown>;
  unlockVideoRequest: (requestId: string) => Promise<unknown>;
  paidMessages: Array<{ id: string; text: string; locked?: boolean; unlockCostTokens?: number; unlockedByActor?: boolean }>;
  videoRequests: Array<{ id: string; title: string; teaser: string; unlockCostTokens: number; status: string }>;
  status: string;
}) {
  const [draft, setDraft] = useState('');
  const modeLabel = messageMode === 'standard' ? 'Standard' : messageMode === 'timed' ? 'Vanishes in 24h' : 'View once';
  const promptChips = ['Ask about the gallery date', 'Send a rose', 'Suggest Saturday coffee'];

  function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void sendMessage(text);
  }

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatHeader}>
        <View style={styles.chatIdentity}>
          <Image source={localProfiles[0]!.photo} style={styles.chatHeaderAvatar} />
          <View>
            <Text style={styles.chatName}>Elena</Text>
            <Text style={styles.chatStatus}>Online now</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}><Icon name="videocam-outline" size={22} color="#FF1493" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}><Icon name="shield-checkmark-outline" size={22} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.kicker}>{status}</Text>
      <View style={styles.newMatches}>
        {localProfiles.map((profile) => (
          <View key={profile.id} style={styles.matchAvatarWrap}>
            <Image source={profile.photo} style={styles.matchAvatar} />
            <Text style={styles.matchAvatarText}>{profile.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.signalRow}>
        <Text style={styles.signal}>Read {readReceipts ? 'on' : 'off'}</Text>
        <Text style={styles.signal}>Typing live</Text>
        <Text style={styles.signal}>{modeLabel}</Text>
      </View>
      <View style={styles.promptRow}>
        {promptChips.map((prompt) => <Text key={prompt} style={styles.promptChip}>{prompt}</Text>)}
      </View>
      {videoRequests.map((request) => (
        <View key={request.id} style={styles.videoInvite}>
          <Text style={styles.videoTitle}>{request.title}</Text>
          <Text style={styles.videoTeaser}>{request.status === 'unlocked' ? 'Video room unlocked. Tap to join when ready.' : request.teaser}</Text>
          <TouchableOpacity onPress={() => { if (request.status !== 'unlocked') { setTokens((value) => Math.max(0, value - request.unlockCostTokens)); void unlockVideoRequest(request.id); } }} style={[styles.unlockButton, request.status === 'unlocked' && styles.unlockButtonDone]}>
            <Text style={styles.unlockButtonText}>{request.status === 'unlocked' ? 'Join video' : `Accept video request (${request.unlockCostTokens} tokens)`}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {starterMessages.map(([from, text, messageStatus]) => (
        <View key={text} style={[styles.bubble, from === 'You' ? styles.sent : styles.received]}>
          <Text style={from === 'You' ? styles.sentText : styles.receivedText}>{text}</Text>
          <Text style={from === 'You' ? styles.sentMeta : styles.receivedMeta}>{messageStatus}</Text>
        </View>
      ))}
      {paidMessages.map((message) => (
        <View key={message.id} style={styles.lockedReply}>
          <View style={styles.lockedHeader}><Icon name="lock-closed" size={18} color="#FFD700" /><Text style={styles.lockedTitle}>Blurred media preview</Text></View>
          <Text style={styles.blurredMask}>{message.locked && !message.unlockedByActor ? '#### ####### ##### ### ########' : message.text}</Text>
          <Text style={styles.lockedText}>Basic text stays free. Unlock only this optional voice note.</Text>
          <TouchableOpacity onPress={() => { if (message.locked && !message.unlockedByActor) { setTokens((value) => Math.max(0, value - Number(message.unlockCostTokens || 10))); void unlockMessage(message.id); } }} style={[styles.unlockButton, message.unlockedByActor && styles.unlockButtonDone]}>
            <Text style={styles.unlockButtonText}>{message.unlockedByActor ? 'Media unlocked' : `Unlock media (${message.unlockCostTokens || 10} tokens)`}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.segment}>
        {(['standard', 'timed', 'viewOnce'] as MessageMode[]).map((mode) => (
          <TouchableOpacity key={mode} onPress={() => setMessageMode(mode)} style={[styles.segmentItem, messageMode === mode && styles.segmentActive]}>
            <Text style={[styles.segmentText, messageMode === mode && styles.segmentTextActive]}>{mode === 'viewOnce' ? 'Once' : mode}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ToggleRow title="Read receipt add-on" value={readReceipts} onPress={() => setReadReceipts(!readReceipts)} />
      <View style={styles.giftRow}>
        {gifts.map((gift) => (
          <TouchableOpacity key={gift.id} onPress={() => { setTokens((value) => Math.max(0, value - gift.tokens)); void sendGift(gift.id); }} style={styles.giftButton}>
            <Text style={styles.giftName}>{gift.name}</Text>
            <Text style={styles.giftMeta}>{gift.tokens} tokens</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.composer}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Send a charming message" style={styles.input} placeholderTextColor="#a45a72" />
        <TouchableOpacity onPress={submit} style={styles.send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
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
        <Text style={styles.title}>Safety & privacy hub</Text>
        <ToggleRow title="Verified-only discovery" value={verifiedOnly} onPress={() => setPrivacy({ verifiedOnly: !verifiedOnly })} />
        <ToggleRow title="Incognito visibility" value={incognito} onPress={() => setPrivacy({ incognito: !incognito })} />
        <ToggleRow title="Anti-screengrab blocks" value={antiGrab} onPress={() => setPrivacy({ antiGrab: !antiGrab })} />
        <TouchableOpacity onPress={() => void verify()} style={styles.listItem}><Text style={styles.listTitle}>Selfie verification</Text><Text style={styles.caption}>Persona / Smile Identity ready</Text></TouchableOpacity>
        <TouchableOpacity onPress={report} style={styles.listItem}><Text style={styles.listTitle}>Report profile</Text><Text style={styles.caption}>Safety team</Text></TouchableOpacity>
        <TouchableOpacity style={styles.listItem}><Text style={styles.listTitle}>Blocked accounts</Text><Text style={styles.caption}>Manage list</Text></TouchableOpacity>
        <TouchableOpacity style={styles.listItem}><Text style={styles.listTitle}>Community support</Text><Text style={styles.caption}>Get help</Text></TouchableOpacity>
      </View>
      <View style={styles.safetyScore}>
        <Text style={styles.score}>97</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>Safety score</Text>
          <Text style={styles.caption}>Identity and consent signals are healthy.</Text>
        </View>
      </View>
    </View>
  );
}

function Profile({ strength, incognito, verify, status }: { strength: number; incognito: boolean; verify: () => Promise<void>; status: string }) {
  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{status}</Text>
        <Text style={styles.title}>Profile & vibe</Text>
        <Text style={styles.profileStrength}>{strength}% complete</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${strength}%` }]} /></View>
        <View style={styles.photoSlotGrid}>{Array.from({ length: 6 }).map((_, index) => <View key={index} style={styles.photoSlot}><Icon name={index < 3 ? 'image' : 'add'} size={22} color={index < 3 ? '#FFD700' : '#FF1493'} /><Text style={styles.photoSlotText}>{index < 3 ? `Photo ${index + 1}` : 'Add'}</Text></View>)}</View>
        {['15-second voice intro', 'Video prompt recorder', 'Pick a song', 'Answer 7 prompts'].map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>{item === 'Answer 7 prompts' && incognito ? 'Visible after like' : 'Ready'}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => void verify()} style={styles.boostButton}><Text style={styles.boostText}>Submit selfie verification</Text></TouchableOpacity>
      </View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Bio assistant</Text>
        <Text style={styles.insight}>One-tap romantic bio: I am looking for something warm, direct, and built around small rituals.</Text>
        <Text style={styles.insight}>Best dates: a walk with room for honest conversation, then food worth remembering.</Text>
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
  content: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#120914' },
  screenContent: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#120914' },
  screenHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#120914', borderBottomWidth: 1, borderBottomColor: 'rgba(255,20,147,0.2)' },
  screenTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1E1222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 20, 147, 0.24)' },
  backButtonText: { color: '#FFFFFF', fontWeight: '900' },
  apiPill: { color: '#FFD700', backgroundColor: '#1E1222', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 38, height: 38, borderRadius: 14 },
  brand: { color: '#FF1493', fontSize: 25, fontWeight: '900' },
  caption: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', lineHeight: 18 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', alignItems: 'center', justifyContent: 'center' },
  walletPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E1222', paddingHorizontal: 12, height: 42, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.38)' },
  walletText: { color: '#FFD700', fontWeight: '900', fontSize: 14 },
  safePill: { backgroundColor: '#1E1222', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  safePillText: { color: '#FFD700', fontWeight: '900' },
  discovery: { marginBottom: 12 },
  deckShadow: { borderRadius: 28, marginBottom: 18, shadowColor: '#FF1493', shadowOpacity: 0.34, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  profileCard: { minHeight: 560, aspectRatio: 9 / 14.5, width: '100%', borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#1E1222' },
  profilePhoto: { borderRadius: 28 },
  photoOverlay: { ...StyleSheet.absoluteFillObject },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  tapZone: { flex: 1 },
  photoDots: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', gap: 4 },
  photoDot: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: '#FF1493' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 30 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  verifiedBadge: { color: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.12)', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontWeight: '900', fontSize: 12 },
  cardBadge: { color: '#120914', backgroundColor: '#FFD700', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontWeight: '900', fontSize: 12 },
  cardCopy: { padding: 20, paddingTop: 40 },
  cardTitle: { color: '#FFFFFF', fontSize: 40, fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.72)', fontSize: 15, fontWeight: '800', marginTop: 4 },
  cardPrompt: { color: '#FFFFFF', fontSize: 16, lineHeight: 23, marginTop: 10, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoTag: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, fontWeight: '900', fontSize: 12 },
  actionDock: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 14, marginTop: -2, marginBottom: 18, paddingBottom: 12 },
  actionItem: { alignItems: 'center', justifyContent: 'flex-start', minWidth: 58 },
  actionLabel: { color: 'rgba(255,255,255,0.72)', fontWeight: '900', fontSize: 11, marginTop: 7 },
  passAction: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E1222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  topAction: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E1222', borderWidth: 1.5, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  likeAction: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden' },
  likeGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  rewindAction: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1222', borderWidth: 1, borderColor: 'rgba(255,215,0,0.24)', justifyContent: 'center', alignItems: 'center' },
  smallAction: { backgroundColor: '#1E1222', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  smallActionText: { color: '#FFFFFF', fontWeight: '900' },
  passActionText: { color: '#8A7B89', fontWeight: '900' },
  likeActionText: { color: '#FFFFFF', fontWeight: '900' },
  topActionText: { color: '#FFD700', fontWeight: '900' },
  matchSheet: { borderRadius: 28, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
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
  nudgeTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginTop: 3 },
  nudgeAction: { color: '#FFD700', fontWeight: '900' },
  panel: { backgroundColor: '#1E1222', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,20,147,0.22)', padding: 18, marginBottom: 14 },
  chatScreen: { backgroundColor: '#120914', paddingBottom: 28 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1E1222' },
  chatIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatHeaderAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#FF1493' },
  chatName: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  chatStatus: { color: '#16A34A', fontWeight: '800', fontSize: 12 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  kicker: { color: '#FF1493', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerLight: { color: '#FFE9F1', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerDark: { color: '#120914', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginBottom: 12 },
  sectionLabel: { color: '#FFD700', fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, fontSize: 12 },
  insight: { color: '#FFFFFF', backgroundColor: '#2A1A30', borderRadius: 16, padding: 13, marginTop: 8, fontWeight: '800', lineHeight: 21 },
  newMatches: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  matchAvatarWrap: { alignItems: 'center', gap: 6 },
  matchAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#FF1493' },
  matchAvatarText: { color: 'rgba(255,255,255,0.72)', fontWeight: '900', fontSize: 12 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  signal: { backgroundColor: '#2A1A30', color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden', fontWeight: '900', fontSize: 12 },
  promptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  promptChip: { backgroundColor: '#FFD700', color: '#120914', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900', fontSize: 12 },
  videoInvite: { backgroundColor: '#1E1222', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FF1493', alignItems: 'center' },
  videoTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, lineHeight: 24, textAlign: 'center' },
  videoTeaser: { color: 'rgba(255,255,255,0.68)', fontWeight: '800', lineHeight: 21, marginTop: 6, textAlign: 'center' },
  lockedReply: { backgroundColor: '#1E1222', borderWidth: 1, borderColor: '#FFD700', borderRadius: 20, padding: 16, marginVertical: 10, gap: 8 },
  lockedHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lockedTitle: { color: '#FFD700', fontWeight: '900', fontSize: 13 },
  blurredMask: { color: 'rgba(255,255,255,0.24)', fontSize: 16, letterSpacing: 2, lineHeight: 24 },
  lockedText: { color: 'rgba(255,255,255,0.72)', fontWeight: '800', fontSize: 13, lineHeight: 20 },
  unlockButton: { backgroundColor: '#FFD700', borderRadius: 14, alignItems: 'center', paddingVertical: 13, marginTop: 8 },
  unlockButtonDone: { backgroundColor: '#16A34A' },
  unlockButtonText: { color: '#120914', fontWeight: '900' },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: 20, marginVertical: 6 },
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
  composer: { flexDirection: 'row', gap: 8, marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,20,147,0.26)', borderRadius: 999, paddingHorizontal: 16, color: '#FFFFFF', backgroundColor: '#1E1222' },
  send: { backgroundColor: '#FF1493', borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
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
  photoSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  photoSlot: { width: '30.5%', aspectRatio: 0.82, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,20,147,0.25)', backgroundColor: '#2A1A30', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoSlotText: { color: 'rgba(255,255,255,0.72)', fontWeight: '900', fontSize: 12 },
});
