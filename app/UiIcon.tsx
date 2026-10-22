import React from 'react';

const shapes: Record<string, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" transform="translate(-1 -1) scale(1.08)"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></>,
  inventory: <><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></>,
  file: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h5M9 13h6M9 17h6"/></>,
  transfer: <><path d="M4 7h15l-3-3M20 17H5l3 3"/><path d="M19 7v4M5 17v-4"/></>,
  chart: <><path d="M4 20V11M10 20V4M16 20v-8M22 20H2"/></>,
  pill: <><path d="m5 19 14-14a5 5 0 0 1 7 7L12 26a5 5 0 0 1-7-7Z" transform="translate(-2 -2)"/><path d="m8 8 8 8"/></>,
  box: <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
  shield: <><path d="M12 3 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  chevron: <><path d="m6 9 6 6 6-6"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"/></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v4h16v-4"/></>,
};

export default function UiIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const key = name.toLowerCase();
  const icon = key === 'close' ? 'close'
    : key === 'chevron' ? 'chevron'
    : key.includes('refresh') ? 'refresh'
    : key.includes('export') || key.includes('download') ? 'download'
    : key.includes('dashboard') || key === 'home' ? 'dashboard'
    : key.includes('inventory') || key.includes('stock') ? 'inventory'
    : key.includes('transfer') || key.includes('request') ? 'transfer'
    : key.includes('sales') || key.includes('performance') || key.includes('report') || key.includes('valuation') ? 'chart'
    : key.includes('drug') || key.includes('dispens') || key.includes('pos') ? 'pill'
    : key.includes('supplier') || key.includes('purchase') || key.includes('grn') || key.includes('receipt') ? 'box'
    : key.includes('return') || key.includes('refund') || key.includes('payment') || key.includes('reconcil') || key.includes('invoice') ? 'receipt'
    : key.includes('audit') || key.includes('approval') || key.includes('security') ? 'shield'
    : key.includes('expiry') || key.includes('loss') || key.includes('health') || key.includes('close') ? 'clock'
    : key.includes('user') || key.includes('staff') || key.includes('role') ? 'users'
    : key.includes('location') ? 'location'
    : key.includes('setting') || key.includes('theme') ? 'settings'
    : key.includes('search') ? 'search'
    : key.includes('logout') || key.includes('sign out') ? 'logout'
    : key.includes('file') || key.includes('notification') ? 'bell' : 'file';
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[icon]}</svg>;
}
