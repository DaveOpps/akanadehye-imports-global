"use client";

// Simple localStorage-based auth for the merchant dashboard.
// Real Auth.js session wiring is planned for Sprint 1 #35-40.

const AUTH_KEY = "akanadehye-auth-v1";

export type AuthRole = "admin" | "super_admin";

export type AuthUser = {
  name: string;
  email: string;
  role: AuthRole;
  initial: string;
};

// Demo credentials — swap for real backend auth when Sprint 1 auth lands.
const CREDENTIALS: Array<AuthUser & { password: string }> = [
  {
    name: "Nanayaw",
    email: "admin@akanadehye.com",
    password: "Admin@1234",
    role: "super_admin",
    initial: "N",
  },
  {
    name: "Staff",
    email: "staff@akanadehye.com",
    password: "Staff@1234",
    role: "admin",
    initial: "S",
  },
];

export function login(email: string, password: string): AuthUser | null {
  if (typeof window === "undefined") return null;
  const match = CREDENTIALS.find(
    (c) =>
      c.email.toLowerCase() === email.toLowerCase() &&
      c.password === password
  );
  if (!match) return null;
  const user: AuthUser = {
    name: match.name,
    email: match.email,
    role: match.role,
    initial: match.initial,
  };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch {}
  return user;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {}
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isSuperAdmin(): boolean {
  return getAuthUser()?.role === "super_admin";
}
