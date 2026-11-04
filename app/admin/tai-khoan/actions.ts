"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { isMasterEmail } from "@/lib/admin-email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin-audit";

const userIdSchema = z.string().uuid("ID tài khoản không hợp lệ.");
const reasonSchema = z.string().trim().max(500, "Lý do không được quá 500 ký tự.").optional();

type AccountActionResult = {
  success: boolean;
  message: string;
  warning?: boolean;
};

type TargetUserResult =
  | { error: string }
  | { user: NonNullable<Awaited<ReturnType<typeof supabaseAdmin.auth.admin.getUserById>>["data"]["user"]> };

async function getTargetUser(userId: string, actorId: string): Promise<TargetUserResult> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ID không hợp lệ." };

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(parsed.data);
  if (error || !data.user) return { error: "Không tìm thấy tài khoản." };

  const target = data.user;
  const targetEmail = target.email?.trim().toLowerCase();
  if (target.id === actorId) return { error: "Không thể thao tác trên chính tài khoản đang đăng nhập." };
  if (targetEmail && isMasterEmail(targetEmail)) return { error: "Không thể thao tác trên tài khoản quản trị." };

  return { user: target };
}

async function writeAudit(
  actor: { email: string; role: "master" | "owner" | "manager" | "host" | "marketing" },
  action: "ban_user" | "unban_user" | "delete_user",
  targetUserId: string,
  _targetEmail: string,
  _details: string,
) {
  const { error } = await logAdminAction(actor, {
    action,
    area: "accounts",
    targetType: "user",
    targetId: targetUserId,
    details: { operation: action },
  });
  return error;
}

function finish(message: string) {
  revalidatePath("/admin/tai-khoan");
  return { success: true, message };
}

export async function banUser(userId: string, reason?: string): Promise<AccountActionResult> {
  const actor = await requirePermission("customers.ban");
  const parsedReason = reasonSchema.safeParse(reason);
  if (!parsedReason.success) return { success: false, message: parsedReason.error.issues[0]?.message ?? "Lý do không hợp lệ." };
  const targetResult = await getTargetUser(userId, actor.userId);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const targetEmail = targetResult.user.email ?? "Không có email";

  const { error } = await supabaseAdmin.auth.admin.updateUserById(targetResult.user.id, { ban_duration: "876000h" });
  if (error) return { success: false, message: `Không thể khóa tài khoản: ${error.message}` };

  const auditDetails = parsedReason.data || "Không nêu lý do";
  const auditError = await writeAudit(actor, "ban_user", targetResult.user.id, targetEmail, auditDetails);
  revalidatePath("/admin/tai-khoan");
  return auditError
    ? { success: true, warning: true, message: `Đã khóa tài khoản nhưng không ghi được nhật ký: ${auditError.message}` }
    : finish("Đã khóa tài khoản.");
}

export async function unbanUser(userId: string): Promise<AccountActionResult> {
  const actor = await requirePermission("customers.ban");
  const targetResult = await getTargetUser(userId, actor.userId);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const targetEmail = targetResult.user.email ?? "Không có email";

  const { error } = await supabaseAdmin.auth.admin.updateUserById(targetResult.user.id, { ban_duration: "none" });
  if (error) return { success: false, message: `Không thể mở khóa tài khoản: ${error.message}` };

  const auditError = await writeAudit(actor, "unban_user", targetResult.user.id, targetEmail, "Mở khóa tài khoản");
  revalidatePath("/admin/tai-khoan");
  return auditError
    ? { success: true, warning: true, message: `Đã mở khóa tài khoản nhưng không ghi được nhật ký: ${auditError.message}` }
    : finish("Đã mở khóa tài khoản.");
}

export async function deleteUser(userId: string): Promise<AccountActionResult> {
  const actor = await requirePermission("customers.delete");
  const targetResult = await getTargetUser(userId, actor.userId);
  if ("error" in targetResult) return { success: false, message: targetResult.error };
  const targetEmail = targetResult.user.email ?? "Không có email";

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetResult.user.id);
  if (error) return { success: false, message: `Không thể xóa tài khoản: ${error.message}` };

  const auditError = await writeAudit(actor, "delete_user", targetResult.user.id, targetEmail, "Xóa tài khoản");
  revalidatePath("/admin/tai-khoan");
  return auditError
    ? { success: true, warning: true, message: `Đã xóa tài khoản nhưng không ghi được nhật ký: ${auditError.message}` }
    : finish("Đã xóa tài khoản.");
}
