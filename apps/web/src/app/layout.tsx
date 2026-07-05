import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Grogon Sacco Demo | SACCO App Portfolio',
  description:
    'A demo SACCO mobile and web app concept using sample data only for mechanics, garages and spare shops around Grogon and Kirinyaga Road, Nairobi.',
  applicationName: 'Grogon Sacco Demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

