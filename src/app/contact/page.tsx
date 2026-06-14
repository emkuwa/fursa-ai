import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'
import { Phone, Mail, Globe, MapPin, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with ${APP_NAME} and Zanzibaba Digital. Contact us for questions, suggestions or partnership opportunities.`,
  alternates: { canonical: `${APP_URL}/contact` },
  openGraph: {
    title: `Contact Us | ${APP_NAME}`,
    description: `Get in touch with ${APP_NAME} and Zanzibaba Digital.`,
    url: `${APP_URL}/contact`,
    siteName: APP_NAME,
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get In Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions, suggestions or partnership opportunities? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a href="tel:+255716002790" className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Phone</div>
                <div className="font-semibold text-gray-900 text-lg">+255 716 002 790</div>
                <div className="text-sm text-gray-500 mt-1">Monday - Friday, 8am - 5pm EAT</div>
              </div>
            </a>

            <a href="mailto:info@zanzibaba.com" className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-900 text-lg">info@zanzibaba.com</div>
                <div className="text-sm text-gray-500 mt-1">We respond within 24 hours</div>
              </div>
            </a>

            <a href="https://fursaai.com" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Website</div>
                <div className="font-semibold text-gray-900 text-lg">fursaai.com</div>
                <div className="text-sm text-gray-500 mt-1">Browse opportunities 24/7</div>
              </div>
            </a>

            <div className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Location</div>
                <div className="font-semibold text-gray-900 text-lg">Zanzibar, Tanzania</div>
                <div className="text-sm text-gray-500 mt-1">East Africa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Company Name</div>
                <div className="font-semibold text-gray-900">Zanzibaba Digital</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Parent Company</div>
                <div className="font-semibold text-gray-900">Zanzibaba Co. Ltd</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold text-gray-900">Zanzibar, Tanzania</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-semibold text-gray-900">+255 716 002 790</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">Explore thousands of verified opportunities today.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-sm">
            Browse Opportunities
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
