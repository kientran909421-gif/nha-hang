"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/tracking";

export function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin") || lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;
    track("page_view", {
      path: pathname,
      utmSource: searchParams.get("utm_source") ?? undefined,
    });
  }, [pathname, searchParams]);

  return null;
}
