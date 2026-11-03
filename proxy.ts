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
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path === "/api/admin" || path.startsWith("/api/admin/");
  const isAdminRoute = isAdminPage || isAdminApi;
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

  if (isLogin || !isAdminRoute) {
    console.log("[admin-auth] proxy: cho phép trang login");
    return response;
  }

  if (error || !user) {
    if (isAdminApi) {
      return copyCookies(
        response,
        NextResponse.json({ error: "Bạn chưa đăng nhập." }, { status: 401 }),
      );
    }
    console.log("[admin-auth] proxy: chưa đăng nhập, chuyển tới login");
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/admin/login", request.url)),
    );
  }

  const email = user.email?.trim().toLowerCase();
  let hasStaffAccess = Boolean(user.email_confirmed_at && email && allowedAdminEmails().includes(email));
  if (!hasStaffAccess && user.email_confirmed_at && email) {
    const { data: staff } = await supabase
      .from("staff_members")
      .select("role")
      .ilike("email", email)
      .eq("active", true)
      .maybeSingle();
    hasStaffAccess = Boolean(staff?.role && ["owner", "manager", "host", "marketing"].includes(String(staff.role)));
  }
  if (!hasStaffAccess) {
    if (isAdminApi) {
      return copyCookies(
        response,
        NextResponse.json({ error: "Bạn không có quyền quản trị." }, { status: 403 }),
      );
    }
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
