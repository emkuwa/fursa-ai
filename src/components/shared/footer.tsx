import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold mb-4">{APP_NAME}</h3>
            <p className="text-sm">Your AI-Powered Opportunity Intelligence Platform for Africa.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Opportunities</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/scholarships" className="hover:text-white">Scholarships</Link></li>
              <li><Link href="/jobs" className="hover:text-white">Foreign Jobs</Link></li>
              <li><Link href="/grants" className="hover:text-white">Grants</Link></li>
              <li><Link href="/fellowships" className="hover:text-white">Fellowships</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/opportunities" className="hover:text-white">All Opportunities</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/beta" className="hover:text-white">Beta Waitlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
