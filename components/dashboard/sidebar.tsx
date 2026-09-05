"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Database, Search, LayersIcon, BookMarked, PlusCircle,
  History, Users, Settings, Menu, X, FileSpreadsheet,
} from "lucide-react";
import { useState } from "react";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ size?: number }>; adminOnly?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Steel Database", href: "/dashboard/steel", icon: Database },
  { label: "Search & Compare", href: "/dashboard/compare", icon: Search },
  { label: "Steel Categories", href: "/dashboard/categories", icon: LayersIcon },
  { label: "Standards", href: "/dashboard/standards", icon: BookMarked },
  { label: "Add Steel", href: "/dashboard/steel/add", icon: PlusCircle, adminOnly: true },
  { label: "Import / Export", href: "/dashboard/import-export", icon: FileSpreadsheet, adminOnly: false },
  { label: "Change History", href: "/dashboard/history", icon: History },
  { label: "User Management", href: "/dashboard/users", icon: Users, adminOnly: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ role }: { role: "ADMIN" | "USER" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = navItems.filter((i) => !i.adminOnly || role === "ADMIN");

  return (
    <>
      {/* Mobile: hamburger button (Section 31) */}
      <button
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-md bg-background border border-border"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 border-r border-border bg-background z-30",
          "transform transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-border">
          <span className="font-semibold text-sm tracking-wide">STEEL DATA HUB</span>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
