"use server";

import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function deleteAccount() {
  const user = await requireCustomer();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Không thể xóa tài khoản:", error.message);
    throw new Error(`Không thể xóa tài khoản: ${error.message}`);
  }
  redirect("/");
}
