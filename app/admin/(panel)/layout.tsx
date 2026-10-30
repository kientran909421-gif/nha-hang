import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { requireAdmin } from "@/lib/auth";

export default function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen" />}>
        <AdminAuthenticatedContent>{children}</AdminAuthenticatedContent>
      </Suspense>
      <Toaster />
    </>
  );
}

async function AdminAuthenticatedContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const user = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen max-w-[90rem]">
      <AdminSidebar email={user.email ?? "Tài khoản quản trị"} />
      <div className="min-w-0 flex-1">
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
