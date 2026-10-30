import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";

const eventSchema = z.object({
  name: z.enum([
    "page_view",
    "booking_start",
    "booking_complete",
    "call_click",
    "directions_click",
    "menu_item_view",
  ]),
  path: z.string().trim().min(1).max(500),
  utm_source: z.string().trim().max(100).optional().default(""),
  session_id: z.string().trim().min(16).max(128),
});

const requestTimes = new Map<string, number[]>();
const maxEventsPerMinute = 30;

function isBot(userAgent: string) {
  return /bot|crawler|spider/i.test(userAgent);
}

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

function isRateLimited(sessionId: string) {
  const now = Date.now();
  const recent = (requestTimes.get(sessionId) ?? []).filter(
    (timestamp) => now - timestamp < 60_000,
  );
  if (recent.length >= maxEventsPerMinute) {
    requestTimes.set(sessionId, recent);
    return true;
  }
  recent.push(now);
  requestTimes.set(sessionId, recent);
  return false;
}

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const referrer = request.headers.get("referer") ?? "";
  if (/\/admin(?:\/|$)/.test(referrer)) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (isAdminPath(parsed.data.path)) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (isRateLimited(parsed.data.session_id)) {
    return NextResponse.json({ ok: false, error: "Quá nhiều yêu cầu." }, { status: 429 });
  }

  const device = /mobile|android|iphone|ipad/i.test(userAgent)
    ? "mobile"
    : "desktop";
  const { error } = await supabaseAdmin.from("events").insert({
    name: parsed.data.name,
    path: parsed.data.path,
    utm_source: parsed.data.utm_source,
    session_id: parsed.data.session_id,
    device,
    referrer,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Không thể ghi nhận sự kiện." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
