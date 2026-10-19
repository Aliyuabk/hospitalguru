import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';

declare global { var mysqlPool: Pool | undefined }

export const db = global.mysqlPool ?? mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USERNAME || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_DATABASE || process.env.MYSQLDATABASE || 'bkd_pharmacy',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  decimalNumbers: true,
});
if (process.env.NODE_ENV !== 'production') global.mysqlPool = db;

export async function rows<T extends RowDataPacket = RowDataPacket>(sql: string, values: any[] = []) {
  const [result] = await db.execute<T[]>(sql, values);
  return result;
}
export async function one<T extends RowDataPacket = RowDataPacket>(sql: string, values: any[] = []) {
  return (await rows<T>(sql, values))[0] ?? null;
}
export async function run(sql: string, values: any[] = []) {
  const [result] = await db.execute<ResultSetHeader>(sql, values);
  return result;
}
