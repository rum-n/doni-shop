#!/usr/bin/env node
/**
 * Checks that the shop is wired up: env vars, Stripe, the webhook endpoint,
 * the database and email.
 *
 * Read-only. It never creates a charge, an order or a webhook endpoint, and it
 * never prints a secret — only whether one is present and what mode it is for.
 *
 *   npm run doctor
 */
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const WEBHOOK_PATH = "/api/webhooks/stripe";
const REQUIRED_EVENT = "checkout.session.completed";

let failures = 0;
let warnings = 0;

const pass = (label, detail = "") =>
  console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? `  ${detail}` : ""}`);
const warn = (label, detail = "") => {
  warnings++;
  console.log(`  \x1b[33m!\x1b[0m ${label}${detail ? `  ${detail}` : ""}`);
};
const fail = (label, detail = "") => {
  failures++;
  console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? `  ${detail}` : ""}`);
};
const section = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);

function keyMode(key) {
  if (!key) return null;
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

// --- environment ------------------------------------------------------------
section("Environment");

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

for (const [name, value] of Object.entries(env)) {
  if (value && value.trim()) pass(name);
  else fail(name, "not set");
}

const mode = keyMode(env.STRIPE_SECRET_KEY);

if (mode === "live") {
  warn(
    "Stripe is in LIVE mode",
    "real cards will be charged — use sk_test_ keys for testing"
  );
} else if (mode === "test") {
  pass("Stripe is in test mode");
}

if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
  fail("STRIPE_WEBHOOK_SECRET", "does not look like a signing secret (whsec_…)");
}

// Email is optional: without it orders still record, they just go unannounced.
section("Email (optional)");
const emailVars = ["RESEND_API_KEY", "ORDER_EMAIL_FROM", "ORDER_EMAIL_TO"];
const emailSet = emailVars.filter((v) => process.env[v]?.trim());

if (emailSet.length === emailVars.length) {
  pass("order emails configured", `to ${process.env.ORDER_EMAIL_TO}`);
  if (process.env.ORDER_EMAIL_FROM?.includes("resend.dev")) {
    warn(
      "sender is onboarding@resend.dev",
      "only delivers to the Resend account owner; verify a domain for real mail"
    );
  }
} else if (emailSet.length === 0) {
  warn("order emails are off", "orders will record, nothing will be sent");
} else {
  fail(
    "order emails half-configured",
    `missing ${emailVars.filter((v) => !process.env[v]?.trim()).join(", ")}`
  );
}

// --- stripe + webhook endpoint ---------------------------------------------
section("Stripe");

if (!env.STRIPE_SECRET_KEY) {
  fail("skipped", "no STRIPE_SECRET_KEY");
} else {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  try {
    const account = await stripe.accounts.retrieve();
    pass("secret key works", `account ${account.id}`);
    if (account.charges_enabled === false) {
      fail("charges are not enabled on this account");
    }
  } catch (error) {
    fail("secret key rejected", error.message);
  }

  try {
    const { data: endpoints } = await stripe.webhookEndpoints.list({ limit: 100 });

    if (endpoints.length === 0) {
      fail(
        "no webhook endpoints registered",
        `add one for ${env.NEXT_PUBLIC_BASE_URL ?? "<your domain>"}${WEBHOOK_PATH}`
      );
    } else {
      const expected = `${(env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "")}${WEBHOOK_PATH}`;
      const match = endpoints.find((e) => e.url === expected);

      if (!match) {
        fail("no endpoint matches this deployment", `expected ${expected}`);
        for (const e of endpoints) {
          console.log(`      registered: ${e.url}  [${e.status}]`);
        }
      } else {
        pass("webhook endpoint registered", match.url);

        if (match.status !== "enabled") {
          fail("endpoint is not enabled", `status: ${match.status}`);
        }

        const events = match.enabled_events ?? [];
        if (events.includes(REQUIRED_EVENT) || events.includes("*")) {
          pass(`endpoint listens for ${REQUIRED_EVENT}`);
        } else {
          fail(
            `endpoint does NOT listen for ${REQUIRED_EVENT}`,
            `it has: ${events.join(", ") || "nothing"}`
          );
        }
      }
    }
  } catch (error) {
    fail("could not list webhook endpoints", error.message);
  }
}

// --- database ---------------------------------------------------------------
section("Database");

const db = new PrismaClient();
let dbReachable = false;

try {
  const [artworks, inStock, orders, admins] = await Promise.all([
    db.artwork.count(),
    db.artwork.count({ where: { inStock: true } }),
    db.order.count(),
    db.user.count({ where: { role: "admin" } }),
  ]);

  pass("connected");
  dbReachable = true;
  pass("artworks", `${artworks} total, ${inStock} in stock`);
  pass("admin accounts", String(admins));

  if (admins === 0) {
    fail("no admin account", "run: npm run create-admin");
  }

  if (orders === 0) {
    warn("no orders recorded yet", "nothing has completed checkout");
  } else {
    const latest = await db.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true, createdAt: true, total: true, status: true },
    });
    pass("orders", `${orders} total`);
    pass(
      "most recent",
      `${latest.createdAt.toISOString().slice(0, 16).replace("T", " ")} · ` +
        `${latest.total.toFixed(2)} EUR · ${latest.status}`
    );
    // The order number IS the Stripe session id, so a recorded order proves
    // the webhook reached this deployment and its signature verified.
    if (latest.orderNumber.startsWith("cs_")) {
      pass("webhook delivery confirmed", "latest order came from a real session");
    }
  }
} catch (error) {
  fail("database", error.message);
}

// --- the decisive check -----------------------------------------------------
// Every completed Checkout session should have produced an order, because the
// order number IS the session id. A session with no order means the webhook
// never landed: wrong or missing signing secret, a 500, or an endpoint
// pointing somewhere else. This is the one check that proves the live path.
section("Paid sessions vs recorded orders");

if (!env.STRIPE_SECRET_KEY || !dbReachable) {
  fail("skipped", "needs both Stripe and the database");
} else {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  try {
    const { data: events } = await stripe.events.list({
      type: REQUIRED_EVENT,
      limit: 100,
    });

    if (events.length === 0) {
      warn(
        "no completed checkouts in Stripe's event history",
        "nobody has paid yet, so the live path is still unproven"
      );
    } else {
      const sessionIds = events
        .map((e) => e.data?.object?.id)
        .filter((id) => typeof id === "string" && id.startsWith("cs_"));

      const recorded = await db.order.findMany({
        where: { orderNumber: { in: sessionIds } },
        select: { orderNumber: true },
      });
      const have = new Set(recorded.map((o) => o.orderNumber));
      const missing = sessionIds.filter((id) => !have.has(id));

      pass("completed checkouts found in Stripe", String(sessionIds.length));

      if (missing.length === 0) {
        pass(
          "every paid session has an order",
          "the webhook, its secret and order recording all work"
        );
      } else {
        fail(
          `${missing.length} paid session${missing.length === 1 ? "" : "s"} with NO order`,
          "money taken, nothing recorded"
        );
        for (const id of missing.slice(0, 5)) {
          const event = events.find((e) => e.data?.object?.id === id);
          const when = event
            ? new Date(event.created * 1000).toISOString().slice(0, 16).replace("T", " ")
            : "?";
          console.log(`      ${when}  ${id}`);
        }
        console.log(
          "      → check STRIPE_WEBHOOK_SECRET in the hosting environment,"
        );
        console.log(
          "        then replay these from Stripe's webhook delivery log."
        );
      }
    }
  } catch (error) {
    fail("could not reconcile sessions with orders", error.message);
  } finally {
    await db.$disconnect();
  }
}

// --- verdict ----------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.log(
    `\x1b[31m${failures} problem${failures === 1 ? "" : "s"}\x1b[0m` +
      (warnings ? `, ${warnings} warning${warnings === 1 ? "" : "s"}` : "")
  );
  process.exit(1);
}
console.log(
  warnings
    ? `\x1b[33mOK with ${warnings} warning${warnings === 1 ? "" : "s"}\x1b[0m`
    : "\x1b[32mAll checks passed\x1b[0m"
);
