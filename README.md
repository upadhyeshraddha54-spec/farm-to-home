# Farm To Home

A multi-vendor agricultural marketplace where approved farmers sell directly to
customers, with Cash on Delivery checkout, per-farm shipment tracking, a farmer
dashboard and an admin panel.

**Stack:** React 19 + Vite · Tailwind CSS v4 · React Router · Firebase
(Authentication, Firestore, Hosting) · Cloudinary (product photos)

- Deploying to the internet and connecting a domain: **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## What it does

| Role | Can do |
| --- | --- |
| **Visitor** | Browse, search, filter and sort products; farmer directory with locations and ratings; farm pages; add to cart |
| **Customer** | Everything above, plus checkout (Cash on Delivery), saved address, order history, live shipment tracking, cancel before a farm confirms, reviews of delivered products, contact form |
| **Farmer** | Sells **immediately after signup** (no approval step). Farm profile; add/edit/hide/delete products with photos; manage stock; see and update their part of orders (confirm → ship → deliver, or cancel); sales dashboard |
| **Admin** | Suspend / reinstate farmers (their products are hidden/relisted automatically); block customers; hide/release/delete products; manage categories; view and move any order; remove reviews; read contact messages |

**Choosing farmers.** Customers pick who they buy from: the **Our farmers**
directory can be searched, filtered by location and sorted by rating, and every
product shows its farm. A cart can hold products from several farms; each farm
delivers its own shipment.

**Reviews.** A customer can rate (1–5 stars) and review a product only after an
order containing it was **delivered** to them — the security rules check the
order. Ratings appear on product cards, product pages and farm pages.

**Orders.** One checkout can include products from several farms (up to
**6 different products** per order, 20 of each). Each farm fulfils its own
part ("shipment"). Checkout is one Firestore transaction: it re-reads every
product, checks stock, writes the order and reduces stock together, so two
buyers can never get the last unit. Each checkout uses a fixed order ID, so
double-clicking "Place order" can't create two orders. Money is stored in whole
paise so totals are exact. Delivery: ₹40, free from ₹500, paid with shipment 1.

## Security model (no backend server)

There is no custom server — the browser talks to Firebase directly, and
**[firestore.rules](firestore.rules) is the real protection**. Among other things the rules:

- stop anyone signing up as an admin, lifting their own suspension or changing their role;
- let only farmers who are not suspended list products, in active categories, and only edit their own;
- accept a review only from the customer whose order containing that product was delivered;
- re-check every order line against the product's real price, and allow stock to
  change **only** by exactly the ordered quantity in the same transaction as the order
  (and back up only when that part of the order is cancelled);
- show customers only their own orders and farmers only orders containing their products;
- let admins change only approval/blocking/visibility fields (never prices or roles).

They are covered by automated tests (see **Testing**). The 6-products-per-order
limit comes from Firestore's budget of 1,000 evaluated expressions per request
(every line and every stock change is validated in one request) and is the
tested maximum.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase + Cloudinary values
npm run dev                  # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code (oxlint) |
| `npm run test:emulator` | Run all security-rule and workflow tests against local Firebase emulators |
| `npm run seed:demo` | Preview / add / remove the demo catalogue (see **Demo data**) |
| `npm run admin:grant -- email@example.com` | Preview / grant / revoke admin rights (see **Admin accounts**) |

## Environment variables

All `VITE_…` values are bundled into the website and are **public** — never put
secrets in them. See [.env.example](.env.example) for the full list.

| Variable | Needed | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_*` (6 values) | Yes | Firebase web app config (Project settings → Your apps) |
| `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | Photo uploads through an **unsigned** preset (no API secret is ever used) |
| `VITE_SITE_URL` | Recommended | Your live URL, e.g. `https://farmtohome.in` — enables `sitemap.xml` |
| `VITE_BUSINESS_LEGAL_NAME`, `VITE_BUSINESS_ADDRESS`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_PHONE`, `VITE_GRIEVANCE_OFFICER` | Before launch | Shown on Contact and policy pages; empty ones are hidden |
| `VITE_FIRESTORE_FORCE_LONG_POLLING` | Only if needed | See **Troubleshooting** |

## Testing

```bash
npm run test:emulator
```

Starts the Firebase **Auth + Firestore emulators** (nothing touches your real
project — the tests refuse to run unless pointed at the `demo-farm-to-home`
emulator project), then runs:

- `tests/rules.test.js` — direct allow/deny checks for every collection;
- `tests/workflows.test.js` — the app's real service code end to end: signup,
  listing straight after signup, multi-farm checkout with exact totals,
  duplicate-order and overselling prevention, tampering attempts (fake prices,
  skipped stock changes, wrong delivery fee…), farmer/admin status updates,
  cancellations that restock, reviews (verified purchase only), suspensions that
  hide products, blocking, categories and contact messages.

The emulators need Java (JDK 11+) installed.

## Demo data (optional)

`scripts/seed/` contains 8 **fictional** farms from Maharashtra and 35 products
with illustrative prices and freely licensed photos (credits in
`scripts/seed/image-credits.json`, shown under each photo). Every demo record
has `isDemo: true` and a `demo-` ID, and the store shows a **Demo** badge.

1. Firebase console → ⚙ Project settings → **Service accounts** → **Generate new
   private key**. Save it in the project folder as `firebase-admin-key.json`
   (git-ignored; treat it like a password).
2. `npm run seed:demo` (preview) → `npm run seed:demo -- --write`.

It creates no login accounts or `users/` documents, creates only **missing**
default categories (never changes yours), refuses to overwrite non-demo data at a
`demo-` ID, and is repeatable. Remove everything with
`npm run seed:demo -- --remove --write` (categories and Cloudinary photos stay).
Orders for demo products can only be moved forward by an admin (demo farms have
no login).

## Admin accounts

Admin rights are never granted through the website.

1. The person creates a normal account on the site.
2. With `firebase-admin-key.json` in place:
   `npm run admin:grant -- them@example.com` (preview) →
   `npm run admin:grant -- them@example.com --write`.
3. Revoke with `--revoke --write` (the last admin can't be revoked).

(Alternatively, edit `users/{uid}.role` to `admin` in the Firebase console.)

## Project structure

```
src/
├── config/          firebase.js, cloudinary.js, site.js (business details)
├── services/        ALL Firebase/Cloudinary calls: auth, profile, category, farm,
│                    product, marketplace, order, review, admin, cloudinary
├── context/         AuthProvider, CategoriesProvider, CartProvider, ToastProvider
├── hooks/           useAuth, useCart, useCartDetails, useCategories, useToast,
│                    useLiveData, useAsync, useFarmerData, useAdminData, useSignOut
├── routes/          AppRouter (lazy-loaded pages), paths, route guards
├── layouts/         MainLayout, DashboardLayout, FarmerLayout, AdminLayout
├── components/      ui/, common/, product/, order/, farmer/, farm/, home/, auth/
├── pages/           public/, customer/, account/, farmer/, admin/, info/
└── utils/           constants, orders (money/status), marketplace (search), reviews,
                     validators, formatters, farmerStats, productValidation
firestore.rules      security rules (the real protection)
firestore.indexes.json  the collection-group index that farm ratings need
firebase.json        Hosting (security headers, caching, SPA rewrites) + emulators
tests/               emulator test suites
scripts/             seed/ (demo data), admin/ (admin accounts), lib/
```

## Troubleshooting

- **Writes hang for about a minute, then succeed.** Some networks/proxies buffer
  Firestore's streaming connection. Set `VITE_FIRESTORE_FORCE_LONG_POLLING=true`,
  rebuild and redeploy. (Long-polling is always used with the local emulator,
  where this was observed.)
- **"Missing or insufficient permissions"** after an update: deploy the latest
  rules (`npx firebase deploy --only firestore:rules`).
- **Farmers can't add products:** an admin must add categories first
  (Admin → Categories → *Add default categories*).
- **A farm page shows "The query requires an index":** deploy the indexes
  (`npx firebase deploy --only firestore:indexes`) and wait a few minutes.
- **Existing farmers from before approval was removed** keep working: any old
  `farmerStatus` value other than `suspended` counts as active.

## Known limitations

- Up to 6 different products per order (customers can place another order for more).
- Cash on Delivery only; online payments (e.g. Razorpay) are not integrated yet.
- No e-mail/SMS notifications — status changes appear live in the app. E-mails
  would need Cloud Functions (Firebase Blaze plan).
- Deleting a product or photo doesn't delete the file from Cloudinary (that needs
  the API secret, i.e. a server). Files are kept; nothing is lost.
- Store search runs in the browser over up to 1,000 listed products; beyond that,
  add a search service (Algolia/Typesense). Admin dashboards show the latest 500 orders.
- The site is a client-rendered single-page app: search engines that don't run
  JavaScript see little content. Google does render it; for more SEO, add
  pre-rendering or server-side rendering later.
- Policy pages describe how the app works but are not legal advice — have them
  reviewed before launch.
