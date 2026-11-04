"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function signOutAdmin() {
  const staff = await getCurrentStaff();
  if (staff) await logAdminAction(staff, { action: "logout", area: "auth" });
  const client = await createClientForServer();
  await client.auth.signOut();
  redirect("/admin/login");
}

export async function recordAdminLogin() {
  const staff = await getCurrentStaff();
  if (!staff) return { success: false };
  if (staff.role !== "master") {
    const { error } = await supabaseAdmin
      .from("staff_members")
      .update({ last_login_at: new Date().toISOString() })
      .ilike("email", staff.email);
    if (error) {
      console.error("[admin-auth] Không thể cập nhật last_login_at:", error.message);
      return { success: false };
    }
  }
  await logAdminAction(staff, { action: "login", area: "auth" });
  return { success: true };
}

export async function recordAdminLoginFailure(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const { error } = await supabaseAdmin.from("admin_audit_log").insert({
    actor_email: normalized,
    actor_role: "unknown",
    action: "login_failed",
    area: "auth",
    details: {},
  });
  if (error) console.error("[admin-auth] Không thể ghi đăng nhập thất bại:", error.message);
}
