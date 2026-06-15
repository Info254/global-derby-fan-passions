import { Link } from "@tanstack/react-router";
import { Home, Users, BookMarked, Radio, Trophy } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/matchday", label: "Live", icon: Radio },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/passport", label: "Passport", icon: BookMarked },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-navy/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-between items-center z-50">
      {tabs.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center gap-1 flex-1 text-white/40 [&.active]:text-white"
          activeProps={{ className: "active" }}
          activeOptions={{ exact: true }}
        >
          {label === "Live" ? (
            <span className="relative">
              <Icon className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-japan-red animate-pulse" />
            </span>
          ) : (
            <Icon className="size-5" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
