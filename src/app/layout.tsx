import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rose Glass A/B Testing Platform',
  description: 'Dual-window blind comparison for Rose Glass framework validation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
