import Link from "next/link";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function CustomerLoginPage({ error, next = "/" }: { error: boolean; next?: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <section className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Khách hàng
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">Đăng nhập</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Đăng nhập để xem thông tin tài khoản và các lần đặt bàn của bạn.
        </p>
        <div className="mt-8">
          <GoogleSignInButton next={next} />
        </div>
        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            Đăng nhập không thành công. Vui lòng thử lại.
          </p>
        ) : null}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Bạn vẫn có thể đặt bàn mà không cần đăng nhập{" "}
          <Link href="/dat-ban" className="font-medium text-primary hover:underline">
            Đặt bàn ngay
          </Link>
        </p>
      </section>
    </main>
  );
}
