export type StaffRole = "owner" | "manager" | "host" | "marketing";

export type Permission =
  | "dashboard.bookings"
  | "dashboard.traffic"
  | "bookings.manage"
  | "menu.availability"
  | "menu.edit"
  | "content.edit"
  | "promotions.edit"
  | "settings.edit"
  | "customers.view"
  | "customers.lookup"
  | "customers.ban"
  | "customers.delete"
  | "audit.view"
  | "staff.manage";

export const rolePermissions: Record<StaffRole, readonly Permission[]> = {
  owner: [
    "dashboard.bookings", "dashboard.traffic", "bookings.manage",
    "menu.availability", "menu.edit", "content.edit", "promotions.edit",
    "settings.edit", "customers.view", "customers.lookup", "customers.ban",
    "customers.delete", "audit.view", "staff.manage",
  ],
  manager: [
    "dashboard.bookings", "dashboard.traffic", "bookings.manage",
    "menu.availability", "menu.edit", "content.edit", "promotions.edit",
    "settings.edit", "customers.view", "customers.lookup", "customers.ban",
    "audit.view",
  ],
  host: [
    "dashboard.bookings", "bookings.manage", "menu.availability",
    "customers.lookup",
  ],
  marketing: ["dashboard.traffic", "content.edit", "promotions.edit"],
};

export function hasPermission(role: StaffRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: StaffRole, permissions: readonly Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}
