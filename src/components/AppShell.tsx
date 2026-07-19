import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            Steady
          </span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            one thing a day
          </span>
        </div>
        {right}
      </header>
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
