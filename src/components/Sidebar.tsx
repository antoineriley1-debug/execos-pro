'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Email Intel', href: '/dashboard/email-intel', icon: '📧' },
    { label: 'Synthesis', href: '/dashboard/synthesis', icon: '✨' },
    { label: 'Projects', href: '/dashboard/projects', icon: '📁' },
    { label: 'Contracts', href: '/dashboard/contracts', icon: '📋' },
    { label: 'Documents', href: '/dashboard/documents', icon: '📄' },
    { label: 'Vendors', href: '/dashboard/vendors', icon: '🏢' },
    { label: 'Contacts', href: '/dashboard/contacts', icon: '👥' },
    { label: 'Notes', href: '/dashboard/notes', icon: '📝' },
    { label: 'Action Items', href: '/dashboard/action-items', icon: '✓' },
  ]

  return (
    <div
      className={`bg-gray-900 text-white transition-all ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen flex flex-col`}
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">EXECOS</h1>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                title={collapsed ? item.label : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition">
          {collapsed ? '🚪' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
