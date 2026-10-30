import { supabase } from "@/lib/supabase/server";

export async function GET() {
  const { count, error } = await supabase
    .from("tables")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, tables: count ?? 0 });
}
