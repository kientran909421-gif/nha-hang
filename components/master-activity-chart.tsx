"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  count: { label: "Thao tác", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function MasterActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return data.length ? (
    <ChartContainer config={config} className="min-h-64 w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  ) : <p className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
}
