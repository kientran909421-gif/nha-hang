import { Suspense } from "react";
import { HomePage } from "@/components/home-page";
import {
  getSignatureDishes,
  getPromotions,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

async function HomeContent() {
  const site = await getSiteSettings();
  const [promotions, testimonials, signatureDishes] = await Promise.all([
    getPromotions(),
    getTestimonials(),
    getSignatureDishes(site.signatureCount),
  ]);

  return (
    <HomePage
      site={site}
      promotions={promotions}
      testimonials={testimonials}
      signatureDishes={signatureDishes}
    />
  );
}

export default function Home() {
  return <Suspense fallback={<div className="min-h-screen" />}><HomeContent /></Suspense>;
}
