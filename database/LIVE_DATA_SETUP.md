# Synthetic environment setup

`seed_live_environment.sql` is a **fictional test fixture**, despite the historical filename. It creates realistic-looking but invented staff, patients, suppliers, medicine catalogue entries, stock, and workflow records so every role can be exercised locally. It is not BKD live data and must never be imported into a production database.

## Import for local testing

1. Start XAMPP's MySQL/MariaDB service and create or select the `hospitalguru` database.
2. For a new database, import `schema.sql` first.
3. Import `seed_live_environment.sql` using phpMyAdmin or the MariaDB client.
4. Sign in with one of the role accounts below. Every account uses the password `BkdTest2026!`.
5. Test each workflow and location. These are shared QA accounts and should only exist in a disposable local or isolated staging database.

| Role | Username |
|---|---|
| Super Administrator | `admin.qa` |
| CMD Executive | `cmd.qa` |
| Head Pharmacist | `headpharm.qa` |
| DRF Store Keeper | `drf.qa` |
| Pharmacy Dispenser | `dispenser.qa` |
| Pharmacy Supervisor | `supervisor.qa` |
| Cashier | `cashier.qa` |
| Procurement Officer | `procurement.qa` |
| Internal Auditor | `auditor.qa` |
| System Administrator | `sysadmin.qa` |

## What the fixture creates

It provisions the role permissions and locations plus synthetic users and assignments, suppliers, drugs and price history, stock batches and reorder rules, patients and prescriptions, purchase requests and orders, GRNs, pharmacy stock requests and transfers, sales and payments, returns, stock counts, adjustments, write-offs, refunds, business-day reconciliation, audit logs, notifications, system-health events, backups, inventory ledger rows, and missing default settings/numbering sequences.

The script can be rerun to refresh records keyed with `QA-`. It may reset those fixture records. It preserves existing general settings and permission choices where its SQL uses insert-if-missing behavior. Do not run it against a database containing real operational records.

## Actual BKD deployment

For a genuine production deployment, use only BKD-approved staff, patient, supplier, catalogue, price, and stock records. Create the first administrator through the application's `/setup` flow, then load authorized records using reviewed imports and auditable opening-balance workflows. Do not use these QA credentials or guessed records in production.
