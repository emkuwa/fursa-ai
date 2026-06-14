import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${APP_NAME}. Read our terms and conditions for using the platform.`,
  alternates: { canonical: `${APP_URL}/terms` },
  openGraph: {
    title: `Terms of Service | ${APP_NAME}`,
    description: `Terms of Service for ${APP_NAME}.`,
    url: `${APP_URL}/terms`,
    siteName: APP_NAME,
    type: 'website',
  },
}

export default function TermsPage() {
  return (
    <>
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-lg text-gray-600">Last updated: June 14, 2026</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto prose prose-lg text-gray-600 max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using {APP_NAME} (&quot;the Platform&quot;), you accept and agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Description</h2>
            <p>
              {APP_NAME} is an opportunity discovery platform that aggregates and presents verified
              jobs, scholarships, grants, fellowships, internships and other opportunities from
              trusted organizations. The Platform is developed and operated by Zanzibaba Digital,
              a division of Zanzibaba Co. Ltd, based in Zanzibar, Tanzania.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Opportunity Listings</h2>
            <p>
              The Platform collects and displays opportunities from various sources. While we strive
              to provide accurate and up-to-date information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not guarantee the accuracy, completeness or availability of any listing</li>
              <li>Opportunity details may change without notice</li>
              <li>Deadlines, requirements and availability are subject to change</li>
              <li>We are not responsible for any errors or omissions in listings</li>
              <li>Listing on {APP_NAME} does not constitute an endorsement</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
            <p>When using {APP_NAME}, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate registration information</li>
              <li>Maintain the security of your account</li>
              <li>Not use the Platform for any unlawful purpose</li>
              <li>Not attempt to disrupt or compromise the Platform</li>
              <li>Not scrape, crawl or use automated tools to access the Platform</li>
              <li>Not impersonate another person or entity</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Links</h2>
            <p>
              The Platform contains links to third-party websites and resources. These links are
              provided for your convenience only. We have no control over and are not responsible
              for the content, privacy policies or practices of any third-party websites.
            </p>
            <p>
              When you click on a third-party link, you leave {APP_NAME} and access the linked
              website at your own risk. We encourage you to review the terms and privacy policies
              of any third-party websites you visit.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p>
              All content on {APP_NAME}, including text, graphics, logos, icons, images, data
              compilations and software, is the property of Zanzibaba Digital or its content
              suppliers and is protected by Tanzanian and international copyright laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works of, publicly
              display or exploit any content from the Platform without prior written permission.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
            <p>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES,
              INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Platform will be uninterrupted, error-free, secure or
              free of viruses or other harmful components.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL ZANZIBABA DIGITAL, ZANZIBABA CO. LTD, OR THEIR OFFICERS,
              DIRECTORS, EMPLOYEES OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE
              PLATFORM.
            </p>
            <p>
              Our total liability to you for all claims arising out of or related to the use of
              the Platform shall not exceed the amount you have paid to us in the twelve (12)
              months preceding the claim, or one hundred US dollars ($100), whichever is greater.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify, defend and hold harmless Zanzibaba Digital, Zanzibaba Co.
              Ltd and their officers, directors, employees and agents from any claims, damages,
              losses, liabilities and expenses arising out of your use of the Platform or
              violation of these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of any
              changes by posting the new Terms on this page and updating the &quot;Last updated&quot;
              date. Your continued use of the Platform after any changes constitutes acceptance
              of the new Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              the United Republic of Tanzania, without regard to its conflict of law provisions.
              Any disputes arising under these Terms shall be resolved in the courts of Zanzibar,
              Tanzania.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us:
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
