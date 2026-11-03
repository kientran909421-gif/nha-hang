import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({ id: z.string().uuid().optional(), code: z.string().min(1).optional() }).refine((value) => value.id || value.code, "Thiếu mã đặt bàn.");

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Mã đặt bàn không hợp lệ." }, { status: 400 });
  const user = await getOptionalUser();
  let query = supabaseAdmin.from("reservations").update({ status: "pending" });
  query = parsed.data.id ? query.eq("id", parsed.data.id) : query.eq("code", parsed.data.code!);
  if (user) query = query.or(`user_id.eq.${user.id},user_id.is.null`);
  else query = query.is("user_id", null);
  const { data, error } = await query.select("id, code, status").maybeSingle();
  if (error) {
    console.error("Không thể xác nhận đặt bàn:", error.message);
    return NextResponse.json({ error: `Không thể xác nhận đặt bàn: ${error.message}` }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Không tìm thấy đặt bàn để xác nhận." }, { status: 404 });
  if (user) {
    await supabaseAdmin.from("reservations").update({ user_id: user.id }).eq("id", data.id);
  }
  return NextResponse.json(data);
}
