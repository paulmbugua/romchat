'use client';

import Link from 'next/link';
import { ArrowLeft, BadgeCheck, LockKeyhole, ShieldCheck } from 'lucide-react';

const sections = [
  {
    "title": "1. Who We Are",
    "body": "RomChat is a romance-first dating and chatting platform for adults, designed primarily for Kenyan users. We help members create profiles, upload photos, discover compatible people, like or pass profiles, match, chat, buy optional tokens or premium features, and use safety controls such as blocking, reporting, appeals, and account deletion. RomChat acts as a data controller for the account, profile, discovery, messaging, safety, and payment-intent data we decide how and why to process."
  },
  {
    "title": "2. Age Restriction",
    "body": "RomChat is strictly for adults aged 18 years and above. We do not knowingly allow minors to create dating profiles or use romantic matching features. If we discover that an account belongs to a person under 18, we may suspend or delete the account and related profile data. Age integrity is important in dating, so age may be locked after onboarding."
  },
  {
    "title": "3. Personal Data We Collect",
    "body": "We may collect account data, profile data, uploaded photos, selfie-verification images, discovery preferences, swipes, likes, Super Likes, matches, chats, reports, blocks, appeals, payment intent records, token balances, subscription status, device/browser logs, approximate location or city information, and support communications. We do not store raw card numbers. Card details are handled by the payment provider."
  },
  {
    "title": "4. Account and Login Data",
    "body": "When you create or access a RomChat account, we process your name, display name, email address, password hash, Google login profile where used, verification status, session tokens, and account status. We use this to authenticate you, secure the account, send OTPs or reset emails, and prevent unauthorized access."
  },
  {
    "title": "5. Dating Profile Data",
    "body": "Your profile may include age, gender, city, dating intention, interests, bio, prompts, profile strength, verification status, profile images, distance and age filters, and map-discovery settings. This information helps other eligible members understand your dating intent and helps RomChat recommend compatible profiles."
  },
  {
    "title": "6. Photos, Media, and Selfie Verification",
    "body": "Uploaded photos are used to show your profile in discovery and match screens. Selfie verification may compare your selfie with profile images to reduce impersonation, fake profiles, and catfishing. Media may be stored using cloud storage and content delivery providers. Images may be moderated automatically or manually for safety and policy compliance."
  },
  {
    "title": "7. Discovery, Matching, and Ranking",
    "body": "RomChat processes likes, passes, Super Likes, Likes Sent, Top Picks, daily like limits, profile boosts, gender preference, age filters, distance filters, city, interests, verification status, and swipe history to show relevant profiles. Some ranking may be automated, but users remain in control of liking, passing, matching, reporting, and deleting their account."
  },
  {
    "title": "8. Chats and Contact Sharing",
    "body": "Matched users can chat. We process message content and metadata to deliver messages, show chat history, detect abusive language, reduce spam, support reports, and enforce community rules. If users appear to share phone numbers, emails, social handles, payment requests, or off-platform contacts, RomChat may show safety reminders. Keep early conversations inside RomChat and report pressure or suspicious requests."
  },
  {
    "title": "9. Safety, Blocking, Reporting, and Appeals",
    "body": "Users can block or report abusive, suspicious, fake, spammy, or unsafe accounts. Reports may include profile details, reported messages, timestamps, reporter notes, moderation flags, and evidence needed for admin review. Severe abusive content may trigger automatic blocking or account review. Reported users may appeal, and admins may reinstate accounts where reports are found to be incorrect."
  },
  {
    "title": "10. Payments, Tokens, and Premium Features",
    "body": "RomChat supports optional paid features such as tokens, Super Likes, boosts, and premium plans. Payments may use M-Pesa or card checkout providers such as Paystack. We process package selected, amount in KES, phone number for M-Pesa where entered, email for card checkout, payment reference, provider response, payment status, and fulfilment records. Payment data is used to deliver tokens or benefits, prevent fraud, reconcile payments, and support users."
  },
  {
    "title": "11. Location and Kenyan Market Use",
    "body": "RomChat is built mainly for the Kenyan dating market. We may use city and approximate coordinates to support distance filtering and local discovery. You should not share exact home, work, or sensitive location details in your public profile or early chats."
  },
  {
    "title": "12. Legal Bases for Processing",
    "body": "Depending on the feature, RomChat may rely on consent, performance of a contract, legal obligation, legitimate interests, protection of users, or establishment/exercise/defence of legal claims. Consent may apply to optional marketing, optional media uploads, and some device permissions. Contract necessity applies to login, profile creation, matching, messaging, and paid feature delivery. Legitimate interests apply to safety, fraud prevention, moderation, security, service improvement, and abuse prevention."
  },
  {
    "title": "13. Sensitive Information",
    "body": "Dating profiles may reveal personal interests, relationship preferences, religion, lifestyle, location, images, or other sensitive context. RomChat does not require users to provide race, ethnicity, health status, political opinion, sexual history, or religion. If you voluntarily include sensitive information in profiles, prompts, photos, or messages, it may be processed to display your profile, operate matching, and enforce safety rules."
  },
  {
    "title": "14. Marketing and Communications",
    "body": "We may send service communications such as OTPs, password resets, payment status, security alerts, account notices, policy updates, and safety reminders. Promotional messages will be sent only where permitted by law and should include an opt-out mechanism where required."
  },
  {
    "title": "15. Cookies and Local Storage",
    "body": "RomChat web may use cookies, browser storage, and similar technologies for login sessions, auth tokens, preferences, payment return flows, security, diagnostics, and reliability. Blocking essential storage may stop login, chat, profile editing, token purchase, or deletion controls from working correctly."
  },
  {
    "title": "16. Who We Share Data With",
    "body": "We may share necessary data with hosting providers, databases, cloud storage/CDN providers, email providers, payment providers, Google login services, moderation and security tools, analytics/logging tools, customer support tools, professional advisers, and authorities where legally required. Other users may see the profile information and photos you choose to make visible."
  },
  {
    "title": "17. International Transfers",
    "body": "Some providers may process data outside Kenya. Where personal data is transferred outside Kenya, RomChat aims to use appropriate safeguards, contractual protections, vendor due diligence, access controls, and security measures consistent with applicable Kenyan data protection requirements."
  },
  {
    "title": "18. Retention",
    "body": "We keep account and profile data while your account is active. Photos, messages, matches, reports, payment records, and logs are retained for periods needed to provide the service, resolve disputes, prevent abuse, process payments, comply with law, support appeals, and maintain security. Some safety, fraud, payment, legal, and audit records may be retained after account deletion where necessary."
  },
  {
    "title": "19. Security",
    "body": "RomChat uses safeguards such as authenticated APIs, password hashing, access controls, HTTPS, cloud storage controls, moderation workflows, logging, and admin review procedures. No online service is perfectly secure, so users should use strong passwords, secure devices, avoid suspicious links, and report suspicious activity quickly."
  },
  {
    "title": "20. Your Rights in Kenya",
    "body": "Under Kenyan data protection law, users may have rights to be informed, access personal data, object to certain processing, correct false or misleading data, request deletion of false or misleading data, withdraw consent where consent is the legal basis, and complain to Kenya’s Office of the Data Protection Commissioner."
  },
  {
    "title": "21. Account Deletion and Data Deletion Requests",
    "body": "You can edit your profile, request data deletion, or fully delete your account from the RomChat profile screen. Immediate deletion removes active access and starts backend deletion workflows. Some records may remain where required for payment, fraud prevention, abuse reports, legal claims, regulatory obligations, backup expiry, or protection of other users."
  },
  {
    "title": "22. Complaints and Contact",
    "body": "For privacy questions, safety reports, deletion requests, or data access requests, use the RomChat profile, report, or complaints screens. Include your account email and enough detail for us to verify and process the request. If dissatisfied, you may contact Kenya’s Office of the Data Protection Commissioner."
  },
  {
    "title": "23. Changes to This Policy",
    "body": "RomChat may update this policy as features, providers, laws, payment methods, and safety systems evolve. Material changes may be communicated through the website, app, email, or other reasonable notice."
  }
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#09050b] text-white">
      <header className="border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/assets/romchat/icon.png" alt="RomChat" className="h-11 w-11 rounded-2xl object-cover" />
            <div>
              <p className="text-2xl font-black text-[#ff1493]">RomChat</p>
              <p className="text-xs font-bold text-white/55">Kenyan dating privacy center</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/80">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="rounded-[36px] border border-[#ff1493]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,20,147,.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.03))] p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff1493] px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
            <ShieldCheck size={16} /> Privacy Policy
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">RomChat Privacy Policy for Kenya</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            A detailed privacy policy for RomChat’s romance, dating, matching, chatting, token, payment, verification, safety, and account-deletion features, written for a platform serving mostly Kenyan users.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4"><LockKeyhole className="text-[#ff9bd0]" /><p className="mt-3 font-black">Privacy-first profiles</p><p className="mt-1 text-sm text-white/55">Edit profile, images, visibility, deletion, and account controls.</p></div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4"><BadgeCheck className="text-[#12c55b]" /><p className="mt-3 font-black">Dating safety</p><p className="mt-1 text-sm text-white/55">Verification, reports, blocks, appeals, and abuse moderation.</p></div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4"><ShieldCheck className="text-[#ffd700]" /><p className="mt-3 font-black">Kenya-aware</p><p className="mt-1 text-sm text-white/55">Built around Kenyan user expectations and data protection rights.</p></div>
          </div>
          <p className="mt-6 text-sm font-bold text-white/50">Effective date: 12 August 2026</p>
        </div>

        <div className="mt-6 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-7">
              <h2 className="text-2xl font-black text-white">{section.title}</h2>
              <p className="mt-3 leading-8 text-white/68">{section.body}</p>
            </article>
          ))}
        </div>

        <footer className="mt-8 rounded-[28px] border border-white/10 bg-black/30 p-5 text-sm text-white/60">
          <p className="font-bold text-white">Launch note</p>
          <p className="mt-2 leading-7">Before public launch, confirm controller details, contacts, processor list, retention schedule, ODPC registration obligations, and legal wording with qualified Kenyan data protection counsel.</p>
        </footer>
      </section>
    </main>
  );
}
