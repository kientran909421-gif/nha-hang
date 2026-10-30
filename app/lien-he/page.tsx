import { getSiteSettings } from "@/lib/content";
import {
  TrackedDirectionsLink,
  TrackedPhoneLink,
} from "@/components/tracked-links";

export default async function ContactPage() {
  const site = await getSiteSettings();

  return (
    <main>
      <section className="bg-[#F1E9DE] px-5 py-20 text-center lg:px-8 lg:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
          Chúng tôi luôn sẵn lòng lắng nghe
        </p>
        <h1 className="font-heading text-5xl font-semibold sm:text-6xl">
          Liên hệ
        </h1>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-foreground/75">
          Hãy ghé thăm, gọi điện hoặc theo dõi chúng tôi để cập nhật những câu
          chuyện mới nhất từ căn bếp.
        </p>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
        <div className="space-y-8">
          <div>
            <p className="text-sm font-medium text-foreground/60">Địa chỉ</p>
            <p className="mt-2 text-lg leading-8">{site.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">
              Giờ mở cửa
            </p>
            <p className="mt-2 text-lg leading-8">{site.openingHours}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Hotline</p>
            <TrackedPhoneLink
              href={site.phoneHref}
              className="mt-2 block text-lg font-semibold text-primary"
            >
              {site.phone}
            </TrackedPhoneLink>
            <TrackedDirectionsLink
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Chỉ đường
            </TrackedDirectionsLink>
          </div>
          <div className="flex gap-5">
            <a
              href={site.socialLinks.facebook}
              className="text-sm font-medium text-primary hover:underline"
            >
              Facebook
            </a>
            <a
              href={site.socialLinks.instagram}
              className="text-sm font-medium text-primary hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
        {site.mapEmbedUrl ? (
          <div className="aspect-[4/3] overflow-hidden rounded-2xl">
            <iframe
              title="Bản đồ vị trí nhà hàng"
              src={site.mapEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
