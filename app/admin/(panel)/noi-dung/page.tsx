import { AdminContentForm } from "@/components/admin-content-form";
import { getSiteSettings } from "@/lib/content";
import { getAdminPromotions, getAdminTestimonials } from "@/lib/content";
import { requireAdmin } from "@/lib/auth";

export default function AdminContentPage() {
  return <AdminContentPageContent />;
}

async function AdminContentPageContent() {
  await requireAdmin();
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
