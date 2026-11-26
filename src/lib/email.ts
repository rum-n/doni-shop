import { Resend } from "resend";
import type { Order, OrderItem, Artwork } from "@prisma/client";

/**
 * Order email, sent from the Stripe webhook.
 *
 * Every failure here is swallowed and logged. The order is already paid for
 * and written to the database by the time this runs: if the webhook returned
 * 500 because an email bounced, Stripe would retry and the shop owner would
 * get duplicate notifications for an order that was recorded correctly the
 * first time.
 */

type OrderWithItems = Order & {
  items: (OrderItem & { artwork: Pick<Artwork, "title" | "medium" | "year"> })[];
};

interface ShippingAddress {
  name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  state?: string | null;
  country?: string | null;
}

function config() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const owner = process.env.ORDER_EMAIL_TO;

  if (!apiKey || !from || !owner) {
    return null;
  }

  return { resend: new Resend(apiKey), from, owner };
}

function money(amount: number): string {
  return `${amount.toFixed(2)} EUR`;
}

function addressLines(address: ShippingAddress | null): string[] {
  if (!address) return ["No shipping address on this order."];

  return [
    address.name,
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    [address.state, address.country].filter(Boolean).join(", "),
    address.phone,
  ]
    .map((line) => (line || "").trim())
    .filter(Boolean);
}

function itemRows(order: OrderWithItems): string {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
            <div style="color:#1e293b;">${escape(item.artwork.title)}</div>
            <div style="color:#64748b;font-size:13px;">
              ${escape(item.artwork.medium)}, ${item.artwork.year}
            </div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;color:#334155;white-space:nowrap;">
            ${money(item.price)}
          </td>
        </tr>`
    )
    .join("");
}

/** Order data is customer-supplied, so never interpolate it into HTML raw. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(heading: string, intro: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;">
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:400;color:#1e293b;">${escape(heading)}</h1>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">${escape(intro)}</p>
      ${body}
    </td></tr>
  </table>
</body></html>`;
}

function orderBlock(order: OrderWithItems): string {
  const address = (order.shippingAddress as ShippingAddress | null) ?? null;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(order)}
      <tr>
        <td style="padding:14px 0;color:#1e293b;">Total</td>
        <td style="padding:14px 0;text-align:right;color:#1e293b;font-weight:500;">
          ${money(order.total)}
        </td>
      </tr>
    </table>

    <h2 style="margin:28px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:400;">
      Shipping address
    </h2>
    <p style="margin:0;color:#334155;line-height:1.7;">
      ${addressLines(address).map(escape).join("<br />")}
    </p>`;
}

/** Confirms the order to the buyer. */
async function sendBuyerEmail(
  order: OrderWithItems,
  email: string
): Promise<void> {
  const cfg = config();
  if (!cfg) return;

  await cfg.resend.emails.send({
    from: cfg.from,
    to: email,
    subject: `Your order is confirmed`,
    html: shell(
      "Thank you for your order",
      "Your payment went through and your order is being prepared. Here is what you bought.",
      orderBlock(order)
    ),
  });
}

/** Tells the shop owner there is something to pack. */
async function sendOwnerEmail(
  order: OrderWithItems,
  buyerEmail: string
): Promise<void> {
  const cfg = config();
  if (!cfg) return;

  await cfg.resend.emails.send({
    from: cfg.from,
    to: cfg.owner,
    replyTo: buyerEmail,
    subject: `New order — ${money(order.total)}`,
    html: shell(
      "New order",
      `From ${buyerEmail}. Reply to this email to reach the buyer.`,
      orderBlock(order)
    ),
  });
}

/**
 * Sends both order emails. Never throws.
 *
 * Returns what happened so the webhook can log it without deciding whether to
 * fail the request.
 */
export async function sendOrderEmails(
  order: OrderWithItems,
  buyerEmail: string
): Promise<{ sent: boolean; reason?: string }> {
  if (!config()) {
    return {
      sent: false,
      reason:
        "email is not configured (needs RESEND_API_KEY, ORDER_EMAIL_FROM, ORDER_EMAIL_TO)",
    };
  }

  // Settled, not all: the owner must still hear about the order even if the
  // buyer's address bounces, and the other way round.
  const results = await Promise.allSettled([
    sendBuyerEmail(order, buyerEmail),
    sendOwnerEmail(order, buyerEmail),
  ]);

  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  if (failures.length > 0) {
    return { sent: failures.length < results.length, reason: failures.join("; ") };
  }

  return { sent: true };
}
