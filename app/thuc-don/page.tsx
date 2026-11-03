import { MenuBrowser } from "@/components/menu-browser";
import { getMenu } from "@/lib/content";

export default async function MenuPage() {
  const menu = await getMenu();

  return (
    <main>
      <section className="bg-[#F1E9DE] px-5 py-20 text-center lg:px-8 lg:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
          Tinh hoa từ căn bếp
        </p>
        <h1 className="font-heading text-5xl font-semibold sm:text-6xl">
          Thực đơn
        </h1>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-foreground/75">
          Những món ăn được chuẩn bị từ nguyên liệu tươi ngon, kết hợp hương vị
          thân quen với cách chế biến đầy sáng tạo.
        </p>
      </section>
      <section className="py-16 lg:py-24">
        <MenuBrowser items={menu} />
      </section>
    </main>
  );
}
