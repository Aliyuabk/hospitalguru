import type { Metadata } from 'next';
import './globals.css';
import './workspaces.css';
import './details.css';
import './personalization.css';
import './design-system.css';
import { PageLoader } from './ThemeTools';

export const metadata: Metadata = {
  title: 'BKD Pharmacy | Administration',
  description: 'BKD General Hospital Pharmacy Management System',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<PageLoader /></body></html>;
}
