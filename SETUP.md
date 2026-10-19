# BKD Pharmacy setup

The application runs on Next.js with MySQL. The Next.js server provides the API and connects to MySQL using server-only environment variables. Laravel is not required.

## Requirements

- Node.js 20 or newer
- MySQL 8, either local or reachable from the Next.js server

## Database setup

For a fresh database, create an empty MySQL database and apply [`frontend/database/schema.mysql.sql`](frontend/database/schema.mysql.sql). For an existing installation, point Next.js at the existing database. Do not drop or recreate existing tables; the Next.js API uses the same tables and preserves their records.

Create `frontend/.env.local` using [`frontend/.env.example`](frontend/.env.example) as a template:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bkd_pharmacy
DB_USERNAME=root
DB_PASSWORD=your_database_password
```

Keep these values private. Do not prefix database credentials with `NEXT_PUBLIC_`.

An existing database keeps its current HOD, staff, and patient accounts. For a fresh database, create the first HOD user and default departments from `frontend/` with `npm.cmd run create-admin`. Choose a unique password of at least 12 characters.

## Run locally

From `frontend/`:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open <http://localhost:3000>. The development server prints a LAN address for other devices on the network. The browser talks to the same-origin `/api`; only the Next.js server needs database access.

To create a production build and serve it locally:

```powershell
npm.cmd run build
npm.cmd run start
```

## ZevCloud deployment

Configure the service root as `frontend/` and use:

- Build command: `npm run build`
- Start command: `npm run start`
- Runtime database variables: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`

The MySQL server must allow connections from the ZevCloud app. Keep the database port private and use the provider's private network when available. Do not set either build or start command to `npm run dev`.

## Windows desktop app

The Electron shell is still available for packaging:

```powershell
Set-Location frontend
npm.cmd run dist:win
```

Desktop clients need access to the hosted Next.js application and its MySQL database remains server-side. The app's API is same-origin; `NEXT_PUBLIC_API_URL` is not used.

## Offline POS

After signing in while online, POS can cache its catalogue, store sales on the device, print receipts, and retry synchronization when online. Other screens need the Next.js server. Each device's offline stock display is an estimate; the server checks stock and prescription limits when queued sales sync.
