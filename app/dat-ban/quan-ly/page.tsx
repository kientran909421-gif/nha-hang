import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { supabaseAdmin } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ code?: string }> };

async function ManageReservationContent({ searchParams }: Props) {
  const code = (await searchParams).code?.trim();
  if (!code) notFound();
  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("code, reservation_date, start_time, party_size, status, branches(name)")
    .eq("code", code)
    .maybeSingle();
  if (!reservation) notFound();
  const branch = reservation.branches as { name?: string } | null;
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 lg:px-8">
      <p className="text-sm uppercase tracking-[0.2em] text-accent">Quản lý đặt bàn</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold">Mã {reservation.code}</h1>
      <div className="mt-6 rounded-2xl border p-5">
        <p>{reservation.reservation_date} · {reservation.start_time}</p>
        <p className="mt-2 text-muted-foreground">{reservation.party_size} khách · {branch?.name ?? "Không rõ chi nhánh"}</p>
        <p className="mt-2 text-sm text-accent">Trạng thái: {reservation.status}</p>
      </div>
      <Button nativeButton={false} render={<Link href="/tai-khoan" />} variant="outline" className="mt-6">Về tài khoản</Button>
    </main>
  );
}

export default function ManageReservationPage(props: Props) {
  return <Suspense fallback={null}><ManageReservationContent {...props} /></Suspense>;
}
