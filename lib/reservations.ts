import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export type Reservation = {
  id: string;
  code: string;
  reservationDate: string;
  startTime: string;
  partySize: number;
  branchName: string;
  status: string;
};

export async function getUserReservations(userId: string): Promise<Reservation[]> {
  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("id, code, reservation_date, start_time, party_size, status, branches(name)")
    .eq("user_id", userId)
    .order("reservation_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Không thể đọc đặt bàn của khách:", error.message);
    throw new Error(`Không thể đọc lịch sử đặt bàn: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const branch = row.branches as { name?: string } | null;
    return {
      id: String(row.id),
      code: String(row.code),
      reservationDate: String(row.reservation_date),
      startTime: String(row.start_time),
      partySize: Number(row.party_size),
      branchName: String(branch?.name ?? "Không rõ chi nhánh"),
      status: String(row.status),
    };
  });
}

export const reservationStatusLabels: Record<string, string> = {
  held: "Đang giữ chỗ",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
};
