'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Heart, Briefcase, User, Settings, FileText, BarChart3, Users, Shield, Bot, TrendingUp, DollarSign } from 'lucide-react'

const userNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Saved', href: '/dashboard/saved', icon: Heart },
  { label: 'Applications', href: '/dashboard/applications', icon: FileText },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
]

const adminNav = [
  { label: 'Admin Dashboard', href: '/admin', icon: Shield },
  { label: 'Opportunities', href: '/admin/opportunities', icon: Briefcase },
  { label: 'Agents', href: '/admin/agents', icon: Bot },
  { label: 'Sources', href: '/admin/sources', icon: TrendingUp },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile } = useUser()
  const isAdmin = profile?.role === 'admin'
  const isAdminPage = pathname.startsWith('/admin')
  const navItems = isAdminPage ? adminNav : userNav

  return (
    <div className="flex min-h-[80vh]">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          {isAdmin && !isAdminPage && (
            <>
              <hr className="my-4" />
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </>
          )}
          {isAdminPage && (
            <>
              <hr className="my-4" />
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                User Dashboard
              </Link>
            </>
          )}
        </div>
      </aside>
      <div className="flex-1 p-6 lg:p-8 bg-gray-50">
        {children}
      </div>
    </div>
  )
}
