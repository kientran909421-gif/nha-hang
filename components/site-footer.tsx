import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import { TrackedPhoneLink } from "@/components/tracked-links";

export function SiteFooter({ site }: { site: SiteSettings }) {
  return (
    <footer className="border-t border-border/70 bg-foreground py-10 text-background">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-heading text-xl font-semibold">{site.name}</p>
          <p className="mt-3 text-sm text-background/70">{site.address}</p>
        </div>
        <div>
          <p className="font-medium">Giờ mở cửa</p>
          <p className="mt-3 text-sm text-background/70">{site.openingHours}</p>
        </div>
        <div>
          <p className="font-medium">Hotline</p>
          <TrackedPhoneLink
            href={site.phoneHref}
            className="mt-3 block text-sm text-background/70 hover:text-background"
          >
            {site.phone}
          </TrackedPhoneLink>
        </div>
        <div>
          <p className="font-medium">Theo dõi chúng tôi</p>
          <div className="mt-3 flex gap-4 text-sm text-background/70">
            <Link href={site.socialLinks.facebook} className="hover:text-background">
              Facebook
            </Link>
            <Link href={site.socialLinks.instagram} className="hover:text-background">
              Instagram
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-7xl border-t border-background/15 px-5 pt-5 text-xs text-background/60 lg:px-8">
        © {site.copyrightYear} {site.name}. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
