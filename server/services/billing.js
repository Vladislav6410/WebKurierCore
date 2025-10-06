import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET);
export async function checkoutUrl({ priceId, userId }){
  const s = await stripe.checkout.sessions.create({
    mode:'subscription',
    line_items:[{ price: priceId, quantity:1 }],
    client_reference_id: userId,
    success_url:'https://your.app/success',
    cancel_url:'https://your.app/cancel'
  });
  return s.url;
}