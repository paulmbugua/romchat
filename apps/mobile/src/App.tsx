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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

const profiles: ProfileSeed[] = [
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
  { name: 'Rose', tokens: 12 },
  { name: 'Coffee', tokens: 30 },
  { name: 'Spotlight', tokens: 80 },
];

const starterMessages = [
  ['Elena', 'Your answer about building a life with room for quiet days was rare.', 'Seen 8:41 PM'],
  ['You', 'The best connection feels calm before it feels exciting.', 'Read'],
  ['Elena', 'That deserves a golden-hour walk. Saturday?', 'Typing now'],
];

export default function App() {
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
  const bottomInset = Math.max(insets.bottom, 16);
  const profile = profiles[index % profiles.length]!;
  const strength = useMemo(() => 82 + (verifiedOnly ? 5 : 0) + (incognito ? 4 : 0) + (antiGrab ? 3 : 0), [verifiedOnly, incognito, antiGrab]);
  const activePlan = boosted ? 'Platinum' : 'Gold';

  function passProfile() {
    setIndex((value) => (value + 1) % profiles.length);
    setShowMatch(false);
    setActiveSection(null);
  }

  function previous() {
    setIndex((value) => (value - 1 + profiles.length) % profiles.length);
    setShowMatch(false);
    setActiveSection(null);
  }

  function likeProfile() {
    setShowMatch(true);
    setActiveSection(null);
  }

  const swipeHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dy) < 24,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx > 48) setShowMatch(true);
          if (gesture.dx < -48) {
            setIndex((value) => (value + 1) % profiles.length);
            setShowMatch(false);
            setActiveSection(null);
          }
        },
      }).panHandlers,
    []
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff6f9" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomInset }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
            <View>
              <Text style={styles.brand}>RomChat</Text>
              <Text style={styles.caption}>Swipe. Match. Chat.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setActiveSection('safety')} style={styles.safePill}>
            <Text style={styles.safePillText}>Safe</Text>
          </TouchableOpacity>
        </View>

        <Discover
          profile={profile}
          passProfile={passProfile}
          likeProfile={likeProfile}
          previous={previous}
          swipeHandlers={swipeHandlers}
          showMatch={showMatch}
          dismissMatch={passProfile}
          openChat={() => {
            setShowMatch(false);
            setActiveSection('chat');
          }}
        />

        <ShortcutRail activeSection={activeSection} setActiveSection={setActiveSection} />

        {activeSection == null && <HomeNudge profile={profile} openProfile={() => setActiveSection('profile')} />}
        {activeSection === 'chat' && (
          <Chat
            readReceipts={readReceipts}
            setReadReceipts={setReadReceipts}
            messageMode={messageMode}
            setMessageMode={setMessageMode}
            tokens={tokens}
            setTokens={setTokens}
          />
        )}
        {activeSection === 'premium' && (
          <Premium tokens={tokens} setTokens={setTokens} boosted={boosted} setBoosted={setBoosted} activePlan={activePlan} />
        )}
        {activeSection === 'safety' && (
          <Safety
            incognito={incognito}
            setIncognito={setIncognito}
            antiGrab={antiGrab}
            setAntiGrab={setAntiGrab}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
          />
        )}
        {activeSection === 'profile' && <Profile strength={strength} incognito={incognito} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Discover({
  profile,
  passProfile,
  likeProfile,
  previous,
  swipeHandlers,
  showMatch,
  dismissMatch,
  openChat,
}: {
  profile: ProfileSeed;
  passProfile: () => void;
  likeProfile: () => void;
  previous: () => void;
  swipeHandlers: GestureResponderHandlers;
  showMatch: boolean;
  dismissMatch: () => void;
  openChat: () => void;
}) {
  const openers = [
    `Ask ${profile.name} about ${profile.tags[0]?.toLowerCase()}.`,
    `Start with: "${profile.poll.question}"`,
  ];

  return (
    <View style={styles.discovery}>
      <TouchableOpacity activeOpacity={0.96} onPress={likeProfile} style={styles.deckShadow} {...swipeHandlers}>
        <ImageBackground source={profile.photo} resizeMode="cover" style={styles.profileCard} imageStyle={styles.profilePhoto}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(42,0,18,0.18)', 'rgba(28,0,14,0.9)']} style={styles.photoOverlay} />
          <View style={styles.photoDots}>
            {profiles.map((item) => (
              <View key={item.id} style={[styles.photoDot, item.id === profile.id && styles.photoDotActive]} />
            ))}
          </View>
          <View style={styles.cardTopRow}>
            <Text style={styles.verifiedBadge}>Verified</Text>
            <Text style={styles.cardBadge}>{profile.match}%</Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{profile.name}, {profile.age}</Text>
            <Text style={styles.cardSub}>{profile.city} - {profile.intent}</Text>
            <Text style={styles.cardPrompt}>{profile.prompt}</Text>
            <View style={styles.tagRow}>{profile.tags.map((tag) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.actionDock}>
        <TouchableOpacity onPress={previous} style={styles.smallAction}><Text style={styles.smallActionText}>Back</Text></TouchableOpacity>
        <TouchableOpacity onPress={passProfile} style={styles.passAction}><Text style={styles.passActionText}>Pass</Text></TouchableOpacity>
        <TouchableOpacity onPress={likeProfile} style={styles.likeAction}><Text style={styles.likeActionText}>Like</Text></TouchableOpacity>
        <TouchableOpacity onPress={likeProfile} style={styles.topAction}><Text style={styles.topActionText}>Top</Text></TouchableOpacity>
      </View>

      {showMatch && (
        <LinearGradient colors={['#ff2f73', '#ff7a59']} style={styles.matchSheet}>
          <Text style={styles.matchKicker}>It is a match</Text>
          <Text style={styles.matchTitle}>Say hi to {profile.name}</Text>
          {openers.map((item) => <Text key={item} style={styles.matchPrompt}>{item}</Text>)}
          <View style={styles.matchActions}>
            <TouchableOpacity onPress={dismissMatch} style={styles.matchSecondary}><Text style={styles.matchSecondaryText}>Keep swiping</Text></TouchableOpacity>
            <TouchableOpacity onPress={openChat} style={styles.matchPrimary}><Text style={styles.matchPrimaryText}>Chat</Text></TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

function ShortcutRail({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section | null;
  setActiveSection: (section: Section | null) => void;
}) {
  return (
    <View style={styles.shortcutRail}>
      {shortcuts.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => setActiveSection(activeSection === item.id ? null : item.id)}
          style={[styles.shortcut, activeSection === item.id && styles.shortcutActive]}
        >
          <Text style={[styles.shortcutLabel, activeSection === item.id && styles.shortcutLabelActive]}>{item.label}</Text>
          <Text style={[styles.shortcutTitle, activeSection === item.id && styles.shortcutTitleActive]}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HomeNudge({ profile, openProfile }: { profile: ProfileSeed; openProfile: () => void }) {
  return (
    <TouchableOpacity onPress={openProfile} style={styles.homeNudge}>
      <View>
        <Text style={styles.kicker}>Today</Text>
        <Text style={styles.nudgeTitle}>{profile.name} likes thoughtful openers</Text>
      </View>
      <Text style={styles.nudgeAction}>View</Text>
    </TouchableOpacity>
  );
}

function Chat({ readReceipts, setReadReceipts, messageMode, setMessageMode, tokens, setTokens }: {
  readReceipts: boolean;
  setReadReceipts: (value: boolean) => void;
  messageMode: MessageMode;
  setMessageMode: (value: MessageMode) => void;
  tokens: number;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
}) {
  const modeLabel = messageMode === 'standard' ? 'Standard' : messageMode === 'timed' ? 'Vanishes in 24h' : 'View once';
  const promptChips = ['Ask about the gallery date', 'Send a rose', 'Suggest Saturday coffee'];

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Inbox</Text>
      <Text style={styles.title}>Elena is typing</Text>
      <View style={styles.newMatches}>
        {profiles.map((profile) => (
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
      {starterMessages.map(([from, text, status]) => (
        <View key={text} style={[styles.bubble, from === 'You' ? styles.sent : styles.received]}>
          <Text style={from === 'You' ? styles.sentText : styles.receivedText}>{text}</Text>
          <Text style={from === 'You' ? styles.sentMeta : styles.receivedMeta}>{status}</Text>
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
          <TouchableOpacity key={gift.name} onPress={() => setTokens((value) => Math.max(0, value - gift.tokens))} style={styles.giftButton}>
            <Text style={styles.giftName}>{gift.name}</Text>
            <Text style={styles.giftMeta}>{gift.tokens} tokens</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.composer}>
        <TextInput placeholder="Send a charming message" style={styles.input} placeholderTextColor="#a45a72" />
        <TouchableOpacity style={styles.send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function Premium({ tokens, setTokens, boosted, setBoosted, activePlan }: {
  tokens: number;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
  boosted: boolean;
  setBoosted: (value: boolean) => void;
  activePlan: string;
}) {
  return (
    <View>
      <LinearGradient colors={['#ff2f73', '#ff7a59', '#8a3ffc']} style={styles.walletHero}>
        <Text style={styles.kickerLight}>RomChat Plus</Text>
        <Text style={styles.balance}>{tokens} tokens</Text>
        <Text style={styles.heroCopy}>Boost, unblur admirers, and send priority likes without crowding discovery.</Text>
      </LinearGradient>
      {plans.map((plan) => (
        <View key={plan.name} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}/mo</Text>
          </View>
          {plan.perks.map((perk) => <Text key={perk} style={styles.planPerk}>{perk}</Text>)}
        </View>
      ))}
      <TouchableOpacity onPress={() => setBoosted(!boosted)} style={[styles.boostButton, boosted && styles.boostButtonActive]}>
        <Text style={styles.boostText}>{boosted ? 'Spotlight active for 30 minutes' : 'Boost profile for peak hour'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Safety({ incognito, setIncognito, antiGrab, setAntiGrab, verifiedOnly, setVerifiedOnly }: {
  incognito: boolean;
  setIncognito: (value: boolean) => void;
  antiGrab: boolean;
  setAntiGrab: (value: boolean) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
}) {
  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Trust</Text>
        <Text style={styles.title}>Date safely</Text>
        <ToggleRow title="Verified-only discovery" value={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)} />
        <ToggleRow title="Incognito visibility" value={incognito} onPress={() => setIncognito(!incognito)} />
        <ToggleRow title="Anti-screengrab blocks" value={antiGrab} onPress={() => setAntiGrab(!antiGrab)} />
        {['Selfie verification', 'Report profile', 'Block contacts'].map((item) => (
          <TouchableOpacity key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>Ready</Text>
          </TouchableOpacity>
        ))}
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

function Profile({ strength, incognito }: { strength: number; incognito: boolean }) {
  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Strength {strength}%</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${strength}%` }]} /></View>
        {['Add 6 photos', 'Record voice', 'Pick a song', 'Answer 7 prompts'].map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>{item === 'Answer 7 prompts' && incognito ? 'Visible after like' : 'Ready'}</Text>
          </View>
        ))}
      </View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Bio assistant</Text>
        <Text style={styles.insight}>I am looking for something warm, direct, and built around small rituals.</Text>
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
  safe: { flex: 1, backgroundColor: '#fff6f9' },
  content: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff6f9' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 14 },
  brand: { color: '#ff2f73', fontSize: 28, fontWeight: '900' },
  caption: { color: '#9a5269', fontWeight: '800', lineHeight: 18 },
  safePill: { backgroundColor: '#ffe4ee', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  safePillText: { color: '#8a2947', fontWeight: '900' },
  discovery: { marginBottom: 10 },
  deckShadow: { borderRadius: 30, marginBottom: 12, shadowColor: '#a0003a', shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  profileCard: { height: 610, borderRadius: 30, overflow: 'hidden', justifyContent: 'space-between' },
  profilePhoto: { borderRadius: 30 },
  photoOverlay: { ...StyleSheet.absoluteFillObject },
  photoDots: { position: 'absolute', left: 18, right: 18, top: 14, flexDirection: 'row', gap: 6 },
  photoDot: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)' },
  photoDotActive: { backgroundColor: 'white' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 30 },
  verifiedBadge: { color: 'white', backgroundColor: '#1da1f2', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900' },
  cardBadge: { color: '#ff2f73', backgroundColor: 'white', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, fontWeight: '900' },
  cardCopy: { padding: 20 },
  cardTitle: { color: 'white', fontSize: 48, fontWeight: '900' },
  cardSub: { color: '#ffd1df', fontSize: 16, fontWeight: '900', marginTop: 5 },
  cardPrompt: { color: 'white', fontSize: 18, lineHeight: 26, marginTop: 12, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  photoTag: { color: 'white', backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, fontWeight: '900' },
  actionDock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  smallAction: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: '#ffd0df' },
  smallActionText: { color: '#8a2947', fontWeight: '900' },
  passAction: { backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 15, borderRadius: 999, borderWidth: 1, borderColor: '#ffd0df' },
  passActionText: { color: '#8a2947', fontWeight: '900' },
  likeAction: { backgroundColor: '#ff2f73', paddingHorizontal: 38, paddingVertical: 16, borderRadius: 999 },
  likeActionText: { color: 'white', fontWeight: '900' },
  topAction: { backgroundColor: '#ffcf33', paddingHorizontal: 18, paddingVertical: 15, borderRadius: 999 },
  topActionText: { color: '#4a2600', fontWeight: '900' },
  matchSheet: { borderRadius: 26, padding: 18, marginTop: 14 },
  matchKicker: { color: '#ffe9f1', fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  matchTitle: { color: 'white', fontSize: 30, fontWeight: '900', marginTop: 5, marginBottom: 10 },
  matchPrompt: { color: '#2b0716', backgroundColor: 'white', borderRadius: 16, padding: 12, fontWeight: '800', lineHeight: 20, marginTop: 8 },
  matchActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  matchSecondary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  matchSecondaryText: { color: 'white', fontWeight: '900' },
  matchPrimary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 999, backgroundColor: 'white' },
  matchPrimaryText: { color: '#ff2f73', fontWeight: '900' },
  shortcutRail: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shortcut: { flex: 1, backgroundColor: 'white', borderRadius: 18, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ffd0df' },
  shortcutActive: { backgroundColor: '#ff2f73', borderColor: '#ff2f73' },
  shortcutLabel: { color: '#ff2f73', fontWeight: '900', fontSize: 12 },
  shortcutLabelActive: { color: '#ffe9f1' },
  shortcutTitle: { color: '#2b0716', fontWeight: '900', marginTop: 4, fontSize: 12 },
  shortcutTitleActive: { color: 'white' },
  homeNudge: { backgroundColor: 'white', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#ffd0df', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nudgeTitle: { color: '#2b0716', fontWeight: '900', fontSize: 16, marginTop: 3 },
  nudgeAction: { color: '#ff2f73', fontWeight: '900' },
  panel: { backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#ffd0df', padding: 18, marginBottom: 14 },
  kicker: { color: '#ff2f73', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerLight: { color: '#ffe9f1', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  title: { color: '#2b0716', fontSize: 28, fontWeight: '900', marginBottom: 12 },
  insight: { color: '#5f1730', backgroundColor: '#fff0f6', borderRadius: 16, padding: 13, marginTop: 8, fontWeight: '800', lineHeight: 21 },
  newMatches: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  matchAvatarWrap: { alignItems: 'center', gap: 6 },
  matchAvatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: '#ff2f73' },
  matchAvatarText: { color: '#8a2947', fontWeight: '900', fontSize: 12 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  signal: { backgroundColor: '#ffe4ee', color: '#8a2947', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden', fontWeight: '900', fontSize: 12 },
  promptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  promptChip: { backgroundColor: '#ffcf33', color: '#4a2600', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900', fontSize: 12 },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: 22, marginVertical: 6 },
  sent: { alignSelf: 'flex-end', backgroundColor: '#ff2f73', borderBottomRightRadius: 4 },
  received: { alignSelf: 'flex-start', backgroundColor: '#fff0f6', borderBottomLeftRadius: 4 },
  sentText: { color: 'white', fontWeight: '800', lineHeight: 22 },
  receivedText: { color: '#2b0716', fontWeight: '800', lineHeight: 22 },
  sentMeta: { color: '#ffd1df', fontSize: 11, fontWeight: '900', marginTop: 6 },
  receivedMeta: { color: '#b06a80', fontSize: 11, fontWeight: '900', marginTop: 6 },
  segment: { flexDirection: 'row', backgroundColor: '#fff0f6', borderRadius: 18, padding: 4, marginVertical: 12 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 15 },
  segmentActive: { backgroundColor: '#2b0716' },
  segmentText: { color: '#8a2947', fontWeight: '900', textTransform: 'capitalize', fontSize: 12 },
  segmentTextActive: { color: 'white' },
  giftRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  giftButton: { flex: 1, backgroundColor: '#fff0f6', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#ffd0df' },
  giftName: { color: '#2b0716', fontWeight: '900' },
  giftMeta: { color: '#ff2f73', fontWeight: '900', marginTop: 4, fontSize: 12 },
  composer: { flexDirection: 'row', gap: 8, marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ffc0d5', borderRadius: 999, paddingHorizontal: 16, color: '#2b0716', backgroundColor: '#fffafd' },
  send: { backgroundColor: '#2b0716', borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: 'white', fontWeight: '900' },
  walletHero: { borderRadius: 26, padding: 20, marginBottom: 14 },
  balance: { color: 'white', fontSize: 46, fontWeight: '900' },
  heroCopy: { color: '#ffe9f1', fontWeight: '800', lineHeight: 22, marginTop: 8 },
  planCard: { backgroundColor: 'white', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#ffd0df', marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { color: '#2b0716', fontSize: 24, fontWeight: '900' },
  planPrice: { color: '#ff2f73', fontWeight: '900', fontSize: 18 },
  planPerk: { color: '#5f1730', fontWeight: '800', paddingVertical: 5 },
  boostButton: { backgroundColor: '#ffcf33', padding: 18, borderRadius: 22, alignItems: 'center', marginBottom: 14 },
  boostButtonActive: { backgroundColor: '#ff7a59' },
  boostText: { color: '#4a2600', fontWeight: '900' },
  listItem: { backgroundColor: '#fff0f6', borderRadius: 18, padding: 15, marginTop: 10 },
  listTitle: { color: '#2b0716', fontWeight: '900', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#ffd0df', borderRadius: 20, padding: 16, marginBottom: 12 },
  switchTitle: { flex: 1, fontWeight: '900', color: '#2b0716', paddingRight: 10 },
  toggleTrack: { width: 52, height: 30, borderRadius: 999, backgroundColor: '#efd1dc', padding: 3 },
  toggleTrackOn: { backgroundColor: '#ff2f73' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white' },
  toggleDotOn: { transform: [{ translateX: 22 }] },
  safetyScore: { flexDirection: 'row', gap: 16, backgroundColor: '#fff0f6', borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#ffd0df' },
  score: { width: 76, height: 76, borderRadius: 38, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#ffcf33', color: '#4a2600', fontSize: 30, fontWeight: '900', overflow: 'hidden' },
  scoreTitle: { color: '#2b0716', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  progress: { height: 9, backgroundColor: '#ffe4ee', borderRadius: 999, overflow: 'hidden', marginVertical: 12 },
  progressFill: { height: 9, backgroundColor: '#ff2f73' },
});
