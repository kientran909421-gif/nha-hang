import { HomePage } from "@/components/home-page";
import {
  getMenu,
  getPromotions,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

export default async function Home() {
  const [site, promotions, testimonials, menu] = await Promise.all([
    getSiteSettings(),
    getPromotions(),
    getTestimonials(),
    getMenu(),
  ]);

  return (
    <HomePage
      site={site}
      promotions={promotions}
      testimonials={testimonials}
      signatureDishes={menu
        .filter((item) => item.available && item.tags.includes("ban-chay"))
        .slice(0, 4)}
    />
  );
}
