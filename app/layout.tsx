import type { Metadata } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MobileCta } from "@/components/mobile-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HeaderAuth } from "@/components/header-auth";
import { Tracker } from "@/components/tracker";
import { getSiteSettings } from "@/lib/content";
import { MaintenanceBanner } from "@/components/maintenance-banner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const isDemoMode = process.env.DEMO_MODE === "true";
  return {
    title: site.seo.title,
    description: site.seo.description,
    ...(isDemoMode ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await getSiteSettings();

  return (
    <html
      lang="vi"
      className={cn(
        "h-full",
        "antialiased",
        playfair.variable,
        beVietnamPro.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col pb-20 md:pb-0">
        <Suspense fallback={null}><MaintenanceBanner /></Suspense>
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        <SiteHeader
          site={site}
          authMenu={
            <Suspense fallback={null}>
              <HeaderAuth />
            </Suspense>
          }
          mobileAuthMenu={
            <Suspense fallback={null}>
              <HeaderAuth mobile />
            </Suspense>
          }
        />
        <main className="flex-1">{children}</main>
        <SiteFooter site={site} />
        <MobileCta site={site} />
      </body>
    </html>
  );
}
