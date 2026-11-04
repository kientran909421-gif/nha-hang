"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOutAdmin } from "@/app/admin/actions";
import { hasAnyPermission, type Permission, type StaffRole } from "@/lib/permissions";

const navigation: Array<{ label: string; href: string; permissions: Permission[] }> = [
  { label: "Tổng quan", href: "/admin", permissions: ["dashboard.bookings", "dashboard.traffic"] },
  { label: "Nội dung website", href: "/admin/noi-dung", permissions: ["content.edit", "settings.edit", "promotions.edit"] },
  { label: "Thực đơn", href: "/admin/thuc-don", permissions: ["menu.availability", "menu.edit"] },
  { label: "Đặt bàn", href: "/admin/dat-ban", permissions: ["dashboard.bookings", "bookings.manage"] },
  { label: "Tài khoản", href: "/admin/tai-khoan", permissions: ["customers.view", "audit.view"] },
  { label: "Nhân viên", href: "/admin/nhan-vien", permissions: ["staff.manage"] },
  { label: "Master", href: "/admin/master", permissions: ["activity.viewAll", "system.manage"] },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function Navigation({ onNavigate, role }: { onNavigate?: () => void; role: StaffRole }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1" aria-label="Điều hướng quản trị">
      {navigation.filter((item) => hasAnyPermission(role, item.permissions)).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
            isActive(pathname, item.href) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminSidebar({ email, role }: { email: string; role: StaffRole }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background p-5 md:block">
        <div className="mb-8">
          <p className="font-heading text-xl font-semibold text-primary">
            Quản trị
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Navigation role={role} />
        <Link
          href="/"
          className="mt-4 block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Xem website
        </Link>
        <form action={signOutAdmin} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Đăng xuất
          </button>
        </form>
      </aside>

      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
        <div>
          <p className="font-heading text-lg font-semibold text-primary">Quản trị</p>
          <p className="max-w-[13rem] truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Sheet>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-xl"
            aria-label="Mở menu quản trị"
          >
            <span aria-hidden="true">☰</span>
          </SheetTrigger>
          <SheetContent showCloseButton className="p-6">
            <SheetTitle>Quản trị</SheetTitle>
            <div className="mt-8">
              <Navigation role={role} />
              <Link
                href="/"
                className="mt-4 block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Xem website
              </Link>
              <form action={signOutAdmin} className="mt-8">
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
