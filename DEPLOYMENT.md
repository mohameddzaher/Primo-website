# Deploying PRIMO to Render

One service runs everything: the storefront on Render's public port, the API
beside it on an internal port that is never exposed. Browser requests go to
`/api/proxy/*` and Next.js forwards them locally.

That means **one URL, one bill (~$7/month), and no CORS to configure** — the
storefront and the API share an origin, so the most common way this deployment
breaks simply cannot happen.

Everything is encoded in [`render.yaml`](./render.yaml). This file covers the
parts you do by hand.

---

## Before you touch Render

**Rotate the MongoDB Atlas password.** The old one is readable in this repo's
git history and the repo is public. You are about to paste a connection string
into a dashboard — rotate first, paste the new one. Otherwise you have only
copied a known-compromised credential to a second place.

---

## Deploy

1. **Render → New → Blueprint** → select this repository.
   It reads `render.yaml` and proposes one service named `primo`.

2. **Fill in `MONGODB_URI`** — the rotated Atlas connection string.
   Leave `NEXT_PUBLIC_APP_URL` blank for now.

3. **Apply.** The first build takes a few minutes.

4. **Atlas → Network Access** → allow Render's outbound IPs (or `0.0.0.0/0`
   for a demo). Without this the service starts and then every query fails.

5. **Copy the service URL** Render gives you (e.g.
   `https://primo-xxxx.onrender.com`), set `NEXT_PUBLIC_APP_URL` to it, then
   **Manual Deploy → Clear build cache & deploy**.

   A plain restart is not enough: `NEXT_PUBLIC_*` values are compiled into the
   browser bundle at build time. This variable only affects canonical URLs and
   the sitemap, so the site works before you do it — the links are just wrong.

Everything else (JWT secrets, the API address, payment settings) is already in
the blueprint. Render generates the secrets itself.

---

## What is running

```
Render's public $PORT ──► Next.js ──► /api/proxy/*  ──► localhost:5005 (Express)
                                  └─► /uploads/*    ──► localhost:5005
```

- `NEXT_PUBLIC_API_URL=/api/proxy` — relative, so the browser stays same-origin
- `API_INTERNAL_URL=http://localhost:5005/api/v1` — absolute, for server
  components and the sitemap, which cannot fetch a relative URL

`start:single` runs both with `concurrently --kill-others`, so if either
process dies the service restarts as a whole. That is intentional: a storefront
with a dead API is not "up", and Render should notice.

### Why Frankfurt

The Atlas cluster resolves to Frankfurt (`65.62.83.98`). Render defaults to
**Oregon**, and a single page render issues several queries — taking that
default puts every one of them on a round trip across the Atlantic. From Saudi
Arabia expect ~100–130 ms; no major host offers a Gulf region.

### Why not the free plan

A free service sleeps after ~15 minutes idle and the next visitor waits ~50 s
while it wakes. For a link handed to a client that reads as "the site is
broken".

### Why `npm ci --include=dev`

`NODE_ENV=production` is visible during the build, and `npm ci` then omits
devDependencies — which is where `typescript`, `next` and `concurrently` live.
Without the flag the build fails with `tsc: not found`.

---

## Payments here are SIMULATED

```
PAYMENT_PROVIDER=demo
ALLOW_DEMO_PAYMENTS=i-understand-no-money-is-collected
```

Card and Apple Pay orders are marked **paid without any money being
collected**, so the checkout journey can be demonstrated before a payment
provider is contracted.

`NODE_ENV=production` normally refuses the demo provider outright; the
acknowledgement is the deliberate second step that overrides it. It is an exact
sentence rather than `=true` so it cannot be switched on by accident or copied
between environments unread.

`GET /api/proxy/payments/availability` reports `simulated: true` while this is
active, so the storefront can label it.

**Before accepting a single real order:**

1. Delete `ALLOW_DEMO_PAYMENTS`
2. Set `PAYMENT_PROVIDER=moyasar`
3. Add `MOYASAR_SECRET_KEY` and `MOYASAR_WEBHOOK_SECRET`
4. Point the Moyasar webhook at `https://<your-host>/api/proxy/payments/webhook`

Leaving it as-is on a live store means giving the products away.

---

## Things that are easy to miss

**The demo shares the development database.** The deployed site uses the same
Atlas cluster as local development, so anything a client does — orders,
reviews, edits — appears locally too, and vice versa. Fine for a demo; give it
its own cluster before it is a real store.

**Email is optional.** With `SMTP_*` unset, order confirmations are not sent
and nothing breaks. (The credentials currently in `.env` are rejected with
`535 auth failed`, so email does not work locally either.)

**VAT invoices are not yet legally valid.** The seller VAT number is unset in
Settings, so the ZATCA QR is structurally correct but incomplete. Fill it in
under Admin → Settings before the invoices are used for anything real.

**Four admin toggles do nothing.** `stripeEnabled`, `paypalEnabled`,
`enablePushNotifications` and `enableMarketingEmails` exist in the settings UI
with no implementation behind them. They are left off deliberately.

**Maintenance mode is safe to use.** It returns 503 for storefront writes while
leaving browsing, `/auth`, `/settings` and the admin panel working, and staff
bypass it — so enabling it cannot lock you out of the switch that disables it.

---

## Splitting into two services later

If the single container runs out of headroom, the split is mechanical: deploy
the API as its own service, then change two variables on the web service —
`NEXT_PUBLIC_API_URL` and `API_INTERNAL_URL` — to the API's public URL, and set
`CORS_ORIGIN` on the API to the storefront's origin (full origin, including
`https://`, no trailing slash). No code changes.
