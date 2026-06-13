import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-amber-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            Go Home
          </Link>
          <Link href="/opportunities" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-xl font-semibold hover:border-amber-300 transition-colors">
            Browse Opportunities
          </Link>
        </div>
      </div>
    </div>
  )
}
