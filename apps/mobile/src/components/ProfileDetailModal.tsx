import React, { useMemo, useState } from 'react';
import { Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export function ProfileDetailModal({ profile, visible, onClose, onPass, onLike, onSuperLike, onFirstImpression }: {
  profile: ProfileDetailData | null;
  visible: boolean;
  onClose: () => void;
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onFirstImpression: (offer: FirstImpressionOffer) => void;
}) {
  const insets = useSafeAreaInsets();
  const [showFirstImpressions, setShowFirstImpressions] = useState(false);
  const photoSources = useMemo(() => profile ? (profile.photos.length ? profile.photos : [profile.photo]) : [], [profile]);
  if (!profile) return null;

  const activeLabel = profile.online ? 'Active now' : 'Recently active';
  const distance = typeof profile.distanceKm === 'number' && profile.distanceKm > 0 ? `${profile.distanceKm} km away` : 'Nearby in Kenya';
  const offers: FirstImpressionOffer[] = [
    { id: 'first_impressions_3', count: 3, total: 1050, unit: 350 },
    { id: 'first_impressions_12', count: 12, total: 2900, unit: 242, badge: 'Popular' },
    { id: 'first_impressions_50', count: 50, total: 6500, unit: 130, badge: 'Best value' },
  ];

  const chooseOffer = (offer: FirstImpressionOffer) => {
    setShowFirstImpressions(false);
    onFirstImpression(offer);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: '#08070A' }]}>
        <View style={[styles.colorHeader, { backgroundColor: profile.color, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton} accessibilityLabel="Close profile details">
            <Icon name="chevron-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerIdentity}>
            <Text style={styles.headerName}>{profile.name.split(' ')[0]}, {profile.age}</Text>
            <Text style={styles.headerDistance}>{distance}</Text>
          </View>
          <View style={styles.headerButton}><Icon name="ellipsis-horizontal" size={23} color="#FFFFFF" /></View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 154 }} showsVerticalScrollIndicator={false}>
          <ImageBackground source={photoSources[0]} style={styles.hero} imageStyle={styles.heroImage}>
            <LinearGradient colors={['transparent', 'rgba(8,7,10,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={styles.heroCopy}>
              <View style={styles.statusPill}><View style={[styles.statusDot, { backgroundColor: profile.online ? '#25D366' : '#FFD166' }]} /><Text style={styles.statusText}>{activeLabel}</Text></View>
              <Text style={styles.heroName}>{profile.name.split(' ')[0]} <Text style={styles.heroAge}>{profile.age}</Text>{profile.verified ? <Icon name="checkmark-circle" size={24} color="#FFFFFF" /> : null}</Text>
              <Text style={styles.heroDistance}><Icon name="location-outline" size={17} color="#FFFFFF" /> {distance}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFirstImpressions(true)} style={styles.replyButton} accessibilityLabel="Send a first impression">
              <Icon name="paper-plane" size={16} color="#111016" /><Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </ImageBackground>

          <DetailSection title="Looking for" icon="search-outline"><Text style={styles.detailValue}>{profile.intent}</Text></DetailSection>
          <DetailSection title="About {0}" icon="chatbubble-ellipses-outline"><Text style={styles.detailValue}>{profile.prompt || profile.quote}</Text></DetailSection>
          <DetailSection title="Essentials" icon="information-circle-outline">
            <Text style={styles.detailValue}>{distance}</Text>
            <Text style={styles.detailMuted}>{profile.city}, Kenya</Text>
          </DetailSection>
          <DetailSection title="Interests" icon="grid-outline"><View style={styles.tagWrap}>{profile.tags.map((tag) => <Text key={`${profile.id}-${tag}`} style={styles.tag}>{tag}</Text>)}</View></DetailSection>
          <DetailSection title="My vibe" icon="musical-notes-outline"><Text style={styles.detailValue}>{profile.song}</Text></DetailSection>
          <DetailSection title="What friends would say" icon="quote-outline"><Text style={styles.quote}>{profile.quote}</Text></DetailSection>
          {!!profile.answers.length && <DetailSection title="Quick answers" icon="sparkles-outline"><View style={styles.answerList}>{profile.answers.map((answer) => <Text key={`${profile.id}-${answer}`} style={styles.detailValue}>• {answer}</Text>)}</View></DetailSection>}

          <View style={styles.gallerySection}><Text style={styles.sectionTitle}>More from {profile.name.split(' ')[0]}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>{photoSources.slice(1).map((source, index) => <Image key={`${profile.id}-detail-photo-${index}`} source={source} style={styles.galleryImage} />)}</ScrollView></View>
          <TouchableOpacity style={styles.shareBlock}><Icon name="share-outline" size={20} color="#FFFFFF" /><Text style={styles.shareText}>Share this profile</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shareBlock}><Icon name="ban-outline" size={20} color="#FFFFFF" /><Text style={styles.shareText}>Block {profile.name.split(' ')[0]}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.shareBlock, styles.reportBlock]}><Icon name="flag-outline" size={20} color="#FF718C" /><Text style={[styles.shareText, { color: '#FF718C' }]}>Report profile</Text></TouchableOpacity>
        </ScrollView>

        <View style={[styles.floatingActions, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <ActionButton icon="close" label="Pass" onPress={onPass} style={styles.pass} />
          <ActionButton icon="star" label="Super like" onPress={onSuperLike} style={styles.super} />
          <ActionButton icon="heart" label="Like" onPress={onLike} style={styles.like} />
        </View>

        <Modal visible={showFirstImpressions} animationType="slide" transparent onRequestClose={() => setShowFirstImpressions(false)}>
          <View style={styles.offerBackdrop}><SafeAreaView style={styles.offerSheet} edges={['top', 'bottom']}>
            <TouchableOpacity onPress={() => setShowFirstImpressions(false)} style={styles.offerClose}><Icon name="close" size={23} color="#FFFFFF" /></TouchableOpacity>
            <Icon name="paper-plane" size={42} color="#9BC6FF" />
            <Text style={styles.offerKicker}>Make the first move</Text>
            <Text style={styles.offerTitle}>Send a thoughtful hello</Text>
            <Text style={styles.offerSubtitle}>A short message can make your profile memorable before a mutual match.</Text>
            {offers.map((offer) => <TouchableOpacity key={offer.id} onPress={() => chooseOffer(offer)} style={styles.offerCard}>
              <View><Text style={styles.offerCount}>{offer.count} First Impressions</Text>{offer.badge ? <Text style={styles.offerBadge}>{offer.badge}</Text> : <Text style={styles.offerMeta}>A single standout message</Text>}</View>
              <View><Text style={styles.offerPrice}>KES {offer.unit.toFixed(0)}/each</Text><Text style={styles.offerTotal}>KES {offer.total.toLocaleString()} total</Text></View>
            </TouchableOpacity>)}
            <Text style={styles.offerFinePrint}>Payment is handled securely in RomChat. Messages still follow our safety and moderation rules.</Text>
          </SafeAreaView></View>
        </Modal>
      </View>
    </Modal>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <View style={styles.detailSection}><View style={styles.sectionHeading}><Icon name={icon} size={21} color="#CFC8D3" /><Text style={styles.sectionTitle}>{title.replace('{0}', '')}</Text></View>{children}</View>;
}

function ActionButton({ icon, label, onPress, style }: { icon: string; label: string; onPress: () => void; style: object }) {
  return <TouchableOpacity onPress={onPress} style={[styles.actionButton, style]} accessibilityLabel={label}><Icon name={icon} size={30} color="#FFFFFF" /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, colorHeader: { minHeight: 88, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.26)', alignItems: 'center', justifyContent: 'center' }, headerIdentity: { flex: 1 }, headerName: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' }, headerDistance: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700', marginTop: 2 }, hero: { height: 520, justifyContent: 'flex-end', overflow: 'hidden' }, heroImage: { resizeMode: 'cover' }, heroCopy: { padding: 22, gap: 7 }, statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }, statusDot: { width: 9, height: 9, borderRadius: 5 }, statusText: { color: '#17131A', fontWeight: '900', fontSize: 13 }, heroName: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' }, heroAge: { fontWeight: '500' }, heroDistance: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' }, replyButton: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 19, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, replyText: { color: '#17131A', fontWeight: '900', fontSize: 16 }, detailSection: { marginTop: 10, marginHorizontal: 10, padding: 22, borderRadius: 24, backgroundColor: '#151317', gap: 14 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, sectionTitle: { color: '#D8D1DB', fontSize: 20, fontWeight: '900' }, detailValue: { color: '#FFFFFF', fontSize: 22, lineHeight: 31, fontWeight: '700' }, detailMuted: { color: 'rgba(255,255,255,0.56)', fontSize: 16, fontWeight: '700' }, tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, tag: { color: '#FFFFFF', backgroundColor: '#050407', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, fontWeight: '800' }, quote: { color: '#FFFFFF', fontSize: 20, lineHeight: 29, fontWeight: '700' }, answerList: { gap: 8 }, gallerySection: { marginTop: 10, padding: 22, backgroundColor: '#151317' }, galleryRow: { gap: 12, paddingTop: 14 }, galleryImage: { width: 145, height: 190, borderRadius: 18, resizeMode: 'cover' }, shareBlock: { marginTop: 10, marginHorizontal: 10, minHeight: 66, borderRadius: 22, backgroundColor: '#151317', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, shareText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' }, reportBlock: { marginBottom: 18 }, floatingActions: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,7,10,0.92)', flexDirection: 'row', justifyContent: 'center', gap: 24, paddingTop: 13 }, actionButton: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, pass: { backgroundColor: '#29262A' }, super: { backgroundColor: '#252A3D' }, like: { backgroundColor: '#F21C2F' }, offerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' }, offerSheet: { backgroundColor: '#1B2230', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, gap: 12 }, offerClose: { alignSelf: 'flex-end', width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, offerKicker: { color: '#AFCBFF', fontSize: 17, fontWeight: '900', marginTop: 8 }, offerTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900' }, offerSubtitle: { color: '#CAD7F2', fontSize: 16, lineHeight: 23 }, offerCard: { minHeight: 82, padding: 16, borderRadius: 20, backgroundColor: '#0F131D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }, offerCount: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' }, offerBadge: { color: '#FFD166', fontSize: 12, fontWeight: '900', marginTop: 6, textTransform: 'uppercase' }, offerMeta: { color: 'rgba(255,255,255,0.52)', fontSize: 12, fontWeight: '700', marginTop: 6 }, offerPrice: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'right' }, offerTotal: { color: '#AFCBFF', fontSize: 12, fontWeight: '800', marginTop: 5, textAlign: 'right' }, offerFinePrint: { color: 'rgba(255,255,255,0.52)', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
});
