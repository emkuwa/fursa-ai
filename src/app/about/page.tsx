import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'
import {
  GraduationCap, Briefcase, HandCoins, Award, Globe, Users,
  ShieldCheck, Sparkles, MapPin, Phone, Mail, ExternalLink,
  BookOpen, Rocket, Database, ArrowRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'About Fursa AI | Opportunity Platform by Zanzibaba Digital',
  description: 'Learn about Fursa AI, a Tanzania-focused opportunity discovery platform developed by Zanzibaba Digital, helping people find jobs, scholarships, grants, fellowships and internships from trusted sources.',
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About Fursa AI | Opportunity Platform by Zanzibaba Digital',
    description: 'Learn about Fursa AI, a Tanzania-focused opportunity discovery platform developed by Zanzibaba Digital.',
    url: `${APP_URL}/about`,
    siteName: APP_NAME,
    type: 'website',
  },
}

async function getStats() {
  try {
    const supabase = createServiceClient()
    const statuses = ['approved', 'featured']

    const [totalRes, jobsRes, scholarshipsRes, grantsRes, countriesRes, sourcesRes] = await Promise.all([
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'foreign_job').in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'scholarship').in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'grant').in('status', statuses),
      supabase.from('opportunities').select('country').not('country', 'is', null).in('status', statuses).limit(5000),
      supabase.from('sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const rawCountries = (countriesRes.data || []).map(r => r.country?.trim()).filter(Boolean)
    const countries = new Set(rawCountries).size

    return {
      total: totalRes.count || 0,
      jobs: jobsRes.count || 0,
      scholarships: scholarshipsRes.count || 0,
      grants: grantsRes.count || 0,
      countries,
      sources: sourcesRes.count || 0,
    }
  } catch {
    return { total: 0, jobs: 0, scholarships: 0, grants: 0, countries: 0, sources: 0 }
  }
}

function formatStat(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
  return `${n}+`
}

const WHAT_WE_OFFER = [
  { icon: Briefcase, title: 'Tanzania Jobs', description: 'Verified job opportunities from top Tanzanian employers and organizations.' },
  { icon: Globe, title: 'International Jobs', description: 'Career opportunities from organizations around the world.' },
  { icon: GraduationCap, title: 'Scholarships', description: 'Scholarships for undergraduate, graduate and postgraduate studies globally.' },
  { icon: HandCoins, title: 'Grants', description: 'Research grants, project funding and development grants.' },
  { icon: Award, title: 'Fellowships', description: 'Professional fellowships and research opportunities.' },
  { icon: BookOpen, title: 'Internships', description: 'Internship and training programs for students and graduates.' },
  { icon: Rocket, title: 'Training Opportunities', description: 'Workshops, bootcamps and professional development programs.' },
  { icon: Database, title: 'Career Development', description: 'Resources and tools to advance your career.' },
]

const WHY_FURSA = [
  'Verified opportunities from trusted sources',
  'Tanzania-first approach',
  'Global opportunity coverage',
  'AI-powered opportunity discovery',
  'Free access to thousands of opportunities',
  'Continuously updated database',
]

export default async function AboutPage() {
  const stats = await getStats()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fursa AI',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Zanzibaba Digital',
      parentOrganization: {
        '@type': 'Organization',
        name: 'Zanzibaba Co. Ltd',
      },
    },
    url: 'https://fursaai.com',
    telephone: '+255716002790',
    email: 'info@zanzibaba.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Zanzibar',
      addressCountry: 'TZ',
    },
    description: 'Fursa AI is a Tanzania-focused opportunity discovery platform developed by Zanzibaba Digital.',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ============ HERO ============ */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            About Fursa AI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Helping Tanzanians Discover Opportunities That Change Lives
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Fursa AI is a Tanzania-focused opportunity discovery platform developed by Zanzibaba Digital to help students, graduates and professionals find verified jobs, scholarships, grants, fellowships, internships and career opportunities from Tanzania and around the world.
          </p>
        </div>
      </section>

      {/* ============ WHO WE ARE ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Who We Are
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Making Opportunity Discovery Simple and Accessible
          </h2>
          <div className="prose prose-lg text-gray-600 max-w-none space-y-4">
            <p>
              Fursa AI is an opportunity discovery platform designed to make finding life-changing opportunities easier, faster and more accessible.
            </p>
            <p>
              The platform collects, organizes and presents verified opportunities from trusted organizations, including jobs, scholarships, grants, fellowships, internships and training programs.
            </p>
            <p>
              Our goal is to help individuals spend less time searching and more time applying for opportunities that can improve their education, careers and future.
            </p>
          </div>
        </div>
      </section>

      {/* ============ OUR MISSION ============ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Our Mission
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Connecting People with Opportunities That Transform Lives
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            To make opportunity discovery simple, accessible and available to everyone.
          </p>
        </div>
      </section>

      {/* ============ WHAT WE OFFER ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              What We Offer
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Opportunities Across Every Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Browse verified opportunities from trusted organizations worldwide</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHAT_WE_OFFER.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ WHY FURSA AI ============ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Why Fursa AI
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Why Choose Fursa AI</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_FURSA.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT ZANZIBABA DIGITAL ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            About Zanzibaba Digital
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            The Company Behind Fursa AI
          </h2>
          <div className="prose prose-lg text-gray-600 max-w-none space-y-4 mb-8">
            <p>
              Fursa AI is developed and operated by Zanzibaba Digital, a digital solutions company based in Zanzibar, Tanzania.
            </p>
            <p>
              Zanzibaba Digital specializes in building technology-driven platforms and digital solutions that help individuals and businesses access information, services and opportunities more effectively.
            </p>
            <p>
              The company develops innovative digital products across multiple sectors, including opportunity discovery, digital services, marketing solutions, real estate technology and tourism solutions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Company Name</div>
                <div className="font-semibold text-gray-900">Zanzibaba Digital</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Parent Company</div>
                <div className="font-semibold text-gray-900">Zanzibaba Co. Ltd</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold text-gray-900">Zanzibar, Tanzania</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-semibold text-gray-900">+255 716 002 790</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OUR IMPACT ============ */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Our Impact</h2>
            <p className="text-amber-100 max-w-xl mx-auto">Connecting people with verified opportunities from trusted sources worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Opportunities', value: stats.total },
              { label: 'Jobs', value: stats.jobs },
              { label: 'Scholarships', value: stats.scholarships },
              { label: 'Grants', value: stats.grants },
              { label: 'Countries', value: stats.countries },
              { label: 'Active Sources', value: stats.sources },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center">
                <div className="text-2xl md:text-3xl font-bold">{formatStat(stat.value)}</div>
                <div className="text-sm text-amber-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Contact Us
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Get In Touch</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Have questions, suggestions or partnership opportunities? We would love to hear from you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a href="tel:+255716002790" className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-semibold text-gray-900">+255 716 002 790</div>
              </div>
            </a>
            <a href="mailto:info@zanzibaba.com" className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-semibold text-gray-900">info@zanzibaba.com</div>
              </div>
            </a>
            <a href="https://fursaai.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Website</div>
                <div className="font-semibold text-gray-900">fursaai.com</div>
              </div>
            </a>
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold text-gray-900">Zanzibar, Tanzania</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Ready to Discover Opportunities?</h2>
          <p className="text-gray-600 mb-8">Start exploring verified jobs, scholarships, grants and more.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/opportunities" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-sm">
              Browse Opportunities
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
