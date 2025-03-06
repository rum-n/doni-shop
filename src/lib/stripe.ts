import { Stripe } from 'stripe';

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error('Missing STRIPE_SECRET_KEY');
// }

const stripe = new Stripe("", {
  apiVersion: '2025-02-24.acacia', // Use the latest API version
});

export default stripe;