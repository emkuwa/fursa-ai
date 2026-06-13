'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PLANS, APP_NAME } from '@/lib/constants'
import { Check, Sparkles } from 'lucide-react'

export default function PricingClient() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-600 text-lg">Choose the plan that fits your needs. Upgrade anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => (
          <Card key={key} className={`relative ${key === 'premium' ? 'border-amber-500 shadow-lg ring-2 ring-amber-500' : ''}`}>
            {key === 'premium' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/month</span>}
                </div>
                {plan.monthly_matches > 0 ? (
                  <p className="text-sm text-gray-500 mt-1">{plan.monthly_matches} matches/month</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Unlimited matches</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={key === 'free' ? '/register' : '/register'}>
                <Button variant={key === 'premium' ? 'primary' : 'outline'} className="w-full">
                  {key === 'free' ? 'Get Started Free' : `Subscribe to ${plan.name}`}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
