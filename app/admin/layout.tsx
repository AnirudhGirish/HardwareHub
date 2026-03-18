'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, Package, Users, Building2, ShieldCheck, 
  ClipboardList, Globe, ChevronLeft, ChevronRight, UsersRound
} from 'lucide-react'
import { useState } from 'react'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/resources', label: 'Resources', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/teams', label: 'Teams', icon: UsersRound },
  { href: '/admin/domains', label: 'Domains', icon: Globe },
  { href: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-[#E5E5E5] z-30 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E5E5]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-[#1A1A1A] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold tracking-tight text-[#0A0A0A]">Admin</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 rounded-md hover:bg-[#F4F4F4] flex items-center justify-center text-[#6B6B6B]"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6B6B] hover:bg-[#F4F4F4] hover:text-[#0A0A0A]'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Back to dashboard */}
        <div className="p-3 border-t border-[#E5E5E5]">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B6B6B] hover:bg-[#F4F4F4] hover:text-[#0A0A0A] transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Main content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        className="flex-1 min-h-screen"
      >
        <div className="p-8">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
