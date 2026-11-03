import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

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

  it("allows owner every defined permission", () => {
    expect(hasPermission("owner", "staff.manage")).toBe(true);
    expect(hasPermission("owner", "customers.delete")).toBe(true);
    expect(hasPermission("owner", "audit.view")).toBe(true);
  });
});
