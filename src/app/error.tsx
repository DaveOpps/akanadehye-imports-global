"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-8 py-20 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-[color:var(--muted)]">
        We hit an unexpected error. Try again, or head back home if it keeps happening.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-[color:var(--muted)] font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <button onClick={reset} className="btn-gold">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
