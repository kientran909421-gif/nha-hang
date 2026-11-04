export type StaffRole = "master" | "owner" | "manager" | "host" | "marketing";

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
  | "staff.manage"
  | "owners.manage"
  | "activity.viewAll"
  | "activity.viewTeam"
  | "system.manage";

export const rolePermissions: Record<StaffRole, readonly Permission[]> = {
  master: [
    "dashboard.bookings", "dashboard.traffic", "bookings.manage",
    "menu.availability", "menu.edit", "content.edit", "promotions.edit",
    "settings.edit", "customers.view", "customers.lookup", "customers.ban",
    "customers.delete", "audit.view", "staff.manage", "owners.manage",
    "activity.viewAll", "activity.viewTeam", "system.manage",
  ],
  owner: [
    "dashboard.bookings", "dashboard.traffic", "bookings.manage",
    "menu.availability", "menu.edit", "content.edit", "promotions.edit",
    "settings.edit", "customers.view", "customers.lookup", "customers.ban",
    "customers.delete", "audit.view", "staff.manage",
    "activity.viewTeam",
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

export const roleRank: Record<StaffRole, number> = {
  marketing: 1,
  host: 1,
  manager: 2,
  owner: 3,
  master: 4,
};

export function canManageRole(actorRole: StaffRole, targetRole: StaffRole) {
  return roleRank[targetRole] < roleRank[actorRole];
}

export function hasPermission(role: StaffRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: StaffRole, permissions: readonly Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}
