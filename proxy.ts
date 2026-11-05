import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/url";
import { isMasterEmail } from "@/lib/admin-email";

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
  const isProtectedRoute =
    isAdminPage ||
    isAdminApi ||
    path === "/tai-khoan" ||
    path === "/dang-nhap" ||
    path === "/auth" ||
    path.startsWith("/auth/");
  const isStaticAsset =
    path === "/api/track" ||
    path.startsWith("/_next/") ||
    path.startsWith("/images/") ||
    path === "/favicon.ico" ||
    /\.(?:jpg|jpeg|png|webp|svg|ico|css|js|txt|xml)$/i.test(path);
  if (!isProtectedRoute || isStaticAsset) {
    return NextResponse.next({ request });
  }
  const isAdminRoute = isAdminPage || isAdminApi;
  if (process.env.NODE_ENV === "development") {
  }

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
  if (process.env.NODE_ENV === "development") {
  }

  if (isLogin || !isAdminRoute) {
    return response;
  }

  if (error || !user) {
    if (isAdminApi) {
      return copyCookies(
        response,
        NextResponse.json({ error: "Bạn chưa đăng nhập." }, { status: 401 }),
      );
    }
    if (process.env.NODE_ENV === "development") {
    }
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/admin/login", request.url)),
    );
  }

  const email = user.email?.trim().toLowerCase();
  let hasStaffAccess = Boolean(user.email_confirmed_at && email && isMasterEmail(email));
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
    if (process.env.NODE_ENV === "development") {
    }
    await supabase.auth.signOut();
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url)),
    );
  }

  if (process.env.NODE_ENV === "development") {
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
