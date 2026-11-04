"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { supabaseAdmin } from "@/lib/supabase/server";

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().min(1).max(500),
});

export type MasterActionResult = { success: boolean; message: string };

export async function updateMaintenance(
  enabled: boolean,
  message: string,
): Promise<MasterActionResult> {
  const actor = await requirePermission("system.manage");
  const parsed = maintenanceSchema.safeParse({ enabled, message });
  if (!parsed.success) return { success: false, message: "Thông tin chế độ bảo trì không hợp lệ." };

  const { error } = await supabaseAdmin
    .from("system_settings")
    .upsert({
      id: 1,
      maintenance_enabled: parsed.data.enabled,
      maintenance_message: parsed.data.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  if (error) return { success: false, message: `Không thể cập nhật hệ thống: ${error.message}` };

  await logAdminAction(actor, {
    action: "system_maintenance",
    area: "system",
    targetType: "system_settings",
    targetId: "1",
    details: {
      maintenance_enabled: { old: null, new: parsed.data.enabled },
      maintenance_message: { old: null, new: parsed.data.message },
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/master");
  return { success: true, message: parsed.data.enabled ? "Đã bật chế độ bảo trì." : "Đã tắt chế độ bảo trì." };
}
