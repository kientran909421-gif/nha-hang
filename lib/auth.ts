"use server";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClientForServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminAuthError } from "@/lib/admin-auth-error";
import { logAdminAction } from "@/lib/admin-audit";
import { isMasterEmail, normalizeEmail } from "@/lib/admin-email";
import {
  hasAnyPermission,
  hasPermission,
  type Permission,
  type StaffRole,
} from "@/lib/permissions";

export async function isAdmin() {
  return (await getCurrentStaff()) !== null;
}

export async function getOptionalUser() {
  await connection();
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  return error ? null : user;
}

export async function requireCustomer() {
  await connection();
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
  await connection();
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) return null;

  const email = normalizeEmail(user.email);
  if (isMasterEmail(email)) {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentPresence, error: presenceReadError } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id")
      .eq("actor_email", email)
      .eq("action", "presence")
      .eq("area", "auth")
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    if (presenceReadError) {
      console.error("[admin-auth] Không thể đọc presence master:", presenceReadError.message);
    } else if (!recentPresence) {
      await logAdminAction(
        { email, role: "master" },
        { action: "presence", area: "auth", details: { source: "session" } },
      );
    }
    return { email, role: "master", branchId: null, userId: user.id };
  }

  const { data: staff, error: staffError } = await client
    .from("staff_members")
    .select("id, email, role, branch_id, last_seen_at")
    .ilike("email", email)
    .eq("active", true)
    .maybeSingle();
  if (staffError || !staff) return null;
  if (!["owner", "manager", "host", "marketing"].includes(String(staff.role))) return null;

  const lastSeen = staff.last_seen_at ? new Date(String(staff.last_seen_at)).getTime() : 0;
  if (!lastSeen || Date.now() - lastSeen >= 5 * 60 * 1000) {
    const { error: touchError } = await supabaseAdmin
      .from("staff_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", staff.id);
    if (touchError) console.error("[admin-auth] Không thể cập nhật last_seen_at:", touchError.message);
  }

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
  await connection();
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login");
  }
  if (!hasPermission(staff.role, permission)) {
    await logAdminAction(staff, {
      action: "denied",
      area: "authorization",
      targetType: "permission",
      targetId: permission,
      details: { reason: "missing_permission" },
    });
    if (options?.api) throw new AdminAuthError(403, "Bạn không có quyền thực hiện thao tác này.");
    redirect("/admin?error=forbidden");
  }
  await logAdminAction(staff, {
    action: permission,
    area: "admin",
    details: { authorization: "granted" },
  });
  return staff;
}

export async function requireAnyPermission(
  permissions: readonly Permission[],
  options?: { api?: boolean },
) {
  await connection();
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login");
  }
  if (!hasAnyPermission(staff.role, permissions)) {
    await logAdminAction(staff, {
      action: "denied",
      area: "authorization",
      targetType: "permission",
      targetId: permissions.join(","),
      details: { reason: "missing_permission" },
    });
    if (options?.api) throw new AdminAuthError(403, "Bạn không có quyền thực hiện thao tác này.");
    redirect("/admin?error=forbidden");
  }
  await logAdminAction(staff, {
    action: "authorized",
    area: "admin",
    details: { permissions: [...permissions] },
  });
  return staff;
}

export async function requireAdmin(options?: { api?: boolean }) {
  await connection();
  console.log("[admin-auth] requireAdmin: bắt đầu kiểm tra phiên");
  const staff = await getCurrentStaff();
  if (!staff) {
    if (options?.api) throw new AdminAuthError(401, "Bạn chưa đăng nhập hoặc không có tài khoản nhân viên.");
    redirect("/admin/login?error=unauthorized");
  }
  await logAdminAction(staff, {
    action: "authorized",
    area: "admin",
    details: { authorization: "admin" },
  });
  return staff;
}
