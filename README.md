# General Hospital BKD Pharmacy System

An offline-first pharmacy inventory and point-of-sale system for General Hospital BKD. Its operating model is pharmacy retail software with hospital workflows for patients, prescriptions, dispensing departments, stock batches, and sales reporting.

This repository contains a working MVP and the planned product scope. The **Current MVP** sections describe implemented behavior. Features marked **Planned** or **Needs a decision** are not represented as finished software.

## Product goals

The system is intended to help pharmacy teams manage medicine catalogue records, receive and move stock, sell or dispense medicines, link transactions to patients and prescriptions, and review sales and stock status. It is designed for two dispensing departments first, with a central store and room to expand to other hospital units.

The first release prioritizes inventory, POS, alerts, offline sales, staff access, reports, patient labels, and two dispensing departments. Controlled-drug registers, NHIS claims, and deeper hospital integrations are later phases.

## Client-confirmed requirements

The client has confirmed the proposed first-release scope, with these clarifications:

- Start with the central store and two pharmacy departments, while allowing additional pharmacy units and staff accounts to be added later.
- Prefer hospital-server hosting for fast local operation, with a cloud option also desired. The exact arrangement (cloud backup, failover, or synchronized dual hosting) still needs an architecture decision; do not treat two writable servers as a requirement.
- POS terminal connection is desired, and every payment must also be recorded in the app. The current payment-mode selection does not yet integrate with a terminal.
- Use fixed selling prices. Price-change permissions and effective-date/history rules still need to be set.
- Defer NHIS functionality to a later phase.
- Existing stock/price records are available and should be assessed for import. Confirm their formats and fields before migration.
- No barcode scanner or printers have been selected. Recommended baseline for procurement: USB HID 1D/2D barcode scanners; an Epson TM-T20III 80 mm receipt printer (choose USB for one workstation or Ethernet for shared LAN use); and a direct-thermal label printer whose label size fits the medicine-label template. Confirm local support, consumables, and compatibility with the actual workstations before purchase. [Epson Africa product page](https://www.epson-africa.com/printers/point-of-sale/static-pos/tm-t20iii-011-usb-serial-ps-blk-eu-c31ch51011) lists the TM-T20III USB/serial variant; [Epson Africa Ethernet variant](https://www.epson-africa.com/printers/static-pos/epson-tm-t20iii-012a0-ether-c31ch51012a0) is available for network installation.

## Current MVP

| Area | Current behavior |
| --- | --- |
| Drug catalogue | The drug master screen supports adding a drug with name, SKU, barcode, category, and unit. The API also has update/deactivate endpoints, but the screen does not yet expose those actions. Strength, dosage form, and pack size are not separate catalogue fields yet. |
| Stock and departments | Stock is tracked by drug, batch, department, quantity, supplier, cost, selling price, and expiry. The seed data includes a central store and two dispensing departments. Store keepers can add stock batches and transfer stock. Intake is not yet a formal GRN approval workflow. |
| Sales and dispensing | Pharmacy staff can search or scan a barcode, select a patient or walk-in sale, set a discount, choose Cash, Transfer, NHIS, or Staff Credit, and save a sale. The server deducts stock from the earliest-expiring eligible batch when the sale syncs. |
| Receipts and labels | The POS can print an 80 mm receipt. Prescription-linked sales can print a patient medicine label containing the patient folder number and the prescription's dosage and instructions. |
| Low stock and expiry | HOD can configure low-stock and expiry warning thresholds. Inventory and dashboard views show matching alerts. Defaults are 20 units and 30 days. |
| Offline sales | The POS saves completed sales in local PouchDB/IndexedDB and retries synchronization when online. A local sale UUID prevents duplicate server records. Unsynced sales reduce the cached stock display on that device. Stock conflicts are kept for HOD review. |
| Patients and prescriptions | Patient folders are searchable and linked to sales. Doctors can create prescriptions with quantity, dosage, duration, and instructions; pharmacy staff can open a prescription in POS. |
| Staff access | MySQL-backed bearer-token authentication and server-side role checks support HOD, store keeper, pharmacy staff, medical director, and doctor. Existing staff records and bcrypt passwords can be reused. |
| Staff chat | Authenticated active accounts can send text messages to one another. Conversations refresh every 2.5 seconds while open, show sent/read indicators and unread counts, and can play a short sent/received tone when sound is enabled. Attachments are not supported. |
| Reports | Daily, weekly, and monthly sales summaries include department, staff, and payment-mode views. Sales data can be exported as CSV. |
| App identity | `frontend/public/icon.svg` is used as the PWA/browser icon and as the visible logo on the sign-in screen and app navigation. |

### Offline limitations

Offline support currently centers on the POS. A previously signed-in user can use the locally cached catalogue, save sales, print receipts, and let the queue retry later. Other workflows, including inventory receiving, transfers, prescription creation, staff management, and reports, require the Next.js server. Local stock figures are device-local estimates until the server accepts a sale; the server remains the shared stock authority and can flag conflicts when multiple devices sell the same remaining stock while disconnected.

## Planned features

These items are in the product specification but are not complete in the current MVP.

### Inventory and purchasing

- Formal goods-received-note (GRN) records with supplier invoice details and an approval workflow.
- Physical stock counts with review and reconciliation history.
- Overstock, fast-moving, and slow-moving stock alerts and reports.
- Catalogue fields for strength, dosage form, and pack size.
- An auditable stock movement trail covering receipts, edits, transfers, counts, and adjustments.

### Sales, payments, and controls

- Discount approval and approver tracking.
- A cashier workflow that confirms payment before dispensing, including a separate central cashier flow.
- POS terminal integration, confirmed as desired. Current payment modes record the selected method; terminal integration and payment confirmation are not implemented. The app must continue recording the payment method and transaction reference/status.
- Additional payment states such as free-drug transactions and configurable payment destinations.
- Fixed selling prices, confirmed by the client. Price administration, change authorization, and price history still need implementation/definition.

### Users and accountability

- Cashier and read-only auditor roles, configurable permissions, and staff shift assignment.
- A complete audit trail for sales, voids, stock edits, approvals, and user changes. A database audit-log table exists, but the full event logging and review workflow is not complete.

### Reports, insurance, and regulation

- Profit and loss, purchase-spend, stock-balance, reorder, fast/slow-moving, staff, and NHIS claims reports.
- Excel/PDF exports and report printing beyond the current sales CSV export.
- Controlled-drug flags, pharmacist approval rules, a dangerous-drug register, and PCN reporting exports.
- NHIS eligibility checks, covered-drug rules, claim records, and separate insurance pricing. Selecting NHIS as a payment mode alone does not provide these workflows.

### Administration and operations

- Backup and restore tools, configurable markup, and editable receipt and label templates.
- Expansion to additional pharmacy units and staff accounts, confirmed by the client; broader integrations with OPD, laboratory, cashier, and health-information systems remain later scope.
- Desktop hardware workflows such as UPS/power-loss recovery and printer/scanner compatibility validation on the hospital's actual devices.

## Architecture

- `frontend/` — Next.js 14, React, TypeScript, Tailwind CSS, PWA support, role-based screens, POS, and the local offline sales queue.
- `frontend/app/api/` — Next.js server API, MySQL data access, bearer-token authentication, and role enforcement.
- `frontend/database/schema.mysql.sql` — MySQL schema for fresh installations; existing Laravel-managed databases can be reused.
- `electron/` — context-isolated Electron shell for the Windows desktop build.
- Database — MySQL 8 for shared use; SQLite can be configured for local API development.

The Electron desktop app packages the frontend. Next.js serves the API and connects to MySQL on the server. MySQL credentials are server-only and must never use `NEXT_PUBLIC_` environment variables.

## Run locally

Requirements: Node.js 20+ and MySQL 8.

### 1. Configure MySQL

Create a database and apply `frontend/database/schema.mysql.sql` for a fresh installation. To continue using an existing installation, point Next.js at the same MySQL database; do not drop or recreate its tables. The schema includes authentication tokens, staff chat, stock counts, and all pharmacy tables.

Create `frontend/.env.local` with server-side database settings (see `frontend/.env.example`):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bkd_pharmacy
DB_USERNAME=root
DB_PASSWORD=your_database_password
```

Use an existing staff account from the database. Fresh installations need an administrator account inserted with a bcrypt password hash before first sign-in; do not use sample or shared production credentials.

### 2. Start Next.js

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The development server also prints a LAN URL for other devices. Only Next.js needs to be reachable by clients; it connects to MySQL server-side. After sign-in, POS sales can be queued locally while disconnected and synced when online.

### Public domain deployment

The production default is `https://bkdmedical.com.ng`, with the API at `https://bkdmedical.com.ng/api`. See [SETUP.md](SETUP.md#publish-on-bkdmedicalcomng) for the DNS, HTTPS, reverse-proxy, and server steps needed to make it reachable outside the local network. Changing application code cannot change DNS records or router/firewall settings.

## Windows desktop build

Stop the development server before building so the development server and production build do not write to `.next` at the same time. From `frontend/`, run:

```powershell
npm run dist:win
```

If PowerShell blocks the `npm.ps1` script, use:

```powershell
npm.cmd run dist:win
```

The NSIS installer is written to `frontend/dist/`. The desktop app requires the Next.js server and MySQL database to be reachable on the hospital network. For desktop development, start Next.js with `npm run dev`, then run `npm run desktop` from `frontend/`.

## Sign-in accounts

The application reads staff accounts from MySQL. Existing databases retain their current accounts. On a fresh installation, create the first HOD account with `npm.cmd run create-admin` from `frontend/`; the script prompts for a unique email and password without echoing the password.

## Roles and access control

The Next.js API enforces role permissions on protected endpoints. Hiding a screen in the frontend is not treated as an authorization check.

| Role | Access |
| --- | --- |
| HOD Super Admin (`hod`) | Full access to all pharmacy modules, all departments, reports, settings, sync-conflict review, and user account management. Can create, edit, disable, re-enable, and remove staff accounts. Removing an account disables sign-in and preserves its historical records. The current account and the last active HOD Super Admin cannot be removed or demoted. |
| Store keeper (`store_keeper`) | Drug catalogue, stock intake, inventory across departments, transfers, and supplier management. Cannot access POS, patient records, staff accounts, or management reports. |
| Pharmacy staff (`pharmacy_staff`) | POS, patient and active prescription workflows, own sales history, drug catalogue, and read-only stock information for the assigned department. Cannot manage users, delete patient records, receive/transfer stock, or access other departments' stock balances. |
| Medical director (`md`) | Read-only dashboard, sales reports, sales, catalogue, departments, and inventory views. Cannot edit stock, users, prescriptions, or settings. |
| Doctor (`doctor`) | Patient lookup, drug catalogue for prescribing, and prescriptions created by that doctor. Cannot access POS, stock management, sales reports, or user accounts. |

Cashier and auditor are future roles, not current seeded roles.
## API overview

All API routes are under `/api`. Login is `POST /api/auth/login` with `email` and `password`; protected routes use the bearer token returned by login, stored as a hash in MySQL. `GET /api/me` returns the authenticated account. Common endpoints include:

- `GET /api/dashboard` and `GET /api/reports` — overview and sales reports.
- `GET /api/drugs`, `GET /api/inventory`, and `GET /api/inventory/summary` — catalogue and stock.
- `POST /api/inventory/stock` and `POST /api/inventory/transfers` — stock intake and transfers.
- `GET/POST /api/patients` — patient lookup and records.
- `GET/POST /api/prescriptions` — prescription queue and creation.
- `POST /api/sync/sales` — idempotent synchronization of locally queued sales.
- `GET /api/sync/conflicts` — HOD review of stock or prescription conflicts.
- `GET/PUT /api/settings/alerts` — HOD low-stock and expiry thresholds.

## Decisions needed before production deployment

Remaining decisions before production deployment:

1. **Hosting and synchronization:** the client prefers a hospital server and also mentioned cloud for quick processes. Decide whether cloud is for backup/remote access or a true failover service; define the single authoritative database, backup ownership, local network access, and recovery expectations.
2. **POS integration:** identify terminal provider/model, payment processor/bank, supported integration method, required payment reference/status, and whether a central cashier confirms payments. Recording each payment in the app is mandatory.
3. **Fixed prices:** identify who may set/change prices, whether changes require approval, and whether the system should retain effective dates and price history.
4. **NHIS and controlled drugs:** NHIS is deferred. Confirm phase and requirements later; controlled-drug requirements remain undecided.
5. **Data migration:** existing stock and price records are available. Obtain sample files and confirm item, batch, supplier, quantity, expiry, and price fields before planning import.
6. **Hardware:** agree the 1D/2D scanner and printer models, connection types, label size, paper/label supplies, and power-loss recovery after an on-site compatibility check. Initial suggestion: USB HID scanners, Epson TM-T20III 80 mm receipt printer (USB for one workstation, Ethernet for LAN sharing), and a compatible direct-thermal label printer.
7. **Department and staffing setup:** confirm names and workflows for the first two dispensing units, central store, and process for adding future units and staff.

## Security and deployment notes

For a live deployment, use HTTPS, unique staff passwords, server-only database credentials and backups, restrict access to trusted networks, and run the Next.js service under a supervised production process. Do not use demo seed credentials for live accounts. The app is pharmacy workflow software; confirm hospital policies and applicable record-keeping requirements before using it for controlled medicines, insurance claims, or regulated reporting.
