import { NextResponse, type NextRequest } from "next/server";
import { createClientForServer } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/dang-nhap?error=1", request.url));
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/dang-nhap?error=1", request.url));
  }

  return NextResponse.redirect(
    new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url),
  );
}
