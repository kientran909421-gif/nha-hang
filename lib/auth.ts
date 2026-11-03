"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase/server";
import { AdminAuthError } from "@/lib/admin-auth-error";
import {
  hasAnyPermission,
  hasPermission,
  type Permission,
  type StaffRole,
} from "@/lib/permissions";

async function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin() {
  return (await getCurrentStaff()) !== null;
}

export async function getOptionalUser() {
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  return error ? null : user;
}

export async function requireCustomer() {
  const user = await getOptionalUser();
  if (!user) redirect("/dang-nhap?next=/tai-khoan");
  return user;
}

export type CurrentStaff = {
  email: string;
  role: StaffRole;
  branchId: string | null;
  userId: string;
};

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) return null;

  const email = user.email.trim().toLowerCase();
  if ((await getAllowedAdminEmails()).includes(email)) {
    return { email, role: "owner", branchId: null, userId: user.id };
  }

  const { data: staff, error: staffError } = await client
    .from("staff_members")
    .select("email, role, branch_id")
    .ilike("email", email)
    .eq("active", true)
    .maybeSingle();
  if (staffError || !staff) return null;
  if (!["owner", "manager", "host", "marketing"].includes(String(staff.role))) return null;

  return {
    email,
    role: staff.role as StaffRole,
    branchId: staff.branch_id ? String(staff.branch_id) : null,
    userId: user.id,
  };
}

export async function requirePermission(
  permission: Permission,
  options?: { api?: boolean },
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login");
  }
  if (!hasPermission(staff.role, permission)) {
    if (options?.api) throw new AdminAuthError(403, "Bạn không có quyền thực hiện thao tác này.");
    redirect("/admin?error=forbidden");
  }
  return staff;
}

export async function requireAnyPermission(
  permissions: readonly Permission[],
  options?: { api?: boolean },
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login");
  }
  if (!hasAnyPermission(staff.role, permissions)) {
    if (options?.api) throw new AdminAuthError(403, "Bạn không có quyền thực hiện thao tác này.");
    redirect("/admin?error=forbidden");
  }
  return staff;
}

export async function requireAdmin(options?: { api?: boolean }) {
  console.log("[admin-auth] requireAdmin: bắt đầu kiểm tra phiên");
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login?error=unauthorized");
  }
  return staff;
}
