# Deploying Farm To Home

This puts the site on **Firebase Hosting** (free on the Spark plan, with HTTPS)
and publishes the security rules. Allow about 30 minutes the first time.

## 0. Before you start

- Node.js 20+ and Java 11+ (for the emulator tests).
- Your Firebase project (from Step 2) and Cloudinary account + unsigned preset (Step 3).
- `.env.local` filled in with the **production** values. All `VITE_…` values are
  baked into the build, so rebuild after changing any of them. Fill in the
  business details (`VITE_BUSINESS_LEGAL_NAME`, `VITE_SUPPORT_EMAIL`,
  `VITE_SUPPORT_PHONE`, `VITE_BUSINESS_ADDRESS`, `VITE_GRIEVANCE_OFFICER`) and,
  once you know it, `VITE_SITE_URL`.

## 1. Check everything locally

```bash
npm install
npm run lint
npm run test:emulator   # all tests must pass
npm run build
```

## 2. Connect the Firebase CLI (once)

```bash
npx firebase login
npx firebase use --add      # pick your project, alias: default
```

This creates `.firebaserc` (safe to commit).

## 3. Deploy

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
npx firebase deploy --only hosting
```

The site is now live at `https://<project-id>.web.app` (and `.firebaseapp.com`).
Later updates: `npm run build && npx firebase deploy --only hosting` (and the
rules command whenever `firestore.rules` changes).

> Rules first, then the site: the new app needs the new rules. The indexes
> command creates the collection-group index that farm ratings use; it can take
> a few minutes to become ready after the first deploy.

## 4. First-time setup on the live site

1. **Create the first admin.** Sign up on the live site, then on your computer
   (with `firebase-admin-key.json` in the project folder):
   `npm run admin:grant -- you@example.com --write`. Sign out and in again.
2. **Categories.** Admin → Categories → *Add default categories*.
3. **Demo data (optional).** `npm run seed:demo` then `npm run seed:demo -- --write`.
   Skip this for a real launch, or remove it later with
   `npm run seed:demo -- --remove --write`.
4. **Firebase Authentication settings** (console → Authentication → Settings):
   - *User actions*: enable **email enumeration protection**.
   - *Password policy*: require at least 8 characters with a letter and a number
     (matches the signup form).

## 5. Smoke test (5 minutes)

- Visitor: home page shows products; search "dal"; open a product.
- Customer: sign up → open **Our farmers** and pick a farm → add 2 products from
  different farms → checkout → order page shows 2 shipments → cancel works while
  "Placed".
- Admin: move one shipment to **Delivered**, **then immediately hide and release
  a product** — both should take about a second. If the second action hangs for
  ~1 minute, set `VITE_FIRESTORE_FORCE_LONG_POLLING=true` in `.env.local`,
  rebuild and redeploy.
- Customer: open the delivered product → post a review → the rating shows on the
  product card and the farm page (if the farm page shows an index error, see
  README → Troubleshooting).
- Farmer: sign up as a farmer → set up the farm profile → add a product with a
  photo; it should be in the store straight away. Admin → Farmers → **Suspend**
  hides it; **Reinstate** brings it back.

## 6. Connect your own domain

1. Firebase console → **Hosting** → **Add custom domain** → enter e.g.
   `farmtohome.in` (repeat for `www.farmtohome.in`, choosing "redirect to farmtohome.in").
2. At your domain registrar (GoDaddy, Hostinger, Namecheap…), add the DNS
   records Firebase shows: a **TXT** record to verify ownership, then the **A**
   records (and/or CNAME for `www`). Remove any old A/AAAA records for the same name.
3. Wait for verification and the free SSL certificate — usually under an hour,
   up to 24 hours.
4. **Authorise the domain for sign-in:** console → Authentication → Settings →
   **Authorized domains** → add `farmtohome.in` and `www.farmtohome.in`.
5. Set `VITE_SITE_URL=https://farmtohome.in` in `.env.local`, then
   `npm run build && npx firebase deploy --only hosting` (this generates
   `sitemap.xml` and the `Sitemap:` line in `robots.txt`).
6. Optional: add the site to Google Search Console and submit
   `https://farmtohome.in/sitemap.xml`.

## 7. Recommended hardening

- **Restrict the Firebase API key** (Google Cloud console → APIs & Services →
  Credentials → *Browser key*): Application restrictions → **Websites** →
  add `https://farmtohome.in/*`, `https://<project-id>.web.app/*`,
  `https://<project-id>.firebaseapp.com/*` and `http://localhost:5173/*`.
  (The key is public by design; this only limits where it can be used.)
- **Cloudinary preset:** keep it *Unsigned* with the folder, allowed formats
  (jpg, png, webp) and 5 MB limit from Step 3. Existing uploaded photos are not
  affected by deploys — nothing in this process deletes Cloudinary files.
- **Keep secrets out of git:** `.env.local` and `firebase-admin-key.json` are
  git-ignored. Store the admin key somewhere safe (password manager) and never
  share it. If it leaks: console → Service accounts → delete that key.
- **Security headers** (CSP, HSTS, X-Frame-Options…) are set in `firebase.json`
  and were tested with the production build. If you later add another external
  service (e.g. Razorpay or analytics), add its domains to the
  `Content-Security-Policy` there, or the browser will block it.
- Consider **Firebase App Check** (reCAPTCHA) later to make automated abuse harder.
- Free-plan limits (Spark): 50k Firestore reads and 20k writes per day. Watch
  usage in the console as traffic grows; the Blaze plan is pay-as-you-go.

## Rolling back

Firebase console → Hosting → **Release history** → choose a previous release →
**Rollback**. (Rules: redeploy the previous `firestore.rules`.)
