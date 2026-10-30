"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl } from "@/lib/supabase/url";

export const supabase = createBrowserClient(
  getSupabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
