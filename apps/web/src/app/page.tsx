import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Heart, LockKeyhole, MapPin, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import styles from './landing.module.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.paulmbugua2.romchat1';

const features = [
  { icon: MapPin, number: '01', title: 'Meet within your world', copy: 'Discover adults nearby, tune your distance, and explore dating vibes shaped around how Kenyans actually connect.' },
  { icon: MessageCircle, number: '02', title: 'Start with more than hey', copy: 'Prompts, interests, and First Impressions make it easier to begin with something thoughtful.' },
  { icon: ShieldCheck, number: '03', title: 'Date with stronger boundaries', copy: 'Verification, reporting, blocking, and privacy controls remain close whenever you need them.' },
];

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image src="/assets/profile_photo.png" alt="RomChat member" fill priority sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand} aria-label="RomChat home">
            <Image src="/assets/romchat/icon.png" alt="" width={42} height={42} className={styles.brandIcon} />
            <span>RomChat</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#how-it-works">How it works</a>
            <a href="#safety">Safety</a>
            <Link href="/login">Sign in</Link>
          </div>
          <a className={styles.navCta} href={PLAY_STORE_URL} target="_blank" rel="noreferrer">Download the app</a>
        </nav>

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> Made for dating in Kenya</p>
            <h1>RomChat</h1>
            <p className={styles.heroStatement}>Meet someone who gets your world.</p>
            <p className={styles.heroBody}>Local discovery, expressive profiles, and safer conversations for adults ready to date with intention.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.7 2.7 14 12 3.7 21.3c-.4-.4-.7-1-.7-1.7V4.4c0-.7.3-1.3.7-1.7Zm11.4 10.4 2.7 2.4-10.5 5.9 7.8-8.3Zm3.9-3.5 2.3 1.3c.9.5.9 1.7 0 2.2L19 14.4 16.3 12 19 9.6ZM7.3 2.6l10.5 5.9-2.7 2.4-7.8-8.3Z" /></svg>
                <span><small>GET IT ON</small>Google Play</span>
              </a>
              <Link className={styles.secondaryCta} href="/discover">Browse on web <ArrowRight size={19} /></Link>
            </div>
          </div>

          <div className={styles.profileSignal}>
            <div className={styles.activeLabel}><span /> Recently active</div>
            <p className={styles.profileName}>A real profile tells a better story.</p>
            <div className={styles.signalMeta}><BadgeCheck size={18} /> Verified discovery <span>•</span> 18+ only</div>
          </div>
        </div>
        <a href="#how-it-works" className={styles.scrollCue}><span /> Scroll to discover</a>
      </section>

      <section className={styles.intro} id="how-it-works">
        <div className={styles.introHeader}>
          <p className={styles.sectionLabel}>Dating, with context</p>
          <h2>Less guessing.<br />More genuine signals.</h2>
        </div>
        <p className={styles.introCopy}>RomChat brings the details that matter into the first hello: where you are, what you enjoy, and what kind of connection you want.</p>
      </section>

      <section className={styles.featureGrid}>
        {features.map(({ icon: Icon, number, title, copy }) => (
          <article className={styles.feature} key={title}>
            <div className={styles.featureTop}><span>{number}</span><Icon size={25} /></div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className={styles.conversationBand}>
        <div className={styles.conversationVisual}>
          <Image src="/assets/romchat/profile-noah.png" alt="Illustrated RomChat profile preview" fill sizes="(max-width: 800px) 100vw, 45vw" className={styles.conversationImage} />
          <div className={styles.messageBubble}><span>Wanjiku</span>Karura walk, then coffee?</div>
          <div className={styles.replyBubble}>That sounds like my kind of Saturday.</div>
        </div>
        <div className={styles.conversationCopy}>
          <p className={styles.sectionLabel}>Chemistry starts in conversation</p>
          <h2>A match is only the beginning.</h2>
          <p>Move from shared interests to real conversation with expressive prompts, thoughtful introductions, and an inbox designed around people, not noise.</p>
          <Link href="/discover">See how RomChat works <ArrowRight size={19} /></Link>
        </div>
      </section>

      <section className={styles.safety} id="safety">
        <div className={styles.safetyCopy}>
          <p className={styles.sectionLabel}>Your pace. Your boundaries.</p>
          <h2>Confidence built into every connection.</h2>
          <p>Dating should feel exciting without making safety an afterthought. RomChat keeps practical controls visible from discovery through conversation.</p>
          <Link href="/safety-standards">Read our safety standards <ArrowRight size={18} /></Link>
        </div>
        <div className={styles.safetyList}>
          <div><BadgeCheck /><span><strong>Verification signals</strong>Know when a profile has completed extra checks.</span></div>
          <div><LockKeyhole /><span><strong>Privacy controls</strong>Choose how you appear and who can reach you.</span></div>
          <div><ShieldCheck /><span><strong>Report and block</strong>Act quickly without leaving the experience.</span></div>
        </div>
      </section>

      <section className={styles.download}>
        <div className={styles.downloadMark}><Sparkles size={24} /><Heart size={42} fill="currentColor" /></div>
        <p className={styles.sectionLabel}>Your next conversation is closer</p>
        <h2>Make room for something real.</h2>
        <p>RomChat is available for adults 18+ on Android.</p>
        <a className={styles.downloadButton} href={PLAY_STORE_URL} target="_blank" rel="noreferrer">Download the app <ArrowRight size={20} /></a>
      </section>

      <footer className={styles.footer}>
        <div><strong>RomChat</strong><p>Kenya dating, beautifully considered.</p></div>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/policies">Community</Link><Link href="/help">Help</Link>
        </div>
        <p>© {new Date().getFullYear()} RomChat. Adults 18+ only.</p>
      </footer>
    </main>
  );
}
