import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'discover' | 'chat' | 'premium' | 'safety' | 'profile';
type MessageMode = 'standard' | 'timed' | 'viewOnce';

const profiles = [
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
    tags: ['Architecture', 'Jazz', 'Travel'],
    poll: { question: 'Pineapple on pizza?', yes: 62, no: 38 },
    color: '#a63646',
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
    tags: ['Cooking', 'Design', 'Film'],
    poll: { question: 'Plan the date or freestyle?', yes: 74, no: 26 },
    color: '#df8072',
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
    tags: ['Books', 'Rooftops', 'Running'],
    poll: { question: 'Early flight or late checkout?', yes: 57, no: 43 },
    color: '#26c6c4',
  },
];

const plans = [
  { name: 'Gold', price: '$19', perks: ['Unlimited likes', 'See admirers', 'Undo swipes', 'Read receipts'] },
  { name: 'Platinum', price: '$39', perks: ['Priority likes', 'Passport mode', 'Weekly boost', 'Incognito included'] },
];

const gifts = [
  { name: 'Rose', tokens: 12, cash: '$0.40' },
  { name: 'Coffee', tokens: 30, cash: '$1.20' },
  { name: 'Spotlight', tokens: 80, cash: '$3.50' },
];

const starterMessages = [
  ['Elena', 'Your answer about building a life with room for quiet days was rare.', 'Seen 8:41 PM'],
  ['You', 'The best connection feels calm before it feels exciting.', 'Read'],
  ['Elena', 'That deserves a golden-hour walk. Saturday?', 'Typing now'],
];

export default function App() {
  const [tab, setTab] = useState<Tab>('discover');
  const [index, setIndex] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [incognito, setIncognito] = useState(true);
  const [antiGrab, setAntiGrab] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [messageMode, setMessageMode] = useState<MessageMode>('timed');
  const [tokens, setTokens] = useState(146);
  const [boosted, setBoosted] = useState(false);
  const [pollYes, setPollYes] = useState(true);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const profile = profiles[index % profiles.length];
  const strength = useMemo(() => 86 + (verifiedOnly ? 4 : 0) + (incognito ? 3 : 0), [verifiedOnly, incognito]);
  const activePlan = boosted ? 'Platinum' : 'Gold';

  function next() {
    setIndex((value) => (value + 1) % profiles.length);
    setPollYes(true);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9fc" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <View>
            <Text style={styles.brand}>RomChat</Text>
            <Text style={styles.caption}>Verified chemistry</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyText}>Verified</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 112 + bottomInset }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === 'discover' && (
          <Discover
            profile={profile}
            next={next}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            pollYes={pollYes}
            setPollYes={setPollYes}
          />
        )}
        {tab === 'chat' && (
          <Chat
            readReceipts={readReceipts}
            setReadReceipts={setReadReceipts}
            messageMode={messageMode}
            setMessageMode={setMessageMode}
            tokens={tokens}
            setTokens={setTokens}
          />
        )}
        {tab === 'premium' && (
          <Premium tokens={tokens} setTokens={setTokens} boosted={boosted} setBoosted={setBoosted} activePlan={activePlan} />
        )}
        {tab === 'safety' && (
          <Safety incognito={incognito} setIncognito={setIncognito} antiGrab={antiGrab} setAntiGrab={setAntiGrab} />
        )}
        {tab === 'profile' && <Profile strength={strength} incognito={incognito} />}
      </ScrollView>

      <View style={[styles.nav, { bottom: bottomInset }]}>
        {(['discover', 'chat', 'premium', 'safety', 'profile'] as Tab[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.navItem, tab === item && styles.navItemActive]}>
            <Text style={[styles.navText, tab === item && styles.navTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Discover({ profile, next, verifiedOnly, setVerifiedOnly, pollYes, setPollYes }: any) {
  const openers = [
    `Ask ${profile.name} about ${profile.tags[0].toLowerCase()} and the one place that changed their taste.`,
    `Invite a low-pressure debate: "${profile.poll.question}"`,
    `Connect on intent: "${profile.intent}" without making it feel like an interview.`,
  ];

  return (
    <View>
      <View style={[styles.profileCard, { backgroundColor: profile.color }]}>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{profile.match}% compatible</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.slice(0, 1)}</Text>
        </View>
        <Text style={styles.cardTitle}>{profile.name}, {profile.age}</Text>
        <Text style={styles.cardSub}>{profile.city} - {profile.intent}</Text>
        <Text style={styles.cardPrompt}>{profile.prompt}</Text>
        <View style={styles.tagRow}>{profile.tags.map((tag: string) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
        <View style={styles.mediaRow}>
          <Text style={styles.mediaPill}>{profile.voiceNote}</Text>
          <Text style={styles.mediaPill}>{profile.videoPrompt}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={next} style={styles.pass}><Text style={styles.passText}>Pass</Text></TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.like}><Text style={styles.likeText}>Like</Text></TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.spark}><Text style={styles.sparkText}>Priority</Text></TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.kicker}>AI icebreakers</Text>
        {openers.map((item) => <Text key={item} style={styles.insight}>{item}</Text>)}
      </View>

      <View style={styles.pollCard}>
        <Text style={styles.kicker}>Vibe check</Text>
        <Text style={styles.pollTitle}>{profile.poll.question}</Text>
        <View style={styles.pollSplit}>
          <TouchableOpacity onPress={() => setPollYes(true)} style={[styles.pollChoice, pollYes && styles.pollChoiceActive]}>
            <Text style={[styles.pollText, pollYes && styles.pollTextActive]}>Yes {profile.poll.yes}%</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPollYes(false)} style={[styles.pollChoice, !pollYes && styles.pollChoiceActive]}>
            <Text style={[styles.pollText, !pollYes && styles.pollTextActive]}>No {profile.poll.no}%</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ToggleRow title="Verified-only discovery" value={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)} />
    </View>
  );
}

function Chat({ readReceipts, setReadReceipts, messageMode, setMessageMode, tokens, setTokens }: any) {
  const modeLabel = messageMode === 'standard' ? 'Standard' : messageMode === 'timed' ? 'Vanishes in 24h' : 'View once';

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Live chat</Text>
      <Text style={styles.title}>Elena is typing</Text>
      <Text style={styles.notice}>Trust insight: verified member, healthy pace, private media guard active.</Text>
      <View style={styles.signalRow}>
        <Text style={styles.signal}>Read receipts {readReceipts ? 'on' : 'off'}</Text>
        <Text style={styles.signal}>Typing live</Text>
        <Text style={styles.signal}>{modeLabel}</Text>
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
          <TouchableOpacity key={gift.name} onPress={() => setTokens(Math.max(0, tokens - gift.tokens))} style={styles.giftButton}>
            <Text style={styles.giftName}>{gift.name}</Text>
            <Text style={styles.giftMeta}>{gift.tokens} tokens</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.composer}>
        <TextInput placeholder="Send a thoughtful message" style={styles.input} placeholderTextColor="#8a7576" />
        <TouchableOpacity style={styles.send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function Premium({ tokens, setTokens, boosted, setBoosted, activePlan }: any) {
  return (
    <View>
      <View style={styles.walletHero}>
        <Text style={styles.kickerLight}>RomChat wallet</Text>
        <Text style={styles.balance}>{tokens} tokens</Text>
        <Text style={styles.heroCopy}>Active tier: {activePlan}. Gifts can be redeemed by recipients for creator-style perks.</Text>
      </View>
      {plans.map((plan) => (
        <View key={plan.name} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}/mo</Text>
          </View>
          {plan.perks.map((perk) => <Text key={perk} style={styles.planPerk}>{perk}</Text>)}
        </View>
      ))}
      <View style={styles.panel}>
        <Text style={styles.kicker}>A la carte</Text>
        {['Unblur one admirer - 25 tokens', 'Undo last swipe - 10 tokens', 'Priority like - 18 tokens', 'Specific read receipt - 8 tokens'].map((item) => (
          <TouchableOpacity key={item} onPress={() => setTokens(Math.max(0, tokens - 8))} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => setBoosted(!boosted)} style={[styles.boostButton, boosted && styles.boostButtonActive]}>
        <Text style={styles.boostText}>{boosted ? 'Spotlight active for 30 minutes' : 'Boost profile for peak hour'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Safety({ incognito, setIncognito, antiGrab, setAntiGrab }: any) {
  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Trust controls</Text>
        <Text style={styles.title}>Privacy-first dating</Text>
        <ToggleRow title="Incognito visibility" value={incognito} onPress={() => setIncognito(!incognito)} />
        <ToggleRow title="Anti-screengrab blocks" value={antiGrab} onPress={() => setAntiGrab(!antiGrab)} />
        {['Mandatory selfie verification', 'Liveness scan before badge', 'Consent gates for calls', 'Private media watermarking', 'Instant report escalation'].map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>Active</Text>
          </View>
        ))}
      </View>
      <View style={styles.safetyScore}>
        <Text style={styles.score}>97</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>Safety score</Text>
          <Text style={styles.caption}>Identity, pace, content, and consent signals are healthy.</Text>
        </View>
      </View>
    </View>
  );
}

function Profile({ strength, incognito }: { strength: number; incognito: boolean }) {
  const bioDrafts = [
    'I am looking for something warm, direct, and built around small rituals.',
    'Best dates: a walk with room for honest conversation, then food worth remembering.',
  ];

  return (
    <View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Profile assistant</Text>
        <Text style={styles.title}>Profile strength {strength}%</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${strength}%` }]} /></View>
        {bioDrafts.map((bio) => <Text key={bio} style={styles.insight}>{bio}</Text>)}
      </View>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Authenticity studio</Text>
        {['10-second voice intro', 'Short looping video prompt', 'Three vibe polls', 'Intent badge', 'Selfie verification'].map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.listTitle}>{item}</Text>
            <Text style={styles.caption}>{item === 'Intent badge' && incognito ? 'Visible after like' : 'Ready'}</Text>
          </View>
        ))}
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
  safe: { flex: 1, backgroundColor: '#f9f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#ddbfc0', backgroundColor: 'rgba(255,255,255,0.94)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 14 },
  brand: { fontSize: 22, fontWeight: '900', color: '#1a1c1e' },
  caption: { color: '#574142', fontWeight: '600', lineHeight: 19 },
  verifyButton: { backgroundColor: '#a63646', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  verifyText: { color: 'white', fontWeight: '900' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  profileCard: { minHeight: 560, borderRadius: 28, padding: 20, justifyContent: 'flex-end', overflow: 'hidden' },
  cardBadge: { position: 'absolute', top: 18, right: 18, backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  cardBadgeText: { color: '#a63646', fontWeight: '900' },
  avatar: { position: 'absolute', top: 76, alignSelf: 'center', width: 156, height: 156, borderRadius: 78, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  avatarText: { color: 'white', fontSize: 82, fontWeight: '900' },
  cardTitle: { color: 'white', fontSize: 44, fontWeight: '900' },
  cardSub: { color: '#ffdadb', fontSize: 16, fontWeight: '800', marginTop: 6 },
  cardPrompt: { color: 'white', fontSize: 18, lineHeight: 27, marginTop: 14, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  photoTag: { color: 'white', backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, fontWeight: '800' },
  mediaRow: { gap: 8, marginTop: 14 },
  mediaPill: { color: 'white', backgroundColor: 'rgba(0,0,0,0.18)', overflow: 'hidden', padding: 12, borderRadius: 18, fontWeight: '700', lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  pass: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: '#ddbfc0' },
  like: { backgroundColor: '#a63646', paddingHorizontal: 34, paddingVertical: 14, borderRadius: 999 },
  spark: { backgroundColor: '#26c6c4', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 999 },
  passText: { color: '#574142', fontWeight: '900' },
  likeText: { color: 'white', fontWeight: '900' },
  sparkText: { color: '#102120', fontWeight: '900' },
  panel: { backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#ddbfc0', padding: 18, marginBottom: 14 },
  kicker: { color: '#a63646', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  kickerLight: { color: '#ffe4e5', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
  title: { color: '#1a1c1e', fontSize: 30, fontWeight: '900', marginBottom: 12 },
  notice: { backgroundColor: '#fff7f8', color: '#6a041e', padding: 14, borderRadius: 18, fontWeight: '700', lineHeight: 22, marginBottom: 12 },
  insight: { color: '#2c2021', backgroundColor: '#f7f0f1', borderRadius: 16, padding: 13, marginTop: 8, fontWeight: '700', lineHeight: 21 },
  pollCard: { backgroundColor: '#1a1c1e', borderRadius: 24, padding: 18, marginBottom: 14 },
  pollTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 14 },
  pollSplit: { flexDirection: 'row', gap: 10 },
  pollChoice: { flex: 1, borderWidth: 1, borderColor: '#5c5556', padding: 14, borderRadius: 18, alignItems: 'center' },
  pollChoiceActive: { backgroundColor: '#f4717f', borderColor: '#f4717f' },
  pollText: { color: '#dad3d4', fontWeight: '900' },
  pollTextActive: { color: '#1a1c1e' },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  signal: { backgroundColor: '#ecfbfa', color: '#0c4c4b', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden', fontWeight: '900', fontSize: 12 },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: 22, marginVertical: 6 },
  sent: { alignSelf: 'flex-end', backgroundColor: '#a63646', borderBottomRightRadius: 4 },
  received: { alignSelf: 'flex-start', backgroundColor: '#f3f3f6', borderBottomLeftRadius: 4 },
  sentText: { color: 'white', fontWeight: '700', lineHeight: 22 },
  receivedText: { color: '#1a1c1e', fontWeight: '700', lineHeight: 22 },
  sentMeta: { color: '#ffd7da', fontSize: 11, fontWeight: '800', marginTop: 6 },
  receivedMeta: { color: '#7a6b6c', fontSize: 11, fontWeight: '800', marginTop: 6 },
  segment: { flexDirection: 'row', backgroundColor: '#f3f3f6', borderRadius: 18, padding: 4, marginVertical: 12 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 15 },
  segmentActive: { backgroundColor: '#1a1c1e' },
  segmentText: { color: '#574142', fontWeight: '900', textTransform: 'capitalize', fontSize: 12 },
  segmentTextActive: { color: 'white' },
  giftRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  giftButton: { flex: 1, backgroundColor: '#fff7f8', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#f1c9cc' },
  giftName: { color: '#1a1c1e', fontWeight: '900' },
  giftMeta: { color: '#a63646', fontWeight: '800', marginTop: 4, fontSize: 12 },
  composer: { flexDirection: 'row', gap: 8, marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 999, paddingHorizontal: 16, color: '#1a1c1e' },
  send: { backgroundColor: '#1a1c1e', borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: 'white', fontWeight: '900' },
  walletHero: { backgroundColor: '#1a1c1e', borderRadius: 28, padding: 20, marginBottom: 14 },
  balance: { color: 'white', fontSize: 48, fontWeight: '900' },
  heroCopy: { color: '#e8dada', fontWeight: '700', lineHeight: 22, marginTop: 8 },
  planCard: { backgroundColor: 'white', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#ddbfc0', marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { color: '#1a1c1e', fontSize: 24, fontWeight: '900' },
  planPrice: { color: '#a63646', fontWeight: '900', fontSize: 18 },
  planPerk: { color: '#2c2021', fontWeight: '700', paddingVertical: 5 },
  boostButton: { backgroundColor: '#26c6c4', padding: 18, borderRadius: 22, alignItems: 'center', marginBottom: 14 },
  boostButtonActive: { backgroundColor: '#f4717f' },
  boostText: { color: '#102120', fontWeight: '900' },
  listItem: { backgroundColor: '#f3f3f6', borderRadius: 18, padding: 15, marginTop: 10 },
  listTitle: { color: '#1a1c1e', fontWeight: '900', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 20, padding: 16, marginBottom: 12 },
  switchTitle: { flex: 1, fontWeight: '900', color: '#1a1c1e', paddingRight: 10 },
  toggleTrack: { width: 52, height: 30, borderRadius: 999, backgroundColor: '#d8d2d3', padding: 3 },
  toggleTrackOn: { backgroundColor: '#a63646' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white' },
  toggleDotOn: { transform: [{ translateX: 22 }] },
  safetyScore: { flexDirection: 'row', gap: 16, backgroundColor: '#ecfbfa', borderRadius: 24, padding: 18, alignItems: 'center' },
  score: { width: 76, height: 76, borderRadius: 38, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#26c6c4', color: '#102120', fontSize: 30, fontWeight: '900', overflow: 'hidden' },
  scoreTitle: { color: '#102120', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  progress: { height: 9, backgroundColor: '#e2e2e5', borderRadius: 999, overflow: 'hidden', marginVertical: 14 },
  progressFill: { height: 9, backgroundColor: '#f4717f' },
  nav: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 999, padding: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 999 },
  navItemActive: { backgroundColor: '#1a1c1e' },
  navText: { color: '#574142', fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  navTextActive: { color: 'white' },
});
