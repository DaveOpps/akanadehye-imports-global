"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

function AuthContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<"signin" | "signup">(sp.get("tab") === "signup" ? "signup" : "signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(t: "signin" | "signup") {
    setTab(t);
    setError("");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      router.push(role === "customer" ? "/account" : "/");
      router.refresh();
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone: phone || undefined, newsletterSubscribed: newsletter }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Registration failed."); setLoading(false); return; }
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { router.push("/register?tab=signin"); } else { router.push("/account"); router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-[color:var(--brand-cream)]/40 py-12 px-4">
      <div className="max-w-md mx-auto">

        {/* Brand */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--brand-navy)] font-bold text-2xl mb-3 shadow-lg text-[color:var(--brand-gold)]">
            A
          </Link>
          <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Akanadehye</h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">Sign in to track orders and get deals</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[color:var(--brand-cream)] border border-[color:var(--border)] p-1 mb-5">
          <button onClick={() => switchTab("signin")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${tab === "signin" ? "bg-white shadow-sm text-[color:var(--brand-navy)]" : "text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]"}`}>
            Sign In
          </button>
          <button onClick={() => switchTab("signup")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${tab === "signup" ? "bg-white shadow-sm text-[color:var(--brand-navy)]" : "text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]"}`}>
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 font-medium mb-4">{error}</div>}

        {/* ── SIGN IN ── */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" autoComplete="email" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Password</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" autoComplete="current-password" />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-xs text-[color:var(--muted)]">
              No account?{" "}
              <button type="button" onClick={() => switchTab("signup")} className="font-semibold text-[color:var(--brand-navy)] hover:underline">Create one free</button>
            </p>
          </form>
        )}

        {/* ── SIGN UP ── */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Full name <span className="text-red-500">*</span></span>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kwame Mensah" className="input" autoComplete="name" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Email <span className="text-red-500">*</span></span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" autoComplete="email" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Phone <span className="text-xs text-[color:var(--muted)] font-normal">(optional)</span></span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" className="input" autoComplete="tel" />
            </label>
            <div className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Password <span className="text-red-500">*</span></span>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="input pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition" aria-label="Toggle password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">Confirm password <span className="text-red-500">*</span></span>
              <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="input" autoComplete="new-password" />
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/40 transition">
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[color:var(--brand-navy)] shrink-0" />
              <div>
                <div className="text-sm font-medium text-[color:var(--brand-navy)]">Subscribe to newsletter</div>
                <div className="text-xs text-[color:var(--muted)] mt-0.5">Get deals and new arrivals straight to your inbox</div>
              </div>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? "Creating account…" : "Create account"}
            </button>
            <p className="text-center text-xs text-[color:var(--muted)]">
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("signin")} className="font-semibold text-[color:var(--brand-navy)] hover:underline">Sign in</button>
            </p>
          </form>
        )}

        {/* Guest option */}
        <div className="mt-4 flex items-center justify-between bg-white rounded-xl border border-[color:var(--border)] px-4 py-3 shadow-sm">
          <div className="text-sm text-[color:var(--muted)]">Just browsing? No account needed.</div>
          <Link href="/products" className="text-sm font-bold text-[color:var(--brand-navy)] hover:underline shrink-0 ml-3">
            Shop as guest →
          </Link>
        </div>

        <p className="text-center text-xs text-[color:var(--muted)] mt-4">
          <Link href="/" className="hover:text-[color:var(--brand-navy)] underline underline-offset-2 transition">← Back to storefront</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--muted)]">Loading…</div>}>
      <AuthContent />
    </Suspense>
  );
}
