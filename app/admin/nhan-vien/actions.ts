"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/permissions";

const emailSchema = z.string().trim().email("Email không hợp lệ.").transform((value) => value.toLowerCase());
const roleSchema = z.enum(["owner", "manager", "host", "marketing"], {
  message: "Vai trò không hợp lệ.",
});
const idSchema = z.string().uuid("ID nhân viên không hợp lệ.");

type StaffActionResult = { success: boolean; message: string };
type StaffTargetResult =
  | { error: string }
  | { staff: { id: string; email: string; role: string; active: boolean } };

async function writeStaffAudit(
  actorEmail: string,
  action: "staff_add" | "staff_role_change" | "staff_deactivate",
  targetEmail: string,
  details: string,
) {
  return supabaseAdmin.from("admin_audit_log").insert({
    actor_email: actorEmail,
    action,
    target_email: targetEmail,
    details,
  });
}

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

  const audit = await writeStaffAudit(actor.email || "Không có email", "staff_add", parsedEmail.data, `Thêm vai trò ${parsedRole.data}`);
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
  const safetyError = await ensureOwnerSafety(targetResult.staff.id, parsedRole.data, targetResult.staff.active);
  if (safetyError) return { success: false, message: safetyError };

  const { error } = await supabaseAdmin.from("staff_members").update({ role: parsedRole.data }).eq("id", targetResult.staff.id);
  if (error) return { success: false, message: `Không thể đổi vai trò: ${error.message}` };
  const audit = await writeStaffAudit(actor.email || "Không có email", "staff_role_change", targetResult.staff.email || "Không có email", `Đổi vai trò thành ${parsedRole.data}`);
  return audit.error
    ? { success: true, message: `Đã đổi vai trò nhưng không ghi được nhật ký: ${audit.error.message}` }
    : done("Đã đổi vai trò nhân viên.");
}

export async function setStaffActive(id: string, active: boolean): Promise<StaffActionResult> {
  const actor = await requirePermission("staff.manage");
  const targetResult = await getStaffTarget(id, actor.email);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const safetyError = await ensureOwnerSafety(targetResult.staff.id, targetResult.staff.role as StaffRole, active);
  if (safetyError) return { success: false, message: safetyError };

  const { error } = await supabaseAdmin.from("staff_members").update({ active }).eq("id", targetResult.staff.id);
  if (error) return { success: false, message: `Không thể cập nhật trạng thái: ${error.message}` };
  const audit = await writeStaffAudit(actor.email || "Không có email", "staff_deactivate", targetResult.staff.email || "Không có email", active ? "Bật nhân viên" : "Tắt nhân viên");
  return audit.error
    ? { success: true, message: `Đã cập nhật trạng thái nhưng không ghi được nhật ký: ${audit.error.message}` }
    : done(active ? "Đã bật nhân viên." : "Đã tắt nhân viên.");
}
