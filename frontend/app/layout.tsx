import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell';
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'), title: 'General Hospital BKD Pharmacy', description: 'Offline-first hospital pharmacy management', icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }
