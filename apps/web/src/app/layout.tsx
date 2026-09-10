import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'RomChat | Meet Someone Who Gets Your World',
  description: 'RomChat is a Kenya-first dating app for local discovery, expressive profiles, thoughtful conversations, and stronger safety controls.',
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
