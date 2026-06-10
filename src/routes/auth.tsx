import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Global Derby" },
      { name: "description", content: "Sign in to claim your loyalties, build your passport, and join your family circle." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) nav({ to: "/" });
  }, [session, nav]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Global Derby</p>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tighter italic mt-1">
              {mode === "signup" ? "Claim Your Passport" : "Welcome Back"}
            </h1>
          </Link>
          <p className="text-sm text-white/60">
            {mode === "signup" ? "Stamps, circles, and reactions — saved forever." : "Sign in to pick up where you left off."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white text-navy font-display font-bold py-3 rounded-lg uppercase tracking-tight text-sm hover:brightness-95 transition disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/30">
          <div className="flex-1 h-px bg-white/10" /> Or <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/50"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/50"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/50"
          />
          {error && <p className="text-japan-red text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-navy font-display font-black py-3 rounded-lg uppercase tracking-tight text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-center text-xs text-white/60 hover:text-white transition"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
