import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  FileText,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | RomChat',
  description:
    'Terms governing RomChat accounts, dating profiles, matching, messaging, safety, subscriptions, tokens, digital purchases, and acceptable use.',
  alternates: { canonical: '/terms' },
};

type TermsSection = {
  id: string;
  title: string;
  body: string;
  items?: string[];
};

const sections: TermsSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of these Terms',
    body:
      'These Terms of Service form a binding agreement between you and RomChat regarding your access to and use of the RomChat mobile application, website, dating, discovery, matching, messaging, safety, and paid features. By creating an account, accessing RomChat, or purchasing a digital feature, you confirm that you have read and agree to these Terms and the policies linked below. If you do not agree, do not use RomChat.',
  },
  {
    id: 'eligibility',
    title: '2. Eligibility and adults-only access',
    body:
      'RomChat is strictly for adults aged 18 years and older. You must be legally capable of entering this agreement, must not be prohibited from using dating services under applicable law, and must not have been removed from RomChat for a serious policy violation unless we expressly authorize your return.',
    items: [
      'You must provide your true age and must not create an account for a minor.',
      'You must not allow a minor to access RomChat through your account or device session.',
      'We may request age or identity verification and may restrict an account while checks are pending.',
    ],
  },
  {
    id: 'accounts',
    title: '3. Accounts and account security',
    body:
      'You are responsible for the accuracy of your registration information and for activity conducted through your account. Keep your password, device, login links, and authentication credentials secure. Notify RomChat promptly if you suspect unauthorized access. You may not sell, transfer, rent, share, or create accounts through automated means.',
  },
  {
    id: 'profiles',
    title: '4. Profiles, identity, and authenticity',
    body:
      'Profile information and media must truthfully represent you. You may not impersonate another person, use another person’s photos without permission, misrepresent your identity or relationship intentions, operate a fraudulent profile, or upload deceptive or unlawfully obtained content. Verification badges indicate that specified checks were completed; they are not endorsements, background checks, or guarantees of character or safety.',
  },
  {
    id: 'matching',
    title: '5. Discovery, matching, and communication',
    body:
      'RomChat may use preferences, location or city, age range, interests, activity, verification status, prior interactions, and other signals to rank or recommend profiles. A match occurs only when supported interactions are reciprocal. RomChat does not guarantee profile visibility, compatibility, responses, matches, dates, relationships, or any particular outcome. Users remain responsible for deciding whom to like, message, meet, block, or report.',
  },
  {
    id: 'conduct',
    title: '6. Acceptable use and prohibited conduct',
    body:
      'Use RomChat respectfully, lawfully, and only for genuine adult dating and social interaction. You must not misuse RomChat or help another person do so.',
    items: [
      'No harassment, stalking, threats, hate, discrimination, sexual coercion, non-consensual sexual content, or intimate-image abuse.',
      'No scams, fraud, spam, solicitation, money requests, pyramid schemes, commercial sexual services, trafficking, or promotion of illegal activity.',
      'No malware, scraping, automated accounts, reverse engineering, security testing without authorization, service disruption, or attempts to bypass access controls.',
      'No collection, publication, or misuse of another member’s personal information, private messages, images, or location.',
      'No content that infringes intellectual property, privacy, publicity, confidentiality, or other legal rights.',
    ],
  },
  {
    id: 'child-safety',
    title: '7. Child safety and zero-tolerance standards',
    body:
      'RomChat strictly prohibits child sexual abuse and exploitation, child grooming, sexualization of minors, sextortion, child trafficking, solicitation of minors, and child sexual abuse material. Suspected violations may result in immediate content removal, account restriction or termination, preservation of relevant evidence, and reports to the appropriate authority where required by law. Our complete published standards are available on the Child Safety Standards page.',
  },
  {
    id: 'content',
    title: '8. Your content and permissions to RomChat',
    body:
      'You retain ownership of content you lawfully submit, including profile text, photos, prompts, and messages. You confirm that you have all rights and permissions needed to submit it. You grant RomChat a non-exclusive, worldwide, royalty-free, sublicensable license to host, store, reproduce, process, adapt for technical formatting, display, and transmit that content only as reasonably needed to operate, secure, improve, moderate, and provide RomChat. This license ends when the content is deleted, subject to reasonable backup cycles, legal duties, safety investigations, and content already shared with other users.',
  },
  {
    id: 'safety',
    title: '9. Dating safety and interactions with other users',
    body:
      'RomChat does not control what members do outside the service and cannot guarantee identity, intentions, statements, conduct, or compatibility. Use judgment, keep early conversations in RomChat, protect financial and location information, arrange first meetings in public places, tell someone you trust, and leave or seek help if you feel unsafe. Never send money or financial credentials to another member. Contact emergency services when there is immediate danger.',
  },
  {
    id: 'moderation',
    title: '10. Reporting, blocking, moderation, and enforcement',
    body:
      'You can block and report profiles or unsafe messages through RomChat. We may use automated systems and human review to investigate reports, detect abuse, moderate content, restrict features, remove content, reduce distribution, suspend accounts, permanently terminate accounts, and prevent repeat access. We may act without advance notice where necessary to protect users, comply with law, secure the service, or investigate serious misconduct. Where available, affected users may submit an appeal for review.',
  },
  {
    id: 'purchases',
    title: '11. Digital purchases and Google Play Billing',
    body:
      'RomChat may offer optional tokens, subscriptions, Super Likes, boosts, and other digital features. The price, currency, billing period, and included benefit shown at checkout control the purchase. In the Android app distributed through Google Play, eligible digital purchases are processed through Google Play Billing and are also subject to Google Play’s terms. Google, not RomChat, processes the payment instrument used through Google Play. Taxes or currency conversion may affect the final amount displayed by the store.',
  },
  {
    id: 'subscriptions',
    title: '12. Subscriptions and renewal',
    body:
      'A subscription provides the benefits described for the selected plan during the active billing period. Unless the checkout screen states otherwise, subscriptions automatically renew until cancelled through the store or account used to purchase them. Deleting RomChat or deleting an account does not automatically cancel a store-managed subscription. Cancel through Google Play or the applicable purchase provider before renewal. Cancellation normally stops future charges while access continues until the end of the paid period, subject to the provider’s rules.',
  },
  {
    id: 'tokens',
    title: '13. Tokens and virtual features',
    body:
      'Tokens and other virtual items are limited, revocable licenses to use specified RomChat features. They are not money, stored value, property, cryptocurrency, or a bank balance. They cannot be transferred between users, traded, redeemed for cash, or used outside RomChat. Token costs are shown before a supported action. Except where required by law or caused by a verified service error, consumed tokens and delivered digital benefits are not refundable. Fraud, chargebacks, or policy violations may lead to reversal of associated benefits.',
  },
  {
    id: 'refunds',
    title: '14. Refunds, cancellations, and delivery issues',
    body:
      'Refund eligibility is governed by applicable law, the purchase provider’s rules, and RomChat’s Refund and Cancellation Policy. For Google Play purchases, use Google Play’s purchase history and support process where required. If a confirmed purchase is not delivered, report it with the order reference and the RomChat account used for the purchase. Do not send full card details, passwords, or authentication codes.',
  },
  {
    id: 'third-parties',
    title: '15. Third-party services',
    body:
      'RomChat may rely on third-party services for app distribution, login, hosting, storage, notifications, maps, moderation, analytics, and payments. Those services may have separate terms and privacy policies. RomChat is not responsible for independent third-party services, content, outages, or actions, but this does not limit rights you have under applicable law.',
  },
  {
    id: 'intellectual-property',
    title: '16. RomChat intellectual property',
    body:
      'RomChat and its software, branding, interface, graphics, databases, recommendations, and original content are owned by or licensed to RomChat and are protected by applicable intellectual-property laws. These Terms grant you a personal, limited, non-exclusive, non-transferable, revocable right to use RomChat for its intended purpose. They do not grant ownership of RomChat technology or permission to copy, resell, modify, or commercially exploit it.',
  },
  {
    id: 'availability',
    title: '17. Service availability and changes',
    body:
      'We work to keep RomChat reliable but do not promise uninterrupted or error-free operation. Features may be unavailable during maintenance, network failures, security events, provider outages, legal changes, or technical incidents. We may add, modify, limit, or discontinue features and may introduce reasonable usage limits. Where a change materially affects an active paid benefit, we will act consistently with applicable law and the purchase provider’s requirements.',
  },
  {
    id: 'termination',
    title: '18. Account deletion, suspension, and termination',
    body:
      'You may delete your account using the in-app account-deletion control. We may restrict, suspend, or terminate access where we reasonably believe these Terms were breached, the account creates risk, payment activity is fraudulent, or action is required by law. Termination ends your right to use RomChat. Provisions concerning content responsibility, intellectual property, payments already incurred, safety records, disclaimers, liability, disputes, and enforcement survive where their nature requires.',
  },
  {
    id: 'disclaimers',
    title: '19. Disclaimers',
    body:
      'RomChat is provided on an “as is” and “as available” basis to the extent permitted by law. We do not warrant that profiles are accurate, members are compatible, communications will receive responses, or interactions will be safe or successful. Verification and moderation reduce risk but cannot eliminate it. Nothing in these Terms excludes warranties or consumer rights that cannot lawfully be excluded.',
  },
  {
    id: 'liability',
    title: '20. Limitation of liability',
    body:
      'To the maximum extent permitted by law, RomChat is not liable for indirect, incidental, special, punitive, or consequential loss, loss of opportunity, loss of data, or conduct of another user arising from use of the service. Where liability cannot be excluded, RomChat’s aggregate liability relating to the service will not exceed the greater of the amount you paid to RomChat for the affected service during the twelve months before the claim or the minimum amount required by applicable law. This limitation does not apply where liability cannot legally be limited.',
  },
  {
    id: 'responsibility',
    title: '21. Your responsibility for claims',
    body:
      'To the extent permitted by law, you are responsible for losses, claims, and reasonable costs arising from your unlawful content, misuse of RomChat, infringement of another person’s rights, or material breach of these Terms. RomChat will provide reasonable notice of a covered claim and will not require responsibility for losses caused solely by RomChat’s own unlawful conduct.',
  },
  {
    id: 'law',
    title: '22. Governing law and disputes',
    body:
      'These Terms are governed by the laws of Kenya, without overriding mandatory consumer protections that apply where you live. Before starting formal proceedings, you and RomChat should attempt in good faith to resolve the dispute through the complaints process. If it remains unresolved, the courts of competent jurisdiction in Kenya may hear the dispute, unless applicable law gives you the right to bring it elsewhere.',
  },
  {
    id: 'general',
    title: '23. General terms',
    body:
      'If any provision is found unenforceable, the remaining provisions continue in effect and the affected provision will be limited to the minimum extent necessary. A failure to enforce a provision is not a waiver. You may not transfer this agreement without RomChat’s consent. RomChat may transfer it as part of a merger, reorganization, financing, asset transfer, or change of operator, subject to applicable law. These Terms and the incorporated policies form the entire agreement about your use of RomChat.',
  },
  {
    id: 'changes',
    title: '24. Changes to these Terms',
    body:
      'We may update these Terms when features, laws, safety practices, or payment requirements change. The current version will be published here with an updated effective date. Material changes may also be communicated through the app, website, or account contact details. Continued use after the effective date means you accept the revised Terms where permitted by law; otherwise, you should stop using RomChat and delete your account.',
  },
  {
    id: 'contact',
    title: '25. Contact, complaints, and notices',
    body:
      'For account, payment-delivery, privacy, or policy questions, use the help and complaints channels on the RomChat website. For member conduct or safety concerns, use the in-app Report or Block and Report controls so the relevant profile, message, and account context can be reviewed. If a person is in immediate danger, contact local emergency services before contacting RomChat.',
  },
];

const highlights = [
  { icon: UserRoundCheck, title: 'Adults only', copy: 'RomChat is strictly for users aged 18 and older.' },
  { icon: ShieldCheck, title: 'Safety enforced', copy: 'Reporting, blocking, moderation, and child-safety rules apply.' },
  { icon: CreditCard, title: 'Clear billing', copy: 'Android digital purchases use Google Play Billing.' },
  { icon: Scale, title: 'Kenyan law', copy: 'Mandatory consumer protections continue to apply.' },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#09050b] text-white">
      <header className="border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/assets/romchat/icon.png" alt="RomChat" className="h-11 w-11 rounded-2xl object-cover" />
            <div>
              <p className="text-2xl font-black text-[#ff1493]">RomChat</p>
              <p className="text-xs font-bold text-white/55">Terms and policy center</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/80">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="rounded-[36px] border border-[#ff1493]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,20,147,.2),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.03))] p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff1493] px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
            <FileText size={16} /> Legal agreement
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">RomChat Terms of Service</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/70">
            The rules governing RomChat accounts, profiles, discovery, matching, messaging, safety, subscriptions, tokens, and digital purchases.
          </p>
          <p className="mt-6 text-sm font-bold text-white/50">Effective date: 6 November 2026</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
              <Icon className="text-[#ff7abf]" size={21} />
              <p className="mt-3 font-black">{title}</p>
              <p className="mt-1 text-sm leading-6 text-white/55">{copy}</p>
            </div>
          ))}
        </div>

        <nav aria-label="Terms sections" className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#ff8bc7]">In these Terms</p>
          <div className="flex flex-wrap gap-2">
            {sections.map(({ id, title }) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:border-[#ff1493]/60 hover:text-white">
                {title.replace(/^\d+\.\s*/, '')}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-5 grid gap-4">
          {sections.map((section) => (
            <article id={section.id} key={section.id} className="scroll-mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
              <h2 className="text-2xl font-black text-white">{section.title}</h2>
              <p className="mt-3 leading-8 text-white/70">{section.body}</p>
              {section.items ? (
                <ul className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-7 text-white/65">
                      <BadgeCheck className="mt-1 shrink-0 text-[#ff7abf]" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.id === 'child-safety' ? (
                <Link href="/safety-standards" className="mt-5 inline-flex rounded-full border border-[#ff1493]/40 px-4 py-2 text-sm font-black text-[#ff8bc7]">
                  Read Child Safety Standards
                </Link>
              ) : null}
              {section.id === 'refunds' ? (
                <Link href="/refunds" className="mt-5 inline-flex rounded-full border border-[#ff1493]/40 px-4 py-2 text-sm font-black text-[#ff8bc7]">
                  Read Refund and Cancellation Policy
                </Link>
              ) : null}
              {section.id === 'contact' ? (
                <Link href="/complaints-feedback" className="mt-5 inline-flex rounded-full border border-[#ff1493]/40 px-4 py-2 text-sm font-black text-[#ff8bc7]">
                  Open Complaints and Feedback
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <footer className="mt-8 flex flex-wrap gap-5 border-t border-white/10 py-6 text-sm font-bold text-white/55">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/safety-standards">Child Safety Standards</Link>
          <Link href="/refunds">Refunds</Link>
          <Link href="/delete-account">Delete account</Link>
        </footer>
      </section>
    </main>
  );
}
