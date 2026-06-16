"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      // Read fresh session to determine role-based redirect
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const dest = rawCallback ?? (role === "customer" ? "/account" : "/admin");
      router.push(dest);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4"
    >
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 font-medium">
          {error}
        </div>
      )}

      <label className="block">
        <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@akanadehye.com"
          className="input"
          autoComplete="email"
        />
      </label>

      <div className="block">
        <span className="block text-sm font-medium mb-1.5 text-[color:var(--brand-navy)]">
          Password
        </span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input pr-11"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[color:var(--brand-cream)]">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--brand-navy)] font-bold text-2xl mb-4 shadow-lg text-[color:var(--brand-gold)]">
            A
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Akanadehye</h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">Admin Dashboard</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm">
            <div className="h-10 bg-[color:var(--brand-cream)] rounded-lg animate-pulse mb-4" />
            <div className="h-10 bg-[color:var(--brand-cream)] rounded-lg animate-pulse mb-4" />
            <div className="h-10 bg-[color:var(--brand-cream)] rounded-lg animate-pulse" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-[color:var(--muted)] mt-4">
          <Link href="/" className="hover:text-[color:var(--brand-navy)] underline underline-offset-2 transition">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
