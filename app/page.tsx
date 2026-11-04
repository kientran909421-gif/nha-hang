import { Suspense } from "react";
import { HomePage } from "@/components/home-page";
import {
  getMenu,
  getPromotions,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

async function HomeContent() {
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

export default function Home() {
  return <Suspense fallback={<div className="min-h-screen" />}><HomeContent /></Suspense>;
}
