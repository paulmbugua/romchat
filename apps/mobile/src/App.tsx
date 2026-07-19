import React, { useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Tab = 'discover' | 'chat' | 'events' | 'safety' | 'wallet' | 'profile';

const profiles = [
  { id: 'elena', name: 'Elena', age: 26, city: 'New York', match: 94, intent: 'Long-term, slow burn', prompt: 'Coffee, galleries, and dinner where phones stay away.', tags: ['Architecture', 'Jazz', 'Travel'], color: '#a63646' },
  { id: 'amara', name: 'Amara', age: 29, city: 'Brooklyn', match: 91, intent: 'Ready for partnership', prompt: 'Thoughtful dinners, film nights, and tiny rituals.', tags: ['Cooking', 'Design', 'Film'], color: '#df8072' },
  { id: 'noah', name: 'Noah', age: 31, city: 'Jersey City', match: 88, intent: 'Intentional connection', prompt: 'Runner, builder, and the friend who books the table.', tags: ['Books', 'Rooftops', 'Running'], color: '#26c6c4' },
];

const messages = [
  ['Elena', 'Your answer about building a life with room for quiet days was rare.'],
  ['You', 'The best connection feels calm before it feels exciting.'],
  ['Elena', 'That deserves a golden-hour walk. Saturday?'],
];

export default function App() {
  const [tab, setTab] = useState<Tab>('discover');
  const [index, setIndex] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const profile = profiles[index % profiles.length];
  const strength = useMemo(() => 86 + (verifiedOnly ? 7 : 0), [verifiedOnly]);

  function next() {
    setIndex((value) => (value + 1) % profiles.length);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <View>
            <Text style={styles.brand}>RomChat</Text>
            <Text style={styles.caption}>Verified chemistry</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.verifyButton}><Text style={styles.verifyText}>Verify</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'discover' && <Discover profile={profile} next={next} verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly} />}
        {tab === 'chat' && <Chat />}
        {tab === 'events' && <Events />}
        {tab === 'safety' && <Safety />}
        {tab === 'wallet' && <Wallet />}
        {tab === 'profile' && <Profile strength={strength} />}
      </ScrollView>

      <View style={styles.nav}>
        {(['discover', 'chat', 'events', 'safety', 'profile'] as Tab[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.navItem, tab === item && styles.navItemActive]}>
            <Text style={[styles.navText, tab === item && styles.navTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Discover({ profile, next, verifiedOnly, setVerifiedOnly }: any) {
  return (
    <View>
      <View style={[styles.profileCard, { backgroundColor: profile.color }]}>
        <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{profile.match}% compatible</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name.slice(0, 1)}</Text></View>
        <Text style={styles.cardTitle}>{profile.name}, {profile.age}</Text>
        <Text style={styles.cardSub}>{profile.city} - {profile.intent}</Text>
        <Text style={styles.cardPrompt}>{profile.prompt}</Text>
        <View style={styles.tagRow}>{profile.tags.map((tag: string) => <Text key={tag} style={styles.photoTag}>{tag}</Text>)}</View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={next} style={styles.pass}><Text style={styles.passText}>Pass</Text></TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.like}><Text style={styles.likeText}>Like</Text></TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.spark}><Text style={styles.sparkText}>Spark</Text></TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setVerifiedOnly(!verifiedOnly)} style={styles.switchRow}>
        <Text style={styles.switchTitle}>Verified-only discovery</Text>
        <Text style={styles.switchValue}>{verifiedOnly ? 'On' : 'Off'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Chat() {
  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Live chat</Text>
      <Text style={styles.title}>Elena is online</Text>
      <Text style={styles.notice}>Trust insight: verified member, healthy pace, no risky language detected.</Text>
      {messages.map(([from, text]) => <View key={text} style={[styles.bubble, from === 'You' ? styles.sent : styles.received]}><Text style={from === 'You' ? styles.sentText : styles.receivedText}>{text}</Text></View>)}
      <View style={styles.composer}><TextInput placeholder="Send a thoughtful message" style={styles.input} /><TouchableOpacity style={styles.send}><Text style={styles.sendText}>Send</Text></TouchableOpacity></View>
    </View>
  );
}

function Events() {
  return <View style={styles.panel}><Text style={styles.kicker}>Curated events</Text><Text style={styles.title}>Meet safely offline</Text>{['Golden Hour Social', 'Mindful Dating Workshop', 'Architecture Walk'].map((item) => <View key={item} style={styles.listItem}><Text style={styles.listTitle}>{item}</Text><Text style={styles.caption}>Verified singles, limited seats, hosted prompts</Text></View>)}</View>;
}

function Safety() {
  return <View style={styles.panel}><Text style={styles.kicker}>Safety hub</Text><Text style={styles.title}>Built for grown-up dating</Text>{['ID and liveness verification', 'Consent gates for calls', 'Screenshot warnings', 'Block and report controls', 'Trusted-contact check-ins'].map((item) => <View key={item} style={styles.listItem}><Text style={styles.listTitle}>{item}</Text></View>)}</View>;
}

function Wallet() {
  return <View style={styles.panel}><Text style={styles.kicker}>Wallet</Text><Text style={styles.balance}>$46.00</Text><Text style={styles.caption}>Use balance for events, boosts, voice notes, and tasteful gifts.</Text>{['Profile boost', 'Send a gift', 'Book ticket'].map((item) => <View key={item} style={styles.listItem}><Text style={styles.listTitle}>{item}</Text><Text style={styles.price}>$6</Text></View>)}</View>;
}

function Profile({ strength }: { strength: number }) {
  return <View style={styles.panel}><Text style={styles.kicker}>Onboarding</Text><Text style={styles.title}>Profile strength {strength}%</Text><View style={styles.progress}><View style={[styles.progressFill, { width: `${strength}%` }]} /></View>{['Intent', 'Identity', 'Photos', 'Prompts', 'Safety'].map((item) => <View key={item} style={styles.listItem}><Text style={styles.listTitle}>{item}</Text><Text style={styles.caption}>Complete to improve match quality.</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#ddbfc0', backgroundColor: 'rgba(255,255,255,0.92)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 16 },
  brand: { fontSize: 22, fontWeight: '900', color: '#1a1c1e' },
  caption: { color: '#574142', fontWeight: '600' },
  verifyButton: { backgroundColor: '#a63646', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  verifyText: { color: 'white', fontWeight: '900' },
  content: { padding: 16, paddingBottom: 108 },
  profileCard: { minHeight: 560, borderRadius: 32, padding: 22, justifyContent: 'flex-end', overflow: 'hidden' },
  cardBadge: { position: 'absolute', top: 18, right: 18, backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  cardBadgeText: { color: '#a63646', fontWeight: '900' },
  avatar: { position: 'absolute', top: 88, alignSelf: 'center', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  avatarText: { color: 'white', fontSize: 84, fontWeight: '900' },
  cardTitle: { color: 'white', fontSize: 46, fontWeight: '900' },
  cardSub: { color: '#ffdadb', fontSize: 17, fontWeight: '800', marginTop: 6 },
  cardPrompt: { color: 'white', fontSize: 18, lineHeight: 28, marginTop: 14, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  photoTag: { color: 'white', backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  pass: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: '#ddbfc0' },
  like: { backgroundColor: '#a63646', paddingHorizontal: 34, paddingVertical: 14, borderRadius: 999 },
  spark: { backgroundColor: '#26c6c4', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999 },
  passText: { color: '#574142', fontWeight: '900' },
  likeText: { color: 'white', fontWeight: '900' },
  sparkText: { color: '#102120', fontWeight: '900' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 24, padding: 18 },
  switchTitle: { fontWeight: '900', color: '#1a1c1e' },
  switchValue: { color: '#a63646', fontWeight: '900' },
  panel: { backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#ddbfc0', padding: 20 },
  kicker: { color: '#a63646', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  title: { color: '#1a1c1e', fontSize: 32, fontWeight: '900', marginBottom: 12 },
  notice: { backgroundColor: '#fff7f8', color: '#6a041e', padding: 14, borderRadius: 20, fontWeight: '700', lineHeight: 22, marginBottom: 14 },
  bubble: { maxWidth: '84%', padding: 14, borderRadius: 22, marginVertical: 6 },
  sent: { alignSelf: 'flex-end', backgroundColor: '#a63646', borderBottomRightRadius: 4 },
  received: { alignSelf: 'flex-start', backgroundColor: '#f3f3f6', borderBottomLeftRadius: 4 },
  sentText: { color: 'white', fontWeight: '700', lineHeight: 22 },
  receivedText: { color: '#1a1c1e', fontWeight: '700', lineHeight: 22 },
  composer: { flexDirection: 'row', gap: 8, marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 999, paddingHorizontal: 16 },
  send: { backgroundColor: '#1a1c1e', borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: 'white', fontWeight: '900' },
  listItem: { backgroundColor: '#f3f3f6', borderRadius: 22, padding: 16, marginTop: 10 },
  listTitle: { color: '#1a1c1e', fontWeight: '900', fontSize: 16 },
  price: { color: '#a63646', fontWeight: '900', marginTop: 4 },
  balance: { color: '#1a1c1e', fontSize: 48, fontWeight: '900' },
  progress: { height: 9, backgroundColor: '#e2e2e5', borderRadius: 999, overflow: 'hidden', marginVertical: 14 },
  progressFill: { height: 9, backgroundColor: '#f4717f' },
  nav: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#ddbfc0', borderRadius: 999, padding: 8 },
  navItem: { paddingHorizontal: 10, paddingVertical: 12, borderRadius: 999 },
  navItemActive: { backgroundColor: '#1a1c1e' },
  navText: { color: '#574142', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  navTextActive: { color: 'white' },
});
