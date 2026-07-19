"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type IconProps = { className?: string };

function TodayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v4.5l3 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14-1.2 0-2-1-2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 15c2.5-2.5 5-3.5 8-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 6h9M18 6h1M5 12h1M10 12h9M5 18h7M16 18h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13" cy="18" r="2.1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const ITEMS: { href: string; label: string; icon: (p: IconProps) => ReactNode }[] = [
  { href: "/", label: "Today", icon: TodayIcon },
  { href: "/history", label: "History", icon: GridIcon },
  { href: "/review", label: "Review", icon: LeafIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="focus-ring flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-faint transition-colors"
              style={active ? { color: "var(--color-accent-strong)" } : undefined}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
