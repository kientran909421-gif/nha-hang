import { Suspense } from "react";
import { BookingForm } from "@/components/booking-form";
import { BookingStartTracker } from "@/components/booking-start-tracker";
import { getOptionalUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

async function BookingContent() {
  const [user, branches] = await Promise.all([
    getOptionalUser(),
    supabaseAdmin.from("branches").select("id, name").eq("active", true).order("name").limit(1),
  ]);
  const branch = branches.data?.[0];
  if (!branch) throw new Error("Chưa có chi nhánh nhận đặt bàn.");
  const metadata = user?.user_metadata ?? {};
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20 lg:px-8 lg:py-28">
      <BookingStartTracker />
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        Đặt bàn
      </p>
      <h1 className="mt-3 font-heading text-5xl font-semibold">
        Đặt bàn trực tuyến
      </h1>
      <p className="mt-5 leading-7 text-foreground/75">Chọn thời gian và để chúng tôi chuẩn bị một chỗ ngồi thật thoải mái cho bạn.</p>
      <BookingForm branchId={branch.id} branchName={branch.name} initialName={String(metadata.full_name ?? metadata.name ?? "")} initialEmail={user?.email ?? ""} />
    </main>
  );
}

export default function BookingPage() {
  return <Suspense fallback={null}><BookingContent /></Suspense>;
}
