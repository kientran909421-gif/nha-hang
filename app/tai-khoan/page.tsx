import Link from "next/link";
import { Suspense } from "react";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth";
import { getUserReservations, reservationStatusLabels } from "@/lib/reservations";

function isUpcoming(date: string, time: string) {
  return new Date(`${date}T${time}`).getTime() >= Date.now();
}

async function AccountContent() {
  const user = await requireCustomer();
  const reservations = await getUserReservations(user.id);
  const metadata = user.user_metadata ?? {};
  const avatar = String(metadata.avatar_url ?? metadata.picture ?? "");
  const name = String(metadata.full_name ?? metadata.name ?? user.email ?? "Khách hàng");
  const upcoming = reservations.filter((item) => isUpcoming(item.reservationDate, item.startTime));
  const past = reservations.filter((item) => !isUpcoming(item.reservationDate, item.startTime));

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
      <section className="flex items-center gap-4 rounded-2xl border p-5">
        {avatar ? <img src={avatar} alt="" width={64} height={64} className="size-16 rounded-full object-cover" /> : <div className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">{name.slice(0, 1).toUpperCase()}</div>}
        <div>
          <h1 className="font-heading text-3xl font-semibold">{name}</h1>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
        </div>
      </section>

      <section id="reservations" className="mt-10">
        <h2 className="font-heading text-2xl font-semibold">Đặt bàn của tôi</h2>
        {reservations.length === 0 ? (
          <div className="mt-4 rounded-2xl border p-6 text-center">
            <p className="text-muted-foreground">Bạn chưa có đặt bàn nào</p>
            <Button nativeButton={false} render={<Link href="/dat-ban" />} className="mt-4">Đặt bàn</Button>
          </div>
        ) : (
          <>
            <ReservationGroup title="Sắp tới" items={upcoming} />
            <ReservationGroup title="Đã qua" items={past} />
          </>
        )}
      </section>

      <section className="mt-10 border-t pt-8">
        <h2 className="font-heading text-2xl font-semibold">Xóa tài khoản</h2>
        <p className="mt-2 text-sm text-muted-foreground">Các đặt bàn sẽ không còn gắn với tài khoản này.</p>
        <DeleteAccountButton />
      </section>
    </main>
  );
}

function ReservationGroup({ title, items }: { title: string; items: Awaited<ReturnType<typeof getUserReservations>> }) {
  return (
    <div className="mt-6">
      <h3 className="font-medium">{title}</h3>
      {items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Chưa có đặt bàn.</p> : (
        <div className="mt-3 grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">{item.reservationDate} · {item.startTime}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.partySize} khách · {item.branchName} · Mã {item.code}</p>
                </div>
                <span className="text-sm text-accent">{reservationStatusLabels[item.status] ?? item.status}</span>
              </div>
              <Button nativeButton={false} render={<Link href={`/dat-ban/quan-ly?code=${encodeURIComponent(item.code)}`} />} variant="outline" size="sm" className="mt-3">Quản lý</Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return <Suspense fallback={null}><AccountContent /></Suspense>;
}
