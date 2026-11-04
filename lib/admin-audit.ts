"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/permissions";

type AdminActionLog = {
  action: string;
  area: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
};

export async function logAdminAction(
  actor: { email: string; role: StaffRole },
  entry: AdminActionLog,
) {
  return supabaseAdmin.from("admin_audit_log").insert({
    actor_email: actor.email,
    actor_role: actor.role,
    action: entry.action,
    area: entry.area,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    details: JSON.stringify(entry.details ?? {}),
  });
}
