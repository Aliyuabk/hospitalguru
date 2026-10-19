import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

loadEnvConfig(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const rl = createInterface({ input: stdin, output: stdout });
const email = (await rl.question('HOD email: ')).trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email)) { rl.close(); throw new Error('Enter a valid email address.'); }

async function hiddenPassword(prompt) {
  stdout.write(prompt);
  if (!stdin.isTTY) throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
  stdin.setRawMode(true); stdin.resume();
  return new Promise((resolvePassword, reject) => {
    let value = '';
    const onData = (chunk) => {
      const char = chunk.toString('utf8');
      if (char === '\u0003') { cleanup(); reject(new Error('Cancelled.')); }
      else if (char === '\r' || char === '\n') { cleanup(); stdout.write('\n'); resolvePassword(value); }
      else if (char === '\u007f' || char === '\b') { value = value.slice(0, -1); }
      else if (char >= ' ' && char <= '~') value += char;
    };
    const cleanup = () => { stdin.off('data', onData); stdin.setRawMode(false); };
    stdin.on('data', onData);
  });
}

const password = await hiddenPassword('HOD password (minimum 12 characters): ');
rl.close();
if (password.length < 12) throw new Error('Use a password of at least 12 characters.');
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USERNAME || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_DATABASE || process.env.MYSQLDATABASE || 'hospitalguru',
});
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  for (const [name, code, type] of [['Central Store','central-store','central_store'],['Central Pharmacy','central-pharmacy','central_pharmacy'],['Department 2','dept-2','dept_2']]) {
    await connection.execute('INSERT IGNORE INTO departments(name,code,type,is_active,created_at,updated_at) VALUES(?,?,?,1,NOW(),NOW())', [name,code,type]);
  }
  const [existing] = await connection.execute('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
  if (existing.length) throw new Error('That email already exists. No account was changed.');
  const hash = await bcrypt.hash(password, 12);
  await connection.execute('INSERT INTO users(name,email,password,role,department_id,is_active,created_at,updated_at) VALUES(?,?,?,\'hod\',NULL,1,NOW(),NOW())', ['HOD Administrator',email,hash]);
  await connection.commit();
  stdout.write(`HOD account created for ${email}.\n`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
