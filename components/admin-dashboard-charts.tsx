"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/admin-dashboard";

const lineConfig = {
  visits: { label: "Lượt truy cập", color: "var(--color-primary)" },
  bookings: { label: "Đặt bàn", color: "var(--color-accent)" },
} satisfies ChartConfig;

const barConfig = {
  bookings: { label: "Đặt bàn", color: "var(--color-primary)" },
} satisfies ChartConfig;

function EmptyChart() {
  return <p className="flex aspect-video items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</p>;
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Lượt truy cập và đặt bàn">
        {data.daily.length ? (
          <ChartContainer config={lineConfig}>
            <LineChart data={data.daily} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="visits" stroke="var(--color-visits)" strokeWidth={2} dot={false} />
              <Line dataKey="bookings" stroke="var(--color-bookings)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        ) : <EmptyChart />}
      </ChartCard>
      <ChartCard title="Đặt bàn theo khung giờ">
        {data.hourly.length ? (
          <ChartContainer config={barConfig}>
            <BarChart data={data.hourly} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : <EmptyChart />}
      </ChartCard>
      <ChartCard title="Đặt bàn theo thứ trong tuần">
        {data.weekday.length ? (
          <ChartContainer config={barConfig}>
            <BarChart data={data.weekday} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : <EmptyChart />}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-6">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
