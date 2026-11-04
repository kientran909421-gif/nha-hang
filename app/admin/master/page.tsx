import "server-only";

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminForbidden } from "@/components/admin-forbidden";
import { MasterAccountsTable, type MasterAccount } from "@/components/master-accounts-table";
import { MasterActivityChart } from "@/components/master-activity-chart";
import { MasterSystemPanel } from "@/components/master-system-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentStaff, type CurrentStaff } from "@/lib/auth";
import { getSystemStatus } from "@/lib/system-status";
import { hasAnyPermission } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";

type SearchParams = Promise<{
  tab?: string;
  actor?: string;
  area?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatTime(value: string | null) {
  return value ? timeFormatter.format(new Date(value)) : "Chưa có";
}

function dayStart(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function countAudit(filters: { from: Date; actor?: string; action?: string; area?: string }) {
  let query = supabaseAdmin
    .from("admin_audit_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", filters.from.toISOString());
  if (filters.actor) query = query.eq("actor_email", filters.actor);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.area) query = query.eq("area", filters.area);
  const { count, error } = await query;
  if (error) throw new Error(`Không thể đếm nhật ký: ${error.message}`);
  return count ?? 0;
}

async function getAccounts() {
  const { data, error } = await supabaseAdmin
    .from("staff_members")
    .select("id, email, role, active, last_login_at, last_seen_at")
    .in("role", ["owner", "manager", "host", "marketing"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Không thể đọc tài khoản nhân viên: ${error.message}`);

  const accounts = await Promise.all((data ?? []).map(async (row) => {
    const [actions7d, actions30d] = await Promise.all([
      countAudit({ from: dayStart(7), actor: String(row.email) }),
      countAudit({ from: dayStart(30), actor: String(row.email) }),
    ]);
    return {
      id: String(row.id),
      email: String(row.email),
      role: String(row.role) as MasterAccount["role"],
      active: Boolean(row.active),
      lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
      lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
      actions7d,
      actions30d,
    } satisfies MasterAccount;
  }));
  return accounts;
}

async function getActivity(search: Awaited<SearchParams>) {
  const page = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const from = search.from ? new Date(`${search.from}T00:00:00`) : dayStart(30);
  const to = search.to ? new Date(`${search.to}T23:59:59.999`) : new Date();
  let query = supabaseAdmin
    .from("admin_audit_log")
    .select("id, actor_email, actor_role, action, area, target_type, target_id, details, created_at", { count: "exact" })
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })
    .range((page - 1) * 50, page * 50 - 1);
  if (search.actor) query = query.eq("actor_email", search.actor);
  if (search.area) query = query.eq("area", search.area);
  if (search.action) query = query.eq("action", search.action);
  const { data, count, error } = await query;
  if (error) throw new Error(`Không thể đọc nhật ký hoạt động: ${error.message}`);
  return { rows: data ?? [], count: count ?? 0, page, from: search.from ?? "", to: search.to ?? "" };
}

async function getOverview(accounts: MasterAccount[]) {
  const today = dayStart(0);
  const sevenDays = dayStart(7);
  const [active, loggedInToday, denied7d, failed7d, daily, actorCounts, areaCounts] = await Promise.all([
    supabaseAdmin.from("staff_members").select("id", { count: "exact", head: true }).in("role", ["owner", "manager", "host", "marketing"]).eq("active", true),
    countAudit({ from: today, action: "login" }),
    countAudit({ from: sevenDays, action: "denied" }),
    countAudit({ from: sevenDays, action: "login_failed" }),
    Promise.all(Array.from({ length: 7 }, async (_, index) => {
      const start = dayStart(6 - index);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { count, error } = await supabaseAdmin.from("admin_audit_log").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      if (error) throw new Error(`Không thể tổng hợp hoạt động: ${error.message}`);
      return { date: start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), count: count ?? 0 };
    })),
    Promise.all(accounts.map(async (account) => ({ email: account.email, count: await countAudit({ from: sevenDays, actor: account.email }) }))),
    Promise.all(["auth", "authorization", "accounts", "staff", "content", "menu", "bookings", "system", "admin"].map(async (area) => ({ area, count: await countAudit({ from: sevenDays, area }) }))),
  ]);
  if (active.error) throw new Error(`Không thể đếm tài khoản hoạt động: ${active.error.message}`);
  return {
    activeAccounts: active.count ?? 0,
    loggedInToday,
    denied7d,
    failed7d,
    daily,
    actorCounts: actorCounts.sort((a, b) => b.count - a.count).slice(0, 8),
    areaCounts: areaCounts.sort((a, b) => b.count - a.count),
  };
}

async function MasterContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const staff = await getCurrentStaff();
  if (!staff || !hasAnyPermission(staff.role, ["activity.viewAll", "system.manage"])) return <AdminForbidden />;

  const search = await searchParams;
  const tab = search.tab ?? "accounts";
  const accounts = await getAccounts();
  const overview = tab === "overview" ? await getOverview(accounts) : null;
  const activity = tab === "activity" ? await getActivity(search) : null;
  const system = tab === "system" ? await getSystemStatus() : null;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Quản trị cấp cao</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold">Master</h1>
        <p className="mt-3 text-muted-foreground">Quản lý tài khoản, hoạt động và trạng thái hệ thống.</p>
      </header>
      <nav className="flex max-w-full gap-2 overflow-x-auto rounded-xl bg-muted p-1">
        {[
          ["accounts", "Tài khoản"], ["activity", "Hoạt động"], ["overview", "Tổng quan hoạt động"], ["system", "Hệ thống"],
        ].map(([value, label]) => <Link key={value} href={`/admin/master?tab=${value}`} className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${tab === value ? "bg-background text-foreground" : "text-muted-foreground"}`}>{label}</Link>)}
      </nav>
      {tab === "accounts" ? <MasterAccountsTable accounts={accounts} /> : null}
      {tab === "activity" && activity ? <ActivityPanel activity={activity} accounts={accounts} /> : null}
      {tab === "overview" && overview ? <OverviewPanel overview={overview} /> : null}
      {tab === "system" && system ? <MasterSystemPanel status={system} /> : null}
    </section>
  );
}

function ActivityPanel({ activity, accounts }: { activity: Awaited<ReturnType<typeof getActivity>>; accounts: MasterAccount[] }) {
  const totalPages = Math.max(1, Math.ceil(activity.count / 50));
  const query = (page: number) => {
    const params = new URLSearchParams({ tab: "activity", page: String(page) });
    if (activity.from) params.set("from", activity.from);
    if (activity.to) params.set("to", activity.to);
    return `/admin/master?${params.toString()}`;
  };
  return <div className="space-y-5">
    <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-5" method="get">
      <input type="hidden" name="tab" value="activity" />
      <select className="h-9 rounded-4xl border bg-background px-3 text-sm" name="actor" defaultValue=""><option value="">Mọi người</option>{accounts.map((account) => <option key={account.email} value={account.email}>{account.email}</option>)}</select>
      <input className="h-9 rounded-4xl border bg-background px-3 text-sm" name="area" placeholder="Area" defaultValue="" />
      <input className="h-9 rounded-4xl border bg-background px-3 text-sm" name="action" placeholder="Loại thao tác" defaultValue="" />
      <input className="h-9 rounded-4xl border bg-background px-3 text-sm" type="date" name="from" defaultValue={activity.from} />
      <input className="h-9 rounded-4xl border bg-background px-3 text-sm" type="date" name="to" defaultValue={activity.to} />
      <Button type="submit">Lọc</Button>
    </form>
    <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Thời gian</th><th className="p-3">Người thực hiện</th><th className="p-3">Vai trò</th><th className="p-3">Khu vực</th><th className="p-3">Thao tác</th><th className="p-3">Đối tượng</th></tr></thead><tbody>{activity.rows.map((row) => <tr key={String(row.id)} className="border-b"><td className="p-3 whitespace-nowrap">{formatTime(String(row.created_at))}</td><td className="p-3">{row.actor_email}</td><td className="p-3"><Badge variant="outline">{row.actor_role}</Badge></td><td className="p-3">{row.area}</td><td className="p-3">{row.action}</td><td className="p-3">{row.target_type ?? "-"}{row.target_id ? `: ${row.target_id}` : ""}</td></tr>)}</tbody></table></div>
    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Trang {activity.page}/{totalPages} · {activity.count} bản ghi</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={activity.page <= 1} render={<Link href={query(activity.page - 1)} />}>Trước</Button><Button variant="outline" size="sm" disabled={activity.page >= totalPages} render={<Link href={query(activity.page + 1)} />}>Sau</Button></div></div>
  </div>;
}

function OverviewPanel({ overview }: { overview: NonNullable<Awaited<ReturnType<typeof getOverview>>> }) {
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-4">{[
      ["Tài khoản đang hoạt động", overview.activeAccounts], ["Đăng nhập hôm nay", overview.loggedInToday], ["Từ chối quyền 7 ngày", overview.denied7d], ["Đăng nhập thất bại 7 ngày", overview.failed7d],
    ].map(([label, value]) => <Card key={String(label)}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Thao tác theo ngày (7 ngày)</CardTitle></CardHeader><CardContent><MasterActivityChart data={overview.daily} /></CardContent></Card>
    <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Thao tác theo người</CardTitle></CardHeader><CardContent className="space-y-2">{overview.actorCounts.map((item) => <div key={item.email} className="flex justify-between gap-3 text-sm"><span className="truncate">{item.email}</span><strong>{item.count}</strong></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Khu vực được chỉnh sửa nhiều nhất</CardTitle></CardHeader><CardContent className="space-y-2">{overview.areaCounts.map((item) => <div key={item.area} className="flex justify-between text-sm"><span>{item.area}</span><strong>{item.count}</strong></div>)}</CardContent></Card></div>
  </div>;
}

export default function MasterPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<div className="min-h-96" />}><MasterContent searchParams={searchParams} /></Suspense>;
}
