import { z } from "zod";
import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const reservationSchema = z.object({
  branchId: z.string().uuid("Chi nhánh không hợp lệ."),
  reservationDate: z.string().min(1, "Vui lòng chọn ngày."),
  startTime: z.string().min(1, "Vui lòng chọn giờ."),
  partySize: z.number().int().min(1).max(50),
  customerName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại."),
  email: z.string().trim().email("Email không hợp lệ."),
  note: z.string().trim().optional(),
  tableId: z.string().uuid().optional(),
});

async function createReservation(request: Request, status: "held" | "pending") {
  const parsed = reservationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const user = await getOptionalUser();
  const code = `NH${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabaseAdmin
    .from("reservations")
    .insert({
      branch_id: parsed.data.branchId,
      table_id: parsed.data.tableId ?? null,
      reservation_date: parsed.data.reservationDate,
      start_time: parsed.data.startTime,
      party_size: parsed.data.partySize,
      customer_name: parsed.data.customerName,
      user_id: user?.id ?? null,
      status,
      code,
      hold_expires_at: status === "held" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
    })
    .select("id, code, status")
    .single();
  if (error) {
    console.error("Không thể tạo đặt bàn:", error.message);
    return NextResponse.json({ error: `Không thể tạo đặt bàn: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function POST(request: Request) {
  return createReservation(request, "pending");
}
