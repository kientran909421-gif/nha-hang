"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { signatureDishes, testimonials } from "@/data/sample";

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function Home() {
  const router = useRouter();
  const [guests, setGuests] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ guests, date, time });
    router.push(`/dat-ban?${params.toString()}`);
  }

  return (
    <div>
      <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-visible">
        <Image
          src="/images/hero.jpg"
          alt="Không gian ấm cúng của nhà hàng"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-36 pt-24 text-center text-white lg:px-8">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-white/80">
            Hương vị thân quen, trải nghiệm đáng nhớ
          </p>
          <h1 className="mx-auto max-w-4xl font-heading text-5xl leading-[1.05] font-semibold sm:text-7xl">
            Một bữa ăn ngon bắt đầu từ những điều chân thành
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Từ nguyên liệu tươi mỗi ngày đến căn bếp tận tâm, chúng tôi mang
            đến những bữa ăn ấm áp cho người mình thương.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              render={<Link href="/dat-ban" />}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/85"
            >
              Đặt bàn ngay
            </Button>
            <Button
              render={<Link href="/thuc-don" />}
              variant="outline"
              size="lg"
              className="border-white/60 bg-white/10 text-white hover:bg-white hover:text-foreground"
            >
              Xem thực đơn
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="absolute right-5 bottom-0 left-5 z-20 mx-auto grid max-w-5xl translate-y-1/2 gap-3 rounded-2xl bg-background p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_auto] lg:items-end lg:gap-4 lg:p-5"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Số khách
            <select
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                <option key={number} value={number}>
                  {number} khách
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Ngày
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Giờ
            <input
              required
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button type="submit" size="lg" className="h-11">
            Tìm bàn
          </Button>
        </form>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Từ căn bếp của chúng tôi
            </p>
            <h2 className="font-heading text-4xl font-semibold sm:text-5xl">
              Món signature
            </h2>
          </div>
          <Link
            href="/thuc-don"
            className="hidden text-sm font-medium text-primary hover:underline sm:block"
          >
            Xem tất cả món
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {signatureDishes.map((dish) => (
            <article key={dish.name}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold leading-snug">
                {dish.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-accent">
                {formatPrice(dish.price)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#F1E9DE] px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Đừng bỏ lỡ
          </p>
          <h2 className="font-heading text-4xl font-semibold sm:text-5xl">
            Ưu đãi đang chạy
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                image: "/images/uu-dai-1.jpg",
                title: "Bữa trưa trọn vị",
                description: "Tặng món tráng miệng cho bàn từ hai người.",
              },
              {
                image: "/images/uu-dai-2.jpg",
                title: "Hẹn hò cuối tuần",
                description: "Ưu đãi đặc biệt cho những buổi tối đáng nhớ.",
              },
            ].map((offer) => (
              <article
                key={offer.title}
                className="relative aspect-[16/8] overflow-hidden rounded-2xl"
              >
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="font-heading text-2xl font-semibold">
                    {offer.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/85">{offer.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-8 lg:py-32">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="/images/cau-chuyen.jpg"
            alt="Đầu bếp chuẩn bị món ăn trong căn bếp"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Câu chuyện của chúng tôi
          </p>
          <h2 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Nấu ăn bằng ký ức, phục vụ bằng cả tấm lòng
          </h2>
          <p className="mt-6 leading-8 text-foreground/75">
            Nhà hàng bắt đầu từ căn bếp nhỏ và mong muốn lưu giữ những hương vị
            thân quen của bữa cơm Việt. Mỗi ngày, chúng tôi chọn nguyên liệu
            cẩn thận, nấu vừa đủ và đón tiếp mỗi vị khách như một người bạn.
          </p>
          <Button render={<Link href="/lien-he" />} className="mt-8">
            Tìm hiểu thêm
          </Button>
        </div>
      </section>

      <section className="bg-[#F1E9DE] px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Điều khách nhớ
            </p>
            <h2 className="font-heading text-4xl font-semibold sm:text-5xl">
              Khách hàng nói gì
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-2xl bg-background p-6">
                <div className="text-lg tracking-[0.2em] text-accent" aria-label={`${testimonial.stars} trên 5 sao`}>
                  {"★".repeat(testimonial.stars)}
                  <span className="text-border">{"★".repeat(5 - testimonial.stars)}</span>
                </div>
                <p className="mt-5 leading-7 text-foreground/80">
                  “{testimonial.quote}”
                </p>
                <p className="mt-6 text-sm font-semibold">{testimonial.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-8 lg:py-32">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Ghé thăm chúng tôi
          </p>
          <h2 className="font-heading text-4xl font-semibold sm:text-5xl">
            Địa chỉ &amp; giờ mở cửa
          </h2>
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-sm font-medium text-foreground/60">Địa chỉ</p>
              <p className="mt-1 leading-7">{site.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Giờ mở cửa</p>
              <p className="mt-1 leading-7">{site.openingHours}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Đặt bàn qua hotline</p>
              <a href={site.phoneHref} className="mt-1 block text-lg font-semibold text-primary">
                {site.phone}
              </a>
            </div>
          </div>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-2xl">
          <iframe
            title="Bản đồ vị trí nhà hàng"
            src="https://www.google.com/maps?q=Nguyen+Hue,+District+1,+Ho+Chi+Minh+City&output=embed"
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}
