'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { COUNTRIES, EDUCATION_LEVELS, PROFESSIONS, CATEGORIES } from '@/lib/constants'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    education_level: '',
    profession: '',
    country: '',
    interests: [] as string[],
  })

  const toggleInterest = (value: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter(i => i !== value)
        : [...prev.interests, value],
    }))
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)

    const supabase = createClient()
    await supabase
      .from('user_profiles')
      .update({ ...form, is_onboarded: true })
      .eq('id', user.id)

    router.push('/dashboard')
  }

  const steps = [
    {
      title: 'What is your education level?',
      content: (
        <Select
          value={form.education_level}
          onChange={e => setForm(prev => ({ ...prev, education_level: e.target.value }))}
          options={EDUCATION_LEVELS.map(l => ({ value: l, label: l }))}
          label="Education Level"
        />
      ),
    },
    {
      title: 'What is your profession?',
      content: (
        <Select
          value={form.profession}
          onChange={e => setForm(prev => ({ ...prev, profession: e.target.value }))}
          options={PROFESSIONS.map(p => ({ value: p, label: p }))}
          label="Profession"
        />
      ),
    },
    {
      title: 'Which country are you interested in?',
      content: (
        <Select
          value={form.country}
          onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
          options={COUNTRIES.map(c => ({ value: c, label: c }))}
          label="Country of Interest"
        />
      ),
    },
    {
      title: 'What opportunities interest you?',
      content: (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => toggleInterest(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                form.interests.includes(cat.value)
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 mb-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Let&apos;s Get Started
          </div>
          <p className="text-gray-600">Tell us about yourself so we can find the best opportunities</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex justify-center gap-1 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          <div className="min-h-[200px]">
            <h2 className="text-xl font-semibold mb-6">{steps[step].title}</h2>
            {steps[step].content}
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => step > 0 ? setStep(step - 1) : router.push('/dashboard')}
            >
              {step === 0 ? 'Skip' : 'Back'}
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} loading={loading}>
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
