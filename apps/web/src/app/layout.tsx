import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Grogon SACCO | Auto Trade Savings and Workshop Finance',
  description:
    'Savings, dividends, tool finance and working-capital support for mechanics, garages and spare shops around Grogon and Kirinyaga Road, Nairobi.',
  applicationName: 'Grogon SACCO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

