"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase/server";

async function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
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
    redirect("/admin/login");
  }

  const email = user.email?.trim().toLowerCase();
  if (!email || !(await getAllowedAdminEmails()).includes(email)) {
    console.log("[admin-auth] requireAdmin: không có quyền", { email: email ?? null });
    await client.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  console.log("[admin-auth] requireAdmin: được phép", { email });
  return user;
}
