"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wifi, Search, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Hide mobile navigation in admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Plans", href: "/plans", icon: Wifi },
    { label: "Check Voucher", href: "/voucher-checker", icon: Search },
    { label: "Account", href: "/account", icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white shadow-lg md:hidden">
      <nav 
        className="flex h-16 items-center justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                isActive ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              <span className={`p-1 rounded-lg ${isActive ? "bg-emerald-50" : ""}`}>
                <Icon size={20} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
