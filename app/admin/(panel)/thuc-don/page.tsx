import { requireAdmin } from "@/lib/auth";
import { getAdminMenu, getAdminMenuCategories } from "@/lib/content";
import { AdminMenuTable } from "@/components/admin-menu-table";

export default async function AdminMenuPage() {
  await requireAdmin();
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
