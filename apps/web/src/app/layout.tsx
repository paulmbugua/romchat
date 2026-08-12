import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'RomChat | Intentional Dating and Chat',
  description: 'RomChat is a premium dating and chatting app with verified discovery, real-time messaging, events, wallet, calls, and safety tools.',
  applicationName: 'RomChat',
  icons: {
    icon: '/assets/romchat/favicon.png',
    apple: '/assets/romchat/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
