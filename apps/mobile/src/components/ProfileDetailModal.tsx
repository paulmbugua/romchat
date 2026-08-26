import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export type ProfileDetailData = {
  id: string;
  name: string;
  age: number;
  city: string;
  distanceKm?: number;
  intent: string;
  prompt: string;
  quote: string;
  song: string;
  tags: string[];
  answers: string[];
  photos: ImageSourcePropType[];
  photo: ImageSourcePropType;
  color: string;
  online?: boolean;
  verified?: boolean;
};

type FirstImpressionOffer = { id: string; count: number; total: number; unit: number; badge?: string };
type SafetyAction = 'block' | 'report' | null;

type Props = {
  profile: ProfileDetailData | null;
  visible: boolean;
  onClose: () => void;
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onBlock: (profileId: string) => Promise<void> | void;
  onReport: (profileId: string, reason: string) => Promise<void> | void;
  onFirstImpression: (offer: FirstImpressionOffer, message: string) => void;
};

const offers: FirstImpressionOffer[] = [
  { id: 'first_impressions_3', count: 3, total: 1050, unit: 350 },
  { id: 'first_impressions_12', count: 12, total: 2900, unit: 242, badge: 'Popular' },
  { id: 'first_impressions_50', count: 50, total: 6500, unit: 130, badge: 'Best value' },
];

export function ProfileDetailModal({ profile, visible, onClose, onPass, onLike, onSuperLike, onBlock, onReport, onFirstImpression }: Props) {
  const insets = useSafeAreaInsets();
  const [showComposer, setShowComposer] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [draft, setDraft] = useState('');
  const [safetyAction, setSafetyAction] = useState<SafetyAction>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const photoSources = useMemo(() => profile ? (profile.photos.length ? profile.photos : [profile.photo]) : [], [profile]);

  useEffect(() => {
    if (!visible) {
      setShowComposer(false);
      setShowOffers(false);
      setSafetyAction(null);
      setDraft('');
    }
  }, [visible]);

  if (!profile) return null;
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  const activeLabel = profile.online ? 'Active now' : 'Recently active';
  const distance = typeof profile.distanceKm === 'number' && profile.distanceKm > 0 ? `${profile.distanceKm} km away` : 'Nearby in Kenya';

  const shareProfile = async () => {
    try {
      await Share.share({
        title: `Meet ${firstName} on RomChat`,
        message: `Meet ${firstName} on RomChat, Kenya's dating community. https://www.romchat.co.ke`,
      });
    } catch (error) {
      console.warn('[romchat-profile] share:failed', error);
    }
  };

  const confirmSafetyAction = async () => {
    if (!safetyAction || actionBusy) return;
    setActionBusy(true);
    try {
      if (safetyAction === 'block') await onBlock(profile.id);
      else await onReport(profile.id, 'Inappropriate or unsafe profile');
      setSafetyAction(null);
      onClose();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={[styles.colorHeader, { backgroundColor: profile.color, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton} accessibilityLabel="Close profile details">
            <Icon name="chevron-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerIdentity}>
            <Text style={styles.headerName}>{firstName}, {profile.age}</Text>
            <Text style={styles.headerDistance}>{distance}</Text>
          </View>
          {profile.verified ? <Icon name="checkmark-circle" size={25} color="#FFFFFF" /> : <View style={styles.headerSpacer} />}
        </View>

        <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: 184 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <ImageBackground source={photoSources[0]} style={styles.hero} imageStyle={styles.heroImage}>
            <LinearGradient colors={['transparent', 'rgba(8,7,10,0.92)']} style={StyleSheet.absoluteFill} />
            <View style={styles.heroCopy}>
              <View style={styles.statusPill}><View style={[styles.statusDot, { backgroundColor: profile.online ? '#25D366' : '#FFD166' }]} /><Text style={styles.statusText}>{activeLabel}</Text></View>
              <Text style={styles.heroName}>{firstName} <Text style={styles.heroAge}>{profile.age}</Text></Text>
              <Text style={styles.heroDistance}><Icon name="location-outline" size={17} color="#FFFFFF" /> {distance}</Text>
            </View>
          </ImageBackground>

          {photoSources.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
              {photoSources.slice(1).map((source, index) => <Image key={`${profile.id}-photo-${index}`} source={source} style={styles.stripPhoto} />)}
            </ScrollView>
          ) : null}

          <DetailSection title="Looking for" icon="search-outline"><Text style={styles.detailValue}>{profile.intent}</Text></DetailSection>
          <DetailSection title={`About ${firstName}`} icon="chatbubble-ellipses-outline"><Text style={styles.detailValue}>{profile.prompt || profile.quote || 'Ask me what makes a perfect Kenyan date.'}</Text></DetailSection>
          <DetailSection title="Essentials" icon="information-circle-outline"><Text style={styles.detailValue}>{distance}</Text><Text style={styles.detailMuted}>{profile.city}, Kenya</Text></DetailSection>
          <DetailSection title="Interests" icon="grid-outline"><View style={styles.tagWrap}>{profile.tags.map((tag) => <Text key={`${profile.id}-${tag}`} style={styles.tag}>{tag}</Text>)}</View></DetailSection>
          <DetailSection title="Favorite playlist" icon="musical-notes-outline"><Text style={styles.detailValue}>{profile.song || 'A little bit of everything'}</Text></DetailSection>
          <DetailSection title="What friends would say" icon="quote-outline"><Text style={styles.quote}>{profile.quote}</Text></DetailSection>
          {!!profile.answers.length && <DetailSection title="More about me" icon="sparkles-outline"><View style={styles.answerList}>{profile.answers.map((answer) => <Text key={`${profile.id}-${answer}`} style={styles.detailValue}>• {answer}</Text>)}</View></DetailSection>}

          <TouchableOpacity onPress={() => void shareProfile()} style={styles.safetyRow}><Icon name="share-social-outline" size={21} color="#FFFFFF" /><Text style={styles.safetyText}>Share this profile</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSafetyAction('block')} style={styles.safetyRow}><Icon name="ban-outline" size={21} color="#FFFFFF" /><Text style={styles.safetyText}>Block {firstName}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSafetyAction('report')} style={[styles.safetyRow, styles.reportRow]}><Icon name="flag-outline" size={21} color="#FF718C" /><Text style={[styles.safetyText, styles.reportText]}>Report profile</Text></TouchableOpacity>
        </ScrollView>

        <TouchableOpacity onPress={() => setShowComposer(true)} style={[styles.stickyReply, { bottom: 94 + Math.max(insets.bottom, 12) }]} accessibilityLabel="Send a first impression">
          <Icon name="paper-plane" size={16} color="#161219" /><Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>
        <View style={[styles.floatingActions, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <ActionButton icon="close" label="Pass" onPress={onPass} style={styles.pass} />
          <ActionButton icon="star" label="Super like" onPress={onSuperLike} style={styles.super} />
          <ActionButton icon="heart" label="Like" onPress={onLike} style={styles.like} />
        </View>

        <FirstImpressionComposer visible={showComposer} profile={profile} photos={photoSources} draft={draft} setDraft={setDraft} onClose={() => setShowComposer(false)} onContinue={() => setShowOffers(true)} />
        <OfferSheet visible={showOffers} onClose={() => setShowOffers(false)} onChoose={(offer) => { setShowOffers(false); setShowComposer(false); onFirstImpression(offer, draft.trim()); }} />
        <SafetySheet action={safetyAction} firstName={firstName} busy={actionBusy} onClose={() => setSafetyAction(null)} onConfirm={() => void confirmSafetyAction()} />
      </View>
    </Modal>
  );
}

function FirstImpressionComposer({ visible, profile, photos, draft, setDraft, onClose, onContinue }: {
  visible: boolean; profile: ProfileDetailData; photos: ImageSourcePropType[]; draft: string; setDraft: (value: string) => void; onClose: () => void; onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  const slideWidth = Math.min(width - 46, 420);
  const slides: Array<{ id: string; kind: 'image' | 'text'; image?: ImageSourcePropType; eyebrow?: string; title?: string; body?: string }> = [
    { id: 'main', kind: 'image', image: photos[0] },
    { id: 'about', kind: 'text', eyebrow: `About ${firstName}`, title: profile.prompt || profile.quote },
    { id: 'essential', kind: 'text', eyebrow: 'Essentials', title: profile.intent, body: `${profile.city}, Kenya${profile.distanceKm ? ` · ${profile.distanceKm} km away` : ''}` },
    { id: 'playlist', kind: 'text', eyebrow: 'Favorite playlist', title: profile.song || 'A little bit of everything' },
    ...photos.slice(1).map((image, index) => ({ id: `image-${index}`, kind: 'image' as const, image })),
  ];
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.composerRoot} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.composerSafe} edges={['top']}>
          <View style={styles.composerTop}><TouchableOpacity onPress={onClose} style={styles.composerClose}><Icon name="close" size={27} color="#FFFFFF" /></TouchableOpacity><Text style={styles.creditBubble}>0</Text></View>
          <Text style={styles.composerKicker}>Up to 5x your chance to connect</Text>
          <Text style={styles.composerTitle}>Stand out with a thoughtful first note.</Text>
          <Text style={styles.composerSubtitle}>Choose something from {firstName}'s profile and make your hello personal.</Text>
          <ScrollView horizontal pagingEnabled snapToInterval={slideWidth + 14} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slideRow}>
            {slides.map((slide, index) => <View key={slide.id} style={[styles.slideCard, { width: slideWidth }]}>
              <Text style={styles.slideCount}>{index + 1}/{slides.length}</Text>
              {slide.kind === 'image' ? <Image source={slide.image} style={styles.slideImage} /> : <View style={styles.textSlide}><Text style={styles.slideEyebrow}>{slide.eyebrow}</Text><Text style={styles.slideTitle}>{slide.title}</Text>{slide.body ? <Text style={styles.slideBody}>{slide.body}</Text> : null}</View>}
            </View>)}
          </ScrollView>
        </SafeAreaView>
        <View style={[styles.composerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput value={draft} onChangeText={setDraft} placeholder={`Write to ${firstName}...`} placeholderTextColor="#97929D" style={styles.composerInput} maxLength={240} multiline />
          <TouchableOpacity disabled={!draft.trim()} onPress={onContinue} style={[styles.composerSend, !draft.trim() && styles.disabledSend]} accessibilityLabel="Continue with first impression"><Icon name="arrow-forward" size={23} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OfferSheet({ visible, onClose, onChoose }: { visible: boolean; onClose: () => void; onChoose: (offer: FirstImpressionOffer) => void }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.sheetBackdrop}><SafeAreaView style={styles.offerSheet} edges={['bottom']}>
    <View style={styles.sheetHandle} /><TouchableOpacity onPress={onClose} style={styles.sheetClose}><Icon name="close" size={23} color="#FFFFFF" /></TouchableOpacity>
    <Icon name="paper-plane" size={40} color="#9BC6FF" /><Text style={styles.offerKicker}>FIRST NOTES</Text><Text style={styles.offerTitle}>Send your message with priority</Text><Text style={styles.offerSubtitle}>Your note appears with your profile and is reviewed by RomChat safety systems.</Text>
    {offers.map((offer) => <TouchableOpacity key={offer.id} onPress={() => onChoose(offer)} style={styles.offerCard}><View style={styles.offerLeft}><Text style={styles.offerCount}>{offer.count} First Notes</Text><Text style={styles.offerMeta}>{offer.badge || 'Starter pack'}</Text></View><View><Text style={styles.offerPrice}>KES {offer.unit.toLocaleString()}/each</Text><Text style={styles.offerTotal}>KES {offer.total.toLocaleString()} total</Text></View></TouchableOpacity>)}
  </SafeAreaView></View></Modal>;
}

function SafetySheet({ action, firstName, busy, onClose, onConfirm }: { action: SafetyAction; firstName: string; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const isBlock = action === 'block';
  return <Modal visible={Boolean(action)} animationType="fade" transparent onRequestClose={onClose}><View style={styles.sheetBackdrop}><SafeAreaView style={styles.safetySheet} edges={['bottom']}>
    <View style={styles.sheetHandle} /><View style={styles.safetyIcon}><Icon name={isBlock ? 'ban' : 'flag'} size={25} color={isBlock ? '#FFD166' : '#FF718C'} /></View>
    <Text style={styles.safetyTitle}>{isBlock ? `Block ${firstName}?` : `Report ${firstName}?`}</Text>
    <Text style={styles.safetyBody}>{isBlock ? 'You will no longer see each other in discovery, matches, or chat. They will not be notified.' : 'RomChat Safety will review this profile. The profile will also be hidden from you immediately.'}</Text>
    <View style={styles.safetyActions}><TouchableOpacity disabled={busy} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={onConfirm} style={[styles.confirmButton, isBlock && styles.blockButton]}><Text style={styles.confirmText}>{busy ? 'Working...' : isBlock ? 'Block profile' : 'Send report'}</Text></TouchableOpacity></View>
  </SafeAreaView></View></Modal>;
}

function DetailSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <View style={styles.detailSection}><View style={styles.sectionHeading}><Icon name={icon} size={21} color="#CFC8D3" /><Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>;
}

function ActionButton({ icon, label, onPress, style }: { icon: string; label: string; onPress: () => void; style: object }) {
  return <TouchableOpacity onPress={onPress} style={[styles.actionButton, style]} accessibilityLabel={label}><Icon name={icon} size={29} color="#FFFFFF" /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08070A' }, colorHeader: { minHeight: 92, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' }, headerIdentity: { flex: 1 }, headerName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, headerDistance: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700', marginTop: 2 }, headerSpacer: { width: 25 }, detailContent: { backgroundColor: '#08070A' }, hero: { height: 540, justifyContent: 'flex-end', overflow: 'hidden' }, heroImage: { resizeMode: 'cover' }, heroCopy: { padding: 22, gap: 7 }, statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }, statusDot: { width: 9, height: 9, borderRadius: 5 }, statusText: { color: '#17131A', fontWeight: '900', fontSize: 13 }, heroName: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' }, heroAge: { fontWeight: '500' }, heroDistance: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' }, photoStrip: { gap: 10, padding: 10 }, stripPhoto: { width: 210, height: 280, borderRadius: 8, resizeMode: 'cover' }, detailSection: { marginTop: 10, marginHorizontal: 10, padding: 22, borderRadius: 8, backgroundColor: '#151317', gap: 14 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, sectionTitle: { color: '#D8D1DB', fontSize: 18, fontWeight: '900' }, detailValue: { color: '#FFFFFF', fontSize: 20, lineHeight: 29, fontWeight: '700' }, detailMuted: { color: 'rgba(255,255,255,0.56)', fontSize: 15, fontWeight: '700' }, tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, tag: { color: '#FFFFFF', backgroundColor: '#050407', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, fontWeight: '800' }, quote: { color: '#FFFFFF', fontSize: 19, lineHeight: 28, fontWeight: '700' }, answerList: { gap: 8 }, safetyRow: { marginTop: 10, marginHorizontal: 10, minHeight: 66, borderRadius: 8, backgroundColor: '#151317', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, safetyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' }, reportRow: { marginBottom: 12 }, reportText: { color: '#FF718C' }, stickyReply: { position: 'absolute', right: 18, zIndex: 30, elevation: 20, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 19, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, replyText: { color: '#17131A', fontWeight: '900', fontSize: 16 }, floatingActions: { position: 'absolute', zIndex: 25, elevation: 18, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,7,10,0.95)', flexDirection: 'row', justifyContent: 'center', gap: 22, paddingTop: 12 }, actionButton: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, pass: { backgroundColor: '#29262A' }, super: { backgroundColor: '#252A3D' }, like: { backgroundColor: '#F21C2F' }, composerRoot: { flex: 1, backgroundColor: '#1A2230' }, composerSafe: { flex: 1 }, composerTop: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, composerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, creditBubble: { minWidth: 44, textAlign: 'center', color: '#FFFFFF', backgroundColor: '#687180', paddingVertical: 10, borderRadius: 22, fontWeight: '900' }, composerKicker: { color: '#AFCBFF', fontSize: 16, fontWeight: '900', paddingHorizontal: 22, marginTop: 14 }, composerTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 35, fontWeight: '900', paddingHorizontal: 22, marginTop: 12 }, composerSubtitle: { color: '#C9D2E2', fontSize: 15, lineHeight: 21, paddingHorizontal: 22, marginTop: 8 }, slideRow: { paddingHorizontal: 22, paddingTop: 20, gap: 14, paddingBottom: 14 }, slideCard: { height: 430, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#9BC6FF', backgroundColor: '#0D0D10' }, slideCount: { position: 'absolute', zIndex: 3, right: 12, top: 12, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18, fontWeight: '800' }, slideImage: { width: '100%', height: '100%', resizeMode: 'cover' }, textSlide: { flex: 1, padding: 28, justifyContent: 'center' }, slideEyebrow: { color: '#C8C0CA', fontSize: 17, fontWeight: '900', marginBottom: 18 }, slideTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 36, fontWeight: '800' }, slideBody: { color: '#BEB8C1', fontSize: 17, lineHeight: 24, marginTop: 20 }, composerBar: { backgroundColor: '#111720', paddingHorizontal: 18, paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }, composerInput: { flex: 1, minHeight: 52, maxHeight: 110, borderRadius: 24, backgroundColor: '#353C49', color: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 14, fontSize: 16 }, composerSend: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF1493' }, disabledSend: { opacity: 0.4 }, sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.66)', justifyContent: 'flex-end' }, offerSheet: { backgroundColor: '#1B2230', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 12 }, sheetHandle: { width: 46, height: 5, borderRadius: 3, backgroundColor: '#596170', alignSelf: 'center', marginBottom: 3 }, sheetClose: { position: 'absolute', right: 18, top: 18, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }, offerKicker: { color: '#AFCBFF', fontSize: 13, fontWeight: '900', marginTop: 5 }, offerTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' }, offerSubtitle: { color: '#CAD7F2', fontSize: 15, lineHeight: 21 }, offerCard: { minHeight: 78, padding: 15, borderRadius: 8, backgroundColor: '#0F131D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }, offerLeft: { flex: 1, paddingRight: 10 }, offerCount: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' }, offerMeta: { color: '#FFD166', fontSize: 12, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' }, offerPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', textAlign: 'right' }, offerTotal: { color: '#AFCBFF', fontSize: 12, fontWeight: '800', marginTop: 5, textAlign: 'right' }, safetySheet: { backgroundColor: '#17131A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 }, safetyIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#28222C', alignItems: 'center', justifyContent: 'center', marginTop: 6 }, safetyTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' }, safetyBody: { color: '#C8C0CA', fontSize: 16, lineHeight: 23 }, safetyActions: { flexDirection: 'row', gap: 10, marginTop: 5 }, cancelButton: { flex: 1, minHeight: 52, borderRadius: 8, backgroundColor: '#2A252D', alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, confirmButton: { flex: 1.35, minHeight: 52, borderRadius: 8, backgroundColor: '#E84B66', alignItems: 'center', justifyContent: 'center' }, blockButton: { backgroundColor: '#E09C28' }, confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
