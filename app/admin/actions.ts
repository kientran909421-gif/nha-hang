"use server";

import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase/server";

export async function signOutAdmin() {
  const client = await createClientForServer();
  await client.auth.signOut();
  redirect("/admin/login");
}
