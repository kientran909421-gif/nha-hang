import { BookingStartTracker } from "@/components/booking-start-tracker";

export default function BookingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20 lg:px-8 lg:py-28">
      <BookingStartTracker />
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        Đặt bàn
      </p>
      <h1 className="mt-3 font-heading text-5xl font-semibold">
        Đặt bàn trực tuyến
      </h1>
      <p className="mt-5 leading-7 text-foreground/75">
        Hệ thống đặt bàn đang được hoàn thiện. Vui lòng gọi hotline để chúng tôi
        hỗ trợ bạn nhanh nhất.
      </p>
    </main>
  );
}
