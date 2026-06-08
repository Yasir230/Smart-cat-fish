import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Smart Catfish Dashboard | IoT Monitoring',
  description: 'Real-time Dissolved Oxygen monitoring system for catfish ponds using Edge AI and Firebase.',
  keywords: 'IoT, Smart Catfish, Dissolved Oxygen, Edge AI, Next.js, Firebase',
  manifest: '/manifest.json',
  themeColor: '#0c4a6e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen bg-[var(--color-ocean-dark)] selection:bg-sky-500/30">
        {children}
      </body>
    </html>
  );
}
