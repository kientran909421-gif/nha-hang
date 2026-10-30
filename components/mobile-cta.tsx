import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import { TrackedPhoneLink } from "@/components/tracked-links";

export function MobileCta({ site }: { site: SiteSettings }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-3 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <Link
        href="/dat-ban"
        className="inline-flex h-11 items-center justify-center rounded-4xl bg-primary text-sm font-medium text-primary-foreground"
      >
        Đặt bàn
      </Link>
      <TrackedPhoneLink
        href={site.phoneHref}
        className="inline-flex h-11 items-center justify-center rounded-4xl border border-primary text-sm font-medium text-primary"
      >
        Gọi
      </TrackedPhoneLink>
    </div>
  );
}
