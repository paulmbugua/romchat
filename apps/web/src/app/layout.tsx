import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Grogon SACCO | Mechanics Savings and Asset Finance',
  description:
    'A SACCO website and member portal for mechanics and auto shops around Grogon and Kirinyaga Road, Nairobi.',
  applicationName: 'Grogon SACCO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
