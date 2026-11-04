import { Suspense } from "react";
import { getCurrentStaff } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminForbidden } from "@/components/admin-forbidden";

export default function AdminBookingsPage() {
  return <Suspense fallback={<div className="min-h-96" />}><AdminBookingsContent /></Suspense>;
}

async function AdminBookingsContent() {
  const staff = await getCurrentStaff();
  if (!staff || !hasPermission(staff.role, "dashboard.bookings")) {
    return <AdminForbidden />;
  }

  return (
    <section>
      <p className="text-sm text-muted-foreground">Quản trị</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">Đặt bàn</h1>
      <p className="mt-6 rounded-xl border border-border bg-background p-6 text-muted-foreground">
        Sẽ có sau khi hoàn thiện đặt bàn
      </p>
    </section>
  );
}
