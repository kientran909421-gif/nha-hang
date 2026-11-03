"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SiteSettings } from "@/lib/content";

const navigation = [
  { label: "Thực đơn", href: "/thuc-don" },
  { label: "Không gian", href: "/#khong-gian" },
  { label: "Ưu đãi", href: "/#uu-dai" },
  { label: "Liên hệ", href: "/lien-he" },
];

export function SiteHeader({
  site,
  authMenu,
  mobileAuthMenu,
}: {
  site: SiteSettings;
  authMenu: ReactNode;
  mobileAuthMenu: ReactNode;
}) {
  return (
    <header className="border-b border-border/70 bg-background">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="font-heading text-xl font-semibold text-primary"
          aria-label={site.name}
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          {authMenu}
          <Button nativeButton={false} render={<Link href="/dat-ban" />}>Đặt bàn</Button>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-full border border-border text-xl"
              aria-label="Mở menu"
            >
              <span aria-hidden="true">☰</span>
            </SheetTrigger>
            <SheetContent showCloseButton={false} className="p-6">
              <div className="flex items-center justify-between">
                <SheetTitle>{site.name}</SheetTitle>
                <SheetClose
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-xl"
                  aria-label="Đóng menu"
                >
                  <span aria-hidden="true">×</span>
                </SheetClose>
              </div>
              <nav
                className="mt-10 flex flex-col gap-5"
                aria-label="Điều hướng di động"
              >
                {navigation.map((item) => (
                  <SheetClose key={item.href} render={<Link href={item.href} />}>
                    {item.label}
                  </SheetClose>
                ))}
                <SheetClose
                  render={<Link href="/dat-ban" />}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Đặt bàn
                </SheetClose>
                {mobileAuthMenu}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
