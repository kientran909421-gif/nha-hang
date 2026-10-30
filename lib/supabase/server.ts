import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseUrl } from "@/lib/supabase/url";

export async function createClientForServer() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            console.warn("[admin-auth] Không thể ghi cookie trong Server Component");
          }
        },
      },
    },
  );
}

export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);
