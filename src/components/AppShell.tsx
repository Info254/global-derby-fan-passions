import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import appIcon from "@/assets/app-icon.png";

export function AppShell({
  children,
  eyebrow = "Tournament Hub",
}: {
  children: ReactNode;
  eyebrow?: string;
}) {
  const { user } = useAuth();
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    if (!user) return setInitials("?");
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.display_name ?? user.email ?? "Fan";
        setInitials(name.slice(0, 2).toUpperCase());
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-navy text-white font-sans pb-28">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src={appIcon} alt="Global Derby" className="size-9 rounded-lg" width={36} height={36} />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-xl tracking-tight leading-none uppercase">
              Global Derby
            </span>
            <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase mt-1">{eyebrow}</span>
          </div>
        </Link>
        {user ? (
          <Link to="/passport" className="size-10 rounded-full border border-gold/40 p-0.5">
            <div className="w-full h-full rounded-full bg-stadium/40 grid place-items-center text-[10px] font-bold text-white/70">
              {initials}
            </div>
          </Link>
        ) : (
          <Link to="/auth" className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-gold text-navy">
            Sign in
          </Link>
        )}
      </header>
      <main className="max-w-md mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
