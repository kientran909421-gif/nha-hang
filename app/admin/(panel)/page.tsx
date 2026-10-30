import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getDashboardData,
  normalizeRange,
  type DashboardData,
  type DashboardRange,
} from "@/lib/admin-dashboard";
import { DashboardCharts } from "@/components/admin-dashboard-charts";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();
  const range = normalizeRange((await searchParams).range);
  const data = await getDashboardData(range);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tổng quan</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Hiệu quả nhà hàng</h1>
        </div>
        <nav className="flex w-fit rounded-xl border border-border bg-background p-1" aria-label="Khoảng thời gian">
          {ranges.map((item) => (
            <Link
              key={item.value}
              href={`/admin?range=${item.value}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${range === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <MetricGrid metrics={data.metrics} />

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <h2 className="font-heading text-2xl font-semibold">Hôm nay</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <SummaryValue label="Số đặt bàn" value={data.today.bookings} />
          <SummaryValue label="Tổng số khách" value={data.today.guests} />
        </div>
        <div className="mt-6 overflow-x-auto">
          {data.today.upcoming.length ? (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Giờ</th>
                  <th className="px-3 py-3 font-medium">Tên</th>
                  <th className="px-3 py-3 font-medium">Số khách</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.today.upcoming.slice(0, 5).map((booking, index) => (
                  <tr key={`${booking.time}-${booking.name}-${index}`} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">{booking.time}</td>
                    <td className="px-3 py-3 font-medium">{booking.name}</td>
                    <td className="px-3 py-3">{booking.guests}</td>
                    <td className="px-3 py-3 text-muted-foreground">{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState />}
        </div>
      </section>

      <DashboardCharts data={data} />

      <div className="grid gap-5 xl:grid-cols-2">
        <DataTable title="Nguồn truy cập" columns={["Nguồn", "Lượt truy cập"]} rows={data.sources.map((row) => [row.source, row.visits])} />
        <DataTable title="Thiết bị" columns={["Thiết bị", "Lượt truy cập"]} rows={data.devices.map((row) => [row.device, row.visits])} />
        <DataTable title="5 trang xem nhiều nhất" columns={["Trang", "Lượt xem"]} rows={data.pages.map((row) => [row.path, row.views])} />
        <DataTable title="Món được xem nhiều nhất" columns={["Món", "Lượt xem"]} rows={data.menuItems.map((row) => [row.item, row.views])} />
        <DataTable
          title="Tương tác nhanh"
          columns={["Sự kiện", "Số lần"]}
          rows={[["Gọi", data.actions.calls], ["Chỉ đường", data.actions.directions]]}
        />
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: DashboardData["metrics"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.key} className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold">
            {metric.value === null ? "—" : `${metric.value}${metric.suffix ?? ""}`}
          </p>
          <Comparison current={metric.value} previous={metric.previous} />
        </article>
      ))}
    </div>
  );
}

function Comparison({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null || previous === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">Chưa có dữ liệu kỳ trước</p>;
  }
  const change = ((current - previous) / previous) * 100;
  return <p className={`mt-2 text-xs ${change >= 0 ? "text-emerald-700" : "text-destructive"}`}>{change >= 0 ? "Tăng" : "Giảm"} {Math.abs(change).toFixed(1)}% so với kỳ trước</p>;
}

function SummaryValue({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value === null ? "—" : value}</p>
    </div>
  );
}

function DataTable({ title, columns, rows }: { title: string; columns: [string, string]; rows: Array<[string, number]> }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {rows.length ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr><th className="px-2 py-2 font-medium">{columns[0]}</th><th className="px-2 py-2 text-right font-medium">{columns[1]}</th></tr>
          </thead>
          <tbody>{rows.map(([label, value]) => <tr key={label} className="border-b border-border last:border-0"><td className="px-2 py-2">{label}</td><td className="px-2 py-2 text-right font-medium">{value}</td></tr>)}</tbody>
        </table>
      ) : <EmptyState />}
    </section>
  );
}

function EmptyState() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>;
}
