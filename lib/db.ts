import mysql from 'mysql2/promise';

const globalForDb = globalThis as unknown as { bkdPool?: mysql.Pool };

export const db = globalForDb.bkdPool ?? mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospitalguru',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
});

// Reuse one pool per Node.js process in development and production.
globalForDb.bkdPool = db;

export function databaseConfigurationError() {
  if (process.env.NODE_ENV !== 'production') return null;
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].filter(key => !process.env[key]);
  if (missing.length) return `Missing required database environment variables: ${missing.join(', ')}`;
  if (process.env.DB_USER === 'root') return 'Production must use a dedicated database user, not root.';
  return null;
}
