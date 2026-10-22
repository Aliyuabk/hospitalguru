Excellent. For the **BKD General Hospital Pharmacy Management System**, we should create a complete **UI/UX Design and Page Specification** covering every page, dashboard, color, layout, component, interaction, and permission for every user role.

The goal is to give your developer or an AI coding tool like Claude, Gemini, or Cursor enough detail to build a consistent, professional hospital pharmacy management application—not just attractive dashboards.

I recommend designing it as a modern hospital management system with a consistent design system and role-specific workspaces.

# BKD General Hospital Pharmacy Management System
## Complete UI/UX Design Specification

### 1. Global design system

This section defines the appearance and behavior shared by every page.

#### 1.1 Brand identity

**Application name:** BKD General Hospital Pharmacy Management System

**Central inventory:** DRF STORE

**Design direction:** Modern healthcare enterprise software, clean, professional, trustworthy, accessible, and data-focused.

**Primary design principle:** Each role sees only the pages, data, actions, and navigation relevant to its responsibilities.

#### 1.2 Color palette

Use the following colors consistently throughout the application.

| Purpose | Color | Hex code |
|---|---|---|
| Primary brand | Medical teal | `#0F766E` |
| Primary hover | Dark teal | `#115E59` |
| Sidebar background | Deep navy | `#102A43` |
| Main background | Light gray | `#F5F7FA` |
| Card background | White | `#FFFFFF` |
| Main text | Dark navy | `#172B4D` |
| Secondary text | Slate gray | `#64748B` |
| Borders | Light slate | `#E2E8F0` |
| Success | Green | `#15803D` |
| Warning | Amber | `#D97706` |
| Danger | Red | `#DC2626` |
| Information | Blue | `#2563EB` |
| Disabled elements | Gray | `#94A3B8` |

**Color usage rules**

- Teal: Primary buttons, active navigation, important actions and selected tabs.
- Navy: Sidebar, headings and major navigation elements.
- Green: Successful transactions, approved requests and completed payments.
- Amber: Pending approvals, near-expiry stock and items requiring attention.
- Red: Failed transactions, expired stock, rejected requests and critical alerts.
- Blue: Information messages, neutral indicators and informational links.
- Gray: Secondary information, disabled controls and inactive states.

Never use color alone to communicate status. Pair colors with text and, where appropriate, icons.

#### 1.3 Typography

Recommended font: Inter.

| Element | Recommended size | Weight |
|---|---:|---|
| Page title | 26–30 px | 700 |
| Section heading | 18–22 px | 600 |
| Card title | 14–16 px | 500–600 |
| Main metric | 28–36 px | 700 |
| Body text | 14 px | 400 |
| Table text | 13–14 px | 400 |
| Form label | 13–14 px | 500–600 |
| Helper text | 12 px | 400 |
| Button text | 14 px | 600 |

Use consistent typography and avoid excessive font sizes or decorative fonts.

#### 1.4 Application layout

The desktop application should use three principal interface areas.



**A. Left sidebar**

- Fixed dark navy background.
- Hospital logo and application name at the top.
- Role-specific navigation links.
- Icons beside each menu item.
- Active page highlighted with a teal background or accent.
- Collapsible navigation for smaller screens.
- User profile and logout at the bottom.

**B. Top navigation bar**

- Current page title or breadcrumb.
- Global search where applicable.
- Notification bell with unread count.
- Help or support button.
- Current location, when relevant.
- User avatar, name and role.
- Profile dropdown and logout action.

**C. Main content area**

- Light gray background.
- Page title and description.
- Breadcrumb navigation.
- Primary action button aligned to the right of the heading.
- KPI cards where useful.
- Tables, charts, forms or workflow panels.
- Responsive spacing and consistent card styling.

#### 1.5 Standard spacing and components

Use an 8-pixel spacing system.

| Component | Specification |
|---|---|
| Sidebar width | 250 px expanded |
| Collapsed sidebar | Approximately 76 px |
| Topbar height | 68 px |
| Main content padding | 24 px desktop |
| Card padding | 20–24 px |
| Card border radius | 12 px |
| Input height | 44 px |
| Button height | 40–44 px |
| Table row height | 52–60 px |
| Card border | 1 px solid `#E2E8F0` |
| Card shadow | Subtle, not excessive |
| Modal radius | 14 px |

On mobile devices, the sidebar should become a slide-out drawer. Tables should use horizontal scrolling or a mobile-friendly card layout.

---

# 2. Authentication pages

These pages are shared across all roles.

## Page 1: Login

**Route:** `/login`

### Layout

Use a two-column desktop layout.

**Left section:**

- BKD General Hospital logo.
- Product name.
- Short description: Pharmacy Inventory, Dispensing and Management.
- A subtle medical illustration or pharmacy-related visual.
- Small footer showing the hospital name.

**Right section:**

A white login card containing:

- Welcome heading.
- Email or username field.
- Password field.
- Show/hide password control.
- Remember-me checkbox, if permitted by security policy.
- Sign-in button.
- Forgot-password link.
- Loading indicator during authentication.
- Error message area.

### Interaction

When the user submits the form:

1. Validate required fields.
2. Authenticate against the backend.
3. Verify the account is active.
4. Load the user's assigned role and location permissions.
5. Redirect to the appropriate dashboard.
6. Display a clear error if authentication fails.

Do not allow users to choose a role on the login screen to gain permissions. The backend must determine the user's actual role.

### Visual treatment

- White login card.
- Teal primary button.
- Navy headings.
- Light gray background.
- Small, restrained medical illustration.

## Page 2: Forgot password

**Route:** `/forgot-password`

Components:

- Page title.
- Email or username field.
- Send recovery instructions button.
- Back to login link.
- Success message.

Do not reveal whether an account exists through distinguishable error messages.

## Page 3: Reset password

**Route:** `/reset-password`

Components:

- New password.
- Confirm password.
- Password requirements.
- Reset button.
- Expired or invalid recovery link message.

Recovery tokens must expire and be single-use.

## Page 4: Access denied

**Route:** `/403`

Display:

- Lock icon.
- Heading: Access Restricted.
- Explanation that the user does not have permission.
- Return to dashboard button.

The backend must enforce access restrictions even if a user manually enters a URL.

---

# 3. Role 1 — Super Administrator

The Super Administrator manages the technical and operational configuration of the application.

This role should have broad administrative capabilities, but **should not automatically receive unrestricted pharmacy dispensing or stock-approval authority**.

## 3.1 Super Administrator sidebar

Recommended navigation:

**MAIN**
- Dashboard

**ORGANIZATION**
- Hospital Settings
- Locations
- User Management
- Roles & Permissions

**PHARMACY CONFIGURATION**
- Drug Catalogue
- Suppliers
- Inventory Settings
- Transaction Numbering

**SYSTEM**
- Notifications
- Audit Logs
- Reports
- Backup & System Health

**ACCOUNT**
- My Profile
- Security Settings
- Logout

Items should be grouped and collapsible.

## Page 5: Super Administrator Dashboard

**Route:** `/super-admin/dashboard`

This dashboard gives a high-level view of system health, user activity and inventory operations.

### Header

Title: `System Overview`

Subtitle: `Monitor BKD General Hospital Pharmacy Operations`

Right-side actions:

- Date range selector.
- Refresh button.
- Export summary button.

### KPI cards

Display four cards in the first row.

| Card | Metric | Color | Icon |
|---|---|---|---|
| Total Locations | Number of configured locations | Teal | Building |
| Active Users | Active registered accounts | Blue | Users |
| Pending Approvals | Transactions awaiting action | Amber | Clock |
| System Alerts | Open technical or operational alerts | Red | Alert triangle |

These cards should display real database values, not static demonstration numbers.

### Second row: Operational overview

Use two large cards.

**A. Inventory distribution**

A donut chart showing stock valuation by location:

- DRF STORE.
- Central Pharmacy.
- JICHMA Pharmacy.
- Other Pharmacy.

Use a consistent color palette and a legend.

Only include valid stock valuation figures, with clear treatment of in-transit and quarantined stock.

**B. System activity**

A line chart showing:

- User activity over time.
- Transactions created.
- Transactions completed.
- Failed operations.

Provide a configurable date range.

### Third row: Recent activity

A table containing:

| Column | Description |
|---|---|
| Timestamp | Date and time |
| User | User responsible |
| Action | Event performed |
| Module | Affected module |
| Reference | Transaction or event ID |
| Status | Success, failure or review required |

Clicking a record opens its authorized details.

### Fourth row: Alerts and tasks

Display:

- Failed background jobs.
- Backup failures.
- Unusual login activity.
- Pending administrative tasks.
- System configuration warnings.

Technical alerts must be distinguished from pharmacy approval queues.

### Visual layout

```text
┌──────────────────────────────────────────────────────┐
│ System Overview                 Date Range | Export  │
├────────────┬────────────┬────────────┬───────────────┤
│ Locations  │ Active     │ Pending    │ System        │
│            │ Users      │ Approvals  │ Alerts        │
├─────────────────────────┬────────────────────────────┤
│ Inventory Distribution  │ System Activity            │
│                         │                             │
│      Donut Chart        │       Line Chart            │
├─────────────────────────┴────────────────────────────┤
│ Recent Activity                                       │
│ Timestamp | User | Action | Reference | Status        │
├─────────────────────────┬────────────────────────────┤
│ System Alerts           │ Administrative Tasks       │
└─────────────────────────┴────────────────────────────┘
```

On smaller screens, the cards and charts should stack vertically.

## Page 6: User Management

**Route:** `/super-admin/users`

### Page header

Title: `User Management`

Subtitle: `Create accounts and manage application access.`

Primary button: `+ Create User`

### Summary cards

- Total users.
- Active users.
- Suspended users.
- Users requiring attention.

### Filter bar

Include:

- Search by name, username or email.
- Filter by role.
- Filter by assigned location.
- Filter by account status.
- Clear filters button.

### User table

| Column | Content |
|---|---|
| User | Avatar, name |
| Username | Login identifier |
| Role | Assigned role |
| Location | Authorized location or locations |
| Status | Active, suspended or pending |
| Last Login | Last successful login |
| Actions | View, edit, suspend |

### Create-user form

Use a right-side drawer or modal.

Fields:

- Full name.
- Username.
- Email.
- Staff ID, if applicable.
- Assigned role.
- Assigned location.
- Account status.
- Temporary password or secure invitation option.

### Rules

- Usernames must be unique.
- Role assignment must be validated by the backend.
- Suspending an account must invalidate or revoke active sessions according to the security policy.
- Deactivated users' historical transactions must remain intact.
- High-privilege role changes should be audited.

## Page 7: Roles & Permissions

**Route:** `/super-admin/roles`

This page defines which roles can access each module and perform each action.

### Layout

Left panel:

- List of roles.
- Create role button, if custom roles are supported.

Main panel:

Permission matrix.

| Module | View | Create | Edit | Approve | Delete |
|---|---|---|---|---|---|
| Users | ✓ | ✓ | ✓ | — | Restricted |
| Drug Catalogue | ✓ | ✓ | ✓ | As configured | Restricted |
| GRNs | ✓ | ✓ | ✓ | As configured | — |
| Transfers | ✓ | ✓ | ✓ | As configured | — |
| Sales | Restricted | Restricted | Restricted | As configured | — |
| Reports | ✓ | — | — | — | — |
| Audit Logs | ✓ | — | — | — | — |

The matrix is illustrative. Actual permissions must be configured according to the approved authorization policy.

Include a separate permission for sensitive actions such as:

- Posting a GRN.
- Confirming a transfer.
- Approving a return.
- Processing a write-off.
- Issuing a refund.
- Reopening a closed business day.
- Changing product prices.

**Important:** Do not implement permissions as frontend-only checks.

## Page 8: Location Management

**Route:** `/super-admin/locations`

Display the four initial locations.

- DRF STORE.
- Central Pharmacy.
- JICHMA Pharmacy.
- Other Pharmacy.

Each location card should show:

- Location name.
- Location code.
- Location type.
- Active/inactive status.
- Assigned supervisor.
- Number of assigned users.
- Last activity.

Actions:

- View details.
- Edit configuration.
- Manage authorized users.
- Configure reorder levels.
- View inventory.

Do not permit the deletion of a location that has historical transactions. Use an approved deactivation process.

## Page 9: Hospital Settings

**Route:** `/super-admin/settings`

Organize settings into tabs.

**General**
- Hospital name.
- Logo.
- Address.
- Contact information.
- Time zone.
- Default language.

**Inventory**
- Base units.
- Unit conversions.
- Expiry warning periods.
- Reorder rules.
- Negative-stock policy.
- Valuation method.

**Sales**
- Currency: NGN.
- Receipt format.
- Approved payment methods.
- Tax configuration, if applicable.
- Discount permissions.

**Security**
- Session timeout.
- Password policy.
- Multi-factor authentication policy.
- Login rate limits.

**Documents**
- GRN numbering.
- Transfer numbering.
- Return numbering.
- Invoice numbering.
- Receipt numbering.

Changes to important settings must be logged and, where necessary, require additional authorization.

## Page 10: Drug Catalogue

**Route:** `/super-admin/drugs`

The page should contain:

- Search field.
- Category filter.
- Active/inactive filter.
- Product table.
- Add drug button.
- Import/export controls for authorized users.

Product columns:

- Drug code.
- Generic name.
- Brand.
- Strength.
- Dosage form.
- Base unit.
- Purchasing unit.
- Pack conversion.
- Status.
- Actions.

The product detail page should have tabs:

1. General information.
2. Pricing.
3. Batch and expiry information.
4. Stock by location.
5. Transaction history.

Drug records used in historical transactions should not be destructively deleted.

## Page 11: Supplier Management

**Route:** `/super-admin/suppliers`

Include:

- Supplier search.
- Supplier list.
- Add supplier button.
- Supplier status.
- Contact information.
- Registration details where applicable.
- Purchase history.
- Linked GRNs.

Supplier details should contain a summary, contact information, documents and transaction history.

## Page 12: Audit Logs

**Route:** `/super-admin/audit-logs`

Provide filters for:

- Date range.
- User.
- Module.
- Event type.
- Status.
- Transaction reference.

Table columns:

- Timestamp.
- User.
- Event.
- Module.
- Record reference.
- Outcome.
- Details.

Authorized users may inspect event details and export permitted reports.

Audit logs must be append-only from the perspective of normal application users and protected against tampering.

## Page 13: System Health

**Route:** `/super-admin/system-health`

Display:

- Application availability.
- Database connectivity.
- Background job status.
- Backup status.
- Storage usage.
- Error counts.
- Failed integrations.

Do not expose passwords, access tokens, database connection strings or other secrets.

---

# 4. Role 2 — CMD / Authorized Executive

The CMD dashboard should emphasize hospital-wide visibility, risk, financial performance and accountability.

The CMD should generally have read-only access to operational data, with explicitly authorized management actions where required.

## 4.1 CMD sidebar

- Dashboard.
- Inventory Overview.
- Stock Valuation.
- Sales Overview.
- Pharmacy Performance.
- Expiry & Losses.
- Approval Oversight.
- Reports.
- Audit Overview.
- My Profile.
- Logout.

## Page 14: CMD Dashboard

**Route:** `/cmd/dashboard`

### Header

Title: `Executive Overview`

Subtitle: `Hospital Pharmacy Performance and Inventory Control`

Filters:

- Today.
- Last 7 days.
- Last 30 days.
- Custom date range.
- All locations or a selected location.

### First row: KPI cards

| KPI | Description |
|---|---|
| Total Stock Value | Value of inventory under the approved valuation policy |
| Today's Sales | Completed sales for the current business day |
| Low-Stock Products | Products below reorder thresholds |
| Expiring Products | Products within the configured warning window |
| Pending Approvals | Transactions awaiting authorized action |
| Stock Write-offs | Approved write-off value within the selected period |

Use small trend indicators where reliable historical comparisons exist.

### Second row

**Sales trend chart**

- Daily or weekly sales.
- Filters by pharmacy.
- Revenue and refund treatment clearly defined.

**Stock distribution chart**

- DRF STORE.
- Central Pharmacy.
- JICHMA Pharmacy.
- Other Pharmacy.

### Third row

**Top-selling medicines**

- Product.
- Quantity dispensed.
- Sales value.
- Location.

**Critical inventory alerts**

- Product.
- Location.
- Available quantity.
- Reorder level.
- Days until expiry, where applicable.

### Fourth row

**Pharmacy performance comparison**

| Pharmacy | Sales | Stock Value | Low Stock | Expiry Alerts |
|---|---:|---:|---:|---:|
| Central Pharmacy | Actual data | Actual data | Count | Count |
| JICHMA Pharmacy | Actual data | Actual data | Count | Count |
| Other Pharmacy | Actual data | Actual data | Count | Count |

**Important:** DRF STORE should be shown separately as the central store rather than as a dispensing pharmacy.

### Executive actions

- View inventory report.
- View sales report.
- Export executive summary.
- Review critical alerts.
- View approval status.

The CMD should not automatically be able to post a GRN, adjust stock or dispense medicines merely because the CMD can view the dashboard.

## Page 15: Consolidated Inventory

**Route:** `/cmd/inventory`

Display all authorized stock locations in one searchable view.

Filters:

- Location.
- Drug category.
- Product.
- Batch.
- Expiry range.
- Stock status.

Columns:

- Product.
- DRF STORE balance.
- Central Pharmacy balance.
- JICHMA balance.
- Other Pharmacy balance.
- Total usable stock.
- Quarantined quantity.
- Estimated stock value.

The page should distinguish:

- Usable inventory.
- Reserved inventory.
- In-transit inventory.
- Quarantined inventory.
- Expired inventory.

The totals must not double-count the same stock.

## Page 16: Sales Overview

**Route:** `/cmd/sales`

Display:

- Completed sales totals.
- Sales by location.
- Sales by date.
- Sales by product.
- Payment method distribution.
- Cancelled invoices.
- Refunds and reversals.
- Outstanding inpatient bills, if permitted.

The dashboard must clearly distinguish billed amounts, completed sales and collected payments.

## Page 17: Losses and Expiry

**Route:** `/cmd/losses`

Include:

- Expired stock.
- Damaged stock.
- Approved write-offs.
- Pending write-off requests.
- Product recalls.
- Financial impact.

Every value must link to the underlying authorized transaction record.

---

# 5. Role 3 — Head Pharmacist

The Head Pharmacist is responsible for pharmaceutical control, approvals and inventory governance.

## 5.1 Sidebar

- Dashboard.
- Goods Received.
- Transfer Oversight.
- Return Approvals.
- Stock Adjustments.
- Write-off Approvals.
- Expiry & Quarantine.
- Drug Catalogue.
- Pharmacy Reports.
- Audit Trail.
- My Profile.

Access to each approval must follow the hospital's separation-of-duties rules.

## Page 18: Head Pharmacist Dashboard

**Route:** `/head-pharmacist/dashboard`

### KPI cards

- Pending GRNs.
- Pending Returns.
- Pending Stock Adjustments.
- Pending Write-offs.
- Expiry Alerts.
- Recall or Quality Alerts.

### Main sections

**Approval queue**

Show each request's reference, origin, creator, date, type and status.

**Expiry and quality alerts**

Display quarantined products, expired stock and products approaching expiry.

**Inventory exceptions**

Display negative-stock prevention events, discrepancies and unusual movements.

**Recent approvals**

Show the decisions made by the logged-in user.

Each approval action should provide access to supporting documents and the transaction's history.

## Page 19: GRN Approval

**Route:** `/head-pharmacist/grns`

The table should display:

- GRN number.
- Supplier.
- Receipt date.
- Number of items.
- Submitted by.
- Total accepted quantity.
- Status.
- Review action.

### GRN detail page

The detail page should display:

**Header**
- GRN reference.
- Supplier.
- Invoice number.
- Receiving date.
- Created by.

**Product table**
- Drug.
- Batch.
- Expiry.
- Quantity ordered.
- Quantity received.
- Quantity accepted.
- Rejected or quarantined quantity.
- Cost.

**Supporting information**
- Uploaded documents.
- Receiving notes.
- Previous decisions.

**Actions**
- Approve.
- Reject.
- Request correction.

Approving a GRN should not necessarily post it immediately if the application has a separate posting permission. The approved workflow must define the exact posting authority.

## Page 20: Stock Adjustment Approval

**Route:** `/head-pharmacist/adjustments`

Display:

- Adjustment reference.
- Location.
- Product.
- Batch.
- Current recorded balance.
- Physical count or proposed quantity.
- Difference.
- Reason.
- Requester.
- Approval status.

The detail view should show the complete evidence and proposed financial impact.

An approved adjustment must produce an auditable stock-ledger transaction.

## Page 21: Write-off Approval

**Route:** `/head-pharmacist/write-offs`

Use a prominent warning style because write-offs reduce inventory and may affect financial reporting.

Display:

- Write-off reference.
- Source location.
- Product and batch.
- Quantity.
- Reason.
- Cost impact.
- Supporting evidence.
- Requested by.

Available actions:

- Approve.
- Reject.
- Request additional evidence.

The application must prevent the requester from approving their own write-off where independent approval is required.

## Page 22: Returns Approval

**Route:** `/head-pharmacist/returns`

Display pharmacy return requests and their inspection status.

The return detail view should show:

- Origin pharmacy.
- Product and batch.
- Quantity.
- Reason.
- Expiry date.
- Condition on receipt.
- Quarantine status.
- Proposed disposition.
- Approval history.

The final disposition must determine whether stock is returned to usable inventory, quarantined or recorded for authorized disposal.

---

# 6. Role 4 — DRF Store Keeper

The Store Keeper is responsible for central-store operations and physical stock movements.

## 6.1 Sidebar

- Dashboard.
- Goods Received.
- Central Inventory.
- Pharmacy Requests.
- Stock Transfers.
- Returns Received.
- Expiry & Quarantine.
- Stock Count.
- Issue Vouchers.
- Reports.
- My Profile.

## Page 23: DRF Store Dashboard

**Route:** `/drf-store/dashboard`

### KPI cards

- Total Usable Stock.
- Pending GRNs.
- Pharmacy Requests.
- Transfers in Transit.
- Returns Awaiting Inspection.
- Low-Stock Products.

### Main sections

**Recent goods received**

Display the latest GRNs and their statuses.

**Pharmacy stock requests**

Show requested products, quantities and requesting locations.

**Transfers in transit**

Show destination, dispatch date and outstanding quantities.

**Expiry alerts**

Highlight central-store stock requiring attention.

**Quick actions**

- Create GRN.
- Review pharmacy request.
- Create transfer.
- Record stock count.
- View stock ledger.

Do not include an unrestricted direct-edit inventory button.

## Page 24: Create GRN

**Route:** `/drf-store/grns/create`

### Page layout

**Section A: Supplier information**

- Supplier selector.
- Supplier invoice/reference.
- Receipt date.
- Delivery reference.

**Section B: Product entry**

An editable line-item table containing:

- Drug search.
- Batch number.
- Expiry date.
- Quantity received.
- Quantity accepted.
- Quantity rejected.
- Unit cost.
- Notes.

**Section C: Documents**

- Upload delivery note.
- Upload supplier invoice.
- Add remarks.

**Section D: Summary**

- Total accepted quantity.
- Total rejected quantity.
- Estimated receipt cost.

**Footer actions**

- Save draft.
- Submit for approval.
- Cancel.

The application must reject duplicate batch/product entries where prohibited by the data model and must validate dates and unit conversions.

## Page 25: Central Inventory

**Route:** `/drf-store/inventory`

Display stock by product, batch and status.

Columns:

- Drug.
- Batch.
- Expiry.
- Available quantity.
- Reserved quantity.
- Quarantined quantity.
- Unit cost.
- Stock value.
- Reorder level.

Actions:

- View product.
- View movement history.
- Create transfer.
- Start stock count.
- View expiry details.

The Store Keeper must not be able to silently change a posted quantity.

## Page 26: Pharmacy Requests

**Route:** `/drf-store/requests`

Show requests from Central Pharmacy, JICHMA Pharmacy and Other Pharmacy.

Columns:

- Request reference.
- Requesting location.
- Request date.
- Number of products.
- Requested quantity.
- Priority.
- Status.

### Request detail

The Store Keeper can:

1. Review the requested products.
2. Check available usable stock.
3. Propose available quantities.
4. Select eligible batches.
5. Record a shortage reason if full supply is impossible.
6. Submit the proposed issue for any required authorization.

## Page 27: Create Stock Transfer

**Route:** `/drf-store/transfers/create`

### Header

- Transfer number generated by the system.
- Source location: DRF STORE.
- Destination pharmacy.
- Request reference.
- Transfer date.

### Product table

- Product.
- Batch.
- Expiry.
- Available quantity.
- Requested quantity.
- Quantity to issue.

### Summary

- Total units.
- Number of products.
- Destination.
- Requesting staff.

### Actions

- Save draft.
- Submit for approval.
- Dispatch after authorization.
- Print issue voucher.

After dispatch, the stock should be represented as in transit when physical receipt is still pending.

## Page 28: Transfer Detail and Receipt Tracking

**Route:** `/drf-store/transfers/:id`

Display the full transfer lifecycle.

**Timeline**

Request → Approval → Dispatch → In Transit → Receipt Confirmation → Completed

Include:

- Source and destination.
- Product and batch details.
- Quantities dispatched.
- Quantities received.
- Discrepancies.
- Responsible users.
- Timestamps.
- Supporting documents.

If a pharmacy reports a shortage, the application should record the discrepancy and route it for investigation rather than silently altering the transfer quantity.

## Page 29: Returns Received

**Route:** `/drf-store/returns`

Display:

- Return reference.
- Origin pharmacy.
- Product.
- Batch.
- Quantity.
- Return reason.
- Dispatch status.
- Inspection status.

Actions:

- Record physical receipt.
- Record condition.
- Move to quarantine.
- Submit inspection result.
- Record approved disposition.

A return should only increase usable stock when the defined authorization and inspection conditions are satisfied.

---

# 7. Role 5 — Pharmacy Dispenser

The Dispenser works primarily with the selected dispensing pharmacy's stock, invoices and dispensing workflow.

This role needs a fast interface with minimal navigation.

## 7.1 Sidebar

- Dashboard.
- Point of Sale.
- New Sale.
- Sales History.
- Invoices.
- Dispensing History.
- Stock Requests.
- Returns to DRF STORE.
- Inventory Lookup.
- Expiry Alerts.
- My Profile.

A dispenser should not see central-store stock as directly available for dispensing.

## Page 30: Pharmacy Dashboard

**Route:** `/pharmacy/dashboard`

### Header

Display:

- Current pharmacy name.
- Current business date.
- Logged-in user.
- Open/closed status of the current business day.

### KPI cards

- Today's Completed Sales.
- Today's Transaction Count.
- Pending Payments.
- Low-Stock Products.

### Main sections

**Recent sales**

- Receipt.
- Time.
- Sale type.
- Total.
- Payment status.

**Low-stock products**

- Product.
- Available quantity.
- Reorder level.

**Expiry alerts**

- Product.
- Batch.
- Expiry date.

**Quick actions**

- New Sale.
- Find Invoice.
- Check Stock.
- Request Stock.
- Return Stock.

## Page 31: POS — New Sale

**Route:** `/pharmacy/pos`

This is the most important screen for pharmacy dispensers.

It should prioritize speed, accuracy and minimal clicks.

### Recommended desktop layout



```text
┌──────────────────────────────────────────────────────────────┐
│ BKD PHARMACY POS            Central Pharmacy       User       │
├──────────────────────────────────────────────────────────────┤
│ Sale Type: [ Outpatient ▼ ]     Date: Current Business Date  │
├────────────────────────────────┬─────────────────────────────┤
│ SEARCH PRODUCTS                │ CURRENT INVOICE              │
│                                │                             │
│ [Search drug name or code...]  │ Product A       ₦1,000      │
│                                │ Product B       ₦2,500      │
│ Available stock                │                             │
│                                │ Subtotal        ₦3,500      │
│ Product results                │ Total           ₦3,500      │
│ Name | Strength | Stock        │                             │
│                                │ [Save Invoice]               │
│                                │ [Proceed to Payment]         │
└────────────────────────────────┴─────────────────────────────┘
```

### Left panel: Product search

Components:

- Search by name, code or barcode where supported.
- Category filter.
- Available stock.
- Strength and dosage form.
- Product selection.
- Batch selection where needed.

Only eligible stock in the current pharmacy should be shown as available for dispensing.

### Right panel: Invoice/cart

Display:

- Selected products.
- Quantity.
- Unit price.
- Line total.
- Authorized discount, if permitted.
- Subtotal.
- Tax, if applicable.
- Final total.

Actions:

- Increase quantity.
- Decrease quantity.
- Remove item.
- Clear draft with confirmation.

### Sale type selector

Two options:

**Inpatient**

When selected, show:

- Hospital card number.
- Search patient button.
- Verified patient name.
- Ward and bed where applicable.
- Admission status.

The dispenser must use the authoritative patient record.

**Outpatient**

When selected, show:

- Optional patient name.
- Optional patient/card number.
- Optional customer reference.

The sale must be possible without mandatory outpatient registration.

### Primary actions

- Save Draft.
- Generate Invoice.
- Proceed to Payment.
- Cancel Invoice.

The exact point at which stock is reserved, deducted and committed must follow the approved payment and dispensing workflow. Invoice creation alone must not deduct stock.

## Page 32: Payment and Checkout

**Route:** `/pharmacy/pos/checkout`

### Header

Display:

- Invoice number.
- Sale type.
- Patient details, if applicable.
- Pharmacy.
- Total amount.

### Payment panel

Methods:

- Cash.
- Bank Transfer.
- POS Terminal.

For cash:

- Amount due.
- Amount tendered.
- Change due.

For bank transfer:

- Transfer reference.
- Amount.
- Verification status.
- Verified by.

For POS:

- Transaction reference.
- Amount.
- Terminal or integration status.

### Footer

- Confirm payment.
- Return to invoice.
- Cancel checkout.

The confirmation action must be idempotent so that repeated clicks cannot record duplicate payments.

Only the required authorized confirmation should move the invoice to its next state.

## Page 33: Receipt

**Route:** `/pharmacy/receipts/:id`

Display a printable receipt containing:

- BKD General Hospital name.
- Pharmacy location.
- Receipt number.
- Invoice number.
- Transaction date/time.
- Sale type.
- Patient reference when applicable.
- Product names and quantities.
- Unit prices.
- Total amount.
- Payment method.
- Payment status.
- Dispensing staff.
- Authorized footer message.

Actions:

- Print receipt.
- Reprint receipt.
- Return to sales history.

A reprint must use the original transaction and must not deduct inventory again.

## Page 34: Sales History

**Route:** `/pharmacy/sales`

Filters:

- Date range.
- Receipt number.
- Invoice number.
- Sale type.
- Payment method.
- Transaction status.

Table:

- Receipt.
- Invoice.
- Date/time.
- Sale type.
- Amount.
- Payment status.
- Dispensing user.
- Actions.

Actions:

- View details.
- Print receipt.
- View payment history.
- Request cancellation or reversal if authorized.

A dispenser should not be allowed to erase completed transactions.

## Page 35: Inventory Lookup

**Route:** `/pharmacy/inventory`

This page provides a read-only or restricted operational view of the selected pharmacy's stock.

Display:

- Drug.
- Strength.
- Batch.
- Expiry.
- Usable quantity.
- Reorder level.
- Stock status.

Include a prominent status badge for:

- In stock.
- Low stock.
- Out of stock.
- Quarantined.
- Expired.

Expired and quarantined quantities must not be included in usable stock.

## Page 36: Request Stock

**Route:** `/pharmacy/stock-requests/create`

Form:

- Requesting pharmacy.
- Product.
- Requested quantity.
- Reason or priority.
- Notes.

Table of requested items:

- Product.
- Available pharmacy quantity.
- Requested quantity.
- Reason.

Actions:

- Add product.
- Remove draft item.
- Save draft.
- Submit request.

Once submitted, the request should be traceable through the DRF STORE workflow.

## Page 37: Return Stock to DRF STORE

**Route:** `/pharmacy/returns/create`

Fields:

- Product.
- Batch.
- Quantity.
- Expiry date.
- Reason for return.
- Condition.
- Notes.

Actions:

- Save draft.
- Submit return.
- View return status.

The page must not allow a dispenser to return more than the eligible stock held by the pharmacy. The application must define whether the quantity becomes reserved or unavailable once the return is submitted.

---

# 8. Role 6 — Pharmacy Supervisor

The Pharmacy Supervisor oversees daily pharmacy operations and reconciliation.

## 8.1 Sidebar

- Dashboard.
- Sales Oversight.
- Cash Reconciliation.
- Day Closing.
- Stock Requests.
- Returns.
- Staff Activity.
- Pharmacy Reports.
- My Profile.

## Page 38: Pharmacy Supervisor Dashboard

**Route:** `/pharmacy-supervisor/dashboard`

Display:

- Today's sales.
- Payment discrepancies.
- Outstanding invoices.
- Pending stock requests.
- Returns awaiting action.
- Current day-close status.

Additional sections:

- Staff transaction activity.
- Payment method totals.
- Cancelled invoices.
- Low-stock alerts.
- Recent exceptions.

The supervisor should be able to inspect transaction details without automatically gaining permission to approve every financial or inventory operation.

## Page 39: Cash Reconciliation

**Route:** `/pharmacy-supervisor/reconciliation`

Display totals by payment method.

| Payment method | Expected amount | Confirmed amount | Difference |
|---|---:|---:|---:|
| Cash | Actual data | Actual data | Calculated |
| Bank Transfer | Actual data | Actual data | Calculated |
| POS Terminal | Actual data | Actual data | Calculated |

Include:

- Date and business shift.
- Pharmacy.
- Responsible cashier.
- Cash counted.
- Transfer references.
- POS settlement information.
- Discrepancy explanation.
- Review status.

The system must not automatically classify an unexplained difference as a valid stock or financial adjustment.

## Page 40: Daily Closing

**Route:** `/pharmacy-supervisor/day-close`

### Section A: Sales summary

- Completed sales.
- Cancelled invoices.
- Refunds.
- Outstanding balances.

### Section B: Payment reconciliation

- Cash expected.
- Cash counted.
- Bank transfers confirmed.
- POS payments confirmed.
- Differences.

### Section C: Inventory activity

- Opening balance.
- Transfers received.
- Transfers dispatched.
- Sales deductions.
- Returns.
- Adjustments.
- Closing balance.

### Section D: Supervisor confirmation

- Review notes.
- Discrepancy explanations.
- Confirmation checkbox.
- Close business day button.

The close operation must be protected against duplicate submissions and must create a permanent, auditable closing record.

Reopening a closed day requires an authorized process.

---

# 9. Role 7 — Cashier

The Cashier focuses on payment records and reconciliation rather than medicine catalogue management.

## 9.1 Sidebar

- Dashboard.
- Pending Payments.
- Payment Verification.
- Payment History.
- Refund Requests.
- Daily Reconciliation.
- My Profile.

## Page 41: Cashier Dashboard

**Route:** `/cashier/dashboard`

Display:

- Payments recorded today.
- Pending payment verifications.
- Failed payments.
- Refund requests.
- Unreconciled transactions.

Additional sections:

- Recent payments.
- Payment methods breakdown.
- Transactions requiring review.

## Page 42: Payment Verification

**Route:** `/cashier/payments`

Filters:

- Invoice number.
- Receipt number.
- Payment method.
- Date range.
- Verification status.

Table columns:

- Invoice.
- Amount due.
- Amount received.
- Payment method.
- Reference.
- Status.
- Action.

### Payment detail

Show:

- Invoice summary.
- Expected amount.
- Submitted payment reference.
- Existing payment attempts.
- Verification evidence.
- Verification history.

Actions:

- Confirm payment.
- Reject payment.
- Flag for investigation.

A payment should be confirmed only after the required verification. Rejecting a payment must not silently erase the attempt.

---

# 10. Role 8 — Procurement Officer

The Procurement Officer manages suppliers, purchase planning and replenishment records.

This role does not automatically receive permission to post GRNs or approve inventory adjustments.

## 10.1 Sidebar

- Dashboard.
- Suppliers.
- Purchase Requests.
- Purchase Orders.
- Reorder Report.
- Supplier Performance.
- Purchase History.
- Reports.
- My Profile.

## Page 43: Procurement Dashboard

**Route:** `/procurement/dashboard`

Display:

- Products below reorder level.
- Pending purchase requests.
- Open purchase orders.
- Recent deliveries.
- Supplier delivery performance.

Additional panels:

- Frequently requested products.
- Products approaching expiry.
- Supplier delivery delays.

## Page 44: Reorder Planning

**Route:** `/procurement/reorder-planning`

Table:

- Product.
- Total usable stock.
- Stock by location.
- Reorder threshold.
- Average consumption, where reliable data exists.
- Suggested purchase quantity.
- Preferred supplier.

Suggested quantities should be calculated from configurable rules and remain reviewable by authorized staff.

Do not treat stock in transit or quarantined stock as immediately available usable inventory.

## Page 45: Purchase Orders

**Route:** `/procurement/purchase-orders`

Provide:

- Purchase order list.
- Supplier selection.
- Product line items.
- Requested quantities.
- Unit costs.
- Delivery dates.
- Approval status.

A purchase order is not a GRN. Creating or approving a purchase order must not increase stock.

Only the actual receipt and authorized posting of accepted stock should increase DRF STORE inventory.

---

# 11. Role 9 — Internal Auditor

The Internal Auditor needs read-only access to records and reports necessary for independent review.

## 11.1 Sidebar

- Dashboard.
- Inventory Audit.
- GRN Audit.
- Transfer Audit.
- Sales Audit.
- Payment Audit.
- Returns & Write-offs.
- User Activity.
- Audit Logs.
- Reports.
- My Profile.

## Page 46: Auditor Dashboard

**Route:** `/auditor/dashboard`

Display:

- Transactions reviewed.
- Outstanding audit exceptions.
- Stock discrepancies.
- Unapproved or incomplete workflow items.
- Write-off activity.
- Payment reconciliation exceptions.

Include charts for transaction activity and exception trends.

## Page 47: Inventory Audit

**Route:** `/auditor/inventory`

Provide a searchable ledger view with:

- Transaction reference.
- Date/time.
- Product.
- Batch.
- Location.
- Movement type.
- Quantity in.
- Quantity out.
- Balance after movement.
- User.
- Related document.

The auditor should be able to trace a balance back to its originating GRNs, transfers, sales, returns and adjustments.

## Page 48: Transaction Audit Detail

**Route:** `/auditor/transactions/:id`

Display a chronological timeline.

Example:

```text
10:00 — Transaction created
10:05 — Submitted for approval
10:10 — Approved by authorized officer
10:12 — Inventory transaction posted
10:13 — Audit record generated
```

Show supporting documents, approval history, related transactions and any reversals.

Auditors should not be able to alter historical transaction records through this page.

---

# 12. Role 10 — System Administrator versus Super Administrator

If the hospital wants both roles, keep their responsibilities distinct.

| Capability | Super Administrator | System Administrator |
|---|---|---|
| Manage all application settings | Yes | According to assignment |
| Manage user accounts | Yes | According to assignment |
| Assign high-privilege roles | Restricted by policy | No, unless explicitly authorized |
| Manage pharmacy inventory | Not automatically | Not automatically |
| Approve write-offs | Not automatically | Not automatically |
| View system health | Yes | Yes |
| View audit logs | Authorized access | Authorized access |
| Modify audit history | No | No |
| Manage database backups | Authorized | Authorized |
| Dispense medicines | Not automatically | Not automatically |

For the first release, the hospital may use one Super Administrator role and omit a separate System Administrator role to reduce complexity.

---

# 13. Shared pages and components

The following components should be reusable across the application.

## 13.1 Notification center

**Component:** Topbar notification bell.

Categories:

- Pending approval.
- Low stock.
- Near expiry.
- Expired stock.
- Transfer discrepancy.
- Payment failure.
- System alert.

Each notification should include a timestamp, severity, description and link to the relevant authorized page.

Users must not receive notifications containing patient details or other sensitive information outside their permissions.

## 13.2 Global search

Search scope must depend on role.

Examples:

- Super Administrator: authorized users, products, locations and references.
- Store Keeper: products, batches, GRNs and transfers.
- Dispenser: products, invoices and receipts within the permitted pharmacy.
- Cashier: invoices and payment references.
- Auditor: transaction references and ledger records.

Search results must not bypass access controls.

## 13.3 User profile

**Route:** `/profile`

Include:

- Full name.
- Username.
- Email.
- Assigned role.
- Assigned locations.
- Change password.
- Session management.
- Recent login activity.

Role and permission changes must be handled by authorized administrators rather than ordinary profile editing.

## 13.4 Standard table behavior

Every major table should support, where appropriate:

- Search.
- Filtering.
- Sorting.
- Pagination.
- Loading state.
- Empty state.
- Error state.
- Row-level actions.
- Export permissions.
- Confirmation dialogs for sensitive actions.

## 13.5 Standard forms

Forms should provide:

- Required-field indicators.
- Inline validation.
- Helpful error messages.
- Loading and submission states.
- Confirmation after success.
- Protection against duplicate submission.
- Unsaved-changes warning where appropriate.

## 13.6 Standard status badges

| Status | Visual treatment |
|---|---|
| Draft | Gray |
| Pending Approval | Amber |
| Approved | Blue |
| Completed / Posted | Green |
| Rejected | Red |
| Cancelled | Gray |
| In Transit | Blue |
| Quarantined | Orange or amber |
| Expired | Red |
| Payment Failed | Red |

Always display a text label with the color.

---

# 14. Responsive design rules

The application must work on desktop computers, tablets and phones.

### Desktop: 1200 px and above

- Expanded sidebar.
- Four KPI cards per row where space allows.
- Two-column charts and dashboard panels.
- Full inventory tables.
- Side-by-side POS layout.

### Tablet: 768–1199 px

- Collapsible sidebar.
- Two KPI cards per row.
- Stacked or narrower dashboard panels.
- Horizontally scrollable data tables.
- Adapted POS panels.

### Mobile: below 768 px

- Slide-out navigation drawer.
- Single-column dashboard.
- Compact KPI cards.
- Mobile-friendly forms.
- Product search optimized for touch.
- Cart accessible through a clear button or dedicated panel.
- Payment confirmation buttons fixed or prominently positioned where appropriate.
- No critical action hidden behind hover interactions.

On mobile, use cards instead of extremely wide tables when that improves readability.

---

# 15. Design tokens for implementation

Give the developer a centralized design-token file so that colors, typography, spacing and component styling remain consistent.

Recommended structure:

```css
:root {
  /* Brand */
  --color-primary: #0F766E;
  --color-primary-hover: #115E59;
  --color-sidebar: #102A43;

  /* Backgrounds */
  --color-background: #F5F7FA;
  --color-surface: #FFFFFF;

  /* Text */
  --color-text: #172B4D;
  --color-text-muted: #64748B;

  /* Borders */
  --color-border: #E2E8F0;

  /* Status */
  --color-success: #15803D;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-info: #2563EB;

  /* Layout */
  --sidebar-width: 250px;
  --sidebar-collapsed-width: 76px;
  --topbar-height: 68px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Components */
  --radius-card: 12px;
  --radius-input: 8px;
  --radius-button: 8px;
}
```

The developer should extend this with typography, focus states, dark-mode rules if required, shadows, chart colors and responsive breakpoints.

---

# 16. Recommended frontend structure

If the application is being developed with Next.js, organize it around shared layouts and role-specific route groups.

```text
src/
├── app/
│   ├── login/
│   ├── forgot-password/
│   ├── super-admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── locations/
│   │   ├── drugs/
│   │   ├── suppliers/
│   │   ├── settings/
│   │   ├── audit-logs/
│   │   └── system-health/
│   ├── cmd/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── sales/
│   │   └── losses/
│   ├── head-pharmacist/
│   │   ├── dashboard/
│   │   ├── grns/
│   │   ├── adjustments/
│   │   ├── write-offs/
│   │   └── returns/
│   ├── drf-store/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── grns/
│   │   ├── requests/
│   │   ├── transfers/
│   │   └── returns/
│   ├── pharmacy/
│   │   ├── dashboard/
│   │   ├── pos/
│   │   ├── sales/
│   │   ├── inventory/
│   │   └── returns/
│   ├── pharmacy-supervisor/
│   ├── cashier/
│   ├── procurement/
│   ├── auditor/
│   └── profile/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── dashboard/
│   ├── charts/
│   ├── tables/
│   ├── forms/
│   ├── inventory/
│   ├── pos/
│   ├── payments/
│   └── ui/
├── features/
│   ├── authentication/
│   ├── inventory/
│   ├── grns/
│   ├── transfers/
│   ├── returns/
│   ├── sales/
│   ├── payments/
│   ├── reporting/
│   └── audit/
└── lib/
    ├── api/
    ├── permissions/
    ├── validation/
    └── formatting/
```

This is an organizational example. The exact folder structure can be adapted to the selected Next.js routing architecture.

---

# 17. Implementation rules the developer must follow

The visual design must never override the business rules.

1. **Role-based navigation:** Each user sees only authorized modules.
2. **Backend authorization:** Every protected operation is validated on the server.
3. **Real data:** KPI cards and charts use actual database queries or APIs.
4. **Inventory integrity:** All stock changes are represented by traceable ledger transactions.
5. **Transaction integrity:** Payments, sales and inventory changes must be safely coordinated.
6. **Auditability:** Sensitive actions create protected audit records.
7. **Responsive behavior:** Every page works on supported desktop and mobile screens.
8. **Accessible interface:** Controls have labels, keyboard support and visible focus states.
9. **Loading and error states:** Pages must not appear complete while data is still loading or has failed to load.
10. **No fake functionality:** Buttons must work, be explicitly disabled with an explanation, or be identified as unavailable. They must not silently do nothing.

---

# 18. Recommended development order

Rather than building all pages at once, develop them in the following order.

| Phase | Pages and components | Priority |
|---|---|---|
| 1 | Design tokens, sidebar, topbar, login, permissions | Critical |
| 2 | Super Admin dashboard, users, roles and locations | Critical |
| 3 | Drug catalogue, suppliers and GRN workflow | Critical |
| 4 | DRF STORE inventory, requests and transfers | Critical |
| 5 | Pharmacy POS, invoices, payments and receipts | Critical |
| 6 | Returns, batch expiry, quarantine and write-offs | Critical |
| 7 | CMD dashboard and executive reports | High |
| 8 | Cashier, supervisor and day-close workflows | High |
| 9 | Procurement and internal audit | High |
| 10 | System health, exports and final responsive testing | High |

### Final recommendation

Start with **the shared design system, authentication, Super Administrator dashboard and DRF STORE inventory workflow**. Once the navigation, colors, tables, cards and permissions are correct, reuse those components across the remaining roles.

This will make the system more consistent, easier to maintain and faster to develop.

The specification above covers the primary pages and workflows. Before coding, the team should confirm the final role list, approval matrix, patient-system integration and payment policy so the interface accurately reflects how BKD General Hospital operates.