import { supabaseAdmin } from "@/lib/supabase/server";

export type DashboardRange = "today" | "7d" | "30d";

export type DashboardData = {
  range: DashboardRange;
  periodLabel: string;
  metrics: Array<{
    key: string;
    label: string;
    value: number | null;
    previous: number | null;
    suffix?: string;
  }>;
  today: {
    bookings: number | null;
    guests: number | null;
    upcoming: Array<{ time: string; name: string; guests: number; status: string }>;
  };
  daily: Array<{ date: string; visits: number; bookings: number }>;
  hourly: Array<{ hour: string; bookings: number }>;
  weekday: Array<{ day: string; bookings: number }>;
  sources: Array<{ source: string; visits: number }>;
  devices: Array<{ device: string; visits: number }>;
  pages: Array<{ path: string; views: number }>;
  actions: { calls: number; directions: number };
  menuItems: Array<{ item: string; views: number }>;
};

const emptyData = (range: DashboardRange): DashboardData => ({
  range,
  periodLabel: range === "today" ? "Hôm nay" : range === "7d" ? "7 ngày" : "30 ngày",
  metrics: [
    { key: "visits", label: "Lượt truy cập", value: null, previous: null },
    { key: "booking_start", label: "Bắt đầu đặt bàn", value: null, previous: null },
    { key: "booking_complete", label: "Đặt bàn hoàn tất", value: null, previous: null },
    { key: "conversion", label: "Tỷ lệ chuyển đổi", value: null, previous: null, suffix: "%" },
    { key: "guests", label: "Tổng số khách đã đặt", value: null, previous: null },
    { key: "no_show", label: "Tỷ lệ no-show", value: null, previous: null, suffix: "%" },
    { key: "cancelled", label: "Tỷ lệ hủy", value: null, previous: null, suffix: "%" },
  ],
  today: { bookings: null, guests: null, upcoming: [] },
  daily: [],
  hourly: [],
  weekday: [],
  sources: [],
  devices: [],
  pages: [],
  actions: { calls: 0, directions: 0 },
  menuItems: [],
});

export function normalizeRange(value: string | undefined): DashboardRange {
  return value === "today" || value === "30d" ? value : "7d";
}

export async function getDashboardData(range: DashboardRange) {
  const { data, error } = await supabaseAdmin.rpc("get_admin_dashboard", {
    p_range: range,
    p_timezone: "Asia/Ho_Chi_Minh",
  });

  if (error || !data) {
    if (error) console.error("Không thể đọc dữ liệu tổng quan:", error.message);
    return emptyData(range);
  }

  return {
    ...emptyData(range),
    ...data,
    range,
    periodLabel: emptyData(range).periodLabel,
  } as DashboardData;
}
