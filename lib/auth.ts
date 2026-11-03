"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase/server";
import { AdminAuthError } from "@/lib/admin-auth-error";

async function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin() {
  const user = await getOptionalUser();

  if (!user?.email || !user.email_confirmed_at) {
    return false;
  }

  return (await getAllowedAdminEmails()).includes(user.email.trim().toLowerCase());
}

export async function getOptionalUser() {
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  return error ? null : user;
}

export async function requireCustomer() {
  const user = await getOptionalUser();
  if (!user) redirect("/dang-nhap?next=/tai-khoan");
  return user;
}

export async function requireAdmin(options?: { api?: boolean }) {
  console.log("[admin-auth] requireAdmin: bắt đầu kiểm tra phiên");
  const client = await createClientForServer();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  console.log("[admin-auth] requireAdmin: getUser", {
    email: user?.email ?? null,
    hasError: Boolean(error),
  });

  if (error || !user) {
    if (options?.api) {
      throw new AdminAuthError(401, "Bạn chưa đăng nhập.");
    }
    redirect("/admin/login");
  }

  const email = user.email?.trim().toLowerCase();
  if (
    !user.email_confirmed_at ||
    !email ||
    !(await getAllowedAdminEmails()).includes(email)
  ) {
    console.log("[admin-auth] requireAdmin: không có quyền", { email: email ?? null });
    if (options?.api) {
      throw new AdminAuthError(403, "Bạn không có quyền quản trị.");
    }
    await client.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  console.log("[admin-auth] requireAdmin: được phép", { email });
  return user;
}
