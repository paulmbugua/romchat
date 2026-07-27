# RomChat Store Compliance Architecture

RomChat must keep matched basic text messaging free. Tokens are only for voluntary premium extras: locked media previews, video requests, priority placement, virtual gifts, boosts, admirer reveal, undo, and match extension.

## Billing

- Android token purchases must be fulfilled through Google Play Billing.
- iOS token purchases must be fulfilled through StoreKit.
- The mobile app must not link to external checkout, payment webviews, PayPal, M-Pesa, Stripe Checkout, or card-entry pages for digital tokens.
- Backend token ledger endpoints should only credit consumables after a platform-native purchase receipt is verified.

## Chat Monetization

- Allowed: free matched text messages.
- Allowed: token-gated HD photos, voice notes, video invites, priority intros, read receipt add-ons, gifts, boosts, admirer reveal, undo swipe, and match extension.
- Not allowed: blocking users from reading basic matched text replies.

## UGC Safety

- New image/video assets must pass moderation before public rendering.
- Text messages must pass abuse/scam filtering before delivery.
- Chat screens must keep report/block actions globally reachable.
- Android private media screens should enable FLAG_SECURE.
- iOS should listen for screenshot notifications and create a safety event.

## Backend Enforcement

- romchat_token_unlocks records each voluntary premium unlock.
- romchat_wallet_ledger records token spend and top-ups.
- romchat_reports records user safety reports.
- romchat_verification_requests records selfie verification submissions.
