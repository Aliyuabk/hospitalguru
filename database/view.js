// view.js
const fs = require("fs");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: "mysql-7d2086a-aliyuabubakar11117-c7d8.d.aivencloud.com",
    port: 19914,
    user: "avnadmin",
    password: process.env.AIVEN_PASSWORD,
    database: "defaultdb",
    ssl: { ca: fs.readFileSync("ca.pem") },
  });

  const [tables] = await conn.query("SHOW TABLES");
  const tableNames = tables.map((row) => Object.values(row)[0]);
  console.log("Tables:", tableNames);

  // Show the first 10 rows of each table
  for (const name of tableNames) {
    const [rows] = await conn.query(`SELECT * FROM \`${name}\` LIMIT 10`);
    console.log(`\n--- ${name} (${rows.length} rows shown) ---`);
    console.table(rows);
  }

  await conn.end();
})().catch((err) => console.error("Error:", err.message));