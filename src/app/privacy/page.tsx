import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${APP_NAME}. Learn how we collect, use and protect your information.`,
  alternates: { canonical: `${APP_URL}/privacy` },
  openGraph: {
    title: `Privacy Policy | ${APP_NAME}`,
    description: `Privacy Policy for ${APP_NAME}.`,
    url: `${APP_URL}/privacy`,
    siteName: APP_NAME,
    type: 'website',
  },
}

export default function PrivacyPage() {
  return (
    <>
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last updated: June 14, 2026</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto prose prose-lg text-gray-600 max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              Welcome to {APP_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We operate the {APP_NAME} platform at{' '}
              <a href="https://fursaai.com" className="text-amber-600 hover:text-amber-700">fursaai.com</a> to help
              users discover jobs, scholarships, grants, fellowships and other opportunities.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose and safeguard your information when you
              use our platform. By using {APP_NAME}, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">a. Registration Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (stored securely)</li>
              <li>Profile preferences (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">b. Search Activity</h3>
            <p>When you use our search feature, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Search queries you enter</li>
              <li>Search results you view</li>
              <li>Filters you apply</li>
              <li>Timestamps of searches</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">c. Saved Opportunities</h3>
            <p>When you save opportunities, we store:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Opportunities you have saved</li>
              <li>Application deadlines you track</li>
              <li>Notes you add to saved items</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">d. Usage Data</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages you visit</li>
              <li>Time spent on pages</li>
              <li>Links you click</li>
              <li>Browser type and version</li>
              <li>Device type</li>
              <li>IP address (anonymized)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the {APP_NAME} platform</li>
              <li>Personalize your experience and recommend relevant opportunities</li>
              <li>Track search trends and improve our platform</li>
              <li>Send notifications about saved opportunities and deadlines</li>
              <li>Improve our AI-powered opportunity matching</li>
              <li>Ensure platform security and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Analytics</h2>
            <p>
              We use analytics tools to understand how users interact with our platform. These tools
              collect information such as pages visited, time spent on the platform and referral sources.
              This data helps us improve the platform and user experience.
            </p>
            <p>
              Analytics data is aggregated and does not personally identify you. We use this data to
              understand usage patterns, identify popular features and optimize platform performance.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies</h2>
            <p>
              {APP_NAME} uses cookies and similar tracking technologies to maintain your session,
              remember your preferences and analyze platform usage. Cookies are small data files
              stored on your device.
            </p>
            <p>You can control cookies through your browser settings. Disabling cookies may
              affect platform functionality.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who help operate the platform (hosting, analytics)</li>
              <li>Legal authorities when required by law</li>
              <li>Successors in the event of a merger or acquisition</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information.
              However, no method of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Opt out of non-essential data collection</li>
              <li>Export your data</li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="mailto:info@zanzibaba.com" className="text-amber-600 hover:text-amber-700">info@zanzibaba.com</a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              {APP_NAME} is not intended for users under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: <a href="mailto:info@zanzibaba.com" className="text-amber-600 hover:text-amber-700">info@zanzibaba.com</a></li>
              <li>Phone: +255 716 002 790</li>
              <li>Website: <a href="https://fursaai.com" className="text-amber-600 hover:text-amber-700">fursaai.com</a></li>
              <li>Location: Zanzibar, Tanzania</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/opportunities" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-sm">
            Browse Opportunities
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
