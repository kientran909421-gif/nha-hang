import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const holdSchema = z.object({
  branchId: z.string().uuid(),
  reservationDate: z.string().min(1),
  startTime: z.string().min(1),
  partySize: z.number().int().min(1).max(50),
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
  note: z.string().trim().optional(),
  tableId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = holdSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Thông tin đặt bàn không hợp lệ." }, { status: 400 });
  const user = await getOptionalUser();
  const code = `NH${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabaseAdmin.from("reservations").insert({
    branch_id: parsed.data.branchId,
    table_id: parsed.data.tableId ?? null,
    reservation_date: parsed.data.reservationDate,
    start_time: parsed.data.startTime,
    party_size: parsed.data.partySize,
    customer_name: parsed.data.customerName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    note: parsed.data.note ?? null,
    user_id: user?.id ?? null,
    status: "held",
    code,
    hold_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }).select("id, code, status").single();
  if (error) {
    console.error("Không thể giữ chỗ:", error.message);
    return NextResponse.json({ error: `Không thể giữ chỗ: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
