"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { isMasterEmail } from "@/lib/admin-email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { canManageRole, type StaffRole } from "@/lib/permissions";
import { logAdminAction } from "@/lib/admin-audit";

const emailSchema = z.string().trim().email("Email không hợp lệ.").transform((value) => value.toLowerCase());
const roleSchema = z.enum(["owner", "manager", "host", "marketing"], {
  message: "Vai trò không hợp lệ.",
});
const idSchema = z.string().uuid("ID nhân viên không hợp lệ.");

type StaffActionResult = { success: boolean; message: string };
type StaffTargetResult =
  | { error: string }
  | { staff: { id: string; email: string; role: string; active: boolean } };

async function getStaffTarget(id: string, actorEmail: string): Promise<StaffTargetResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ID không hợp lệ." };
  const { data, error } = await supabaseAdmin
    .from("staff_members")
    .select("id, email, role, active")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error || !data) return { error: "Không tìm thấy nhân viên." };
  if (data.email.trim().toLowerCase() === actorEmail) return { error: "Không thể thay đổi quyền của chính mình." };
  return {
    staff: {
      id: String(data.id),
      email: String(data.email ?? ""),
      role: String(data.role),
      active: Boolean(data.active),
    },
  };
}

async function ensureOwnerSafety(targetId: string, nextRole: StaffRole, nextActive: boolean) {
  const isRemovingOwner = nextRole !== "owner" || !nextActive;
  if (!isRemovingOwner) return null;
  const { count, error } = await supabaseAdmin
    .from("staff_members")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("active", true)
    .neq("id", targetId);
  if (error) return `Không thể kiểm tra owner đang hoạt động: ${error.message}`;
  if ((count ?? 0) < 1) return "Không thể hạ quyền hoặc tắt owner cuối cùng đang hoạt động.";
  return null;
}

function done(message: string): StaffActionResult {
  revalidatePath("/admin/nhan-vien");
  return { success: true, message };
}

export async function addStaff(email: string, role: string): Promise<StaffActionResult> {
  const actor = await requirePermission("staff.manage");
  const parsedEmail = emailSchema.safeParse(email);
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedEmail.success) return { success: false, message: parsedEmail.error.issues[0]?.message ?? "Email không hợp lệ." };
  if (!parsedRole.success) return { success: false, message: parsedRole.error.issues[0]?.message ?? "Vai trò không hợp lệ." };
  if (!canManageRole(actor.role, parsedRole.data)) {
    await logAdminAction(actor, {
      action: "denied",
      area: "staff",
      targetType: "staff",
      details: { reason: "role_not_lower_than_actor" },
    });
    return { success: false, message: "Bạn chỉ được cấp vai trò thấp hơn vai trò của mình." };
  }
  if (isMasterEmail(parsedEmail.data)) {
    return { success: false, message: "Không thể thêm tài khoản master vào danh sách nhân viên." };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .ilike("email", parsedEmail.data)
    .maybeSingle();
  if (existingError) return { success: false, message: `Không thể kiểm tra nhân viên: ${existingError.message}` };
  if (existing) return { success: false, message: "Email này đã có trong danh sách nhân viên." };

  const { error } = await supabaseAdmin.from("staff_members").insert({
    email: parsedEmail.data,
    role: parsedRole.data,
    active: true,
    invited_by: actor.userId,
  });
  if (error) return { success: false, message: `Không thể thêm nhân viên: ${error.message}` };

  const audit = await logAdminAction(actor, {
    action: "staff_add",
    area: "staff",
    targetType: "staff",
    targetId: parsedEmail.data,
    details: { role: { old: null, new: parsedRole.data } },
  });
  return audit.error
    ? { success: true, message: `Đã thêm nhân viên nhưng không ghi được nhật ký: ${audit.error.message}` }
    : done("Đã thêm nhân viên. Hãy hướng dẫn họ đăng nhập Google bằng email này.");
}

export async function updateStaffRole(id: string, role: string): Promise<StaffActionResult> {
  const actor = await requirePermission("staff.manage");
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { success: false, message: parsedRole.error.issues[0]?.message ?? "Vai trò không hợp lệ." };
  const targetResult = await getStaffTarget(id, actor.email);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const targetRole = targetResult.staff.role as StaffRole;
  if (!canManageRole(actor.role, targetRole) || !canManageRole(actor.role, parsedRole.data)) {
    await logAdminAction(actor, {
      action: "denied",
      area: "staff",
      targetType: "staff",
      targetId: targetResult.staff.id,
      details: { reason: "role_not_lower_than_actor" },
    });
    return { success: false, message: "Bạn chỉ được quản lý vai trò thấp hơn vai trò của mình." };
  }
  const safetyError = await ensureOwnerSafety(targetResult.staff.id, parsedRole.data, targetResult.staff.active);
  if (safetyError) return { success: false, message: safetyError };

  const { error } = await supabaseAdmin.from("staff_members").update({ role: parsedRole.data }).eq("id", targetResult.staff.id);
  if (error) return { success: false, message: `Không thể đổi vai trò: ${error.message}` };
  const audit = await logAdminAction(actor, {
    action: "staff_role_change",
    area: "staff",
    targetType: "staff",
    targetId: targetResult.staff.id,
    details: { role: { old: targetRole, new: parsedRole.data } },
  });
  return audit.error
    ? { success: true, message: `Đã đổi vai trò nhưng không ghi được nhật ký: ${audit.error.message}` }
    : done("Đã đổi vai trò nhân viên.");
}

export async function setStaffActive(id: string, active: boolean): Promise<StaffActionResult> {
  const actor = await requirePermission("staff.manage");
  const targetResult = await getStaffTarget(id, actor.email);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const targetRole = targetResult.staff.role as StaffRole;
  if (!canManageRole(actor.role, targetRole)) {
    await logAdminAction(actor, {
      action: "denied",
      area: "staff",
      targetType: "staff",
      targetId: targetResult.staff.id,
      details: { reason: "role_not_lower_than_actor" },
    });
    return { success: false, message: "Bạn chỉ được tắt vai trò thấp hơn vai trò của mình." };
  }
  const safetyError = await ensureOwnerSafety(targetResult.staff.id, targetRole, active);
  if (safetyError) return { success: false, message: safetyError };

  const { error } = await supabaseAdmin.from("staff_members").update({ active }).eq("id", targetResult.staff.id);
  if (error) return { success: false, message: `Không thể cập nhật trạng thái: ${error.message}` };
  const audit = await logAdminAction(actor, {
    action: "staff_deactivate",
    area: "staff",
    targetType: "staff",
    targetId: targetResult.staff.id,
    details: { active: { old: targetResult.staff.active, new: active } },
  });
  return audit.error
    ? { success: true, message: `Đã cập nhật trạng thái nhưng không ghi được nhật ký: ${audit.error.message}` }
    : done(active ? "Đã bật nhân viên." : "Đã tắt nhân viên.");
}
