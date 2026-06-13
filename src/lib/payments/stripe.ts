import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  _stripe = new Stripe(key, { typescript: true })
  return _stripe
}

export async function createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  const s = getStripe()
  if (!s) throw new Error('Stripe not configured')
  return s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const s = getStripe()
  if (!s) throw new Error('Stripe not configured')
  return s.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function createFeaturedListingPayment(amount: number, userId: string, opportunityId: string) {
  const s = getStripe()
  if (!s) throw new Error('Stripe not configured')
  return s.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { userId, opportunityId, type: 'featured_listing' },
  })
}

export const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  enterprise_monthly: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
}
