export const ALL_PERMISSIONS = [
  "overview",
  "inventory",
  "orders",
  "customers",
  "sourcing",
  "payments",
  "invoices",
  "chatbots",
  "finance",
  "insights",
  "settings",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  overview:  "Dashboard Overview",
  inventory: "Inventory",
  orders:    "Orders",
  customers: "Customer Accounts",
  sourcing:  "Sourcing",
  payments:  "Payments",
  invoices:  "Invoices",
  chatbots:  "Chatbots & Messaging",
  finance:   "Finance Hub",
  insights:  "Insights & Analytics",
  settings:  "Settings",
};

/** Parse a raw JSON permissions string into an array. Returns null for super_admin (unlimited). */
export function parsePermissions(raw: string | null | undefined): Permission[] | null {
  if (raw === null || raw === undefined) return null; // null = unlimited
  try {
    return JSON.parse(raw) as Permission[];
  } catch {
    return [];
  }
}

/** Returns true if the given role/permissions combo allows access to a section. */
export function hasPermission(
  role: string | undefined,
  rawPermissions: string | null | undefined,
  perm: Permission,
): boolean {
  if (role === "super_admin") return true;
  if (!rawPermissions) return false;
  try {
    return (JSON.parse(rawPermissions) as Permission[]).includes(perm);
  } catch {
    return false;
  }
}
