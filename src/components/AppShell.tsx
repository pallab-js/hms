"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserSquare2,
  Package,
  Moon,
  Sun,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#e5e5e5] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col">
        {/* Logo */}
        <div className="p-6 pb-4">
          <h2 className="text-lg font-display font-medium text-[#000000] dark:text-[#ffffff]">
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
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#e5e5e5] dark:bg-[#262626] text-[#262626] dark:text-[#d4d4d4]"
                    : "text-[#737373] dark:text-[#a3a3a3] hover:bg-[#fafafa] dark:hover:bg-[#141414]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-[#e5e5e5] dark:border-[#262626]">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-full px-4 py-2.5 text-sm font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-[#fafafa] dark:hover:bg-[#141414] transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-auto">{children}</main>
    </div>
  );
}
