# Akanadehye Admin Dashboard — Build Spec

Adapted from the GadgetZone PHP/MySQL prompt. Same product ideas, rewritten for
the Akanadehye stack: **Next.js 16 (App Router) · TypeScript · React 19 ·
Tailwind v4 · Prisma + SQLite (→ Postgres) · Auth.js (pending)**.

Each section is tagged:

- ✅ **BUILT** — already exists in the codebase
- 🔨 **TO BUILD** — buildable now against the current data layer
- ⏳ **BLOCKED** — needs Sprint 1 (Auth.js + Prisma swap, tasks #35–41) first

---

## 📁 File Structure

```
akanadehye/
├── prisma/
│   ├── schema.prisma            # ✅ User, Payment, InventoryItem, Invoice, SourcingOrder, FinancingApplication
│   ├── seed.ts                  # ✅ seeds admin user + sample data
│   └── dev.db                   # ✅ SQLite (swap provider → postgresql for prod)
└── src/
    ├── lib/
    │   ├── db.ts                # ✅ Prisma client singleton        (≈ includes/db.php)
    │   ├── store.ts             # ✅ localStorage hooks + formatGHS (≈ includes/functions.php)
    │   ├── orders.ts            # ✅ shopper orders store, status flow, order numbers
    │   ├── products.ts          # ✅ catalog client + formatPrice   (≈ includes/currency.php)
    │   ├── botBrain.ts          # ✅ chatbot fallback brain
    │   └── claudeBot.ts         # ✅ Claude-powered brain
    ├── components/
    │   ├── DashboardTopBar.tsx  # ✅ topbar (logo, View storefront, bell, user menu)
    │   ├── DashboardShell.tsx   # ✅ sidebar (grouped nav)          (≈ admin/layout.php)
    │   ├── PageHeader.tsx       # ✅ breadcrumb + title + actions
    │   ├── ImageUploader.tsx    # ✅ camera/file upload w/ compression
    │   └── ChannelsWidget.tsx   # ✅ bot status widget
    └── app/admin/
        ├── layout.tsx           # ✅ TopBar + Shell wrapper          (≈ layout.php + footer.php)
        ├── page.tsx             # ✅ Dashboard overview              (≈ index.php)
        ├── inventory/           # ✅ Product CRUD                    (≈ products.php)
        ├── pos/                 # ✅ Point of Sale (no GZ equivalent)
        ├── payments/            # ✅
        ├── invoices/            # ✅
        ├── insights/            # ✅
        ├── sourcing/            # ✅
        ├── chatbots/            # ✅ + telegram/whatsapp/persona/test sub-pages
        ├── orders/              # 🔨 TO BUILD                        (≈ orders.php)
        │   └── [id]/            # 🔨 TO BUILD — order detail
        ├── users/               # ⏳ BLOCKED on Auth.js              (≈ users.php)
        └── settings/            # 🔨 TO BUILD                        (≈ settings.php)
```

No `admin.css` / `admin.js` equivalents — styling is Tailwind + the shared
utility classes in `globals.css` (`.card`, `.input`, `.badge-*`, `.btn-*`);
behavior is React state, no global JS.

---

## ⚙ Bootstrap Convention

GadgetZone's "every page requires layout.php first" maps to App Router nesting:
`app/admin/layout.tsx` wraps every admin page automatically — no per-page
require. Every admin page starts:

```tsx
"use client";                                  // pages using localStorage hooks

import PageHeader from "@/components/PageHeader";

export default function OrdersPage() {
  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Run shop" },                // section group
          { label: "Orders" },
        ]}
        title="Orders"
        subtitle="One-line description."
        actions={/* optional right-side buttons */}
      />
      {/* page body */}
    </div>
  );
}
```

The PHP `$pageTitle` ↔ `PageHeader title` prop. The `$extraHead` hook has no
equivalent and isn't needed — co-locate styles in the component.

---

## 🧰 Available Helpers (use as-is, do not reinvent)

```ts
// lib/store.ts — localStorage-backed hooks (swap to server actions in Sprint 1)
useInventory()  useP ayments()  useInvoices()  useSourcing()  useFinancing()
// each returns { items, add, update, remove, clear, hydrated }
formatGHS(amount)        // "GH₵1,499.00"
formatDate(iso)          // "07 Jun 2026"
uid(prefix)              // "ord_lx3k9..." unique ids
methodLabel(m)           // payment method display names

// lib/orders.ts — shopper orders (the store the admin Orders page reads)
useOrders()              // { items, add, update, get, hydrated }
nextOrderNumber(items)   // "AKN-00042"            (≈ generateOrderNumber())
statusLabel(s)           // display name per status
shippingLabel(m)  paymentLabel(m)  shippingCost(m, subtotal)

// lib/products.ts — catalog
formatPrice(amount)      // "$72.00" (catalog is USD until own catalog lands)
```

**No `sanitize()` equivalent needed** — React escapes output by default, and
all future DB writes go through Prisma (parameterized, ≈ prepared statements).
Never build SQL strings.

---

## 🎨 Design Aesthetic

**Keep the Akanadehye identity — do NOT adopt the GadgetZone dark theme.**

```css
/* globals.css — already defined */
--brand-navy:   #0a1628;   /* primary text, headers, active nav */
--brand-gold:   #d4a951;   /* CTAs, accents */
--brand-clay:   #b04a2f;   /* warnings, destructive */
--brand-teal:   #0f766e;   /* success, positive status */
--brand-cream:  #faf6ef;   /* soft backgrounds, hovers */
--muted: #6b7280;  --border: #e5e7eb;
```

Light theme, Geist font (already configured). Sidebar ≈ 240px grouped nav
(already built). Existing utility classes: `.card`, `.input`, `.chip`,
`.badge` + `.badge-green/-blue/-amber/-red/-gray`, `.btn-gold/-primary/-outline`.

---

## 🔐 Access Control — ⏳ target state (Sprint 1)

Today `/admin/*` is open (no auth). Target, mapping GadgetZone's model:

| GadgetZone | Akanadehye target |
|---|---|
| `$_SESSION` role check in layout.php | Auth.js v5 session + `middleware.ts` matcher on `/admin/:path*` |
| `requireAdmin()` redirect | middleware redirect to `/login` |
| `member / admin / super_admin` | same three roles — **add `role String @default("member")` to the Prisma `User` model** |
| role cached in session until re-login | identical caveat: role lives in the JWT; refresh token/session after role change |
| default login + bcrypt reset SQL | seeded `admin@akanadehye.com` / `admin123` (bcrypt, see `prisma/seed.ts`); re-run `npx prisma db seed` to restore |

Permission rules (enforce in server actions, not just UI):
- `member` → storefront + own orders only, no `/admin`
- `admin` → full dashboard except user role changes / user deletion
- `super_admin` → everything, incl. promote/demote/delete users

---

## 📊 DASHBOARD (`/admin`) — ✅ BUILT, two additions

Already has: total-sales hero w/ period filter + Withdraw, 4 quick actions,
Customer-engagement (bots) widget, low-stock alert, recent transactions grouped
by day, secondary stats.

**Add (🔨):**
1. **Top Selling Products** card — aggregate shopper-order line items
   (`useOrders()` → flatten `items`, group by `id`, sum `quantity`), show top 5
   with thumbnail, name, units sold, revenue. Place beside Recent transactions.
2. **Total Orders stat** with pending-count badge once `/admin/orders` exists.

---

## 📦 PRODUCTS (`/admin/inventory`) — ✅ BUILT (exceeds the GZ spec)

Already has: full CRUD, search, category filter, sortable columns, CSV export,
bulk select/delete, inline ± stock, auto-SKU (`AK-ELE-0042`), images (camera +
gallery + compression + reorder + primary), description, sale price, tags,
low-stock badges, premium empty state.

**Optional deltas from the GZ spec (🔨 small):**
- **Badge field** (`none | NEW | HOT | SALE`) on `InventoryItem` → corner badge
  on storefront cards. SALE is already implied by `salePrice`; NEW/HOT are new.
- **Featured checkbox** → pin product first in the "From our shop" rail.
- **Image URL input** with live preview, alongside upload (upload wins, like GZ).
- **Slug** (auto from name, GZ regex pattern is fine) — only needed when
  merchant-product detail pages are built.
- **Delete safety** — GZ blocks deleting products that have orders. Adopt the
  principle now with a soft check (warn if product name appears in any order's
  items); enforce hard with a real FK when Order/OrderItem land in Prisma.

---

## 🧾 ORDERS (`/admin/orders`) — 🔨 TO BUILD (highest priority)

The big gap. Reads the same store the storefront checkout writes
(`useOrders()` from `lib/orders.ts`).

> ⚠ localStorage caveat: until Sprint 1, admin sees orders placed in the same
> browser only. Build the UI now — the data source swaps underneath later.

### List view
- Paginated (15/page, client-side slice), newest first
- Search: order number or customer name (`order.address.fullName`)
- Status filter dropdown + read `?status=` from the URL (bell deep-links here)
- Columns: `Order # (link) | Customer + email | Items count | Total | Payment | Status (inline select) | Date | View`
- **Inline status select** → `update(id, { status })` immediately (no submit button)

### Status flow — keep ours, don't adopt GZ's
`lib/orders.ts` already defines: `pending → confirmed → shipped → delivered | cancelled`
(GZ uses "processing" where we use "confirmed" — do not rename; storefront
`/orders/[id]` timeline already uses ours.)

### Status badge mapping (existing classes)
| Status | Class |
|---|---|
| pending | `badge-amber` |
| confirmed | `badge-blue` |
| shipped | `badge-blue` |
| delivered | `badge-green` |
| cancelled | `badge-red` |

### Detail view (`/admin/orders/[id]`)
- Customer name, email, phone
- Shipping address + method (`shippingLabel`)
- **Notes** — display `order.address.notes` when non-empty (checkout already collects it)
- Items table: thumbnail | name | qty | unit price | subtotal
- Totals: subtotal, discount (+ coupon code), shipping, grand total
- Payment method + reference
- Status update control + Cancel order (confirm dialog)

### Topbar/sidebar pending badge
- `DashboardTopBar` bell: show pending-orders count, link to
  `/admin/orders?status=pending` (GZ's `$pendingOrders` pattern)
- Optional matching badge on the sidebar Orders item

Add **Orders** to `DashboardShell` under **Run shop**, directly after Overview.

---

## 👥 USERS (`/admin/users`) — ⏳ BLOCKED on Sprint 1

No users exist until Auth.js + Prisma swap lands. Then build per GZ spec:
- List w/ role stats, search by name/email, role filter
- Inline role change — **super_admin only**, auto-saves
- Safe delete — block when the user has orders (FK check)
- Add User modal: name, email, password (bcrypt via `bcryptjs`), role
- Schema prereq: add `role` to `User`; consider `firstName/lastName`, `phone`

---

## ⚙ SETTINGS (`/admin/settings`) — 🔨 TO BUILD

| GadgetZone | Akanadehye adaptation |
|---|---|
| 12-currency grid | **GHS primary**, optional USD display toggle. Live sample-price preview (keep this idea). |
| Stripe keys in DB `settings` table | **Paystack** (Ghana) — and secrets do **NOT** go in the DB or any UI form. Keys live in `.env.local`; settings page shows **status only** (Configured ✓ / Test mode / Not set), same pattern as the existing bot-status cards. |
| `settings` key/value table | Display prefs → localStorage now; a Prisma `Setting` model in Sprint 1 if needed. |

Also surface read-only status rows for: `ANTHROPIC_API_KEY`,
`TELEGRAM_BOT_TOKEN`, Twilio/Meta — reusing `/api/bots/status` plus a
`/api/settings/status` for payment keys. Place under **Run shop** or a new
bottom-of-sidebar Settings entry with a gear icon.

---

## 🖼 LAYOUT — ✅ BUILT, one wiring task

`DashboardTopBar` + `DashboardShell` already cover the GZ layout spec (logo →
storefront link, grouped nav, user avatar/menu, View storefront, hamburger
behavior via responsive grid). Remaining:

- 🔨 Bell badge = live pending-orders count (see Orders section)
- ⏳ User menu shows the real session user + working Sign out (Sprint 1 — the
  `DEMO_USER` placeholder and alert stub are already marked in the code)

---

## 🗄 Data Models

### Current Prisma schema (✅ exists, not yet wired to UI)
`User` (no role yet) · `Payment` · `InventoryItem` · `Invoice` ·
`SourcingOrder` · `FinancingApplication` — all scoped by `userId`.

### Additions needed for this spec (Sprint 1 migration)
```prisma
model User {
  // existing fields...
  role  String @default("member")   // "member" | "admin" | "super_admin"
}

model Order {
  id          String      @id @default(cuid())
  number      String      @unique            // "AKN-00042"
  createdAt   DateTime    @default(now())
  status      String      @default("pending") // pending|confirmed|shipped|delivered|cancelled
  customer    Json                            // name/email/phone/address snapshot
  notes       String?
  subtotal    Float
  discount    Float       @default(0)
  couponCode  String?
  shipping    Float
  total       Float
  paymentMethod    String
  paymentReference String?
  items       OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  productId String?      // nullable FK → InventoryItem (delete-safety check)
  title     String       // snapshot — survives product deletion/rename
  unitPrice Float
  quantity  Int
}
```

(≈ GZ's `orders` + `order_items` tables; `settings` table optional, see above.)

---

## ⚠ Known Gotchas (Akanadehye-specific)

- **localStorage is per-browser** — admin pages built on the hooks show that
  browser's data only until Sprint 1. Fine for dev/demo; say so in UI footnotes
  (the sidebar already carries this note).
- **Hydration guard** — every localStorage hook exposes `hydrated`; render a
  skeleton until it's true or you'll get SSR/client mismatch flashes.
- **Keep order statuses as defined in `lib/orders.ts`** — the storefront
  timeline depends on them; renaming "confirmed" → "processing" breaks it.
- **Secrets never go through forms/DB** — `.env.local` only; UI shows status.
- **Bulk file edits**: do NOT use PowerShell `-replace` on source files — it
  has corrupted UTF-8 (em-dashes, arrows, emoji) in this repo before. Use the
  editor tools / Node scripts, and keep files UTF-8 without BOM.
- **`prisma/seed.ts` is idempotent** — safe to re-run to restore the admin
  login (`admin@akanadehye.com` / `admin123`).
- **SQLite → Postgres** for production = change `provider` in
  `schema.prisma` + `DATABASE_URL`; Prisma 7 datasource URL lives in
  `prisma.config.ts`, not the schema.

---

## 🧭 Build Order

1. 🔨 `/admin/orders` list + inline status + URL status filter
2. 🔨 `/admin/orders/[id]` detail
3. 🔨 Topbar bell pending badge + sidebar Orders entry
4. 🔨 Top Selling Products card on `/admin`
5. 🔨 `/admin/settings` (currency pref + key status panel)
6. 🔨 Inventory deltas (badge, featured, image-URL input) — optional
7. ⏳ Sprint 1: Auth.js + Prisma swap + `role`/`Order`/`OrderItem` migration
8. ⏳ `/admin/users` + delete-safety hard enforcement + real Sign out
