"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { getSupabaseUrl } from "@/lib/supabase/url";
import { recordAdminLogin, recordAdminLoginFailure } from "@/app/admin/actions";

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

function getLoginError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) {
    return "Email chưa được xác nhận.";
  }
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid password") ||
    normalized.includes("invalid email")
  ) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (
    normalized.includes("fetch") ||
    normalized.includes("network") ||
    normalized.includes("failed to fetch")
  ) {
    return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
  return "Đăng nhập không thành công. Vui lòng thử lại.";
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const unauthorized = searchParams.get("error") === "unauthorized";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Thông tin đăng nhập không hợp lệ.");
      return;
    }

    console.log("[admin-auth] login: gửi yêu cầu", { email: parsed.data.email });
    setPending(true);
    try {
      const supabase = createBrowserClient(
        getSupabaseUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      console.log("[admin-auth] login: gọi signInWithPassword", { email: parsed.data.email });
      const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
      if (signInError) {
        await recordAdminLoginFailure(parsed.data.email);
        console.log("[admin-auth] login: Supabase trả lỗi", {
          email: parsed.data.email,
          message: signInError.message,
        });
        setError(getLoginError(signInError.message));
        return;
      }

      await recordAdminLogin();
      console.log("[admin-auth] login: thành công, chuyển tới /admin", {
        email: parsed.data.email,
      });
      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      console.log("[admin-auth] login: exception", {
        email: parsed.data.email,
        message: loginError instanceof Error ? loginError.message : "unknown",
      });
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      console.log("[admin-auth] login: kết thúc", { email: parsed.data.email });
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Quản trị</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">Đăng nhập</h1>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Mật khẩu
            <Input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error || unauthorized ? (
            <p className="text-sm text-destructive" role="alert">
              {error || "Tài khoản không có quyền truy cập"}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </section>
    </main>
  );
}
