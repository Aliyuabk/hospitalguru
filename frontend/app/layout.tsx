import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell';
import { TablePagination } from '@/components/table-pagination';
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'), title: 'General Hospital BKD Pharmacy', description: 'Offline-first hospital pharmacy management', icons: { icon: '/logo.jpeg', shortcut: '/logo.jpeg', apple: '/logo.jpeg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Shell><TablePagination/>{children}</Shell></body></html>; }
