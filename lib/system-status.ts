import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getSystemStatus() {
  const { data, error } = await supabaseAdmin
    .from("system_settings")
    .select("maintenance_enabled, maintenance_message, app_version")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[system] Không thể đọc trạng thái hệ thống:", error.message);
    return {
      maintenanceEnabled: false,
      maintenanceMessage: "",
      appVersion: process.env.npm_package_version ?? "0.1.0",
      supabase: false,
      email: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
    };
  }

  return {
    maintenanceEnabled: Boolean(data?.maintenance_enabled),
    maintenanceMessage: String(data?.maintenance_message ?? ""),
    appVersion: String(data?.app_version ?? process.env.npm_package_version ?? "0.1.0"),
    supabase: true,
    email: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
  };
}
