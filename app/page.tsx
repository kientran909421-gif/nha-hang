import { HomePage } from "@/components/home-page";
import { getPromotions, getSiteSettings, getTestimonials } from "@/lib/content";

export default async function Home() {
  const [site, promotions, testimonials] = await Promise.all([
    getSiteSettings(),
    getPromotions(),
    getTestimonials(),
  ]);

  return (
    <HomePage
      site={site}
      promotions={promotions}
      testimonials={testimonials}
    />
  );
}
