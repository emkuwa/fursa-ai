'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { COUNTRIES, EDUCATION_LEVELS, PROFESSIONS } from '@/lib/constants'
import { CATEGORIES } from '@/lib/constants'
import { Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, loading } = useUser()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    profession: '',
    education_level: '',
    country: '',
    industry: '',
    interests: [] as string[],
    skills: [] as string[],
    phone: '',
    whatsapp_subscribed: false,
    email_subscribed: true,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        profession: profile.profession || '',
        education_level: profile.education_level || '',
        country: profile.country || '',
        industry: profile.industry || '',
        interests: profile.interests || [],
        skills: profile.skills || [],
        phone: profile.phone || '',
        whatsapp_subscribed: profile.whatsapp_subscribed,
        email_subscribed: profile.email_subscribed,
      })
    }
  }, [user, loading, profile, router])

  const toggleInterest = (value: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter(i => i !== value)
        : [...prev.interests, value],
    }))
  }

  const toggleSkill = (value: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(value)
        ? prev.skills.filter(s => s !== value)
        : [...prev.skills, value],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('user_profiles')
      .update({ ...form, is_onboarded: true })
      .eq('id', user!.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Update your profile for better matches</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Basic Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            value={form.full_name}
            onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
          />

          <Select
            label="Education Level"
            value={form.education_level}
            onChange={e => setForm(prev => ({ ...prev, education_level: e.target.value }))}
            options={EDUCATION_LEVELS.map(l => ({ value: l, label: l }))}
          />

          <Select
            label="Profession"
            value={form.profession}
            onChange={e => setForm(prev => ({ ...prev, profession: e.target.value }))}
            options={PROFESSIONS.map(p => ({ value: p, label: p }))}
          />

          <Select
            label="Country"
            value={form.country}
            onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
          />

          <Input
            label="Industry"
            value={form.industry}
            onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g., Technology, Healthcare, Education"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Interests</h2>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Skills</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Communication', 'Leadership', 'Research', 'Data Analysis', 'Project Management', 'Public Speaking', 'Writing', 'Programming', 'Design', 'Teaching', 'Accounting', 'Healthcare'].map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  form.skills.includes(skill)
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Notifications</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Phone (for WhatsApp alerts)"
            value={form.phone}
            onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+255 123 456 789"
          />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.whatsapp_subscribed}
              onChange={e => setForm(prev => ({ ...prev, whatsapp_subscribed: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Receive WhatsApp alerts</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.email_subscribed}
              onChange={e => setForm(prev => ({ ...prev, email_subscribed: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Receive email alerts</span>
          </label>
        </CardContent>
      </Card>

      <Button onClick={handleSave} loading={saving} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saved ? 'Saved!' : 'Save Profile'}
      </Button>
    </div>
  )
}
