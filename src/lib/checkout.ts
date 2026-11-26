/**
 * Starts a Stripe Checkout session and sends the browser to it.
 *
 * Returns nothing on success, because the page navigates away. Throws with a
 * message worth showing the buyer otherwise; `unavailable` is set when the
 * reason is that something has been sold since it went in the cart.
 */
export class CheckoutError extends Error {
  unavailable?: { id: string; title: string }[];

  constructor(message: string, unavailable?: { id: string; title: string }[]) {
    super(message);
    this.name = "CheckoutError";
    this.unavailable = unavailable;
  }
}

export async function startCheckout(
  artworkIds: string[],
  locale: string
): Promise<never | void> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artworkIds, locale }),
  });

  let payload: {
    url?: string;
    message?: string;
    unavailable?: { id: string; title: string }[];
  } = {};

  try {
    payload = await response.json();
  } catch {
    // Fall through to the generic error below
  }

  if (!response.ok) {
    throw new CheckoutError(
      payload.message || "Could not start checkout",
      payload.unavailable
    );
  }

  if (!payload.url) {
    throw new CheckoutError("Stripe did not return a checkout URL");
  }

  // Stripe hands back the hosted page's URL, so navigate to it directly rather
  // than going through the deprecated redirectToCheckout().
  window.location.assign(payload.url);
}
