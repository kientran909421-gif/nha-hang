import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/url";

function allowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";
  console.log("[admin-auth] proxy: bắt đầu", { path });

  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("[admin-auth] proxy: getUser", {
    path,
    email: user?.email ?? null,
    hasError: Boolean(error),
  });

  if (isLogin) {
    console.log("[admin-auth] proxy: cho phép trang login");
    return response;
  }

  if (error || !user) {
    console.log("[admin-auth] proxy: chưa đăng nhập, chuyển tới login");
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/admin/login", request.url)),
    );
  }

  const email = user.email?.trim().toLowerCase();
  if (!email || !allowedAdminEmails().includes(email)) {
    console.log("[admin-auth] proxy: không có quyền", { email: email ?? null });
    await supabase.auth.signOut();
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url)),
    );
  }

  console.log("[admin-auth] proxy: cho phép admin", { email });
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
