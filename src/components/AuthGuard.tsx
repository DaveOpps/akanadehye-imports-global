"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, type AuthUser } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace("/login");
    } else {
      setUser(u);
    }
  }, [router]);

  if (user === "loading" || user === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[color:var(--brand-navy)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
