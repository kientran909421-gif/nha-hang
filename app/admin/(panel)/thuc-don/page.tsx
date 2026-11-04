import { Suspense } from "react";
import { getCurrentStaff } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminForbidden } from "@/components/admin-forbidden";
import { getAdminMenu, getAdminMenuCategories } from "@/lib/content";
import { AdminMenuTable } from "@/components/admin-menu-table";

async function AdminMenuContent() {
  const staff = await getCurrentStaff();
  if (!staff || !hasPermission(staff.role, "menu.edit")) {
    return <AdminForbidden />;
  }
  const [menu, categories] = await Promise.all([
    getAdminMenu(),
    getAdminMenuCategories(),
  ]);

  return (
    <section>
      <p className="text-sm text-muted-foreground">Quản trị</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">Thực đơn</h1>
      <p className="mt-2 text-muted-foreground">
        Quản lý món ăn và trạng thái phục vụ.
      </p>
      <AdminMenuTable items={menu} categories={categories} />
    </section>
  );
}

export default function AdminMenuPage() {
  return <Suspense fallback={<div className="min-h-96" />}><AdminMenuContent /></Suspense>;
}
