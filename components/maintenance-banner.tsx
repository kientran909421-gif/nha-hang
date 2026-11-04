import "server-only";

import { connection } from "next/server";
import { getSystemStatus } from "@/lib/system-status";

export async function MaintenanceBanner() {
  await connection();
  const system = await getSystemStatus();
  if (!system.maintenanceEnabled) return null;
  return <div className="bg-accent px-4 py-2 text-center text-sm text-accent-foreground">{system.maintenanceMessage}</div>;
}
