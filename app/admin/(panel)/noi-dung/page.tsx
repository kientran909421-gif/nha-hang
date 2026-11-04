import { Suspense } from "react";
import { AdminContentForm } from "@/components/admin-content-form";
import { getSiteSettings } from "@/lib/content";
import { getAdminPromotions, getAdminTestimonials } from "@/lib/content";
import { getCurrentStaff } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/permissions";
import { AdminForbidden } from "@/components/admin-forbidden";

export default function AdminContentPage() {
  return <Suspense fallback={<div className="min-h-96" />}><AdminContentPageContent /></Suspense>;
}

async function AdminContentPageContent() {
  const staff = await getCurrentStaff();
  if (!staff || !hasAnyPermission(staff.role, ["content.edit", "settings.edit", "promotions.edit"])) {
    return <AdminForbidden />;
  }
  const site = await getSiteSettings();
  const promotions = await getAdminPromotions();
  const testimonials = await getAdminTestimonials();

  return (
    <section>
      <p className="text-sm text-muted-foreground">Quản trị</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">
        Nội dung website
      </h1>
      <AdminContentForm site={site} promotions={promotions} testimonials={testimonials} />
    </section>
  );
}
