# Production deployment preparation

This project is a Next.js Node.js application backed by MySQL. The database connection is server-side and reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from the application environment.

## Configure the hosted services

1. In the application hosting service, set the variables shown in `.env.production.example` using the database service's **internal** connection details. Use a dedicated database user and a newly rotated password. Keep the password in the hosting provider's secret manager; do not add it to `.env.example`, source code, or a committed `.env` file.
2. Use the database name provisioned by the host (the screenshot shows `hospital`). `DB_NAME` must match it exactly.
3. Confirm the database service health check is passing before deploying the app. The screenshot currently reports a failing database health check, so app connectivity cannot be confirmed until that service is healthy.
4. Import `database/schema.sql` into the selected hosted database. It no longer creates or switches to a hard-coded database name. Do not import `database/seed_live_environment.sql`; it contains synthetic QA records and shared test credentials. Create the first administrator through `/setup` after the app is reachable.
5. Build and start the app with `npm run build` and `npm run start`. Configure the host to expose the Node.js service over HTTPS.
6. Check `/api/health`. HTTP 200 means the app can connect to MySQL; HTTP 503 means required database settings are missing or the database is unreachable. The endpoint intentionally does not disclose connection details.

## Before production use

- Rotate the database password shown in the shared screenshot before using that account. Treat it as exposed.
- Restrict the database user to the required database and application operations; do not use `root`.
- Back up the database and apply the schema only to the intended empty production database.
- Load only BKD-authorized staff, patient, supplier, medicine, price, and opening-stock records. QA seed data is not production data.
- The application deployment target and its secret settings must be configured in the hosting provider; this repository does not contain a deployment credential or provider project link.
