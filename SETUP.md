# BKD Pharmacy App Setup Guide

This guide explains how to run the General Hospital BKD Pharmacy System on Windows for local development or a desktop demonstration. The system has a Next.js frontend, a separate Laravel API, a database, and an optional Electron desktop installer.

> The desktop installer contains the Electron shell and frontend. It does **not** install or start the Laravel API or database. Keep the API and database running on a server that the desktop app can reach.

## 1. Install prerequisites

Install these tools and make sure they are available in PowerShell:

- Node.js 20 or newer (includes npm)
- PHP 8.2 or newer, with the `pdo_mysql`, `mbstring`, `openssl`, and `fileinfo` extensions enabled
- Composer
- MySQL 8 for shared use, or SQLite for local API development

Check versions:

```powershell
node --version
npm.cmd --version
php --version
composer --version
```

## 2. Configure and start the database

### MySQL

Start MySQL and create an empty database named `bkd_pharmacy`. The default database settings in `backend/.env.example` use MySQL at `127.0.0.1:3306`, username `root`, and a blank password. Change these values to match your database account.

### SQLite for local development

From the project root, create the SQLite database file:

```powershell
New-Item -ItemType File -Force backend\database\database.sqlite
```

In `backend/.env`, set:

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

## 3. Configure and start the Laravel API

Open PowerShell in the project root and create the backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env`. At minimum, set a unique seed password with at least 12 characters. For MySQL, also set the database name, username, and password.

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bkd_pharmacy
DB_USERNAME=root
DB_PASSWORD=your_database_password
BKD_SEED_PASSWORD=choose-a-unique-password-at-least-12-characters
```

Install backend dependencies, create the Laravel application key, migrate and seed the database, then start the API:

```powershell
Set-Location backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
composer run dev
```

The API is now available at `http://localhost:8000`. Keep this terminal open. The seeder creates the central store, two dispensing departments, example catalogue/stock/patient records, and starter accounts.

## 4. Configure and start the frontend

Open a second PowerShell window from the project root. Create `frontend/.env.local` in a text editor:

```powershell
Set-Location frontend
notepad .env.local
```

Leave the API address unset so it follows the browser host for local and LAN access:

```env
NEXT_PUBLIC_API_URL=
```

Install frontend dependencies and start the development server:

```powershell
npm install
npm run dev
```

If PowerShell reports that running `npm.ps1` scripts is disabled, use the Windows command shim:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000` in a browser. Keep both the API and frontend terminals running.

The frontend automatically uses the API on the same computer and port 8000. The backend development server binds to the network for LAN access. Allow inbound TCP ports 3000 and 8000 through Windows Firewall on the Private network profile. For production, use a properly configured web server and HTTPS instead of Laravel's development server.

## 5. Sign in

All seeded accounts use the password configured as `BKD_SEED_PASSWORD` in `backend/.env`:

| Role | Email |
| --- | --- |
| HOD | `hod@bkd.local` |
| Store keeper | `store@bkd.local` |
| Pharmacy staff | `amina@bkd.local`, `john@bkd.local`, `maryam@bkd.local`, `david@bkd.local` |
| Medical director | `md@bkd.local` |
| Doctor | `doctor@bkd.local` |

Use non-demo credentials for real deployments. Change or replace seeded credentials before providing access to staff.

## 6. Run the Electron desktop shell in development

With the frontend development server running, open another PowerShell window:

```powershell
Set-Location frontend
npm run desktop
```

If npm scripts are blocked, use `npm.cmd run desktop`.

## 7. Build the Windows installer

Leave `NEXT_PUBLIC_API_URL` empty in `frontend/.env.local` for desktop builds. The installed Electron app discovers the BKD API on the same local subnet automatically. The backend server must be updated, running on port 8000, and reachable through the hospital LAN. Stop `npm run dev` before packaging so the development server and production build do not write to the same `.next` folder.

From the project root:

```powershell
Set-Location frontend
npm.cmd run dist:win
```

The command runs the Next.js production build and Electron Builder. The installer should appear in:

```text
frontend\dist\General Hospital BKD Pharmacy Setup 1.0.0.exe
```

The API and database still need to run on the hospital server. Install the updated backend and allow inbound TCP port 8000. The desktop computers should be connected to the same hospital network as the API server.

## Publish on bkdmedical.com.ng

The frontend now defaults to `https://bkdmedical.com.ng` and the API to `https://bkdmedical.com.ng/api`. The application is configured for this address, but DNS and hosting must point the domain at a server before it becomes reachable:

1. In the domain's DNS control panel, set an `A` record for `@` to the server's **public static IPv4 address**. Set `www` as a CNAME to `bkdmedical.com.ng` (or point it to the same IP).
2. On the server/provider firewall, allow inbound ports 80 and 443. If the server is inside the hospital, configure the router's port forwarding to that server. Do not expose the database port to the internet.
3. Configure a production web server (Nginx, Apache, or IIS) with a valid TLS certificate. Route `https://bkdmedical.com.ng/` to the Next.js production server on `127.0.0.1:3000`, and route `/api` to the Laravel API on `127.0.0.1:8000`, preserving the `/api` path. Keep both app servers bound to localhost behind the HTTPS proxy.
4. In `backend/.env`, set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://bkdmedical.com.ng`, `FRONTEND_URL=https://bkdmedical.com.ng`, and `CORS_ALLOWED_ORIGINS=https://bkdmedical.com.ng,https://www.bkdmedical.com.ng`. Use production database credentials and a unique application key/passwords.
5. In `frontend/.env.local` on the build machine, set `NEXT_PUBLIC_SITE_URL=https://bkdmedical.com.ng` and `NEXT_PUBLIC_API_URL=https://bkdmedical.com.ng/api`, then run `npm.cmd run build`. These public values are embedded at build time.
6. Verify the site and `/api` from a phone on mobile data (not hospital Wi-Fi). Configure database backups, HTTPS renewal, and supervised services before using real hospital records.

### Access from other devices on the hospital LAN

Run `npm.cmd run dev` in `frontend` and `composer run dev` in `backend`. The frontend prints the server's LAN IP and URL, for example `http://10.22.32.251:3000`. Open that address from a device connected to the same hospital Wi-Fi/LAN. Keep both development terminals running and allow inbound TCP ports 3000 and 8000 through Windows Firewall on the Private network profile. No domain, hosts-file entry, or port 80 proxy is needed.

Open the IP address printed by `npm.cmd run dev` (for example, `http://10.22.32.251:3000`) from any device connected to the same hospital Wi-Fi/LAN. Keep the frontend and backend development servers running and allow inbound TCP ports 3000 and 8000 through Windows Firewall on the Private network profile. No local domain, hosts-file entry, or port 80 proxy is needed.

## 8. Offline POS behavior

After a user signs in while connected, the POS can use its locally cached drug catalogue, save completed sales on that device, print receipts, and retry synchronization when connectivity returns. The app uses a client sale ID to avoid duplicating a sale during retries. If the server cannot accept a queued sale because stock or prescription limits conflict, the sale remains queued and is available for HOD review.

Offline operation is currently focused on POS sales. Stock views are local estimates while disconnected, and other workflows such as stock receiving, transfers, staff management, reports, and creating prescriptions require the API. Multiple disconnected devices do not share stock reservations.

## Troubleshooting

### The POS shows `ReferenceError: self is not defined`

Use the current code, where the browser-only offline database is loaded when POS actions run. If you are using an older checkout, update the project before building.

### Next.js reports a missing `.next` chunk or module

Stop all running frontend commands with **Ctrl+C**, then remove the generated Next.js cache and restart:

```powershell
Set-Location frontend
Remove-Item -Recurse -Force .next
npm.cmd run dev
```

Do not run `npm run dev` and `npm run dist:win` at the same time.

### Sign-in cannot reach the API

For a frontend exposed through an HTTPS tunnel such as Cloudflare Tunnel, leave `NEXT_PUBLIC_API_URL` empty so browser requests use the same-origin `/api` path. Run Laravel on the same computer as Next.js at `127.0.0.1:8000`; Next.js forwards `/api/*` requests to Laravel. If Laravel listens elsewhere, set `BKD_API_INTERNAL_URL` before starting `npm run dev` or before running `npm.cmd run build` (the production rewrite target is set at build time), using its internal base URL such as `http://127.0.0.1:8000/api`. Also confirm that `backend/.env` contains valid database settings. If you intentionally configure `NEXT_PUBLIC_API_URL` to a separate public API host, that API must allow the frontend origin in `CORS_ALLOWED_ORIGINS` and serve HTTPS.

### Database migration or seed fails

Check the database service and credentials, confirm the database exists, and ensure `BKD_SEED_PASSWORD` is at least 12 characters. Do not run destructive migration commands against a database containing real records.

## Deployment checklist

Before using the system with live hospital data:

- Host the API and database on a backed-up server reachable by all pharmacy workstations.
- Use HTTPS, a strong application key, unique staff passwords, and restricted network access.
- Configure the production API URL before building the desktop installer.
- Decide the hospital's offline conflict and stock reconciliation procedures.
- Validate the barcode scanners, receipt/label printers, and power backup with the actual workstations.
- Confirm hospital approval for patient records, payment workflows, NHIS, controlled medicines, and regulated reports. NHIS claims, controlled-drug registers, formal GRN approvals, and several other items in the product specification are not yet implemented.
