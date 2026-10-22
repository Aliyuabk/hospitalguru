# BKD General Hospital Pharmacy Management System

This checkout contains the first application workspace for the BKD Pharmacy MVP. The UI follows [`MVP.md`](MVP.md), includes all ten role workspaces, and reads administration and operational lists from MySQL when connected.

## Start with XAMPP

1. Start **MySQL** in the XAMPP Control Panel. Apache is only needed if you use phpMyAdmin to import the schema.
2. Create/select the `hospitalguru` database, then import [`database/schema.sql`](database/schema.sql) through phpMyAdmin or the MySQL CLI. The schema seeds the ten roles, four initial locations, and default settings in the selected database.
3. XAMPP defaults are configured in the server-side connection: host `127.0.0.1`, port `3306`, user `root`, blank password, database `hospitalguru`. If your XAMPP MySQL root account has a password or a different port, copy `.env.example` to `.env.local` and change the server-only `DB_*` values.
4. Install Node dependencies and start Next.js:

   ```powershell
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`. The first visitor can create the initial Super Administrator account at `/setup`. The setup endpoint is disabled after the first user record exists.

For hosted deployment, see [`DEPLOYMENT.md`](DEPLOYMENT.md) and configure server-side database secrets in the hosting provider.

## Roles and access

The role-specific URLs are `/super-admin`, `/cmd`, `/head-pharmacist`, `/drf-store`, `/pharmacy`, `/pharmacy-supervisor`, `/cashier`, `/procurement`, `/auditor`, and `/system-admin`. Workspace routes and data API requests check the signed-in user's role on the server. The permission matrix remains unconfigured until BKD approves the detailed policy; sensitive approval and inventory write actions stay unavailable in the UI until their server workflows are implemented.

Passwords are hashed with Node's scrypt implementation. Session tokens are random, stored as SHA-256 hashes in `access_tokens`, and placed in HTTP-only cookies. Database credentials must remain server-side.

## Current implementation boundary

Authentication, initial administrator setup, user/location/catalogue/supplier creation, account suspension, audit writes for supported administration changes, and authorized data reads use MySQL. The remaining transaction pages are structured from the MVP and clearly mark actions that still require workflow endpoints. Password recovery also needs a verified hospital email delivery service before it can issue reset links.
