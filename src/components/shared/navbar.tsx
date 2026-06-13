'use client'

import Link from 'next/link'
import { useUser } from '@/lib/hooks/use-user'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Grants', href: '/grants' },
  { label: 'Fellowships', href: '/fellowships' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Beta', href: '/beta' },
]

export function Navbar() {
  const { user, profile, loading } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <span className="text-amber-500">✦</span>
            {APP_NAME}
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/profile">
                    <span className="text-sm text-gray-700">{profile?.full_name || user.email}</span>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="block text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          <hr className="my-2" />
          {user ? (
            <>
              <Link href="/dashboard" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={handleSignOut} className="block text-sm text-red-600">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}><Button className="w-full">Get Started</Button></Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
