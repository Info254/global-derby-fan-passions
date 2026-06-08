import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  eyebrow = "Tournament Hub",
}: {
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen bg-navy text-white font-sans pb-28">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-white/10">
        <div className="flex flex-col">
          <span className="font-display font-extrabold text-xl tracking-tight leading-none uppercase">
            Global Derby
          </span>
          <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase mt-1">
            {eyebrow}
          </span>
        </div>
        <div className="size-10 rounded-full border border-gold/40 p-0.5">
          <div className="w-full h-full rounded-full bg-stadium/40 grid place-items-center text-[10px] font-bold text-white/70">
            JD
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
