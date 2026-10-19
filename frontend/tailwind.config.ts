import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: { 50: '#eff9f6', 100: '#d8f1e8', 500: '#168568', 600: '#117158', 700: '#0d5a47', 900: '#103a31' } }, boxShadow: { soft: '0 8px 30px rgba(25, 57, 48, .055)' } } }, plugins: [] } satisfies Config;
