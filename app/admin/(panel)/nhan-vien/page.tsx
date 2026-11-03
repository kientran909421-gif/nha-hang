import "server-only";

import { Suspense } from "react";
import { AdminForbidden } from "@/components/admin-forbidden";
import { AdminStaffTable, type AdminStaff } from "@/components/admin-staff-table";
import { getCurrentStaff } from "@/lib/auth";
import { hasPermission, type StaffRole } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";

async function StaffContent() {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff || !hasPermission(currentStaff.role, "staff.manage")) return <AdminForbidden />;

  const [{ data: staffRows, error: staffError }, { data: authUsers, error: authError }, { data: branches, error: branchesError }] = await Promise.all([
    supabaseAdmin.from("staff_members").select("id, email, role, branch_id, active, user_id, created_at").order("created_at", { ascending: true }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin.from("branches").select("id, name"),
  ]);
  if (staffError) throw new Error(`Không thể đọc danh sách nhân viên: ${staffError.message}`);
  if (authError) throw new Error(`Không thể đọc phiên đăng nhập: ${authError.message}`);
  if (branchesError) throw new Error(`Không thể đọc chi nhánh: ${branchesError.message}`);

  const authById = new Map(authUsers.users.map((user) => [user.id, user]));
  const branchNames = new Map((branches ?? []).map((branch) => [String(branch.id), String(branch.name)]));
  const staff = (staffRows ?? []).map<AdminStaff>((row) => {
    const user = row.user_id ? authById.get(String(row.user_id)) : undefined;
    return {
      id: String(row.id),
      email: String(row.email),
      role: String(row.role) as StaffRole,
      branchName: row.branch_id ? branchNames.get(String(row.branch_id)) ?? "Không rõ" : "Tất cả chi nhánh",
      active: Boolean(row.active),
      lastSignInAt: user?.last_sign_in_at ?? null,
    };
  });

  return <AdminStaffTable staff={staff} />;
}

export default function AdminStaffPage() {
  return <Suspense fallback={<div className="min-h-96" />}><StaffContent /></Suspense>;
}
