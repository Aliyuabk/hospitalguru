// import.js
const fs = require("fs");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: "mysql-7d2086a-aliyuabubakar11117-c7d8.d.aivencloud.com",
    port: 19914,
    user: "avnadmin",
    password: process.env.AIVEN_PASSWORD, // set this in the terminal, not in the file
    database: "defaultdb",
    ssl: { ca: fs.readFileSync("ca.pem") },
    multipleStatements: true,
  });

  const sql = fs.readFileSync("seed_live_environment.sql", "utf8");
  await conn.query(sql);
  const [rows] = await conn.query("SHOW TABLES");
  console.log("Tables in database:", rows);
  await conn.end();
})().catch((err) => console.error("Import failed:", err.message));