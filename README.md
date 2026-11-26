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
   `recordCheckoutSession`, which writes the order and marks the pieces sold in
   one transaction, keyed on the Stripe session id so repeated deliveries are
   idempotent.
4. The success page polls `/api/orders/session/<id>` until the order appears.

Where the shop ships is the single list in `src/lib/shipping.ts`.

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

## Known gaps

- **No transactional email.** Nothing notifies the buyer or the owner when an
  order is placed; the owner has to watch `/admin/orders`.
- **No shipping cost** is charged — prices are the artwork alone.
- **No tests and no CI.**
