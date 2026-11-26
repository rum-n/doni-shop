# Doni Boyadzhieva — shop & portfolio

A bilingual (English / Bulgarian) portfolio and shop for original prints,
linocut stamps and accessories. Each piece is one of a kind: an artwork is
either available or sold, with no stock counts.

Next.js 15 (App Router) · MongoDB via Prisma · NextAuth · Stripe Checkout ·
Cloudinary · next-intl · Tailwind 4

## Getting started

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill it in — see below
npx prisma db push          # create the collections and indexes
npm run create-admin        # interactive: creates the owner account
npm run dev
```

The site runs at http://localhost:3000 and redirects to a locale, e.g. `/en`.

### Environment

Every variable is documented in [.env.example](.env.example). Three are worth
calling out:

- **`STRIPE_WEBHOOK_SECRET`** — without it the webhook returns 500 and **no
  paid order is ever recorded**. The buyer is charged and nothing lands in the
  database. Set it before taking real money.
- **`NEXTAUTH_SECRET`** — signs session tokens. `openssl rand -base64 32`.
- **`DATABASE_URL`** — must point at a replica set (MongoDB Atlas is one by
  default). Order recording runs in a Prisma transaction, which requires one.

### Is it actually working?

```bash
npm run doctor
```

Read-only: it never creates a charge, an order or an endpoint, and never prints
a secret. It checks the environment, that the Stripe key works, that a webhook
endpoint is registered for this deployment and subscribed to
`checkout.session.completed`, that the database is reachable, and — the one
check that proves the live path — that **every completed Checkout session in
Stripe has a matching order row**. The order number *is* the session id, so a
paid session with no order means the webhook never landed.

Note it reads the local `.env`. It cannot see your hosting provider's
environment, so a passing run locally does not prove `STRIPE_WEBHOOK_SECRET` is
set in production — check that in the host's dashboard, or run the reconcile
check with production credentials.

### Receiving Stripe webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`. In production, add
an endpoint for `https://<domain>/api/webhooks/stripe` subscribed to
`checkout.session.completed` and use its signing secret.

## How it fits together

```
src/
  app/[locale]/        public pages + /admin (locale-prefixed)
  app/api/             route handlers
  components/          UI, including CartProvider (localStorage cart)
  i18n/                next-intl routing and request config
  lib/                 db, auth, admin guard, stripe, orders, cloudinary
messages/{en,bg}.json  all user-facing copy
prisma/schema.prisma   User, Artwork, Order, OrderItem, SiteSettings
```

### Authentication and authorization

A session alone does not grant access to anything. Buyers check out as guests
and get a `User` row with an unusable random password, so being signed in and
being the owner are different questions. Admin surfaces check
`role === "admin"` in two places:

- `src/middleware.ts` keeps non-admins off `/admin/**`
- `requireAdmin()` from `src/lib/require-admin.ts` guards every write endpoint
  and everything that exposes customer data

Admin accounts are created only from the CLI (`npm run create-admin`). There is
deliberately no HTTP endpoint for it.

### Buying

1. The browser posts artwork ids to `/api/checkout`, which re-reads prices from
   the database (never trusting the client) and creates a Stripe Checkout
   session that collects a shipping address.
2. Stripe redirects the buyer to `/[locale]/checkout/success`.
3. `POST /api/webhooks/stripe` verifies the signature and calls
   `recordCheckoutSession`, which writes the order keyed on the Stripe session
   id, so repeated deliveries are idempotent, and then sends the order emails.
4. The success page polls `/api/orders/session/<id>` until the order appears.

Where the shop ships is the single list in `src/lib/shipping.ts`.

### Stock

These are prints, not unique pieces, so a sale says nothing about whether a run
is exhausted. `Artwork.inStock` is set **by hand** in the admin; buying
something never changes it. An earlier version flipped it to false on the first
sale, which pulled a print from the shop after one order.

### Email

Order emails go out from the webhook through Resend: a confirmation to the
buyer and a notification to the shop owner, with the buyer as `reply-to`.
Sending is best effort — the order is already paid for and saved, so a provider
outage is logged rather than turned into a webhook retry. Unset the Resend
variables and the shop still works, silently sending nothing.

### Images

The browser uploads straight to Cloudinary using a short-lived signature from
`/api/upload/signature`; image bytes never pass through the deployment. The API
only ever accepts and stores `https://res.cloudinary.com/...` URLs.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run create-admin` | Create the owner account (interactive) |
| `npm run doctor` | Check env, Stripe, the webhook endpoint, the database and email |

## Known gaps

- **No shipping cost** is charged — prices are the artwork alone.
- **No tests and no CI.**
- **The admin area** is still on the pre-redesign styling and is English only.
- **`Artwork.featured`** is written by the admin form and filterable in the API,
  but no page uses it: the homepage has no featured row and the shop lists
  everything. Either put a featured section back or drop the flag.
- **Category pages hide out-of-stock work** (`?category=X&inStock=true`), so an
  unavailable print shows on `/shop` but not on `/prints`.
