"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserSquare2,
  Package,
  Settings as SettingsIcon,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/staff", label: "Staff", icon: UserSquare2 },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside 
        className="w-64 flex flex-col"
        style={{ 
          background: 'var(--color-bg-primary)',
          borderRight: '1px solid var(--color-border-default)'
        }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <h2 
            className="text-lg font-display font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            HMS
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors`}
                style={{
                  background: isActive ? 'var(--color-bg-surface)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--color-brand)' : 'inherit' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div 
          className="p-4"
          style={{ borderTop: '1px solid var(--color-border-default)' }}
        >
          <p className="code-label" style={{ fontSize: '0.7rem' }}>
            Local-first HMS v0.1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-auto" style={{ background: 'var(--color-bg-primary)' }}>
        {children}
      </main>
    </div>
  );
}