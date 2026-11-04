import "server-only";

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminForbidden } from "@/components/admin-forbidden";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentStaff } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";

const formatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

function formatTime(value: string | null) {
  return value ? formatter.format(new Date(value)) : "Chưa có";
}

async function EmployeeDetail({ id }: { id: string }) {
  await connection();
  const actor = await getCurrentStaff();
  if (!actor || !hasAnyPermission(actor.role, ["activity.viewAll", "system.manage"])) return <AdminForbidden />;

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("staff_members")
    .select("id, email, role, active, last_login_at, last_seen_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (employeeError) throw new Error(`Không thể đọc nhân viên: ${employeeError.message}`);
  if (!employee) return <AdminForbidden />;

  const [{ data: activity, error: activityError }, processed, arrived, noShow, cancelled, contentEdits, promotionEdits] = await Promise.all([
    supabaseAdmin.from("admin_audit_log").select("id, action, area, target_type, target_id, created_at, details").eq("actor_email", employee.email).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).in("action", ["booking_processed", "reservation_processed", "booking_confirmed"]),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).in("action", ["arrived", "reservation_arrived"]),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).in("action", ["no_show", "reservation_no_show"]),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).in("action", ["cancelled", "booking_cancelled", "reservation_cancelled"]),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).in("area", ["content", "admin-content", "noi-dung"]),
    supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("actor_email", employee.email).eq("area", "promotions"),
  ]);
  if (activityError) throw new Error(`Không thể đọc hoạt động nhân viên: ${activityError.message}`);

  return <section className="space-y-6">
    <div><Button variant="link" render={<Link href="/admin/master?tab=accounts" />}>← Tài khoản</Button><p className="mt-4 text-sm text-muted-foreground">Chi tiết nhân viên</p><h1 className="mt-2 break-all font-heading text-4xl font-semibold">{employee.email}</h1><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{employee.role}</Badge><Badge variant={employee.active ? "secondary" : "destructive"}>{employee.active ? "Đang hoạt động" : "Đã tắt"}</Badge></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader><CardTitle>Đăng nhập gần nhất</CardTitle></CardHeader><CardContent>{formatTime(employee.last_login_at ? String(employee.last_login_at) : null)}</CardContent></Card><Card><CardHeader><CardTitle>Hoạt động gần nhất</CardTitle></CardHeader><CardContent>{formatTime(employee.last_seen_at ? String(employee.last_seen_at) : null)}</CardContent></Card><Card><CardHeader><CardTitle>Ngày tạo</CardTitle></CardHeader><CardContent>{formatTime(employee.created_at ? String(employee.created_at) : null)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Chỉ số theo vai trò</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-4">{employee.role === "host" ? [["Đặt bàn xử lý", processed.count ?? 0], ["Đã đến", arrived.count ?? 0], ["No-show", noShow.count ?? 0], ["Đã hủy", cancelled.count ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>) : null}{employee.role === "marketing" ? [["Sửa nội dung", contentEdits.count ?? 0], ["Sửa ưu đãi", promotionEdits.count ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>) : null}{employee.role !== "host" && employee.role !== "marketing" ? <p className="text-sm text-muted-foreground">Chưa có chỉ số riêng cho vai trò này.</p> : null}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>50 thao tác gần nhất</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Thời gian</th><th className="p-3">Khu vực</th><th className="p-3">Thao tác</th><th className="p-3">Đối tượng</th></tr></thead><tbody>{(activity ?? []).map((row) => <tr key={String(row.id)} className="border-b"><td className="p-3 whitespace-nowrap">{formatTime(String(row.created_at))}</td><td className="p-3">{row.area}</td><td className="p-3">{row.action}</td><td className="p-3">{row.target_type ?? "-"}{row.target_id ? `: ${row.target_id}` : ""}</td></tr>)}</tbody></table></div></CardContent></Card>
  </section>;
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="min-h-96" />}><EmployeeDetailAsync params={params} /></Suspense>;
}

async function EmployeeDetailAsync({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetail id={id} />;
}
