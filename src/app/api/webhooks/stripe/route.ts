import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/payments/stripe'
import { createServiceClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ message: 'Stripe not configured' }, { status: 200 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ message: 'Stripe webhook not configured' }, { status: 200 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription

        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan: sub.items.data[0].price.nickname?.toLowerCase() || 'premium',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            status: 'active',
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })

          await supabase.from('user_profiles').update({ role: 'premium' }).eq('id', userId)

          await supabase.from('revenue_events').insert({
            user_id: userId,
            event_type: 'subscription_created',
            amount: sub.items.data[0].price.unit_amount || 0,
            currency: 'usd',
            stripe_event_id: event.id,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (existing) {
          await supabase.from('subscriptions').update({
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq('stripe_subscription_id', sub.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object as any
        const { data: deletedExisting } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', deletedSub.id)
          .single()

        if (deletedExisting) {
          await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', deletedSub.id)
          await supabase.from('user_profiles').update({ role: 'user' }).eq('id', deletedExisting.user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
