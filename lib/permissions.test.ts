import { describe, expect, it } from "vitest";
import { canManageRole, hasPermission } from "./permissions";

describe("role permissions", () => {
  it("does not allow host to edit the menu", () => {
    expect(hasPermission("host", "menu.edit")).toBe(false);
  });

  it("does not allow marketing to manage bookings", () => {
    expect(hasPermission("marketing", "bookings.manage")).toBe(false);
  });

  it("does not allow manager to manage staff", () => {
    expect(hasPermission("manager", "staff.manage")).toBe(false);
  });

  it("limits signature management to management roles", () => {
    expect(hasPermission("manager", "signature.manage")).toBe(true);
    expect(hasPermission("marketing", "signature.manage")).toBe(false);
    expect(hasPermission("host", "signature.manage")).toBe(false);
  });

  it("allows owner every defined permission", () => {
    expect(hasPermission("owner", "staff.manage")).toBe(true);
    expect(hasPermission("owner", "customers.delete")).toBe(true);
    expect(hasPermission("owner", "audit.view")).toBe(true);
  });

  it("does not allow owner to manage master", () => {
    expect(hasPermission("owner", "owners.manage")).toBe(false);
    expect(canManageRole("owner", "master")).toBe(false);
  });

  it("does not allow manager to add staff", () => {
    expect(hasPermission("manager", "staff.manage")).toBe(false);
  });

  it("does not allow anyone to create master", () => {
    expect(canManageRole("master", "master")).toBe(false);
    expect(canManageRole("owner", "master")).toBe(false);
  });

  it("allows master to add owner", () => {
    expect(hasPermission("master", "owners.manage")).toBe(true);
    expect(canManageRole("master", "owner")).toBe(true);
  });
});
